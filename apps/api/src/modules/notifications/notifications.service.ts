import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import * as webpush from 'web-push'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)
  private pushReady = false

  constructor(private prisma: PrismaService) {
    const pub = process.env.VAPID_PUBLIC_KEY
    const priv = process.env.VAPID_PRIVATE_KEY
    if (pub && priv) {
      webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:support@hayyaai.com', pub, priv)
      this.pushReady = true
    } else {
      this.logger.warn('VAPID keys not set — web push disabled (in-app notifications still work)')
    }
  }

  getVapidPublicKey() {
    return { key: process.env.VAPID_PUBLIC_KEY || null }
  }

  // Store/refresh a browser push subscription for a user.
  async saveSubscription(userId: string, orgId: string, sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    if (!sub?.endpoint || !sub?.keys) return { ok: false }
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      update: { userId, orgId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      create: { userId, orgId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    })
    return { ok: true }
  }

  // Send a web push to all of a user's devices. Prunes dead subscriptions.
  async sendPush(userId: string, payload: { title: string; body: string; url?: string }) {
    if (!this.pushReady) return
    const subs = await this.prisma.pushSubscription.findMany({ where: { userId } })
    await Promise.all(subs.map(async s => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
        )
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await this.prisma.pushSubscription.delete({ where: { endpoint: s.endpoint } }).catch(() => {})
        }
      }
    }))
  }

  async getForUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit
    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ])
    return { items, total, unreadCount, page, limit }
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    })
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
  }

  async create(userId: string, type: string, title: string, body: string, data?: Prisma.InputJsonValue) {
    const notif = await this.prisma.notification.create({
      data: { userId, type, title, body, data: data ?? Prisma.JsonNull },
    })
    // Fire a web push (best-effort) alongside the in-app notification.
    const url = (data as any)?.url
    this.sendPush(userId, { title, body, url }).catch(() => {})
    return notif
  }

  async deleteOne(id: string, userId: string) {
    return this.prisma.notification.deleteMany({ where: { id, userId } })
  }
}
