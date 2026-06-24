CREATE TABLE IF NOT EXISTS "marketplace_items" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category"    TEXT NOT NULL, -- 'ai_agent', 'prompt_pack', 'workflow', 'crm_template', 'knowledge_pack', 'industry_template'
  "type"        TEXT NOT NULL, -- 'free', 'premium'
  "price"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  "industry"    TEXT,          -- 'healthcare', 'real_estate', 'ecommerce', 'education', null=all
  "tags"        TEXT[] NOT NULL DEFAULT '{}',
  "data"        JSONB NOT NULL DEFAULT '{}', -- the actual template payload
  "thumbnail"   TEXT,
  "authorName"  TEXT NOT NULL DEFAULT 'Hayya AI',
  "authorId"    TEXT,          -- null = platform official
  "downloads"   INTEGER NOT NULL DEFAULT 0,
  "rating"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "ratingCount" INTEGER NOT NULL DEFAULT 0,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "isFeatured"  BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "marketplace_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "marketplace_items_category_idx" ON "marketplace_items"("category");
CREATE INDEX IF NOT EXISTS "marketplace_items_industry_idx" ON "marketplace_items"("industry");
CREATE INDEX IF NOT EXISTS "marketplace_items_downloads_idx" ON "marketplace_items"("downloads" DESC);

