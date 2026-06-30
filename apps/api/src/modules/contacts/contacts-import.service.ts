import { Injectable, Logger } from '@nestjs/common'
import { parse } from 'csv-parse/sync'
import * as ExcelJS from 'exceljs'
import { PrismaService } from '../../database/prisma.service'
import { AuditService } from '../audit/audit.service'

export interface ImportRow {
  name?: string; phone?: string; email?: string; source?: string;
  status?: string; tags?: string; language?: string; country?: string;
  city?: string; notes?: string; [key: string]: string | undefined
}

export interface MappingConfig {
  name: string; phone: string; email?: string; source?: string;
  status?: string; tags?: string; language?: string; country?: string;
  city?: string; notes?: string
}

export interface ImportResult {
  total: number; imported: number; skipped: number; failed: number
  errors: Array<{ row: number; reason: string }>
  duplicates: number
}

const STATUS_MAP: Record<string, string> = {
  new: 'NEW', active: 'ACTIVE', qualified: 'QUALIFIED', lead: 'NEW',
  customer: 'ACTIVE', converted: 'ACTIVE', lost: 'LOST', inactive: 'INACTIVE',
}

@Injectable()
export class ContactsImportService {
  private readonly logger = new Logger(ContactsImportService.name)

  constructor(private prisma: PrismaService, private audit: AuditService) {}

