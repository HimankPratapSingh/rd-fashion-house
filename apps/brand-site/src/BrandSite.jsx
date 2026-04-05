import { useState, useEffect, useRef } from 'react';
import logo from './assets/rd_logo.png';
import watermark from './assets/watermark.png';

const WA_NUM = '918448505933';
const waLink = (msg) => `https://wa.me/${WA_NUM}?text=${encodeURIComponent(msg)}`;

function SectionDivider({ dark, cream }) {
  const cls = dark ? ' section-divider-dark' : cream ? ' section-divider-cream' : '';
  return (
    <div className={`section-divider${cls}`}>
      <div className="section-divider-line" />
      <span className="section-divider-gem" aria-hidden="true">✦ ✦ ✦</span>
      <div className="section-divider-line" />
    </div>
  );
}

const STEPS = [
  { step: '01', title: 'Consultation', desc: 'Chat or visit us. Share your design idea, occasion, and fabric preference.' },
  { step: '02', title: 'Measurements', desc: 'We take precise measurements in-store or guide you remotely via WhatsApp.' },
  { step: '03', title: 'Crafting', desc: 'Our master tailors craft your garment with care, stitch by stitch.' },
  { step: '04', title: 'Delivery', desc: 'Pick up your finished piece or get it delivered. 100% satisfaction guaranteed.' },
];

const PRICING = [
  { id: 1, title: 'Blouse', price: '₹350', desc: 'Simple blouse stitching with basic cut and lining.' },
  { id: 2, title: 'Salwar Suit', price: '₹550', desc: 'Full salwar-kameez set with churidar or palazzo.' },
  { id: 3, title: 'Kurti', price: '₹400', desc: 'Short or long kurti with designer neck work.', popular: true },
  { id: 4, title: 'Lehenga', price: '₹1,200', desc: 'Lehenga with blouse, fully lined with lace finishing.' },
  { id: 5, title: 'Anarkali Suit', price: '₹800', desc: 'Floor-length anarkali with dupatta and embroidery.' },
  { id: 6, title: 'Bridal Wear', price: 'Custom', desc: 'Bespoke bridal ensemble — pricing on consultation.' },
];

const FAQS = [
  { q: 'How long does stitching take?', a: 'Most garments are ready in 5–7 working days. Bridal wear may take 2–3 weeks depending on complexity.' },
  { q: 'Can I provide my own fabric?', a: 'Yes! You can bring your own fabric. We also stock premium fabrics — silk, georgette, velvet, and more.' },
  { q: 'Do you do home visits for measurements?', a: 'For bridal orders above ₹3,000, we offer a complimentary home visit within Ghaziabad. Others can visit our store.' },
  { q: 'Can I see my design before stitching starts?', a: 'Absolutely. We share a paper sketch or digital mock-up for approval before cutting the fabric.' },
  { q: 'What is your alteration policy?', a: 'We offer one free alteration within 15 days of delivery if the garment does not fit as expected.' },
  { q: 'Do you ship outside Ghaziabad?', a: 'Yes, we ship pan-India via courier. Shipping charges apply. WhatsApp us to arrange.' },
];

