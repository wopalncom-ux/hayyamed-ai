// Company/legal footer shared by the inner marketing pages.
const T = {
  en: {
    owned: 'Owned and managed by',
    company: 'Hayya Med AI',
    tagline: 'Artificial Intelligence Solutions & Enterprise Technology',
    address: 'Zone 6, Street 970, Grand Hamad St, Building 2, 3rd Floor, Tejwaans Business Center, Doha, Qatar · P.O. Box 20278',
    contact: 'Contact',
  },
  ar: {
    owned: 'تملكها وتديرها شركة',
    company: 'هيّا ميد للذكاء الاصطناعي',
    tagline: 'حلول الذكاء الاصطناعي والتقنيات المؤسسية',
    address: 'المنطقة 6، الشارع 970، شارع حمد الكبير، المبنى 2، الطابق الثالث، مركز Tejwaans للأعمال، الدوحة، قطر · ص.ب. 20278',
    contact: 'للتواصل',
  },
}

export default function CompanyFooter({ locale = 'en', maxWidth = '900px' }) {
  const t = T[locale] || T.en
  return (
    <footer style={{ maxWidth, margin: '0 auto', padding: '28px 24px', textAlign: 'center', fontSize: '11px', color: '#475569', lineHeight: 1.9 }}>
      {t.owned} <a href="https://hayyamed.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', textDecoration: 'none' }}><strong>{t.company}</strong></a> — {t.tagline}<br />
      {t.address}<br />
      {t.contact}: <span dir="ltr">abbas@hayyamed.ai</span> · <span dir="ltr">+974 3367 7333</span> · © {new Date().getFullYear()} <span dir="ltr">Hayya AI</span>.
    </footer>
  )
}
