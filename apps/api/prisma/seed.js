'use strict';
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('[seed] Starting...');

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
      settings: { create: { aiEnabled: true, language: 'ar', rtlEnabled: true, autoReply: true } },
    },
  });
  console.log(`[seed] Org: ${org.name}`);

  const hash = await bcrypt.hash('Admin@2025', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hayyamed.ai' },
    update: { password: hash, role: 'SUPER_ADMIN' },
    create: { orgId: org.id, email: 'admin@hayyamed.ai', name: 'Abbas Al Masri', role: 'SUPER_ADMIN', password: hash },
  });
  console.log(`[seed] Admin: ${admin.email}`);

  const channel = await prisma.channel.upsert({
    where: { id: 'demo-channel-1' },
    update: {},
    create: { id: 'demo-channel-1', orgId: org.id, type: 'WHATSAPP', name: 'WhatsApp Business', identifier: '+974500000001', isActive: true, isVerified: false },
  });

  const contacts = [
    { name: 'Ahmed Al Rashid', phone: '+97455512345', email: 'ahmed@company.qa', status: 'QUALIFYING', source: 'whatsapp', score: 90 },
    { name: 'Fatima Hassan', phone: '+97455523456', email: 'fatima@gmail.com', status: 'WON', source: 'instagram', score: 70 },
    { name: 'Mohammed Al Ali', phone: '+97455534567', email: 'm.ali@business.qa', status: 'NEW', source: 'whatsapp', score: 40 },
  ];

  for (const c of contacts) {
    const contact = await prisma.contact.upsert({
      where: { id: `demo-contact-${c.phone}` },
      update: {},
      create: { id: `demo-contact-${c.phone}`, orgId: org.id, ...c },
    });
    await prisma.conversation.upsert({
      where: { id: `demo-conv-${c.phone}` },
      update: {},
      create: { id: `demo-conv-${c.phone}`, orgId: org.id, channelId: channel.id, contactId: contact.id, status: 'OPEN', lastMessage: 'Hello, I need information about your services', lastMsgAt: new Date() },
    });
  }

  console.log('[seed] Done!');
}

main()
  .catch(e => { console.error('[seed] Error:', e.message); process.exit(0); })
  .finally(() => prisma.$disconnect());
