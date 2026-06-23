import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { slug: 'hayyamed-demo' },
    update: {},
    create: {
      name: 'Hayyamed Demo',
      slug: 'hayyamed-demo',
      industry: 'Healthcare',
      country: 'QA',
      city: 'Doha',
      plan: 'GROWTH',
      settings: {
        create: {
          aiEnabled: true,
          language: 'ar',
          rtlEnabled: true,
          autoReply: true,
        },
      },
    },
  })

  console.log(`Org: ${org.name} (${org.id})`)

  // Create admin user
  const hash = await bcrypt.hash('Admin@2025', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hayyamed.ai' },
    update: { password: hash },
    create: {
      orgId: org.id,
      email: 'admin@hayyamed.ai',
      name: 'Abbas Al Masri',
      role: 'ADMIN',
      password: hash,
    },
  })

  console.log(`Admin: ${admin.email}`)

  // Create WhatsApp channel
  const channel = await prisma.channel.upsert({
    where: { id: 'demo-channel-1' },
    update: {},
    create: {
      id: 'demo-channel-1',
      orgId: org.id,
      type: 'WHATSAPP',
      name: 'WhatsApp Business',
      identifier: '+974500000001',
      isActive: true,
      isVerified: false,
    },
  })

  console.log(`Channel: ${channel.name}`)

  // Create sample contacts
  const contactData = [
    { name: 'Ahmed Al Rashid', phone: '+97455512345', email: 'ahmed@company.qa', status: 'QUALIFYING' as const, source: 'whatsapp', score: 90 },
    { name: 'Fatima Hassan', phone: '+97455523456', email: 'fatima@gmail.com', status: 'WON' as const, source: 'instagram', score: 70 },
    { name: 'Mohammed Al Ali', phone: '+97455534567', email: 'm.ali@business.qa', status: 'NEW' as const, source: 'whatsapp', score: 40 },
    { name: 'Sara Al Kuwari', phone: '+97455545678', email: 'sara@email.com', status: 'QUALIFYING' as const, source: 'facebook', score: 80 },
    { name: 'Khalid Al Thani', phone: '+97455556789', email: 'khalid@corp.qa', status: 'CONTACTED' as const, source: 'whatsapp', score: 60 },
  ]

  for (const c of contactData) {
    const contact = await prisma.contact.upsert({
      where: { id: `demo-contact-${c.phone}` },
      update: {},
      create: {
        id: `demo-contact-${c.phone}`,
        orgId: org.id,
        ...c,
      },
    })

    // Create a conversation for each contact
    await prisma.conversation.upsert({
      where: { id: `demo-conv-${c.phone}` },
      update: {},
      create: {
        id: `demo-conv-${c.phone}`,
        orgId: org.id,
        channelId: channel.id,
        contactId: contact.id,
        status: 'OPEN',
        lastMessage: 'Hello, I need information about your services',
        lastMsgAt: new Date(),
      },
    })
  }

  console.log(`Created ${contactData.length} contacts and conversations`)

  // Create sample campaign
  await prisma.campaign.upsert({
    where: { id: 'demo-campaign-1' },
    update: {},
    create: {
      id: 'demo-campaign-1',
      orgId: org.id,
      channelId: channel.id,
      name: 'Ramadan 2024',
      type: 'BROADCAST',
      status: 'COMPLETED',
      message: '🌙 Ramadan Kareem! Special offer just for you.',
      sent: 1234,
      delivered: 1200,
      read: 890,
      replied: 178,
      converted: 34,
      totalRecipients: 1234,
    },
  })

  console.log('Seed complete!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
