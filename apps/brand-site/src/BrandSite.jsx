import { useState, useEffect } from 'react';
import logo from './assets/rd_logo.png';
import watermark from './assets/watermark.png';

export default function BrandSite({ content, onAdminNav, onLoginNav }) {
  const [navScrolled, setNavScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const { hero, about, services, gallery, contact, announcement, social, testimonials } = content;

  const announcementActive = announcement?.enabled && announcement?.message &&
    (!announcement.expiresAt || new Date(announcement.expiresAt) > new Date());

  return (
    <div className="brand">
      {/* ── ANNOUNCEMENT BAR ──────────────────────────────── */}
      {announcementActive && (
        <div className="announcement-bar" style={{ background: announcement.bgColor || '#c9a84c' }}>
          <span className="announcement-text">{announcement.message}</span>
        </div>
      )}

      {/* ── NAVBAR ────────────────────────────────────────── */}
      <nav className={`brand-nav ${navScrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <div className="nav-logo" onClick={() => scrollTo('home')}>
            <img src={logo} alt="R&D's" className="nav-logo-img" />
            <span className="nav-brand-text">R&amp;D's <em>Fashion House</em></span>
          </div>

          {/* Desktop links */}
          <ul className="nav-links">
            {['home', 'about', 'services', 'gallery', 'contact'].map(s => (
              <li key={s}><button onClick={() => scrollTo(s)} className="nav-link">{s.charAt(0).toUpperCase() + s.slice(1)}</button></li>
            ))}
          </ul>

          <div className="nav-actions">
            <button className="btn-crm" onClick={onLoginNav}>🔐 Login</button>
            <button className="hamburger" onClick={() => setMenuOpen(o => !o)}>
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="mobile-menu">
            {['home', 'about', 'services', 'gallery', 'contact'].map(s => (
              <button key={s} onClick={() => scrollTo(s)} className="mobile-link">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
            <button className="btn-crm mobile-crm" onClick={() => { setMenuOpen(false); onLoginNav(); }}>
              Login to CRM
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section id="home" className="hero-section">
        <div className="hero-watermark">
          <img src={watermark} alt="" />
        </div>
        <div className="hero-content">
          <p className="hero-eyebrow">Est. 2014 · Ghaziabad</p>
          <h1 className="hero-title">{hero.title}</h1>
          <p className="hero-subtitle">{hero.subtitle}</p>
          <p className="hero-tagline">"{hero.tagline}"</p>
          <div className="hero-btns">
            <button className="btn-gold" onClick={() => scrollTo('contact')}>{hero.cta}</button>
            <button className="btn-outline" onClick={() => scrollTo('services')}>Our Services</button>
          </div>
        </div>
        <div className="hero-scroll-hint">↓</div>
      </section>

      {/* ── ABOUT ─────────────────────────────────────────── */}
      <section id="about" className="section about-section">
        <div className="section-inner">
          <div className="about-text">
            <p className="section-label">About Us</p>
            <h2 className="section-title">{about.title}</h2>
            {about.body.split('\n\n').map((p, i) => (
              <p key={i} className="about-para">{p}</p>
            ))}
          </div>
          <div className="about-stats">
            <div className="stat-card">
              <span className="stat-number">{about.years}</span>
              <span className="stat-label">Years of Excellence</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{about.orders}</span>
              <span className="stat-label">Orders Crafted</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{about.customers}</span>
              <span className="stat-label">Happy Customers</span>
            </div>
            <div className="stat-card about-address-card">
              <span className="stat-icon">📍</span>
              <span className="stat-label">{about.address || contact.address}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ──────────────────────────────────────── */}
      <section id="services" className="section services-section">
        <div className="section-inner">
          <p className="section-label centered">What We Do</p>
          <h2 className="section-title centered">Our Services</h2>
          <div className="services-grid">
            {services.map(svc => (
              <div key={svc.id} className="service-card">
                <div className="service-icon">{svc.icon}</div>
                <h3 className="service-title">{svc.title}</h3>
                <p className="service-desc">{svc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY ───────────────────────────────────────── */}
      <section id="gallery" className="section gallery-section">
        <div className="section-inner">
          <p className="section-label centered">Portfolio</p>
          <h2 className="section-title centered">Our Creations</h2>
          <div className="gallery-grid">
            {gallery.map(item => (
              <div key={item.id} className="gallery-card" style={{ background: item.colour || '#f8f0e8' }}>
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.label} className="gallery-img" />
                  : <span className="gallery-emoji">{item.emoji || '👗'}</span>
                }
                <div className="gallery-label">{item.label || item.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────── */}
      {testimonials?.length > 0 && (
        <section id="testimonials" className="section testimonials-section">
          <div className="section-inner testimonials-inner">
            <p className="section-label centered">What Clients Say</p>
            <h2 className="section-title centered">Customer Love</h2>
            <div className="testimonials-grid">
              {testimonials.map(t => (
                <div key={t.id} className="testimonial-card">
                  <div className="testimonial-stars">{'★'.repeat(t.stars || 5)}</div>
                  <p className="testimonial-text">"{t.text}"</p>
                  <div className="testimonial-author">
                    <span className="testimonial-name">{t.name}</span>
                    <span className="testimonial-role">{t.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CONTACT ───────────────────────────────────────── */}
      <section id="contact" className="section contact-section">
        <div className="section-inner contact-inner">
          <div className="contact-info">
            <p className="section-label">Get in Touch</p>
            <h2 className="section-title">Visit Us</h2>
            <div className="contact-row">
              <span className="contact-icon">📞</span>
              <a href={`tel:${contact.phone}`} className="contact-val">{contact.phone}</a>
            </div>
            {contact.email && (
              <div className="contact-row">
                <span className="contact-icon">✉️</span>
                <a href={`mailto:${contact.email}`} className="contact-val">{contact.email}</a>
              </div>
            )}
            <div className="contact-row">
              <span className="contact-icon">📍</span>
              <span className="contact-val">{contact.address}</span>
            </div>
            <div className="contact-row">
              <span className="contact-icon">🕐</span>
              <span className="contact-val">{contact.hours}</span>
            </div>
            {contact.whatsapp && (
              <a
                href={`https://wa.me/${contact.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="btn-whatsapp"
              >
                📲 Chat on WhatsApp
              </a>
            )}
            {contact.whatsapp && (
              <div className="enquiry-form">
                <p className="enquiry-title">Send a Quick Enquiry</p>
                <EnquiryForm whatsapp={contact.whatsapp} />
              </div>
            )}
          </div>

          <div className="contact-map-placeholder">
            <div className="map-inner">
              <span style={{ fontSize: 48 }}>📍</span>
              <p>HIG, J-3A, Sanjay Nagar,<br />Sec-23, Ghaziabad</p>
              <a
                href="https://maps.google.com/?q=HIG+J-3A+Sanjay+Nagar+Sec-23+Ghaziabad"
                target="_blank"
                rel="noreferrer"
                className="btn-outline-sm"
              >
                Open in Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="brand-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src={logo} alt="R&D's" className="footer-logo" />
            <p className="footer-name">R&amp;D's Fashion House</p>
            <p className="footer-tag">Every stitch, a story.</p>
            <div className="footer-social">
              {social?.instagram && <a href={social.instagram} target="_blank" rel="noreferrer" className="social-icon" title="Instagram">📸</a>}
              {social?.facebook && <a href={social.facebook} target="_blank" rel="noreferrer" className="social-icon" title="Facebook">📘</a>}
              {social?.whatsappBusiness && <a href={social.whatsappBusiness} target="_blank" rel="noreferrer" className="social-icon" title="WhatsApp">💬</a>}
            </div>
          </div>
          <div className="footer-links">
            <p className="footer-col-title">Quick Links</p>
            {['home', 'about', 'services', 'gallery', 'contact'].map(s => (
              <button key={s} onClick={() => scrollTo(s)} className="footer-link">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="footer-links">
            <p className="footer-col-title">Contact</p>
            <p className="footer-text">{contact.phone}</p>
            <p className="footer-text" style={{ whiteSpace: 'pre-line' }}>{contact.address}</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} R&amp;D's Fashion House. All rights reserved.</p>
          <button className="admin-link" onClick={onAdminNav} title="Admin">·</button>
        </div>
      </footer>

    </div>
  );
}

function EnquiryForm({ whatsapp }) {
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const send = () => {
    if (!name.trim() || !msg.trim()) return;
    const text = encodeURIComponent(`Hi, I'm ${name}. ${msg}`);
    window.open(`https://wa.me/${whatsapp}?text=${text}`, '_blank');
  };
  return (
    <div className="enquiry-fields">
      <input className="enquiry-input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
      <textarea className="enquiry-textarea" placeholder="Your message..." value={msg} onChange={e => setMsg(e.target.value)} rows={3} />
      <button className="btn-enquiry" onClick={send}>📲 Send via WhatsApp</button>
    </div>
  );
}