CREATE TABLE IF NOT EXISTS "marketplace_installs" (
  "id"        TEXT NOT NULL,
  "orgId"     TEXT NOT NULL,
  "itemId"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "marketplace_installs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "marketplace_installs_orgId_itemId_key" ON "marketplace_installs"("orgId", "itemId");
CREATE INDEX IF NOT EXISTS "marketplace_installs_orgId_idx" ON "marketplace_installs"("orgId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketplace_installs_itemId_fkey') THEN
    ALTER TABLE "marketplace_installs" ADD CONSTRAINT "marketplace_installs_itemId_fkey"
      FOREIGN KEY ("itemId") REFERENCES "marketplace_items"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketplace_installs_orgId_fkey') THEN
    ALTER TABLE "marketplace_installs" ADD CONSTRAINT "marketplace_installs_orgId_fkey"
      FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- Seed official templates
INSERT INTO "marketplace_items" ("id","name","description","category","type","price","industry","tags","data","isFeatured","downloads") VALUES
-- AI Agents
(gen_random_uuid(),'Healthcare Appointment Bot','AI agent that books appointments, collects patient info, and sends reminders in Arabic & English','ai_agent','free',0,'healthcare',ARRAY['healthcare','arabic','appointments'],'{"systemPrompt":"You are a professional healthcare appointment assistant for a medical clinic in Qatar. You respond in the same language the patient uses (Arabic or English). Your job is to: 1) Greet warmly, 2) Collect patient name and contact, 3) Ask about preferred doctor/specialty, 4) Offer available slots, 5) Confirm booking and send summary. Never provide medical advice.","temperature":0.7,"maxTokens":400}',true,0),
(gen_random_uuid(),'Real Estate Lead Qualifier','Qualifies real estate leads by asking about budget, location preference, property type, and timeline','ai_agent','free',0,'real_estate',ARRAY['real_estate','lead_qualification','arabic'],'{"systemPrompt":"You are a professional real estate assistant in Qatar. Qualify leads by asking: budget range, preferred location (Pearl, Lusail, West Bay etc.), property type (apartment/villa/townhouse), timeline to buy/rent, number of bedrooms. Score the lead and summarize for the agent.","temperature":0.7,"maxTokens":400}',true,0),
(gen_random_uuid(),'E-commerce Order Support Bot','Handles order status, returns, refunds, and product questions for online stores','ai_agent','free',0,'ecommerce',ARRAY['ecommerce','support','orders'],'{"systemPrompt":"You are a customer support agent for an e-commerce store. Help customers with: order tracking, return/refund requests, product questions, and complaints. Always be empathetic. Escalate to human if the customer is upset or issue cannot be resolved.","temperature":0.6,"maxTokens":350}',false,0),
(gen_random_uuid(),'Education Admissions Assistant','Guides prospective students through admissions process, collects documents, answers FAQs','ai_agent','free',0,'education',ARRAY['education','admissions','students'],'{"systemPrompt":"You are an admissions assistant for an educational institution. Help prospective students with: program information, admission requirements, application deadlines, tuition fees, and scholarship options. Collect name, email, and program of interest before answering detailed questions.","temperature":0.7,"maxTokens":400}',false,0),
-- Workflow Packs
(gen_random_uuid(),'New Lead Welcome Sequence','3-step automated workflow: instant WhatsApp greeting → 1hr follow-up → 24hr nurture message','workflow','free',0,null,ARRAY['automation','lead_nurture','whatsapp'],'{"steps":[{"type":"send_message","delay":0,"template":"Welcome! Thank you for reaching out. How can I help you today?"},{"type":"send_message","delay":3600,"template":"Just checking in — did you get a chance to review our services? Happy to answer any questions."},{"type":"send_message","delay":86400,"template":"We have a special offer available this week. Would you like to know more?"}],"trigger":"contact.created"}',true,0),
(gen_random_uuid(),'Appointment Reminder Flow','Sends WhatsApp reminders 24h and 1h before a booking, with cancellation option','workflow','free',0,null,ARRAY['bookings','reminders','automation'],'{"steps":[{"type":"send_message","delay":-86400,"template":"Reminder: You have an appointment tomorrow. Reply CANCEL to cancel."},{"type":"send_message","delay":-3600,"template":"Your appointment is in 1 hour. We look forward to seeing you!"}],"trigger":"booking.confirmed"}',true,0),
(gen_random_uuid(),'Inactive Lead Re-engagement','Re-engages contacts who haven not responded in 7 days with a value-add message','workflow','free',0,null,ARRAY['lead_reengagement','automation','retention'],'{"steps":[{"type":"send_message","delay":604800,"template":"Hi! We noticed we haven not spoken in a while. We have new updates that might interest you — can we schedule a quick call?"}],"trigger":"contact.inactive_7d"}',false,0),
-- CRM Templates
(gen_random_uuid(),'Healthcare Patient Pipeline','Pre-built contact pipeline: Inquiry → Consultation → Treatment → Follow-up → Discharged','crm_template','free',0,'healthcare',ARRAY['healthcare','pipeline','patients'],'{"stages":["Inquiry","Consultation Scheduled","Active Treatment","Follow-up","Discharged","Referred"],"fields":["patient_id","insurance_provider","assigned_doctor","next_appointment"]}',true,0),
(gen_random_uuid(),'Real Estate Sales Pipeline','Lead → Viewing Scheduled → Offer Made → Contract → Closed / Lost','crm_template','free',0,'real_estate',ARRAY['real_estate','sales','pipeline'],'{"stages":["New Lead","Qualified","Viewing Scheduled","Offer Stage","Contract Review","Closed Won","Closed Lost"],"fields":["budget","property_type","preferred_location","agent_assigned"]}',false,0),
-- Knowledge Packs
(gen_random_uuid(),'Qatar Business FAQ Pack','50 common questions and answers about doing business in Qatar — VAT, visa, banking, company setup','knowledge_pack','free',0,'qatar',ARRAY['qatar','business','faq'],'{"articleCount":50,"topics":["Company Registration","VAT in Qatar","Visa Requirements","Banking Setup","Labor Law Basics","Qatar Free Zones"]}',true,0),
(gen_random_uuid(),'Healthcare Clinic FAQ Pack','Answers to common patient questions: appointment booking, insurance, procedures, visiting hours','knowledge_pack','free',0,'healthcare',ARRAY['healthcare','faq','patients'],'{"articleCount":35,"topics":["Appointment Booking","Insurance Accepted","Medical Records","Emergency Services","Visiting Hours","Cost Estimates"]}',false,0),
-- Industry Templates
(gen_random_uuid(),'Healthcare Clinic Starter Pack','Complete setup: AI appointment bot + patient pipeline + welcome workflow + FAQ knowledge base','industry_template','free',0,'healthcare',ARRAY['healthcare','starter','complete_setup'],'{"includes":["Healthcare Appointment Bot","Healthcare Patient Pipeline","New Lead Welcome Sequence","Healthcare Clinic FAQ Pack"]}',true,0),
(gen_random_uuid(),'Real Estate Agency Starter Pack','Complete setup: Lead qualifier AI + sales pipeline + re-engagement workflow','industry_template','free',0,'real_estate',ARRAY['real_estate','starter','complete_setup'],'{"includes":["Real Estate Lead Qualifier","Real Estate Sales Pipeline","Inactive Lead Re-engagement"]}',false,0)
ON CONFLICT DO NOTHING;