export default function BrandSite({ content, onAdminNav, onLoginNav }) {
  const [navScrolled, setNavScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [lightbox, setLightbox] = useState(null); // { src, label }
  const [faqOpen, setFaqOpen] = useState(null);
  const heroRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      setNavScrolled(window.scrollY > 60);
      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom;
        setStickyVisible(heroBottom < 0);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close lightbox on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const { hero, about, services, gallery, contact, announcement, social, testimonials } = content;

  const announcementActive = announcement?.enabled && announcement?.message &&
    (!announcement.expiresAt || new Date(announcement.expiresAt) > new Date());

  const wa = contact.whatsapp || WA_NUM;

  return (
    <div className="brand">
      {/* ── FLOATING WHATSAPP ──────────────────────────────── */}
      <a
        href={waLink("Hi! I'd like to enquire about stitching services at R&D's Fashion House.")}
        target="_blank"
        rel="noreferrer"
        className="float-wa"
        aria-label="Chat on WhatsApp"
      >
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#25D366"/>
          <path d="M23.5 8.5C21.6 6.6 19.1 5.5 16.4 5.5C10.8 5.5 6.3 10 6.3 15.6C6.3 17.4 6.8 19.2 7.7 20.8L6.2 26L11.6 24.5C13.1 25.3 14.7 25.8 16.4 25.8C22 25.8 26.5 21.3 26.5 15.7C26.4 12.9 25.4 10.4 23.5 8.5ZM16.4 24C14.9 24 13.4 23.6 12.1 22.8L11.8 22.6L8.6 23.5L9.5 20.4L9.3 20.1C8.4 18.7 8 17.2 8 15.6C8 10.9 11.8 7.1 16.5 7.1C18.7 7.1 20.8 8 22.3 9.5C23.9 11 24.7 13.1 24.7 15.3C24.8 20.1 21 24 16.4 24ZM21 17.9C20.8 17.8 19.5 17.1 19.3 17.1C19.1 17 19 17 18.9 17.2C18.7 17.4 18.2 18.1 18.1 18.2C18 18.4 17.8 18.4 17.7 18.3C16.4 17.7 15.5 17.2 14.6 15.8C14.4 15.5 14.9 15.5 15.3 14.7C15.4 14.6 15.3 14.4 15.3 14.3C15.3 14.2 14.7 12.9 14.5 12.4C14.3 11.9 14.1 12 13.9 12C13.8 12 13.6 12 13.5 12C13.3 12 13 12.1 12.8 12.3C12.6 12.5 11.9 13.2 11.9 14.5C11.9 15.8 12.8 17 12.9 17.2C13 17.4 14.7 19.9 17.2 21.1C18.8 21.8 19.4 21.9 20.2 21.7C20.7 21.6 21.6 21 21.8 20.3C22.1 19.6 22.1 19 22 18.9C21.9 18.8 21.7 18.7 21 17.9Z" fill="white"/>
        </svg>
      </a>

      {/* ── STICKY BOOK BAR ────────────────────────────────── */}
      {stickyVisible && (
        <div className="sticky-book-bar" role="banner">
          <span className="sticky-book-text">R&amp;D's Fashion House · Ghaziabad</span>
          <a
            href={waLink("Hi! I'd like to book a consultation at R&D's Fashion House.")}
            target="_blank"
            rel="noreferrer"
            className="sticky-book-btn"
          >
            📲 Book Now
          </a>
        </div>
      )}

      {/* ── ANNOUNCEMENT BAR ──────────────────────────────── */}
      {announcementActive && (
        <div className="announcement-bar" style={{ background: announcement.bgColor || '#c9a84c' }}>
          <span className="announcement-text">{announcement.message}</span>
        </div>
      )}

      {/* ── NAVBAR ────────────────────────────────────────── */}
      <nav className={`brand-nav ${navScrolled ? 'scrolled' : ''}`} role="navigation" aria-label="Main navigation">
        <div className="nav-inner">
          <div className="nav-logo" onClick={() => scrollTo('home')} role="button" tabIndex={0} aria-label="Go to top">
            <img src={logo} alt="R&D's Fashion House logo" className="nav-logo-img" loading="eager" />
            <span className="nav-brand-text">R&amp;D's <em>Fashion House</em></span>
          </div>

          {/* Desktop links */}
          <ul className="nav-links" role="list">
            {['home', 'about', 'services', 'how-it-works', 'gallery', 'pricing', 'contact'].map(s => (
              <li key={s}><button onClick={() => scrollTo(s)} className="nav-link">
                {s === 'how-it-works' ? 'How It Works' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button></li>
            ))}
          </ul>

          <div className="nav-actions">
            <button className="btn-crm" onClick={onLoginNav}>🔐 Login</button>
            <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu" aria-expanded={menuOpen}>
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="mobile-menu" role="menu">
            {['home', 'about', 'services', 'how-it-works', 'gallery', 'pricing', 'contact'].map(s => (
              <button key={s} onClick={() => scrollTo(s)} className="mobile-link" role="menuitem">
                {s === 'how-it-works' ? 'How It Works' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
            <button className="btn-crm mobile-crm" onClick={() => { setMenuOpen(false); onLoginNav(); }}>
              Login to CRM
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section id="home" className="hero-section" ref={heroRef} aria-label="Hero">
        <div className="hero-watermark" aria-hidden="true">
          <img src={watermark} alt="" loading="eager" />
        </div>
        <div className="hero-content">
          <p className="hero-eyebrow">Est. 2014 · Ghaziabad</p>
          <h1 className="hero-title">{hero.title}</h1>
          <p className="hero-subtitle">{hero.subtitle}</p>
          <p className="hero-tagline">"{hero.tagline}"</p>
          <div className="hero-btns">
            <a
              href={waLink("Hi! I'd like to book a consultation at R&D's Fashion House.")}
              target="_blank"
              rel="noreferrer"
              className="btn-gold"
            >
              {hero.cta}
            </a>
            <button className="btn-outline" onClick={() => scrollTo('services')}>Our Services</button>
          </div>
        </div>
        <div className="hero-scroll-hint" aria-hidden="true">↓</div>
      </section>

      <SectionDivider />

      {/* ── ABOUT ─────────────────────────────────────────── */}
      <section id="about" className="section about-section" aria-label="About us">
        <div className="section-inner">
          <div className="about-text">
            <p className="section-label">About Us</p>
            <h2 className="section-title">{about.title}</h2>
            {about.body.split('\n\n').map((p, i) => (
              <p key={i} className="about-para">{p}</p>
            ))}
          </div>
          <div className="about-stats" role="list" aria-label="Our achievements">
            <div className="stat-card" role="listitem">
              <span className="stat-number">{about.years}</span>
              <span className="stat-label">Years of Excellence</span>
            </div>
            <div className="stat-card" role="listitem">
              <span className="stat-number">{about.orders}</span>
              <span className="stat-label">Orders Crafted</span>
            </div>
            <div className="stat-card" role="listitem">
              <span className="stat-number">{about.customers}</span>
              <span className="stat-label">Happy Customers</span>
            </div>
            <div className="stat-card about-address-card" role="listitem">
              <span className="stat-icon" aria-hidden="true">📍</span>
              <span className="stat-label">{about.address || contact.address}</span>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ── SERVICES ──────────────────────────────────────── */}
      <section id="services" className="section services-section" aria-label="Our services">
        <div className="section-inner">
          <p className="section-label centered">What We Do</p>
          <h2 className="section-title centered">Our Services</h2>
          <div className="services-grid">
            {services.map(svc => (
              <div key={svc.id} className="service-card">
                <div className="service-icon" aria-hidden="true">{svc.icon}</div>
                <h3 className="service-title">{svc.title}</h3>
                <p className="service-desc">{svc.desc}</p>
                <a
                  href={waLink(`Hi! I'm interested in your ${svc.title} service. Please share more details.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="service-enquire"
                  aria-label={`Enquire about ${svc.title}`}
                >
                  Enquire on WhatsApp →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider cream />

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section id="how-it-works" className="section hiw-section" aria-label="How it works">
        <div className="section-inner">
          <p className="section-label centered">Simple Process</p>
          <h2 className="section-title centered">How It Works</h2>
          <div className="hiw-grid">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="hiw-card">
                <div className="hiw-step" aria-hidden="true">{step}</div>
                <h3 className="hiw-title">{title}</h3>
                <p className="hiw-desc">{desc}</p>
              </div>
            ))}
          </div>
          <div className="hiw-cta">
            <a
              href={waLink("Hi! I'd like to start a consultation at R&D's Fashion House.")}
              target="_blank"
              rel="noreferrer"
              className="btn-gold"
            >
              Start Your Journey →
            </a>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ── GALLERY ───────────────────────────────────────── */}
      <section id="gallery" className="section gallery-section" aria-label="Our creations gallery">
        <div className="section-inner">
          <p className="section-label centered">Portfolio</p>
          <h2 className="section-title centered">Our Creations</h2>
          <div className="gallery-grid">
            {gallery.map(item => (
              <button
                key={item.id}
                className="gallery-card"
                style={{ background: item.colour || '#f8f0e8' }}
                onClick={() => setLightbox({ src: item.imageUrl || null, label: item.label || item.title, emoji: item.emoji })}
                aria-label={`View ${item.label || item.title}`}
              >
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.label || item.title} className="gallery-img" loading="lazy" />
                  : <span className="gallery-emoji" aria-hidden="true">{item.emoji || '👗'}</span>
                }
                <div className="gallery-label">{item.label || item.title}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIGHTBOX ──────────────────────────────────────── */}
      {lightbox && (
        <div
          className="lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.label}
          onClick={() => setLightbox(null)}
        >
          <div className="lightbox-box" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightbox(null)} aria-label="Close">✕</button>
            {lightbox.src
              ? <img src={lightbox.src} alt={lightbox.label} className="lightbox-img" />
              : <div className="lightbox-emoji" aria-hidden="true">{lightbox.emoji || '👗'}</div>
            }
            <p className="lightbox-caption">{lightbox.label}</p>
            <a
              href={waLink(`Hi! I love the ${lightbox.label} design. Can you make something similar?`)}
              target="_blank"
              rel="noreferrer"
              className="btn-gold lightbox-wa"
            >
              📲 Get This Made
            </a>
          </div>
        </div>
      )}

      <SectionDivider cream />

      {/* ── PRICING ───────────────────────────────────────── */}
      <section id="pricing" className="section pricing-section" aria-label="Pricing">
        <div className="section-inner">
          <p className="section-label centered">Transparent Prices</p>
          <h2 className="section-title centered">Stitching Rates</h2>
          <p className="pricing-note">Starting prices — final quote depends on design complexity and fabric.</p>
          <div className="pricing-grid">
            {PRICING.map(item => (
              <div key={item.id} className={`pricing-card${item.popular ? ' pricing-popular' : ''}`}>
                {item.popular && <div className="pricing-badge">Most Popular</div>}
                <h3 className="pricing-title">{item.title}</h3>
                <div className="pricing-price">{item.price}</div>
                <p className="pricing-desc">{item.desc}</p>
                <a
                  href={waLink(`Hi! I'd like a quote for ${item.title} stitching at R&D's Fashion House.`)}
                  target="_blank"
                  rel="noreferrer"
                  className={item.popular ? 'btn-gold pricing-btn' : 'btn-outline-sm pricing-btn'}
                >
                  Get Quote
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider dark />

      {/* ── TESTIMONIALS ──────────────────────────────────── */}
      {testimonials?.length > 0 && (
        <section id="testimonials" className="section testimonials-section" aria-label="Customer testimonials">
          <div className="section-inner">
            <p className="section-label centered">What Clients Say</p>
            <h2 className="section-title centered">Customer Love</h2>
            <div className="testimonials-scroll" role="list" aria-label="Testimonials">
              {testimonials.map(t => (
                <div key={t.id} className="testimonial-card" role="listitem">
                  <div className="testimonial-stars" aria-label={`${t.stars || 5} stars`}>{'★'.repeat(t.stars || 5)}</div>
                  <p className="testimonial-text">"{t.text}"</p>
                  <div className="testimonial-author">
                    <span className="testimonial-name">{t.name}</span>
                    <span className="testimonial-role">{t.role}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="testimonials-scroll-hint" aria-hidden="true">← swipe to see more →</p>
          </div>
        </section>
      )}

      <SectionDivider dark />

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section id="faq" className="section faq-section" aria-label="Frequently asked questions">
        <div className="section-inner">
          <p className="section-label centered">Got Questions?</p>
          <h2 className="section-title centered">FAQ</h2>
          <div className="faq-list" role="list">
            {FAQS.map((faq, i) => (
              <div key={i} className={`faq-item${faqOpen === i ? ' open' : ''}`} role="listitem">
                <button
                  className="faq-q"
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  aria-expanded={faqOpen === i}
                  aria-controls={`faq-a-${i}`}
                >
                  <span>{faq.q}</span>
                  <span className="faq-chevron" aria-hidden="true">{faqOpen === i ? '▲' : '▼'}</span>
                </button>
                <div id={`faq-a-${i}`} className="faq-a" role="region" aria-hidden={faqOpen !== i}>
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="faq-cta">
            <p className="faq-cta-text">Still have questions?</p>
            <a
              href={waLink("Hi! I have a question about R&D's Fashion House services.")}
              target="_blank"
              rel="noreferrer"
              className="btn-whatsapp"
            >
              📲 Ask on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── CONTACT ───────────────────────────────────────── */}
      <section id="contact" className="section contact-section" aria-label="Contact us">
        <div className="section-inner contact-inner">
          <div className="contact-info">
            <p className="section-label">Get in Touch</p>
            <h2 className="section-title">Visit Us</h2>
            <div className="contact-row">
              <span className="contact-icon" aria-hidden="true">📞</span>
              <a href={`tel:${contact.phone}`} className="contact-val">{contact.phone}</a>
            </div>
            {contact.email && (
              <div className="contact-row">
                <span className="contact-icon" aria-hidden="true">✉️</span>
                <a href={`mailto:${contact.email}`} className="contact-val">{contact.email}</a>
              </div>
            )}
            <div className="contact-row">
              <span className="contact-icon" aria-hidden="true">📍</span>
              <span className="contact-val">{contact.address}</span>
            </div>
            <div className="contact-row">
              <span className="contact-icon" aria-hidden="true">🕐</span>
              <span className="contact-val">{contact.hours}</span>
            </div>
            {contact.whatsapp && (
              <a
                href={waLink("Hi! I'd like to enquire about stitching services at R&D's Fashion House.")}
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
                <EnquiryForm whatsapp={wa} />
              </div>
            )}
          </div>

          <div className="contact-map">
            <iframe
              className="map-iframe"
              title="R&D's Fashion House location"
              src="https://maps.google.com/maps?q=HIG+J-3A+Sanjay+Nagar+Sec-23+Ghaziabad+UP&output=embed"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
            <a
              href="https://maps.google.com/?q=HIG+J-3A+Sanjay+Nagar+Sec-23+Ghaziabad"
              target="_blank"
              rel="noreferrer"
              className="btn-outline-sm map-directions"
            >
              📍 Get Directions
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="brand-footer" role="contentinfo">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src={logo} alt="R&D's Fashion House" className="footer-logo" loading="lazy" />
            <p className="footer-name">R&amp;D's Fashion House</p>
            <p className="footer-tag">Every stitch, a story.</p>
            <div className="footer-social" role="list" aria-label="Social media links">
              {social?.instagram && <a href={social.instagram} target="_blank" rel="noreferrer" className="social-icon" title="Instagram" role="listitem">📸</a>}
              {social?.facebook && <a href={social.facebook} target="_blank" rel="noreferrer" className="social-icon" title="Facebook" role="listitem">📘</a>}
              {social?.whatsappBusiness && <a href={social.whatsappBusiness} target="_blank" rel="noreferrer" className="social-icon" title="WhatsApp" role="listitem">💬</a>}
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
          <button className="admin-link" onClick={onAdminNav} title="Admin" aria-label="Admin panel">·</button>
        </div>
      </footer>

    </div>
  );
}

function EnquiryForm({ whatsapp }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');

  const send = () => {
    if (!name.trim() || !msg.trim()) return;
    const phoneStr = phone.trim() ? ` My contact number is ${phone.trim()}.` : '';
    const text = encodeURIComponent(`Hi, I'm ${name}.${phoneStr} ${msg}`);
    window.open(`https://wa.me/${whatsapp}?text=${text}`, '_blank');
  };

  return (
    <div className="enquiry-fields">
      <input
        className="enquiry-input"
        placeholder="Your name *"
        value={name}
        onChange={e => setName(e.target.value)}
        aria-label="Your name"
        autoComplete="name"
      />
      <input
        className="enquiry-input"
        placeholder="Phone number (optional)"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        type="tel"
        aria-label="Phone number"
        autoComplete="tel"
      />
      <textarea
        className="enquiry-textarea"
        placeholder="Your message *"
        value={msg}
        onChange={e => setMsg(e.target.value)}
        rows={3}
        aria-label="Your message"
      />
      <button className="btn-enquiry" onClick={send} disabled={!name.trim() || !msg.trim()}>
        📲 Send via WhatsApp
      </button>
    </div>
  );
}
