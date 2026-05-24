# Hayyamed AI — Omnichannel CRM Platform

> AI-powered omnichannel CRM for Qatar & GCC markets. Like GoHighLevel + HubSpot + AI in one platform.

---

## 🏗️ Architecture Overview

```
hayyamed-ai/
├── apps/
│   ├── web/          ← Next.js 14 Frontend (port 3000)
│   └── api/          ← NestJS Backend API (port 4000)
├── packages/
│   ├── ui/           ← Shared UI components
│   ├── types/        ← Shared TypeScript types
│   └── utils/        ← Shared utilities
├── docker-compose.yml
├── .env.example
└── package.json
```

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, TypeScript, TailwindCSS |
| Backend | NestJS, Node.js, TypeScript |
| Database | PostgreSQL (via Prisma ORM) |
| Cache | Redis |
| Real-time | Socket.io WebSockets |
| AI | OpenAI GPT-4o |
| Queue | Bull (Redis-based) |
| Auth | JWT + Refresh tokens + Google OAuth |
| Payments | Stripe |
| WhatsApp | Meta Cloud API |
| Deployment | Docker + Nginx |

---

## ⚡ Quick Start (Developer)

### 1. Prerequisites
```bash
node >= 20
docker & docker-compose
git
```

### 2. Clone & Install
```bash
git clone https://github.com/yourname/hayyamed-ai.git
cd hayyamed-ai
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
# Fill in your API keys (OpenAI, WhatsApp, etc.)
```

### 4. Start with Docker (Recommended)
```bash
docker-compose up -d
```

This starts:
- ✅ PostgreSQL on port 5432
- ✅ Redis on port 6379
- ✅ API on port 4000
- ✅ Web on port 3000
- ✅ Nginx on port 80/443

### 5. Run Database Migrations
```bash
npm run db:migrate
npm run db:seed
```

### 6. Start Development (without Docker)
```bash
# Terminal 1 — API
cd apps/api && npm run dev

# Terminal 2 — Web
cd apps/web && npm run dev
```

---

## 📡 API Endpoints

### Authentication
```
POST   /api/v1/auth/register        ← Create account
POST   /api/v1/auth/login           ← Login
POST   /api/v1/auth/refresh         ← Refresh token
POST   /api/v1/auth/logout          ← Logout
GET    /api/v1/auth/google          ← Google OAuth
POST   /api/v1/auth/2fa/enable      ← Enable 2FA
```

### Conversations
```
GET    /api/v1/conversations                    ← List all
GET    /api/v1/conversations/:id                ← Get one
GET    /api/v1/conversations/:id/messages       ← Get messages
POST   /api/v1/conversations/:id/messages       ← Send message
PATCH  /api/v1/conversations/:id/assign         ← Assign agent
PATCH  /api/v1/conversations/:id/resolve        ← Resolve
```

### Contacts / CRM
```
GET    /api/v1/contacts             ← List with filters
POST   /api/v1/contacts             ← Create
GET    /api/v1/contacts/:id         ← Get with history
PATCH  /api/v1/contacts/:id         ← Update
DELETE /api/v1/contacts/:id         ← Delete
GET    /api/v1/contacts/:id/score   ← AI lead score
```

### Campaigns
```
GET    /api/v1/campaigns            ← List
POST   /api/v1/campaigns            ← Create
GET    /api/v1/campaigns/:id        ← Get with stats
PATCH  /api/v1/campaigns/:id/launch ← Launch campaign
PATCH  /api/v1/campaigns/:id/pause  ← Pause
GET    /api/v1/campaigns/:id/stats  ← Live stats
```

### AI
```
GET    /api/v1/ai/suggest/:convId   ← Suggest reply
POST   /api/v1/ai/generate          ← Generate message
POST   /api/v1/ai/score/:contactId  ← Score lead
GET    /api/v1/ai/insights          ← Business insights
POST   /api/v1/ai/translate         ← Translate
```

### WhatsApp Webhooks
```
GET    /api/v1/webhooks/whatsapp    ← Verify webhook
POST   /api/v1/webhooks/whatsapp    ← Receive messages
GET    /api/v1/webhooks/instagram   ← Verify webhook
POST   /api/v1/webhooks/instagram   ← Receive messages
```

### Reports
```
GET    /api/v1/reports/dashboard    ← Main KPIs
GET    /api/v1/reports/conversations ← Conversation stats
GET    /api/v1/reports/agents       ← Agent performance
GET    /api/v1/reports/campaigns    ← Campaign analytics
GET    /api/v1/reports/revenue      ← Revenue tracking
POST   /api/v1/reports/export       ← Export PDF/CSV
```

---

## 🔌 WebSocket Events

### Client → Server
```
join:conversation      { conversationId }
leave:conversation     { conversationId }
typing:start           { conversationId, userId }
typing:stop            { conversationId, userId }
```

### Server → Client
```
message:new            { conversationId, message }
message:received       { message }
lead:new               { contact }
conversation:assigned  { conversation }
notification:new       { notification }
stats:update           { stats }
campaign:progress      { campaignId, sent, delivered }
typing:update          { userId, typing }
```

---

## 🌐 WhatsApp Setup

1. Create Meta Developer account at developers.facebook.com
2. Create app → Add WhatsApp product
3. Get Phone Number ID and Access Token
4. Set webhook URL: `https://api.hayyamed.ai/api/v1/webhooks/whatsapp`
5. Subscribe to: messages, message_deliveries, message_reads
6. Add credentials to .env

---

## 🚢 Production Deployment

### On any VPS (Ubuntu 22.04)
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone repo
git clone https://github.com/yourname/hayyamed-ai.git
cd hayyamed-ai

# Setup env
cp .env.example .env
nano .env  # Fill in production values

# Start
docker-compose -f docker-compose.yml up -d

# Run migrations
docker exec hayyamed-api npm run db:migrate
```

### SSL with Let's Encrypt
```bash
apt install certbot
certbot certonly --standalone -d app.hayyamed.ai -d api.hayyamed.ai
# Certificates saved to /etc/letsencrypt/live/
```

---

## 📱 PWA Support

The web app is PWA-ready. Users can install it from the browser:
- Open `app.hayyamed.ai` in Chrome/Safari
- Click "Add to Home Screen"
- Works like a native app on Android & iOS

---

## 🏢 Multi-tenant Architecture

- Each organization is isolated by `orgId`
- Agency accounts can manage multiple client orgs
- White-label: custom domain + brand name per org
- RBAC: SUPER_ADMIN → AGENCY_ADMIN → ADMIN → MANAGER → AGENT → VIEWER

---

## 📧 Support

Built for the Qatar & GCC market.
For questions: support@hayyamed.ai
