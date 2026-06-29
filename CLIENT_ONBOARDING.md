# Hayya AI — Client Onboarding Runbook

How to take a new client live, end to end. Most of this is now automated — your
real work is **training the brain** and **connecting the client's channels**.

---

## ⚡ One-pager (the whole flow)

1. **Log in** as owner → open **Client AI Center** (`/clients`).
2. **+ New Client** → fill **Name + Website** (+ WhatsApp/email) → **Create client**.
   → This auto-creates a **Business Knowledge brain**, an **AI Receptionist** and an **AI Analyzer**, and **crawls the website** into the brain.
3. **AI Brain** tab → add anything else (price list, FAQs, PDF/Word/Excel, more URLs). Wait for sources to reach **ready**.
4. **Agents** tab → tweak each agent's persona/objective → **Test** with a sample question → leave OFF for now.
5. **Channels** tab → connect **WhatsApp** + **Instagram** (see below).
6. **Agents** tab → **toggle the agents ON**.
7. Send a test message to the client's WhatsApp → confirm the AI replies → **done**.
8. **Billing & Profit** tab → set the wallet / profit % per the quotation.

---

## 0. Before you start — what to collect from the client

| Need | For |
|---|---|
| Business name, website, logo | Profile + auto-training |
| WhatsApp Business number | WhatsApp channel |
| Meta access (or you set it up for them) | WhatsApp + Instagram |
| Their content — services, prices, FAQs, hours, policies | AI Brain training |
| Brand tone (formal/friendly), languages (AR/EN) | Agent persona |

**Meta note:** the client pays Meta's messaging fees at Meta's rates (pass-through).
Meta **business verification** is excluded from the setup quote.

---

## 1. Create the client

`/clients` → **+ New Client** → **Profile** tab:

- **Client Name** (required), **Website** (recommended — it gets crawled), Logo emoji,
  Industry, Business Type, Contact Person, WhatsApp Number, Email.
- **Create client.**

On creation the platform automatically provisions:
- 🧠 **Business Knowledge** brain (+ crawls the website if provided)
- 🤖 **AI Receptionist** (greets, answers, qualifies, books — inactive)
- 🤖 **AI Analyzer** (sentiment, intent, lead score, human-handover — inactive)
- ✅ Default modules on: AI Agents, WhatsApp, Website Chatbot, CRM, Reporting

You'll land on the **AI Brain** tab automatically.

---

## 2. Train the AI Brain

**AI Brain** tab → the **Business Knowledge** brain is already there.

Add sources (the more, the better the answers):
- **URL** — extra pages (services, pricing, about).
- **Text** — paste FAQs, policies, opening hours, price lists.
- **Upload** — PDF / Word / Excel / CSV (menus, brochures, catalogues).

Each source shows **pending → processing → ready**. Wait for **ready** before testing.
Use **Reindex** if you change a lot.

---

## 3. Configure & test the agents

**Agents** tab → open **AI Receptionist**:
- Set **persona/personality**, **objective**, **language** (AR/EN), and which **channels** it handles.
- Use the **Test** box: type a customer question → confirm the reply is accurate and on-brand.
- Repeat for **AI Analyzer** (it scores/labels conversations; usually no tuning needed).

Leave agents **OFF** until channels are connected.

---

## 4. Connect channels

**Channels** tab. Two WhatsApp options:

### A) WhatsApp via Unipile (fastest — QR / code, no Meta app review)
- Click **Get code** → enter the WhatsApp number → you get a pairing **code/QR**.
- On the client's phone: **WhatsApp → Settings → Linked Devices → Link a Device → Link with phone number** → enter the code.
- *(Requires the platform's Unipile DSN + key to be configured.)*

### B) WhatsApp via Meta Cloud API (official, scalable)
- **Connect Meta** → enter **Phone Number ID**, **Access Token** (permanent), **Business ID**, **Webhook Secret**.
- Get these from **developers.facebook.com → your app → WhatsApp → API Setup**.
- Webhook URL: `https://api.hayyaai.com/api/v1/whatsapp/webhook` · verify token = your `WHATSAPP_WEBHOOK_TOKEN`.
- Full steps: see **META_SETUP_GUIDE.md** / **META_CHANNEL_SETUP_GUIDE.html**.

### Instagram DM
- **Connect Instagram** → IG **Account ID** + **Page Access Token** + username.
- The client's **Instagram must be a Business/Creator account linked to a Facebook Page**; the token comes from that Page.

The connection is verified on save — a wrong credential is rejected (no fake "connected").

---

## 5. Go live

1. **Agents** tab → toggle **AI Receptionist** (and Analyzer) **ON**.
2. From your own phone, message the client's WhatsApp/Instagram → confirm the AI replies.
3. Show the client the **shared inbox** (`/inbox`) — staff can take over any chat; filter by **status** and **service**.

---

## 6. Billing & profit

**Billing & Profit** tab:
- Set the client's **wallet / top-up**, **profit %**, low-balance threshold.
- Charge campaigns/usage against the wallet.
- Pricing reference: **QUOTATION_AI_ENGAGEMENT.html** — setup 9,500 QR + 8,000 QR/yr (17,500 Year 1).

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Invalid / no token" | Session refresh auto-handles it now; if it persists, log out/in (Ctrl+Shift+R). |
| AI Brain source stuck "processing" | Reindex; check the URL is public / the file is text-extractable. |
| Channel rejected on connect | Credentials are wrong or for the wrong account — re-check Phone Number ID / token / Test-vs-Live. |
| Agent replies but off-topic | Add more brain sources; tighten the agent objective/persona. |
| AI not replying | Confirm the agent is **ON** and assigned to that **channel**; check OpenAI key is funded. |

---

## What's *not* yet connectable (needs credentials you provide)
- Real **Meta WhatsApp** + **Instagram** tokens (THE go-live blocker).
- **MyFatoorah** payments (optional — bill directly via the quotation instead).
- **Anthropic** is out of credit; **OpenAI** is the live primary (auto-fallback handles it).
