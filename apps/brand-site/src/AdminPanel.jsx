import { useState } from 'react';
import { getAdminPass, setAdminPass, DEFAULT_CONTENT } from './App.jsx';
import logo from './assets/rd_logo.png';

export default function AdminPanel({ content, updateContent, onExit }) {
  const [authed, setAuthed] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState('');
  const [tab, setTab] = useState('brandsite');
  const [draft, setDraft] = useState(content);
  const [saved, setSaved] = useState(false);

  const login = () => {
    if (passInput === getAdminPass()) {
      setAuthed(true);
      setPassError('');
    } else {
      setPassError('Incorrect password. Default is admin123');
    }
  };

  const save = () => {
    updateContent(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = () => {
    if (window.confirm('Reset all website content to defaults?')) {
      setDraft(DEFAULT_CONTENT);
      updateContent(DEFAULT_CONTENT);
    }
  };

  // ── LOGIN SCREEN ─────────────────────────────────────────
  if (!authed) {
    return (
      <div className="admin-login-bg">
        <div className="admin-login-box">
          <img src={logo} alt="R&D's" className="admin-login-logo" />
          <h2 className="admin-login-title">Admin Panel</h2>
          <p className="admin-login-sub">R&amp;D's Fashion House · Website Manager</p>
          <div className="admin-field">
            <label className="admin-label">Password</label>
            <input
              type="password"
              className="admin-input"
              placeholder="Enter admin password"
              value={passInput}
              onChange={e => setPassInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
              autoFocus
            />
            {passError && <p className="admin-error">{passError}</p>}
          </div>
          <button className="btn-gold full-width" onClick={login}>Sign In →</button>
          <button className="admin-back-link" onClick={onExit}>← Back to Website</button>
        </div>
      </div>
    );
  }

  // ── ADMIN DASHBOARD ──────────────────────────────────────
  const tabs = [
    { id: 'brandsite', label: '🌐 Brand Site' },
    { id: 'hero', label: '🏠 Hero' },
    { id: 'about', label: '📖 About' },
    { id: 'services', label: '✂️ Services' },
    { id: 'gallery', label: '🖼 Gallery' },
    { id: 'testimonials', label: '⭐ Testimonials' },
    { id: 'contact', label: '📞 Contact' },
    { id: 'settings', label: '⚙️ Settings' },
  ];

  return (
    <div className="admin-panel">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <img src={logo} alt="R&D's" className="admin-sidebar-logo" />
          <div>
            <p className="admin-sidebar-brand">R&amp;D's Fashion House</p>
            <p className="admin-sidebar-role">Website Admin</p>
          </div>
        </div>
        <nav className="admin-nav">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`admin-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button className="btn-save" onClick={save}>{saved ? '✓ Saved!' : 'Save Changes'}</button>
          <button className="admin-view-site" onClick={onExit}>← View Site</button>
          <button className="admin-reset" onClick={reset}>Reset to Defaults</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <div className="admin-main-header">
          <h2 className="admin-main-title">{tabs.find(t => t.id === tab)?.label} Settings</h2>
          <button className="btn-save sm" onClick={save}>{saved ? '✓ Saved!' : 'Save'}</button>
        </div>

        {/* BRAND SITE TAB */}
        {tab === 'brandsite' && (
          <div className="admin-form">
            {/* Overview */}
            <p className="admin-hint" style={{ marginBottom: 4 }}>Manage all sections of your brand website from here.</p>
            <div className="admin-overview-grid">
              <div className="admin-overview-card" style={{ cursor: 'pointer' }} onClick={() => setTab('services')}>
                <span className="overview-icon">✂️</span>
                <span className="overview-num">{draft.services.length}</span>
                <span className="overview-lbl">Services</span>
                <span className="overview-manage">Manage →</span>
              </div>
              <div className="admin-overview-card" style={{ cursor: 'pointer' }} onClick={() => setTab('gallery')}>
                <span className="overview-icon">🖼</span>
                <span className="overview-num">{draft.gallery.length}</span>
                <span className="overview-lbl">Gallery Items</span>
                <span className="overview-manage">Manage →</span>
              </div>
              <div className="admin-overview-card" style={{ cursor: 'pointer' }} onClick={() => setTab('testimonials')}>
                <span className="overview-icon">⭐</span>
                <span className="overview-num">{draft.testimonials?.length || 0}</span>
                <span className="overview-lbl">Testimonials</span>
                <span className="overview-manage">Manage →</span>
              </div>
              <div className="admin-overview-card" style={{ cursor: 'pointer' }} onClick={() => setTab('hero')}>
                <span className="overview-icon">🏠</span>
                <span className="overview-num">Hero</span>
                <span className="overview-lbl">Title & CTA</span>
                <span className="overview-manage">Edit →</span>
              </div>
              <div className="admin-overview-card" style={{ cursor: 'pointer' }} onClick={() => setTab('about')}>
                <span className="overview-icon">📖</span>
                <span className="overview-num">About</span>
                <span className="overview-lbl">Story & Stats</span>
                <span className="overview-manage">Edit →</span>
              </div>
              <div className="admin-overview-card" style={{ cursor: 'pointer' }} onClick={() => setTab('contact')}>
                <span className="overview-icon">📞</span>
                <span className="overview-num">Contact</span>
                <span className="overview-lbl">Phone & Address</span>
                <span className="overview-manage">Edit →</span>
              </div>
              <div className="admin-overview-card" style={{ cursor: 'pointer', gridColumn: '1 / -1' }} onClick={() => setTab('settings')}>
                <span className="overview-icon">📢</span>
                <span className="overview-num" style={{ fontSize: 22 }}>{draft.announcement?.enabled ? '✅ Announcement ON' : '❌ Announcement OFF'}</span>
                <span className="overview-lbl">Toggle in Settings below ↓ or click to manage</span>
              </div>
            </div>

            {/* Announcement Bar */}
            <div className="admin-card">
              <h3 className="admin-card-title">📢 Announcement Bar</h3>
              <p className="admin-hint">Show a banner at the top of the brand website.</p>
              <div className="admin-toggle-row">
                <span className="admin-label">Show Announcement</span>
                <button
                  className={`admin-toggle ${draft.announcement?.enabled ? 'on' : 'off'}`}
                  onClick={() => setDraft(d => ({ ...d, announcement: { ...d.announcement, enabled: !d.announcement?.enabled } }))}
                >
                  {draft.announcement?.enabled ? 'ON' : 'OFF'}
                </button>
              </div>
              <Field label="Announcement Message" value={draft.announcement?.message || ''}
                onChange={v => setDraft(d => ({ ...d, announcement: { ...d.announcement, message: v } }))} />
              <Field label="Background Colour (hex)" value={draft.announcement?.bgColor || '#c9a84c'}
                onChange={v => setDraft(d => ({ ...d, announcement: { ...d.announcement, bgColor: v } }))} />
              <div className="admin-field">
                <label className="admin-label">Auto-expire date (optional)</label>
                <input className="admin-input" type="date" value={draft.announcement?.expiresAt || ''}
                  onChange={e => setDraft(d => ({ ...d, announcement: { ...d.announcement, expiresAt: e.target.value } }))} />
              </div>
            </div>

            {/* SEO */}
            <div className="admin-card">
              <h3 className="admin-card-title">🔍 SEO Settings</h3>
              <p className="admin-hint">Controls how your site appears in Google search results.</p>
              <Field label="Page Title (shown in browser tab & Google)" value={draft.seo?.title || ''}
                onChange={v => setDraft(d => ({ ...d, seo: { ...d.seo, title: v } }))} />
              <Field label="Meta Description (shown in Google search)" value={draft.seo?.description || ''}
                onChange={v => setDraft(d => ({ ...d, seo: { ...d.seo, description: v } }))}
                multiline rows={3} />
            </div>

            {/* Social Media */}
            <div className="admin-card">
              <h3 className="admin-card-title">📱 Social Media Links</h3>
              <Field label="Instagram URL" value={draft.social?.instagram || ''}
                onChange={v => setDraft(d => ({ ...d, social: { ...d.social, instagram: v } }))} />
              <Field label="Facebook URL" value={draft.social?.facebook || ''}
                onChange={v => setDraft(d => ({ ...d, social: { ...d.social, facebook: v } }))} />
              <Field label="WhatsApp Business URL" value={draft.social?.whatsappBusiness || ''}
                onChange={v => setDraft(d => ({ ...d, social: { ...d.social, whatsappBusiness: v } }))} />
            </div>
          </div>
        )}

        {/* HERO TAB */}
        {tab === 'hero' && (
          <div className="admin-form">
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

        {/* ABOUT TAB */}
        {tab === 'about' && (
          <div className="admin-form">
            <Field label="Section Title" value={draft.about.title}
              onChange={v => setDraft(d => ({ ...d, about: { ...d.about, title: v } }))} />
            <Field label="Story (separate paragraphs with blank line)" value={draft.about.body}
              onChange={v => setDraft(d => ({ ...d, about: { ...d.about, body: v } }))}
              multiline rows={6} />
            <div className="admin-row-3">
              <Field label="Years" value={draft.about.years}
                onChange={v => setDraft(d => ({ ...d, about: { ...d.about, years: v } }))} />
              <Field label="Orders" value={draft.about.orders}
                onChange={v => setDraft(d => ({ ...d, about: { ...d.about, orders: v } }))} />
              <Field label="Customers" value={draft.about.customers}
                onChange={v => setDraft(d => ({ ...d, about: { ...d.about, customers: v } }))} />
            </div>
          </div>
        )}

        {/* SERVICES TAB */}
        {tab === 'services' && (
          <div className="admin-form">
            <p className="admin-hint">Edit, remove or add services shown on the website.</p>
            {draft.services.map((svc, i) => (
              <div key={svc.id} className="admin-card">
                <div className="admin-card-header">
                  <span className="admin-card-num">#{i + 1}</span>
                  <button className="admin-remove" onClick={() =>
                    setDraft(d => ({ ...d, services: d.services.filter((_, j) => j !== i) }))
                  }>Remove</button>
                </div>
                <div className="admin-row-2">
                  <Field label="Icon (emoji)" value={svc.icon}
                    onChange={v => setDraft(d => ({ ...d, services: d.services.map((s, j) => j === i ? { ...s, icon: v } : s) }))} />
                  <Field label="Title" value={svc.title}
                    onChange={v => setDraft(d => ({ ...d, services: d.services.map((s, j) => j === i ? { ...s, title: v } : s) }))} />
                </div>
                <Field label="Description" value={svc.desc}
                  onChange={v => setDraft(d => ({ ...d, services: d.services.map((s, j) => j === i ? { ...s, desc: v } : s) }))}
                  multiline rows={2} />
              </div>
            ))}
            <button className="btn-add" onClick={() =>
              setDraft(d => ({ ...d, services: [...d.services, { id: Date.now(), icon: '✂️', title: 'New Service', desc: 'Description here.' }] }))
            }>+ Add Service</button>
          </div>
        )}

        {/* GALLERY TAB */}
        {tab === 'gallery' && (
          <div className="admin-form">
            <p className="admin-hint">Add an image URL or leave blank to use an emoji placeholder.</p>
            {draft.gallery.map((item, i) => (
              <div key={item.id} className="admin-card">
                <div className="admin-card-header">
                  <span className="admin-card-num">Item #{i + 1}</span>
                  <button className="admin-remove" onClick={() =>
                    setDraft(d => ({ ...d, gallery: d.gallery.filter((_, j) => j !== i) }))
                  }>Remove</button>
                </div>
                <div className="admin-row-2">
                  <Field label="Label" value={item.label || item.title || ''}
                    onChange={v => setDraft(d => ({ ...d, gallery: d.gallery.map((g, j) => j === i ? { ...g, label: v } : g) }))} />
                  <Field label="Emoji (if no image)" value={item.emoji || ''}
                    onChange={v => setDraft(d => ({ ...d, gallery: d.gallery.map((g, j) => j === i ? { ...g, emoji: v } : g) }))} />
                </div>
                <Field label="Image URL (optional)" value={item.imageUrl || ''}
                  onChange={v => setDraft(d => ({ ...d, gallery: d.gallery.map((g, j) => j === i ? { ...g, imageUrl: v } : g) }))} />
                <div className="admin-field">
                  <label className="admin-label">Upload Image</label>
                  <input type="file" accept="image/*" className="admin-input"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = ev => setDraft(d => ({ ...d, gallery: d.gallery.map((g, j) => j === i ? { ...g, imageUrl: ev.target.result } : g) }));
                      reader.readAsDataURL(file);
                    }}
                  />
                  {item.imageUrl && <img src={item.imageUrl} alt="preview" style={{width:'80px',height:'80px',objectFit:'cover',marginTop:'4px',borderRadius:'6px'}} />}
                </div>
              </div>
            ))}
            <button className="btn-add" onClick={() =>
              setDraft(d => ({ ...d, gallery: [...d.gallery, { id: Date.now(), emoji: '👗', label: 'New Item', colour: '#f8f0e8' }] }))
            }>+ Add Gallery Item</button>
          </div>
        )}

        {/* CONTACT TAB */}
        {tab === 'contact' && (
          <div className="admin-form">
            <Field label="Phone Number" value={draft.contact.phone}
              onChange={v => setDraft(d => ({ ...d, contact: { ...d.contact, phone: v } }))} />
            <Field label="Email (optional)" value={draft.contact.email || ''}
              onChange={v => setDraft(d => ({ ...d, contact: { ...d.contact, email: v } }))} />
            <Field label="WhatsApp Number (with country code, e.g. 918448505933)" value={draft.contact.whatsapp || ''}
              onChange={v => setDraft(d => ({ ...d, contact: { ...d.contact, whatsapp: v } }))} />
            <Field label="Address" value={draft.contact.address}
              onChange={v => setDraft(d => ({ ...d, contact: { ...d.contact, address: v } }))}
              multiline rows={3} />
            <Field label="Business Hours" value={draft.contact.hours}
              onChange={v => setDraft(d => ({ ...d, contact: { ...d.contact, hours: v } }))}
              multiline rows={2} />
          </div>
        )}

        {/* TESTIMONIALS TAB */}
        {tab === 'testimonials' && (
          <div className="admin-form">
            <p className="admin-hint">Customer reviews shown in the Testimonials section of the brand website.</p>
            {(draft.testimonials || []).map((t, i) => (
              <div key={t.id} className="admin-card">
                <div className="admin-card-header">
                  <span className="admin-card-num">Review #{i + 1}</span>
                  <button className="admin-remove" onClick={() =>
                    setDraft(d => ({ ...d, testimonials: d.testimonials.filter((_, j) => j !== i) }))
                  }>Remove</button>
                </div>
                <div className="admin-row-2">
                  <Field label="Customer Name" value={t.name}
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
            <button className="btn-add" onClick={() =>
              setDraft(d => ({ ...d, testimonials: [...(d.testimonials || []), { id: Date.now(), name: 'Customer Name', role: 'Customer', text: 'Write review here.', stars: 5 }] }))
            }>+ Add Testimonial</button>
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab === 'settings' && (
          <div className="admin-form">
            <div className="admin-card">
              <h3 className="admin-card-title">CRM Integration</h3>
              <Field label="CRM URL (where Login to CRM button points)" value={draft.crmUrl}
                onChange={v => setDraft(d => ({ ...d, crmUrl: v }))} />
              <p className="admin-hint">Default: http://localhost:3000 — change to your production URL when deployed.</p>
            </div>
            <div className="admin-card">
              <h3 className="admin-card-title">Change Admin Password</h3>
              <ChangePassword />
            </div>
            <div className="admin-card danger-zone">
              <h3 className="admin-card-title" style={{ color: '#dc2626' }}>Danger Zone</h3>
              <p className="admin-hint">This will reset all website content back to defaults.</p>
              <button className="btn-danger" onClick={reset}>Reset Website Content</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Field({ label, value, onChange, multiline, rows }) {
  return (
    <div className="admin-field">
      <label className="admin-label">{label}</label>
      {multiline
        ? <textarea className="admin-input" rows={rows || 3} value={value} onChange={e => onChange(e.target.value)} />
        : <input className="admin-input" type="text" value={value} onChange={e => onChange(e.target.value)} />
      }
    </div>
  );
}

function ChangePassword() {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState('');

  const change = () => {
    if (cur !== getAdminPass()) { setMsg('Current password is incorrect.'); return; }
    if (next.length < 6) { setMsg('New password must be at least 6 characters.'); return; }
    setAdminPass(next);
    setCur(''); setNext('');
    setMsg('✓ Password updated successfully!');
  };

  return (
    <div>
      <Field label="Current Password" value={cur} onChange={setCur} />
      <Field label="New Password" value={next} onChange={setNext} />
      {msg && <p className={`admin-msg ${msg.startsWith('✓') ? 'success' : 'error'}`}>{msg}</p>}
      <button className="btn-save" onClick={change}>Update Password</button>
    </div>
  );
}
