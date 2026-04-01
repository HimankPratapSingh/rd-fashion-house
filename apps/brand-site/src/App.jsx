import { useState, useEffect } from 'react';
import BrandSite from './BrandSite.jsx';
import AdminPanel from './AdminPanel.jsx';
import LoginPage from './LoginPage.jsx';
import BrandSettingsPanel from './BrandSettingsPanel.jsx';

const CONTENT_KEY = 'rd_brand_content';
const ADMIN_PASS_KEY = 'rd_admin_pass';

export const DEFAULT_CONTENT = {
  crmUrl: 'http://localhost:3000',
  hero: {
    title: "R&D's Fashion House",
    subtitle: 'Bespoke Tailoring & Design',
    tagline: 'Where Every Stitch Tells Your Story',
    cta: 'Book a Consultation',
  },
  about: {
    title: 'Our Story',
    body: "R&D's Fashion House has been crafting bespoke garments for discerning clients across Ghaziabad and beyond. With a passion for precision and an eye for design, every piece we create is a celebration of your individuality.\n\nFrom elegant suits to intricate bridal wear, our master tailors bring decades of expertise to every stitch. We believe that great clothing is not just made — it is crafted with love.",
    years: '10+',
    orders: '5000+',
    customers: '3000+',
  },
  services: [
    { id: 1, icon: '✂️', title: 'Custom Suit & Salwar', desc: 'Perfectly tailored suits, salwar-kameez and churidar with precise measurements.' },
    { id: 2, icon: '👗', title: 'Blouse & Lehenga', desc: 'Elegant blouses and lehengas crafted to match your vision and fabric.' },
    { id: 3, icon: '💍', title: 'Bridal Wear', desc: 'Exquisite bridal ensembles — from engagement outfits to the grand wedding day.' },
    { id: 4, icon: '🪡', title: 'Alterations & Repairs', desc: 'Expert alterations and repairs to give your beloved garments a fresh life.' },
    { id: 5, icon: '🎨', title: 'Design Consultation', desc: 'One-on-one sessions to transform your ideas into wearable masterpieces.' },
    { id: 6, icon: '🧵', title: 'Fabric Sourcing', desc: 'Curated fabrics from premium suppliers — georgette, silk, velvet, and more.' },
  ],
  gallery: [
    { id: 1, emoji: '👘', label: 'Anarkali Suit', colour: '#f8e0e0' },
    { id: 2, emoji: '🥻', label: 'Silk Saree Blouse', colour: '#e0f0f8' },
    { id: 3, emoji: '💐', label: 'Bridal Lehenga', colour: '#f8e8f0' },
    { id: 4, emoji: '🎀', label: 'Party Wear Kurti', colour: '#e8f8e0' },
    { id: 5, emoji: '✨', label: 'Wedding Sharara', colour: '#f8f0e0' },
    { id: 6, emoji: '👑', title: 'Designer Suit', colour: '#f0e0f8' },
  ],
  contact: {
    phone: '+91-8448505933',
    address: 'HIG, J-3A, Sanjay Nagar, Sec-23,\nOpp. PNB, Ghaziabad – 201001 (U.P.)',
    hours: 'Mon – Sat: 10:00 AM – 8:00 PM\nSunday: 11:00 AM – 6:00 PM',
    email: '',
    whatsapp: '918448505933',
  },
  announcement: {
    enabled: false,
    message: '🎉 Special offer this week — 20% off on bridal stitching! Call now.',
    bgColor: '#c9a84c',
  },
  seo: {
    title: "R&D's Fashion House | Bespoke Tailoring & Design, Ghaziabad",
    description: 'R&D\'s Fashion House offers bespoke tailoring, bridal wear, suit & blouse stitching in Ghaziabad. 10+ years of excellence, 5000+ happy customers.',
  },
  social: {
    instagram: '',
    facebook: '',
    whatsappBusiness: 'https://wa.me/918448505933',
  },
  testimonials: [
    { id: 1, name: 'Priya Sharma', role: 'Bride', text: 'My bridal lehenga was absolutely stunning. The attention to detail and fit was perfect. I felt like royalty!', stars: 5 },
    { id: 2, name: 'Anjali Gupta', role: 'Regular Customer', text: 'Been coming here for 5 years. Best tailoring in Ghaziabad — always on time, always perfect!', stars: 5 },
    { id: 3, name: 'Sunita Verma', role: 'Customer', text: 'They turned my dream design into reality. The fabric quality and craftsmanship is unmatched.', stars: 5 },
  ],
};

export function loadContent() {
  try {
    const saved = localStorage.getItem(CONTENT_KEY);
    if (saved) return { ...DEFAULT_CONTENT, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_CONTENT;
}

export function saveContent(data) {
  localStorage.setItem(CONTENT_KEY, JSON.stringify(data));
}

export function getAdminPass() {
  return localStorage.getItem(ADMIN_PASS_KEY) || 'admin123';
}

export function setAdminPass(p) {
  localStorage.setItem(ADMIN_PASS_KEY, p);
}

export default function App() {
  const [page, setPage] = useState('brand'); // 'brand' | 'login' | 'crm' | 'admin'
  const [content, setContent] = useState(loadContent);

  useEffect(() => {
    if (content.seo?.title) document.title = content.seo.title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'description'); document.head.appendChild(meta); }
    if (content.seo?.description) meta.setAttribute('content', content.seo.description);
  }, [content.seo]);

  const updateContent = (data) => {
    setContent(data);
    saveContent(data);
  };

  if (page === 'admin') {
    return <AdminPanel content={content} updateContent={updateContent} onExit={() => setPage('brand')} />;
  }

  if (page === 'login') {
    return (
      <LoginPage
        onSuccess={() => setPage('crm')}
        onBack={() => setPage('brand')}
      />
    );
  }

  if (page === 'crm') {
    return <CRMView crmUrl={content.crmUrl} onBack={() => setPage('brand')} content={content} updateContent={updateContent} />;
  }

  return (
    <BrandSite
      content={content}
      onAdminNav={() => setPage('admin')}
      onLoginNav={() => setPage('login')}
    />
  );
}

function CRMView({ crmUrl, onBack, content, updateContent }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="crm-shell">
      <div className="crm-topbar">
        <button className="crm-back-btn" onClick={onBack}>
          ← Back to Website
        </button>
        <span className="crm-topbar-brand">R&amp;D's Fashion House · Management System</span>
        <button className="crm-settings-btn" onClick={() => setSettingsOpen(o => !o)}>
          🌐 Brand Site
        </button>
      </div>

      <div className="crm-body">
        <iframe
          className="crm-iframe"
          src={crmUrl}
          title="R&D's Fashion House CRM"
          allow="camera; microphone; geolocation"
        />

        {/* Brand Site Settings Drawer */}
        {settingsOpen && (
          <div className="crm-settings-drawer">
            <BrandSettingsPanel
              content={content}
              updateContent={updateContent}
              onClose={() => setSettingsOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
