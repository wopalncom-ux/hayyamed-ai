# Meta WhatsApp + Instagram — Go-Live Setup Guide
### Hayya AI · official Meta Cloud API

This is everything you do **once** (Part A) to enable WhatsApp + Instagram for *all*
clients, then the quick steps **per client** (Part B). Keep this private — it
contains your webhook verify token.

---

## 📌 Your platform values (have these ready)
| What | Value |
|---|---|
| WhatsApp webhook URL | `https://api.hayyaai.com/api/v1/whatsapp/webhook` |
| Instagram webhook URL | `https://api.hayyaai.com/api/v1/instagram/webhook` |
| **Webhook verify token** | `hayyaai_webhook_prod` |
| WhatsApp subscribe field | `messages` |
| Instagram subscribe field | `messages` |

---

# PART A — One-time platform setup (≈ 1–2 hrs work + Meta review time)

### A1. Meta Business + Developer App
1. Go to **business.facebook.com** → create/confirm your **Meta Business** (Hayya Med AI).
2. Go to **developers.facebook.com** → **My Apps → Create App** → type **Business**.
3. Link the app to your Meta Business.

### A2. Add the WhatsApp product
1. In the app dashboard → **Add Product → WhatsApp → Set up**.
2. You'll get a **test number** + a **temporary token** + a **Phone number ID** — keep these (great for the demo in Part C).
3. Note the **WhatsApp Business Account (WABA) ID**.

### A3. Add the Instagram product
1. **Add Product → Messenger** (and enable **Instagram** messaging), or **Instagram → API setup with Instagram login**.
2. You'll connect an **Instagram professional account** (linked to a Facebook Page).

### A4. Configure the webhooks  ← critical
**WhatsApp:** app → **WhatsApp → Configuration → Webhook → Edit**
- Callback URL: `https://api.hayyaai.com/api/v1/whatsapp/webhook`
- Verify token: `hayyaai_webhook_prod`
- Click **Verify and Save** → then **Manage** → subscribe to **`messages`**.

**Instagram:** app → **Webhooks → Instagram** (or Messenger → Instagram)
- Callback URL: `https://api.hayyaai.com/api/v1/instagram/webhook`
- Verify token: `hayyaai_webhook_prod`
- Verify and Save → subscribe to **`messages`**.

> ✅ If "Verify and Save" succeeds, our server answered Meta's challenge — you're wired correctly.

### A5. Business Verification
- App → **Settings → Basic → Business Verification** → submit company docs (CR, address).
- Takes a few days. Required before production access.

### A6. App Review (for serving clients in production)
Request **Advanced Access** for:
- `whatsapp_business_messaging`, `whatsapp_business_management`
- `instagram_manage_messages`, `pages_messaging`, `instagram_basic`, `pages_show_list`

Submit a short screencast showing the AI answering a message. Approval: **days to ~2 weeks**.

---

# PART B — Per client (5 minutes once Part A is approved)

### WhatsApp
1. Client gives you (or you provision under your app): **Phone Number ID**, **Access Token**, **WABA ID**.
2. In Hayya AI → **Client AI Center → [the client] → Channels → WhatsApp via Meta Cloud API**:
   - Phone Number ID, WABA ID, Access Token, Verify Token → **Connect Meta**.
   - We verify it against Meta; status turns green.

### Instagram
1. Get the client's **Instagram Account ID** + a **Page/IG access token** (with `instagram_manage_messages`).
2. **Channels → Instagram DM (Meta)** → paste IG Account ID + Access Token → **Connect Instagram**.

### Then
- Make sure the client has an **AI Agent** (Agents tab) with their **AI Brain** assigned and the channel selected.
- Send a test message to the number / DM the IG account → **the AI replies.**

---

# PART C — Demo TODAY (no approval needed)
While Part A's review is pending, you can still prove it works:
1. In **WhatsApp → API Setup**, add the client's number under **"To"** test recipients.
2. Copy the **temporary access token** + **Phone Number ID**.
3. Paste them into the client's **Channels → Meta WhatsApp** → Connect.
4. Message the test number → **AI agent replies live.** Perfect for closing the deal.

---

## 🛠️ Troubleshooting
| Symptom | Fix |
|---|---|
| Webhook "Verify and Save" fails | Token must be exactly `hayyaai_webhook_prod`; URL must be the https one above |
| Connected but no AI reply | Client needs an **active AI Agent** + the channel enabled in **Modules**; check the message is text |
| "Meta rejected credentials" on connect | Wrong Phone Number ID / token, or token expired — regenerate in the Meta app |
| Replies stop after 24h | Outside the 24-hour window you must use an **approved template** (set up in Meta) |

## 💰 Remember
- Meta bills **per conversation** — pass it through to the client (use the wallet + profit % in **Billing & Profit**).
- One Meta app serves **all** your clients; only Part B repeats per client.