  // Parse CSV/TSV/XLSX buffer → rows array
  async parseFile(buffer: Buffer, filename: string): Promise<ImportRow[]> {
    const fn = (filename || '').toLowerCase()
    if (fn.endsWith('.xlsx') || fn.endsWith('.xls')) return this.parseExcel(buffer)
    const delimiter = fn.endsWith('.tsv') ? '\t' : ','
    const records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter,
      bom: true,         // handle Excel-generated UTF-8 BOM
      relax_quotes: true,
    }) as ImportRow[]
    return records
  }

  // Parse an .xlsx/.xls workbook (first sheet) → rows keyed by header row
  private async parseExcel(buffer: Buffer): Promise<ImportRow[]> {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer as any)
    const ws = wb.worksheets[0]
    if (!ws) return []
    const rows: ImportRow[] = []
    let headers: string[] = []
    ws.eachRow((row, rowNumber) => {
      const vals = row.values as any[]   // exceljs: index 0 is empty
      if (rowNumber === 1) {
        headers = []
        for (let i = 1; i < vals.length; i++) headers[i] = this.cellText(vals[i]).trim()
        return
      }
      const obj: ImportRow = {}
      let any = false
      for (let i = 1; i < headers.length; i++) {
        const h = headers[i]
        if (!h) continue
        const v = this.cellText(vals[i])
        obj[h] = v
        if (v) any = true
      }
      if (any) rows.push(obj)
    })
    return rows
  }

  // Normalize an exceljs cell value (string | number | Date | hyperlink | formula | richText) to text
  private cellText(v: any): string {
    if (v == null) return ''
    if (typeof v === 'object') {
      if (v instanceof Date) return v.toISOString().slice(0, 10)
      if (typeof v.text === 'string') return v.text                          // hyperlink
      if (v.result != null) return String(v.result)                          // formula result
      if (Array.isArray(v.richText)) return v.richText.map((r: any) => r.text).join('')
    }
    return String(v).trim()
  }

  // Return column headers from first row so frontend can build mapping UI
  async getHeaders(buffer: Buffer, filename: string): Promise<string[]> {
    const records = await this.parseFile(buffer, filename)
    if (!records[0]) return []
    return Object.keys(records[0])
  }

  // Preview first 5 rows
  async preview(buffer: Buffer, filename: string): Promise<{ headers: string[]; rows: ImportRow[] }> {
    const records = await this.parseFile(buffer, filename)
    return {
      headers: records[0] ? Object.keys(records[0]) : [],
      rows: records.slice(0, 5),
    }
  }

  // Full import with mapping
  async import(
    orgId: string,
    userId: string,
    buffer: Buffer,
    filename: string,
    mapping: MappingConfig,
    options: { overwriteDuplicates?: boolean; defaultSource?: string; defaultStatus?: string } = {},
  ): Promise<ImportResult> {
    const records = await this.parseFile(buffer, filename)
    const result: ImportResult = { total: records.length, imported: 0, skipped: 0, failed: 0, errors: [], duplicates: 0 }

    // Pre-load existing phones and emails for dedup (per-org)
    const existingPhones = new Set<string>()
    const existingEmails = new Set<string>()
    const existing = await this.prisma.contact.findMany({
      where: { orgId },
      select: { id: true, phone: true, email: true },
    })
    existing.forEach(c => {
      if (c.phone) existingPhones.add(this.normalizePhone(c.phone))
      if (c.email) existingEmails.add(c.email.toLowerCase())
    })

    const toCreate: any[] = []
    const toUpdate: Array<{ id: string; data: any }> = []

    for (let i = 0; i < records.length; i++) {
      const row = records[i]
      const rowNum = i + 2 // 1-indexed + header row

      const name = row[mapping.name]?.trim()
      const phone = mapping.phone ? this.normalizePhone(row[mapping.phone] || '') : undefined
      const email = mapping.email ? row[mapping.email]?.trim()?.toLowerCase() : undefined

      if (!name) {
        result.errors.push({ row: rowNum, reason: 'Missing name' })
        result.failed++
        continue
      }
      if (!phone && !email) {
        result.errors.push({ row: rowNum, reason: 'Must have at least phone or email' })
        result.failed++
        continue
      }

      // Dedup check
      const phoneKey = phone ? this.normalizePhone(phone) : ''
      const emailKey = email?.toLowerCase() || ''
      const isDuplicate = (phoneKey && existingPhones.has(phoneKey)) || (emailKey && existingEmails.has(emailKey))

      if (isDuplicate && !options.overwriteDuplicates) {
        result.duplicates++
        result.skipped++
        continue
      }

      const rawStatus = mapping.status ? row[mapping.status]?.trim()?.toLowerCase() : undefined
      const status = rawStatus ? (STATUS_MAP[rawStatus] || 'NEW') : (options.defaultStatus || 'NEW')

      const rawTags = mapping.tags ? row[mapping.tags]?.trim() : undefined
      const tags = rawTags ? rawTags.split(/[,;|]/).map(t => t.trim()).filter(Boolean) : []

      const contactData = {
        orgId, name,
        phone: phone || null,
        email: email || null,
        source: (mapping.source ? row[mapping.source]?.trim() : null) || options.defaultSource || 'import',
        status,
        tags,
        language: (mapping.language ? row[mapping.language]?.trim() : null) || 'en',
        country: (mapping.country ? row[mapping.country]?.trim() : null) || 'QA',
        city: mapping.city ? row[mapping.city]?.trim() || null : null,
        notes: mapping.notes ? row[mapping.notes]?.trim() || null : null,
      }

      if (isDuplicate && options.overwriteDuplicates) {
        // Find existing contact to update
        const match = existing.find(c =>
          (phoneKey && c.phone && this.normalizePhone(c.phone) === phoneKey) ||
          (emailKey && c.email && c.email.toLowerCase() === emailKey)
        )
        if (match) {
          toUpdate.push({ id: match.id, data: contactData })
          result.duplicates++
        }
      } else {
        toCreate.push(contactData)
        if (phone) existingPhones.add(phoneKey)
        if (email) existingEmails.add(emailKey)
      }
    }

    // Batch insert new contacts
    if (toCreate.length > 0) {
      await this.prisma.contact.createMany({ data: toCreate, skipDuplicates: true })
      result.imported += toCreate.length
    }

    // Update existing contacts
    for (const { id, data } of toUpdate) {
      await this.prisma.contact.update({ where: { id }, data })
    }
    result.imported += toUpdate.length

    this.audit.log({
      orgId, userId,
      action: 'contacts.import',
      category: 'contact',
      resource: 'contacts',
      after: { total: result.total, imported: result.imported, skipped: result.skipped, failed: result.failed },
    })

    this.logger.log(`Import complete for org ${orgId}: ${result.imported} imported, ${result.skipped} skipped, ${result.failed} failed`)
    return result
  }

  // Export contacts to CSV buffer
  async exportCsv(orgId: string, filter: { status?: string; search?: string } = {}): Promise<Buffer> {
    const where: any = { orgId }
    if (filter.status) where.status = filter.status
    if (filter.search) where.OR = [
      { name: { contains: filter.search, mode: 'insensitive' } },
      { phone: { contains: filter.search } },
      { email: { contains: filter.search, mode: 'insensitive' } },
    ]

    const contacts = await this.prisma.contact.findMany({
      where, orderBy: { createdAt: 'desc' },
      select: { name: true, phone: true, email: true, source: true, status: true, tags: true, country: true, city: true, notes: true, createdAt: true },
    })

    const headers = ['name', 'phone', 'email', 'source', 'status', 'tags', 'country', 'city', 'notes', 'created_at']
    const rows = contacts.map(c => [
      c.name, c.phone || '', c.email || '', c.source || '', c.status,
      (c.tags || []).join(';'), c.country, c.city || '', c.notes || '',
      c.createdAt.toISOString().split('T')[0],
    ])

    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    return Buffer.from('﻿' + csv, 'utf-8') // BOM for Excel compatibility
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/[\s\-().+]/g, '')
  }
}
