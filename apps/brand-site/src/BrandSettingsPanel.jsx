import { useState } from 'react';
import logo from './assets/rd_logo.png';

export default function BrandSettingsPanel({ content, updateContent, onClose }) {
  const [tab, setTab] = useState('brandsite');
  const [draft, setDraft] = useState(content);
  const [saved, setSaved] = useState(false);

  const save = () => {
    updateContent(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'brandsite', label: '🌐 Overview' },
    { id: 'hero',      label: '🏠 Hero' },
    { id: 'about',     label: '📖 About' },
    { id: 'services',  label: '✂️ Services' },
    { id: 'gallery',   label: '🖼 Gallery' },
    { id: 'testimonials', label: '⭐ Reviews' },
    { id: 'contact',   label: '📞 Contact' },
  ];

  return (
    <div className="bsp-panel">
      {/* Header */}
      <div className="bsp-header">
        <div className="bsp-header-left">
          <img src={logo} alt="R&D's" className="bsp-logo" />
          <span className="bsp-title">Brand Site Settings</span>
        </div>
        <div className="bsp-header-actions">
          <button className="bsp-save" onClick={save}>{saved ? '✓ Saved!' : 'Save'}</button>
          <button className="bsp-close" onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bsp-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`bsp-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bsp-body">

        {tab === 'brandsite' && (
          <div className="bsp-form">
            <p className="bsp-hint">Click any section to edit it.</p>
            <div className="bsp-overview-grid">
              {[
                { id: 'hero',         icon: '🏠', label: 'Hero',         sub: 'Title & CTA' },
                { id: 'about',        icon: '📖', label: 'About',        sub: 'Story & Stats' },
                { id: 'services',     icon: '✂️', label: 'Services',     sub: `${draft.services.length} items` },
                { id: 'gallery',      icon: '🖼', label: 'Gallery',      sub: `${draft.gallery.length} items` },
                { id: 'testimonials', icon: '⭐', label: 'Reviews',      sub: `${draft.testimonials?.length || 0} reviews` },
                { id: 'contact',      icon: '📞', label: 'Contact',      sub: 'Phone & Address' },
              ].map(c => (
                <div key={c.id} className="bsp-overview-card" onClick={() => setTab(c.id)}>
                  <span className="bsp-ov-icon">{c.icon}</span>
                  <span className="bsp-ov-label">{c.label}</span>
                  <span className="bsp-ov-sub">{c.sub}</span>
                  <span className="bsp-ov-arrow">Edit →</span>
                </div>
              ))}
            </div>

            {/* Announcement */}
            <div className="bsp-card">
              <h3 className="bsp-card-title">📢 Announcement Bar</h3>
              <div className="bsp-toggle-row">
                <span className="bsp-label">Show on website</span>
                <button
                  className={`bsp-toggle ${draft.announcement?.enabled ? 'on' : 'off'}`}
                  onClick={() => setDraft(d => ({ ...d, announcement: { ...d.announcement, enabled: !d.announcement?.enabled } }))}
                >
                  {draft.announcement?.enabled ? 'ON' : 'OFF'}
                </button>
              </div>
              <Field label="Message" value={draft.announcement?.message || ''}
                onChange={v => setDraft(d => ({ ...d, announcement: { ...d.announcement, message: v } }))} />
              <Field label="Background colour (hex)" value={draft.announcement?.bgColor || '#c9a84c'}
                onChange={v => setDraft(d => ({ ...d, announcement: { ...d.announcement, bgColor: v } }))} />
              <div className="bsp-field">
                <label className="bsp-label">Auto-expire date (optional)</label>
                <input className="bsp-input" type="date" value={draft.announcement?.expiresAt || ''}
                  onChange={e => setDraft(d => ({ ...d, announcement: { ...d.announcement, expiresAt: e.target.value } }))} />
              </div>
            </div>

            {/* Social */}
            <div className="bsp-card">
              <h3 className="bsp-card-title">📱 Social Media</h3>
              <Field label="Instagram URL" value={draft.social?.instagram || ''}
                onChange={v => setDraft(d => ({ ...d, social: { ...d.social, instagram: v } }))} />
              <Field label="Facebook URL" value={draft.social?.facebook || ''}
                onChange={v => setDraft(d => ({ ...d, social: { ...d.social, facebook: v } }))} />
              <Field label="WhatsApp Business URL" value={draft.social?.whatsappBusiness || ''}
                onChange={v => setDraft(d => ({ ...d, social: { ...d.social, whatsappBusiness: v } }))} />
            </div>

            {/* SEO */}
            <div className="bsp-card">
              <h3 className="bsp-card-title">🔍 SEO</h3>
              <Field label="Page Title" value={draft.seo?.title || ''}
                onChange={v => setDraft(d => ({ ...d, seo: { ...d.seo, title: v } }))} />
              <Field label="Meta Description" value={draft.seo?.description || ''}
                onChange={v => setDraft(d => ({ ...d, seo: { ...d.seo, description: v } }))}
                multiline rows={3} />
            </div>
          </div>
        )}

        {tab === 'hero' && (
          <div className="bsp-form">
            <Field label="Brand Title" value={draft.hero.title}
              onChange={v => setDraft(d => ({ ...d, hero: { ...d.hero, title: v } }))} />
            <Field label="Subtitle" value={draft.hero.subtitle}
              onChange={v => setDraft(d => ({ ...d, hero: { ...d.hero, subtitle: v } }))} />
            <Field label="Tagline (shown in quotes)" value={draft.hero.tagline}
              onChange={v => setDraft(d => ({ ...d, hero: { ...d.hero, tagline: v } }))} />
            <Field label="CTA Button Text" value={draft.hero.cta}
              onChange={v => setDraft(d => ({ ...d, hero: { ...d.hero, cta: v } }))} />
          </div>
        )}

        {tab === 'about' && (
          <div className="bsp-form">
            <Field label="Section Title" value={draft.about.title}
              onChange={v => setDraft(d => ({ ...d, about: { ...d.about, title: v } }))} />
            <Field label="Story (blank line = new paragraph)" value={draft.about.body}
              onChange={v => setDraft(d => ({ ...d, about: { ...d.about, body: v } }))}
              multiline rows={6} />
            <div className="bsp-row-3">
              <Field label="Years" value={draft.about.years}
                onChange={v => setDraft(d => ({ ...d, about: { ...d.about, years: v } }))} />
              <Field label="Orders" value={draft.about.orders}
                onChange={v => setDraft(d => ({ ...d, about: { ...d.about, orders: v } }))} />
              <Field label="Customers" value={draft.about.customers}
                onChange={v => setDraft(d => ({ ...d, about: { ...d.about, customers: v } }))} />
            </div>
          </div>
        )}

        {tab === 'services' && (
          <div className="bsp-form">
            {draft.services.map((svc, i) => (
              <div key={svc.id} className="bsp-card">
                <div className="bsp-card-header">
                  <span className="bsp-card-num">#{i + 1}</span>
                  <button className="bsp-remove" onClick={() =>
                    setDraft(d => ({ ...d, services: d.services.filter((_, j) => j !== i) }))
                  }>Remove</button>
                </div>
                <div className="bsp-row-2">
                  <Field label="Icon" value={svc.icon}
                    onChange={v => setDraft(d => ({ ...d, services: d.services.map((s, j) => j === i ? { ...s, icon: v } : s) }))} />
                  <Field label="Title" value={svc.title}
                    onChange={v => setDraft(d => ({ ...d, services: d.services.map((s, j) => j === i ? { ...s, title: v } : s) }))} />
                </div>
                <Field label="Description" value={svc.desc}
                  onChange={v => setDraft(d => ({ ...d, services: d.services.map((s, j) => j === i ? { ...s, desc: v } : s) }))}
                  multiline rows={2} />
              </div>
            ))}
            <button className="bsp-btn-add" onClick={() =>
              setDraft(d => ({ ...d, services: [...d.services, { id: Date.now(), icon: '✂️', title: 'New Service', desc: '' }] }))
            }>+ Add Service</button>
          </div>
        )}

        {tab === 'gallery' && (
          <div className="bsp-form">
            {draft.gallery.map((item, i) => (
              <div key={item.id} className="bsp-card">
                <div className="bsp-card-header">
                  <span className="bsp-card-num">Item #{i + 1}</span>
                  <button className="bsp-remove" onClick={() =>
                    setDraft(d => ({ ...d, gallery: d.gallery.filter((_, j) => j !== i) }))
                  }>Remove</button>
                </div>
                <div className="bsp-row-2">
                  <Field label="Label" value={item.label || item.title || ''}
                    onChange={v => setDraft(d => ({ ...d, gallery: d.gallery.map((g, j) => j === i ? { ...g, label: v } : g) }))} />
                  <Field label="Emoji" value={item.emoji || ''}
                    onChange={v => setDraft(d => ({ ...d, gallery: d.gallery.map((g, j) => j === i ? { ...g, emoji: v } : g) }))} />
                </div>
                <div className="bsp-field">
                  <label className="bsp-label">Upload Image</label>
                  <input type="file" accept="image/*" className="bsp-input"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = ev => setDraft(d => ({ ...d, gallery: d.gallery.map((g, j) => j === i ? { ...g, imageUrl: ev.target.result } : g) }));
                      reader.readAsDataURL(file);
                    }}
                  />
                  {item.imageUrl && <img src={item.imageUrl} alt="" style={{width:'80px',height:'80px',objectFit:'cover',marginTop:'4px',borderRadius:'6px'}} />}
                </div>
                <Field label="Image URL (optional)" value={item.imageUrl || ''}
                  onChange={v => setDraft(d => ({ ...d, gallery: d.gallery.map((g, j) => j === i ? { ...g, imageUrl: v } : g) }))} />
              </div>
            ))}
            <button className="bsp-btn-add" onClick={() =>
              setDraft(d => ({ ...d, gallery: [...d.gallery, { id: Date.now(), emoji: '👗', label: 'New Item', colour: '#f8f0e8' }] }))
            }>+ Add Gallery Item</button>
          </div>
        )}

        {tab === 'testimonials' && (
          <div className="bsp-form">
            {(draft.testimonials || []).map((t, i) => (
              <div key={t.id} className="bsp-card">
                <div className="bsp-card-header">
                  <span className="bsp-card-num">Review #{i + 1}</span>
                  <button className="bsp-remove" onClick={() =>
                    setDraft(d => ({ ...d, testimonials: d.testimonials.filter((_, j) => j !== i) }))
                  }>Remove</button>
                </div>
                <div className="bsp-row-2">
                  <Field label="Name" value={t.name}
                    onChange={v => setDraft(d => ({ ...d, testimonials: d.testimonials.map((x, j) => j === i ? { ...x, name: v } : x) }))} />
                  <Field label="Role / Occasion" value={t.role}
                    onChange={v => setDraft(d => ({ ...d, testimonials: d.testimonials.map((x, j) => j === i ? { ...x, role: v } : x) }))} />
                </div>
                <Field label="Review Text" value={t.text}
                  onChange={v => setDraft(d => ({ ...d, testimonials: d.testimonials.map((x, j) => j === i ? { ...x, text: v } : x) }))}
                  multiline rows={3} />
                <Field label="Stars (1–5)" value={String(t.stars)}
                  onChange={v => setDraft(d => ({ ...d, testimonials: d.testimonials.map((x, j) => j === i ? { ...x, stars: Math.min(5, Math.max(1, Number(v) || 5)) } : x) }))} />
              </div>
            ))}
            <button className="bsp-btn-add" onClick={() =>
              setDraft(d => ({ ...d, testimonials: [...(d.testimonials || []), { id: Date.now(), name: 'Customer Name', role: 'Customer', text: '', stars: 5 }] }))
            }>+ Add Review</button>
          </div>
        )}

        {tab === 'contact' && (
          <div className="bsp-form">
            <Field label="Phone Number" value={draft.contact.phone}
              onChange={v => setDraft(d => ({ ...d, contact: { ...d.contact, phone: v } }))} />
            <Field label="Email (optional)" value={draft.contact.email || ''}
              onChange={v => setDraft(d => ({ ...d, contact: { ...d.contact, email: v } }))} />
            <Field label="WhatsApp Number (e.g. 918448505933)" value={draft.contact.whatsapp || ''}
              onChange={v => setDraft(d => ({ ...d, contact: { ...d.contact, whatsapp: v } }))} />
            <Field label="Address" value={draft.contact.address}
              onChange={v => setDraft(d => ({ ...d, contact: { ...d.contact, address: v } }))}
              multiline rows={3} />
            <Field label="Business Hours" value={draft.contact.hours}
              onChange={v => setDraft(d => ({ ...d, contact: { ...d.contact, hours: v } }))}
              multiline rows={2} />
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, multiline, rows }) {
  return (
    <div className="bsp-field">
      <label className="bsp-label">{label}</label>
      {multiline
        ? <textarea className="bsp-input" rows={rows || 3} value={value} onChange={e => onChange(e.target.value)} />
        : <input className="bsp-input" type="text" value={value} onChange={e => onChange(e.target.value)} />
      }
    </div>
  );
}
