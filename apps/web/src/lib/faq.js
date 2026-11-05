// Frequently asked questions shown on the home page in both languages and
// published as FAQPage structured data. Answers only restate facts that
// already appear elsewhere on the site (features, privacy policy, about page);
// keep them in sync if those change.
export const FAQ = {
  en: [
    {
      q: 'What is Hayya AI?',
      a: 'Hayya AI is an AI customer-engagement platform for businesses. It combines AI agents that answer customers on WhatsApp and Instagram, an omnichannel inbox, a CRM with AI lead scoring, bulk campaigns, a no-code automation builder and in-chat booking. It is built and operated by Hayya Med AI in Doha, Qatar.',
    },
    {
      q: 'Which channels does Hayya AI connect?',
      a: 'Four channels: WhatsApp (through the WhatsApp Business API), Instagram direct messages, website chat and email — all in one shared inbox.',
    },
    {
      q: 'Does the AI reply in Arabic?',
      a: 'Yes. Hayya AI agents reply in both Arabic and English, in the language the customer writes in, and hand the conversation to a team member with full context when a human is needed.',
    },
    {
      q: 'Where is my data stored?',
      a: 'Hayya AI runs on Google Cloud in the me-central1 region in Doha, Qatar. Some data is processed by the third-party providers needed for specific features — AI model providers, payment processors, email delivery and the messaging platforms you connect — as described in the Privacy Policy.',
    },
    {
      q: 'How much does Hayya AI cost?',
      a: 'You can create an account for free. Paid plans are priced in Qatari riyals (QAR), billed monthly, with no annual lock-in; current prices are shown in the pricing section.',
    },
    {
      q: 'How long does setup take?',
      a: 'Onboarding takes about five minutes: create your account, connect your channels (such as WhatsApp Business and Instagram), then activate your AI agent.',
    },
    {
      q: 'Who is behind Hayya AI?',
      a: 'Hayya AI is a product of Hayya Med Artificial Intelligence (commercial registration 219050), an AI solutions and enterprise technology company founded in June 2025 in Doha, Qatar by Abbas Al Masri.',
    },
  ],
  ar: [
    {
      q: 'ما هي منصة Hayya AI؟',
      a: 'Hayya AI منصة لخدمة العملاء والتواصل معهم بالذكاء الاصطناعي. تجمع وكلاء ذكاء اصطناعي يردّون على العملاء في واتساب وإنستغرام، وصندوق وارد موحّداً لكل القنوات، ونظام CRM يقيّم العملاء المحتملين بالذكاء الاصطناعي، وحملات جماعية، ومنشئ أتمتة بدون برمجة، وحجز المواعيد من داخل المحادثة. تطوّرها وتشغّلها شركة هيّا ميد للذكاء الاصطناعي في الدوحة، قطر.',
    },
    {
      q: 'ما القنوات التي يربطها Hayya AI؟',
      a: 'أربع قنوات: واتساب (عبر واجهة WhatsApp Business API)، ورسائل إنستغرام المباشرة، والدردشة على موقعك، والبريد الإلكتروني، وكلها في صندوق وارد واحد.',
    },
    {
      q: 'هل يردّ الذكاء الاصطناعي باللغة العربية؟',
      a: 'نعم. يردّ وكلاء Hayya AI بالعربية والإنجليزية، باللغة التي يكتب بها العميل، ويحوّلون المحادثة إلى أحد أعضاء فريقك مع كامل سياقها عندما تحتاج إلى تدخل بشري.',
    },
    {
      q: 'أين تُخزَّن بياناتي؟',
      a: 'يعمل Hayya AI على Google Cloud في منطقة me‑central1 في الدوحة، قطر. وتُعالَج بعض البيانات لدى مزوّدي الخدمات الخارجيين اللازمين لميزات محددة، مثل مزوّدي نماذج الذكاء الاصطناعي ومعالجي الدفع وخدمات إرسال البريد ومنصات المراسلة التي تربطها، كما هو موضّح في سياسة الخصوصية.',
    },
    {
      q: 'كم تكلفة Hayya AI؟',
      a: 'يمكنك إنشاء حساب مجاناً. الباقات المدفوعة مسعّرة بالريال القطري، وتُدفع شهرياً دون التزام سنوي، والأسعار الحالية معروضة في قسم الباقات.',
    },
    {
      q: 'كم يستغرق الإعداد؟',
      a: 'يستغرق الإعداد نحو خمس دقائق: أنشئ حسابك، ثم اربط قنواتك (مثل واتساب للأعمال وإنستغرام)، ثم فعّل وكيل الذكاء الاصطناعي.',
    },
    {
      q: 'من يقف وراء Hayya AI؟',
      a: 'Hayya AI منتج تابع لشركة هيّا ميد للذكاء الاصطناعي (Hayya Med Artificial Intelligence، سجل تجاري رقم 219050)، وهي شركة حلول ذكاء اصطناعي وتقنيات مؤسسية تأسست في يونيو 2025 في الدوحة، قطر، على يد عباس المصري.',
    },
  ],
}

export function faqJsonLd(locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: locale,
    mainEntity: FAQ[locale].map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}
