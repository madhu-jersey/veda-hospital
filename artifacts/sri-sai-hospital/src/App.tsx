import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import {
  ArrowRight, Camera, Clock3, HeartPulse, MapPin, Menu, PhoneCall, Stethoscope, X, ChevronDown,
} from 'lucide-react';
import { DoctorsSection } from './components/DoctorsSection';
import { HeroDotField } from './components/HeroDotField';
import { HomeHero } from './components/HomeHero';
import { FaqSection, InsuranceSection, WhyChooseSection } from './components/InfoPages';
import { galleryItems } from './data/gallery';

const GalleryPage = lazy(() => import('./components/GalleryPage').then((module) => ({ default: module.GalleryPage })));

const phone = '+918688877831';
const directions = 'https://www.google.com/maps/dir/?api=1&destination=16.7563933,81.6753105';
const reviewsUrl = 'https://www.google.com/maps/place/Veda+Hospital/@16.7563984,81.6727356,1050m/data=!3m1!1e3!4m8!3m7!1s0x3a37b7d412cc378d:0xf8f05683509124b2!8m2!3d16.7563933!4d81.6753105!9m1!1b1!16s%2Fg%2F11x28fv5td';
// No verified YouTube channel or Instagram account supplied: both are removed from the page.

type PageRoute = 'home' | 'gallery';

// FAQ and Why choose us used to be separate pages; their old URLs now open the matching home section.
const legacySectionPaths: Record<string, string> = { '/faq': 'faq', '/why-choose': 'why-choose' };

function getPageRoute(): PageRoute {
  if (window.location.pathname === '/gallery' || window.location.hash === '#gallery-view') return 'gallery';
  return 'home';
}

function isStandaloneRoute() {
  return getPageRoute() !== 'home';
}

// Provisional services: titles and scope pending confirmation (see inline notes).
const services = [
  // [Need to confirm with doctor]
  { title: 'Orthopaedics', text: 'Assessment and treatment of bone, joint, fracture and musculoskeletal conditions.', icon: 'pulse' },
  // [Need to confirm with doctor]
  { title: 'Obstetrics & Gynaecology', text: "Women's health, pregnancy care and gynaecological consultations.", icon: 'heart-hand' },
  // [Need to confirm with doctor]
  { title: 'Pregnancy Care', text: 'Prenatal checkups and pregnancy monitoring, including high-risk pregnancy assessment where available.', icon: 'stethoscope' },
  // [Need to confirm with hospital]
  { title: 'Intensive Care Unit', text: 'Hospital intensive care services for patients who require close medical monitoring.', icon: 'pulse' },
  // [Need to confirm with hospital]
  { title: 'Diagnostic Laboratory', text: 'In-house diagnostic laboratory services.', icon: 'brain' },
  // [Need to confirm with hospital]
  { title: '24-Hour Emergency Care', text: 'Emergency and casualty services available day and night, according to the supplied hospital information.', icon: 'clock' },
];

const reviews = [
  { quote: 'We had an unexpected emergency C-section for our twin pregnancy at Vedha Hospital, and we r truly grateful to Vedha Madam n d entire team for their excellent care. 🙏 Vedha Madam’s dedication, patience, n d way she explains everything in simple words r truly commendable. Her comforting approach before and after surgery gave us immense confidence and reassurance during a stressful situation. She made sure we felt supported and well-informed throughout our hospital stay irrespective of timings. The entire staff was very caring n cooperative, & d hospital ambience was pleasant and comfortable. A heartfelt thanks to Vedha Madam and the entire Vedha Hospital team for taking such wonderful care of us and our babies during an unexpected emergency. Highly recommended!', name: 'charan phaneendra', age: '3 weeks ago' },
  // Age as supplied by the reviewer; [Need to confirm with hospital]
  { quote: 'I was also very impressed with the doctor veda madam. Good staff,Good hospital..', name: 'ganesh chowdary', age: 'a year ago' },
  { quote: 'We went to veda hospital with my personal problem. We consulted dr. Veda mam. Her treatment is very good. Thank you', name: 'Roja Didla', age: 'a year ago' },
  { quote: 'very well maintained. Must recommend for everyone.', name: 'moulika reddy', age: '[Need to confirm with hospital]' },
];

const reviewRating = 4.5;

function getOpenState(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const day = parts.find((part) => part.type === 'weekday')?.value;
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  const totalMinutes = hour * 60 + minute;
  // Open 24 hours, Monday to Sunday, as supplied. [Need to confirm with hospital]
  const scheduledDay = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].includes(day ?? '');
  const openPeriod = totalMinutes >= 0 && totalMinutes < 1440;
  return scheduledDay && openPeriod;
}

function useClinicStatus() {
  const [isOpen, setIsOpen] = useState(() => getOpenState(new Date()));
  useEffect(() => {
    const update = () => setIsOpen(getOpenState(new Date()));
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return isOpen;
}

function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const isStandalonePage = isStandaloneRoute();
  useEffect(() => {
    let frame = 0;
    const update = () => {
      setScrolled(window.scrollY > 20);
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (isStandaloneRoute()) {
          setActiveSection('');
          return;
        }
        const sections = Array.from(document.querySelectorAll<HTMLElement>('main section[id]'));
        const current = sections.filter((section) => section.getBoundingClientRect().top <= 120).at(-1);
        setActiveSection(current?.id ?? '');
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [isStandalonePage]);
  const closeMenu = () => setMenuOpen(false);
  const homePrefix = isStandalonePage ? '/' : '';
  const navLink = (section: string) => `${homePrefix}#${section}`;
  return (
    <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
      <div className="container nav-inner">
        <a className="brand" href={navLink('home')} aria-label="Veda Hospital (Life Care) home" data-testid="link-brand-home" onClick={closeMenu}>
          <img src="/assets/veda-hospital-logo.png" alt="Veda Hospital logo" />
          <span className="brand-name">Veda Hospital<small>Life Care · Tanuku</small></span>
        </a>
        <nav className={`nav-links${menuOpen ? ' open' : ''}`} aria-label="Main navigation">
          <a href={navLink('services')} aria-current={activeSection === 'services' ? 'location' : undefined} data-testid="link-nav-services" onClick={closeMenu}>Services</a>
          <a href={navLink('why-choose')} aria-current={activeSection === 'why-choose' ? 'location' : undefined} data-testid="link-nav-why-choose" onClick={closeMenu}>Why choose us</a>
          <a href={navLink('doctors')} aria-current={activeSection === 'doctors' ? 'location' : undefined} data-testid="link-nav-doctors" onClick={closeMenu}>Our doctors</a>
          <a href={navLink('gallery')} aria-current={activeSection === 'gallery' ? 'location' : undefined} data-testid="link-nav-hospital" onClick={closeMenu}>Hospital</a>
          <a href={navLink('reviews')} aria-current={activeSection === 'reviews' ? 'location' : undefined} data-testid="link-nav-reviews" onClick={closeMenu}>Reviews</a>
          <a href={navLink('insurance')} aria-current={activeSection === 'insurance' ? 'location' : undefined} data-testid="link-nav-insurance" onClick={closeMenu}>Insurance</a>
          <a href={navLink('faq')} aria-current={activeSection === 'faq' ? 'location' : undefined} data-testid="link-nav-faq" onClick={closeMenu}>FAQ</a>
          <a href={navLink('visit')} aria-current={activeSection === 'visit' ? 'location' : undefined} data-testid="link-nav-visit" onClick={closeMenu}>Visit us</a>
          <a className="nav-mobile-call" href={`tel:${phone}`} onClick={closeMenu}>Call now</a>
        </nav>
        <div className="header-contact-actions">
          <a className="nav-call" href={`tel:${phone}`} data-testid="button-call-header"><PhoneIcon /> Call now</a>
        </div>
        <button className="nav-toggle" type="button" data-testid="button-toggle-navigation" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
    </header>
  );
}

function PhoneIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.7a15 15 0 0 0 4.8 4.8L15 13l5 2v4c0 1.1-.9 2-2 2C10.3 21 3 13.7 3 5c0-1.1.9-2 2-2Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ProgressLine() {
  const progressRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let scheduled = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
      scheduled = false;
    };
    const onScroll = () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return <div className="top-progress" aria-hidden="true"><span ref={progressRef} /></div>;
}

function useReveal(isGalleryPage: boolean) {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.reveal, .info-page'));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }
    let scoreTimer = 0;
    let scoreFrame = 0;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          if (entry.target.matches('.review-summary')) {
            const score = entry.target.querySelector<HTMLElement>('.review-score');
            if (score && score.dataset.countStarted !== 'true') {
              score.dataset.countStarted = 'true';
              score.textContent = '0.0';
              scoreTimer = window.setTimeout(() => {
                const start = performance.now();
                const updateScore = (now: number) => {
                  const progress = Math.min(1, (now - start) / 900);
                  score.textContent = `${(reviewRating * progress).toFixed(1)}`;
                  if (progress < 1) scoreFrame = window.requestAnimationFrame(updateScore);
                };
                scoreFrame = window.requestAnimationFrame(updateScore);
              }, 650);
            }
          }
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    elements.forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      window.clearTimeout(scoreTimer);
      window.cancelAnimationFrame(scoreFrame);
    };
  }, [isGalleryPage]);
}

function useMagneticButtons(isGalleryPage: boolean) {
  useEffect(() => {
    if (isGalleryPage) return;
    const finePointer = window.matchMedia('(pointer: fine) and (hover: hover)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!finePointer.matches || reducedMotion.matches) return;

    const button = document.querySelector<HTMLElement>('.hero-actions .button-primary');
    if (!button) return;

    const handleMove = (event: PointerEvent) => {
      if (reducedMotion.matches) {
        button.style.removeProperty('--magnetic-x');
        button.style.removeProperty('--magnetic-y');
        return;
      }
      const rect = button.getBoundingClientRect();
      const nearestX = Math.max(rect.left, Math.min(event.clientX, rect.right));
      const nearestY = Math.max(rect.top, Math.min(event.clientY, rect.bottom));
      const outsideDistance = Math.hypot(event.clientX - nearestX, event.clientY - nearestY);
      const strength = Math.max(0, 1 - outsideDistance / 60);
      const offsetX = event.clientX - (rect.left + rect.width / 2);
      const offsetY = event.clientY - (rect.top + rect.height / 2);
      const distance = Math.hypot(offsetX, offsetY) || 1;
      const pull = Math.min(distance, 8) * strength;
      if (!strength) {
        button.style.removeProperty('--magnetic-x');
        button.style.removeProperty('--magnetic-y');
        return;
      }
      const x = offsetX / distance * pull;
      const y = offsetY / distance * pull;
      button.style.setProperty('--magnetic-x', `${x}px`);
      button.style.setProperty('--magnetic-y', `${y}px`);
    };
    const reset = () => {
      button.style.removeProperty('--magnetic-x');
      button.style.removeProperty('--magnetic-y');
    };
    window.addEventListener('pointermove', handleMove, { passive: true });
    window.addEventListener('blur', reset);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('blur', reset);
      reset();
    };
  }, [isGalleryPage]);
}

function usePhotoParallax(isGalleryPage: boolean) {
  useEffect(() => {
    if (isGalleryPage) return;
    const finePointer = window.matchMedia('(min-width: 1024px) and (pointer: fine) and (hover: hover)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const art = document.querySelector<HTMLElement>('.hero-art');
    const panel = document.querySelector<HTMLElement>('.hero-photo-panel');
    if (!art || !panel) return;

    const restingX = 2;
    const restingY = -5;
    let currentX = restingX;
    let currentY = restingY;
    let targetX = restingX;
    let targetY = restingY;
    let animationFrame = 0;
    let isPointerActive = false;
    let listening = false;

    const animate = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      panel.style.setProperty('--hero-tilt-x', `${currentX}deg`);
      panel.style.setProperty('--hero-tilt-y', `${currentY}deg`);
      if (isPointerActive && (Math.abs(targetX - currentX) > 0.01 || Math.abs(targetY - currentY) > 0.01)) {
        animationFrame = window.requestAnimationFrame(animate);
      } else {
        animationFrame = 0;
      }
    };
    const handleMove = (event: PointerEvent) => {
      if (reducedMotion.matches) return;
      const rect = art.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      targetX = restingX + (0.5 - y) * 6;
      targetY = restingY + (x - 0.5) * 6;
      if (!isPointerActive) {
        isPointerActive = true;
        panel.classList.add('is-cursor-active');
        currentX = restingX;
        currentY = restingY;
      }
      if (!animationFrame) animationFrame = window.requestAnimationFrame(animate);
    };
    const reset = () => {
      isPointerActive = false;
      targetX = restingX;
      targetY = restingY;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      panel.classList.remove('is-cursor-active');
      panel.style.removeProperty('--hero-tilt-x');
      panel.style.removeProperty('--hero-tilt-y');
    };
    const updateListeners = () => {
      const shouldListen = finePointer.matches && !reducedMotion.matches;
      if (shouldListen === listening) return;
      listening = shouldListen;
      if (listening) {
        art.addEventListener('pointermove', handleMove, { passive: true });
        art.addEventListener('pointerleave', reset);
      } else {
        art.removeEventListener('pointermove', handleMove);
        art.removeEventListener('pointerleave', reset);
        reset();
      }
    };
    finePointer.addEventListener('change', updateListeners);
    reducedMotion.addEventListener('change', updateListeners);
    updateListeners();

    return () => {
      finePointer.removeEventListener('change', updateListeners);
      reducedMotion.removeEventListener('change', updateListeners);
      if (listening) {
        art.removeEventListener('pointermove', handleMove);
        art.removeEventListener('pointerleave', reset);
      }
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      reset();
    };
  }, [isGalleryPage]);
}

function Hero() {
  const isOpen = useClinicStatus();
  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      <HeroDotField />
      <div className="container hero-inner">
        <div className="hero-copy">
          <span className="hero-pill"><span aria-hidden="true" /> Veda Hospital · Life Care</span>
          <h1 id="hero-title"><span className="word"><span>Veda Hospital</span></span><br /><span className="word"><span>Life Care</span></span></h1>
          <p className="telugu-title font-telugu" lang="te" data-testid="text-hospital-name-telugu">[Need to confirm with hospital]</p>
          <p className="hero-description">Orthopaedic care, women's health, maternity services and emergency care, with 24-hour hospital services.</p>
          <div className="hero-actions">
            <a className="button button-primary" href={`tel:${phone}`} data-testid="button-call-hero"><PhoneIcon /> Call now</a>
            <a className="button button-outline" href={directions} target="_blank" rel="noreferrer" data-testid="button-directions"><MapPin size={17} /> Get directions</a>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-photo-wrap">
            <div className="hero-photo-stage">
              <div className="hero-photo-shadow" aria-hidden="true" />
              <div className="hero-photo-perspective">
                <div className="hero-photo-panel">
                  <div className="hero-photo-frame">
                    <img src="/assets/hero-veda-building.webp" alt="Veda Hospital (Life Care) building front with its signboard" width="1651" height="953" fetchPriority="high" />
                  </div>
                </div>
              </div>
              <div className="seal" aria-label="Veda Hospital logo"><img src="/assets/veda-hospital-logo.png" alt="" /></div>
              <a className="explore-hint" href="#doctors" aria-label="Scroll to Our doctors">
                <ChevronDown size={14} aria-hidden="true" />
              </a>
            </div>

            <div className="status-card" aria-live="polite">
              <div className="status-top">
                <span className="status-label"><span className="live-dot" aria-hidden="true" /> Clinic hours</span>
                <span className={`status-text${isOpen ? '' : ' closed'}`} data-testid="status-open">{isOpen ? 'Open now' : 'Closed now'}</span>
              </div>
              <div className="hours-line"><span>Mon–Sun · Hospital</span><strong>Open 24 hours</strong></div>
              <div className="hours-line"><span>Emergency &amp; casualty</span><strong>24 hours</strong></div>
              <div className="hours-line"><span>Every day</span><strong>Day and night</strong></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <div className="trust-strip" aria-label="Key facts about Veda Hospital">
      <div className="trust-item">
        <HeartPulse size={18} strokeWidth={1.5} aria-hidden="true" />
        <span>24/7 Casualty Services</span>
      </div>
      <span className="trust-sep" aria-hidden="true" />
      <div className="trust-item">
        <Stethoscope size={18} strokeWidth={1.5} aria-hidden="true" />
        <span>Two Specialist Doctors</span>
      </div>
      <span className="trust-sep" aria-hidden="true" />
      <div className="trust-item">
        <Clock3 size={18} strokeWidth={1.5} aria-hidden="true" />
        <span>Open 24 Hours, 7 Days</span>
      </div>
    </div>
  );
}

function EmergencyStrip() {
  return (
    <div className="emergency-strip" data-testid="text-emergency-contact">
      <p>24-hour casualty and emergency care</p>
      <a href={`tel:${phone}`} data-testid="button-call-emergency"><PhoneIcon /> +91 86888 77831</a>
    </div>
  );
}

type ServiceIconName = typeof services[number]['icon'];

function ServiceIcon({ name }: { name: ServiceIconName }) {
  const shared = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'brain':
      return <svg className="service-icon-svg" viewBox="0 0 24 24" aria-hidden="true" {...shared}>
        <path pathLength="1" d="M12 4.2c-.9-1.2-2.7-1.4-3.9-.3-1.8-.1-3.2 1.5-2.8 3.3-1.5 1-1.7 3.2-.4 4.5-1.1 1.7-.2 4 1.7 4.6.1 1.8 1.8 3 3.5 2.4.6 1.4 2.2 2.1 3.6 1.4" />
        <path pathLength="1" d="M12 4.2c.9-1.2 2.7-1.4 3.9-.3 1.8-.1 3.2 1.5 2.8 3.3 1.5 1 1.7 3.2.4 4.5 1.1 1.7.2 4-1.7 4.6-.1 1.8-1.8 3-3.5 2.4-.6 1.4-2.2 2.1-3.6 1.4" />
        <path pathLength="1" d="M12 4.5v15M8.2 7.2c1.4.2 2 1.1 1.9 2.4m5.7-2.4c-1.4.2-2 1.1-1.9 2.4M7.4 13c1.4-.2 2.3.6 2.4 2m6.8-2c-1.4-.2-2.3.6-2.4 2" />
      </svg>;
    case 'pulse':
      return <svg className="service-icon-svg" viewBox="0 0 24 24" aria-hidden="true" {...shared}>
        <path pathLength="1" d="M3 12h4l2.2-5.5L13 18l2.5-6H21" />
      </svg>;
    case 'stethoscope':
      return <svg className="service-icon-svg" viewBox="0 0 24 24" aria-hidden="true" {...shared}>
        <path pathLength="1" d="M5 4v5a4 4 0 0 0 8 0V4M3.5 4h3M11.5 4h3M9 13v1.5a5.5 5.5 0 0 0 11 0v-1" />
        <path pathLength="1" d="M17 11.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" />
      </svg>;
    case 'heart-hand':
      return <svg className="service-icon-svg" viewBox="0 0 24 24" aria-hidden="true" {...shared}>
        <path pathLength="1" d="M12 19s-7.5-4.4-7.5-9.3a4.1 4.1 0 0 1 7.5-2.2 4.1 4.1 0 0 1 7.5 2.2c0 1.5-.7 2.9-1.8 4.2" />
        <path pathLength="1" d="M3 17h4l2 2h5.5a3 3 0 0 0 2.1-.9l3.1-3.1a1.4 1.4 0 0 0-2-2l-2.2 1.8H12" />
      </svg>;
    case 'headache':
      return <svg className="service-icon-svg" viewBox="0 0 24 24" aria-hidden="true" {...shared}>
        <path pathLength="1" d="M10 21v-2.8c-2.8-1.3-4.5-4.2-4.5-7.1V8.4a6.4 6.4 0 0 1 12.8 0v2.4c0 .6-.4 1.1-.9 1.4l-1.2.7.8 1.1c.3.4 0 .9-.5.9h-1.1c-.2 1.6-1.1 2.6-2.7 3.1V21" />
        <path pathLength="1" d="m7.3 5.3 1 1-1 1 1 1m5.2 2.6h.1" />
      </svg>;
    case 'clock':
      return <svg className="service-icon-svg" viewBox="0 0 24 24" aria-hidden="true" {...shared}>
        <path pathLength="1" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
        <path pathLength="1" d="M12 7v5l3.5 2" />
      </svg>;
    default:
      return null;
  }
}

function Services() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!sectionRef.current) return;

    const cards = Array.from(sectionRef.current.querySelectorAll<HTMLElement>('.service-card'));
    const frames = new Map<HTMLElement, number>();
    const positions = new Map<HTMLElement, { clientX: number; clientY: number }>();
    const onEntranceEnd = (event: TransitionEvent) => {
      if (event.target === event.currentTarget && event.propertyName === 'transform') {
        (event.currentTarget as HTMLElement).classList.add('is-settled');
      }
    };
    const onMove = (event: PointerEvent) => {
      const card = event.currentTarget as HTMLElement;
      positions.set(card, { clientX: event.clientX, clientY: event.clientY });
      if (frames.has(card)) return;
      frames.set(card, window.requestAnimationFrame(() => {
        try {
          const position = positions.get(card);
          if (!position || reducedMotion.matches) return;
          const rect = card.getBoundingClientRect();
          const x = (position.clientX - rect.left) / rect.width;
          const y = (position.clientY - rect.top) / rect.height;
          card.style.setProperty('--spotlight-x', `${x * 100}%`);
          card.style.setProperty('--spotlight-y', `${y * 100}%`);
          card.style.setProperty('--service-tilt-x', `${(0.5 - y) * 8}deg`);
          card.style.setProperty('--service-tilt-y', `${(x - 0.5) * 8}deg`);
        } finally {
          frames.delete(card);
        }
      }));
    };
    const onLeave = (event: PointerEvent) => {
      const card = event.currentTarget as HTMLElement;
      const frame = frames.get(card);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      frames.delete(card);
      positions.delete(card);
      card.style.removeProperty('--spotlight-x');
      card.style.removeProperty('--spotlight-y');
      card.style.removeProperty('--service-tilt-x');
      card.style.removeProperty('--service-tilt-y');
    };

    cards.forEach((card) => card.addEventListener('transitionend', onEntranceEnd));
    if (finePointer.matches && !reducedMotion.matches) {
      cards.forEach((card) => {
        card.addEventListener('pointermove', onMove);
        card.addEventListener('pointerleave', onLeave);
      });
    }
    return () => {
      cards.forEach((card) => {
        card.removeEventListener('transitionend', onEntranceEnd);
        card.removeEventListener('pointermove', onMove);
        card.removeEventListener('pointerleave', onLeave);
      });
      frames.forEach((frame) => window.cancelAnimationFrame(frame));
    };
  }, []);

  return (
    <section className="section services-section" id="services" aria-labelledby="services-heading" ref={sectionRef}>
      <div className="container">
        <div className="section-heading service-heading reveal">
          <span className="eyebrow">Care at Veda</span>
          <h2 id="services-heading">
            <span className="service-word"><span>Thoughtful</span></span>{' '}
            <span className="service-word"><span>care</span></span>{' '}
            <span className="service-word"><span>for</span></span>{' '}
            <em><span className="service-word"><span>every</span></span>{' '}
            <span className="service-word"><span>day.</span></span></em>
          </h2>
          <p>Medical care across key needs, with a focus on careful assessment and ongoing support.</p>
        </div>
        <div className="service-grid">
          {services.map(({ title, text, icon }, index) => (
            <article className="service-card reveal" key={title} data-service-icon={icon} data-testid={`card-service-${index + 1}`}>
              <div className="service-icon"><ServiceIcon name={icon} /></div>
              <h3 data-title={title}>{title}</h3>
              <p>{text}</p>
              <svg className="service-arrow" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14m-6-6 6 6-6 6" pathLength="1" />
              </svg>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Doctors() {
  return <DoctorsSection />;
}

function Gallery() {
  return (
    <section className="section" id="gallery" aria-labelledby="gallery-heading">
      <div className="container">
        <div className="section-heading gallery-section-heading reveal">
          <span className="eyebrow">A look around</span>
          <h2 id="gallery-heading"><span className="gallery-heading-word"><span>A place for</span></span>{' '}<em><span className="gallery-heading-word"><span>care.</span></span></em></h2>
          <p>Explore the spaces at Veda Hospital.</p>
        </div>
        <div className="gallery-preview-grid">
          {galleryItems.map((item, index) => (
            <div className={`gallery-preview-card gallery-preview-card--${item.category} reveal`} key={item.id} style={{ '--gallery-index': index } as React.CSSProperties}>
              {item.src ? (
                <img src={item.src} alt={item.alt} loading="lazy" data-testid={`image-hospital-${index + 1}`} />
              ) : (
                <span className="gallery-placeholder" role="img" aria-label={item.caption}>
                  <Camera size={28} strokeWidth={1.3} aria-hidden="true" />
                </span>
              )}
              <span className="gallery-caption">{item.caption}</span>
            </div>
          ))}
        </div>
        <div className="gallery-view-link-row">
          <a className="gallery-view-link" href="#gallery-view">View photographs <ArrowRight size={18} aria-hidden="true" /></a>
        </div>
      </div>
    </section>
  );
}

const [featuredReview, ...otherReviews] = reviews;

function ReviewStar({ index, half = false, gradientId }: { index: number; half?: boolean; gradientId?: string }) {
  return (
    <svg className="review-star" style={{ '--star-index': index } as React.CSSProperties} viewBox="0 0 24 24" aria-hidden="true">
      {half && gradientId && (
        <defs>
          <linearGradient id={gradientId}>
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      <path
        d="m12 2.8 2.8 5.7 6.3.9-4.55 4.43 1.08 6.27L12 17.14l-5.63 2.96 1.08-6.27L2.9 9.4l6.3-.9L12 2.8Z"
        {...(half && gradientId ? { fill: `url(#${gradientId})`, stroke: 'currentColor', strokeWidth: 1.2, strokeLinejoin: 'round' as const } : {})}
      />
    </svg>
  );
}

function ReviewAuthor({ name, age }: { name: string; age: string }) {
  const initials = name.split(/\s+/).map((part) => part[0]?.toUpperCase() ?? '').join('').slice(0, 2);
  return (
    <div className="review-author">
      <span className="review-avatar" aria-hidden="true">{initials}</span>
      <span className="review-author-text">
        <span className="review-author-name">{name}</span>
        <span className="review-author-meta">Google review · <time>{age}</time></span>
      </span>
    </div>
  );
}

// The long review leads; it opens to full length on request so the section keeps an even rhythm.
function FeaturedReview({ review }: { review: typeof reviews[number] }) {
  const [expanded, setExpanded] = useState(false);
  const [fullHeight, setFullHeight] = useState<number | null>(null);
  const textRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const measure = () => setFullHeight(textRef.current?.scrollHeight ?? null);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  return (
    <article className="review-feature reveal" data-expanded={expanded} data-testid="card-review-1">
      <div className="review-feature-top">
        <span className="review-quote-mark" aria-hidden="true">“</span>
        {/* Supplied with a 5/5 rating. */}
        <span className="review-stars review-feature-stars" aria-label="Rated 5 out of 5">
          {[0, 1, 2, 3, 4].map((star) => <ReviewStar key={star} index={star} />)}
        </span>
      </div>
      <div
        className="review-feature-text"
        id="featured-review-text"
        ref={textRef}
        style={{ maxHeight: expanded && fullHeight ? `${fullHeight}px` : undefined }}
      >
        <blockquote>{review.quote}</blockquote>
      </div>
      <div className="review-feature-bottom">
        <ReviewAuthor name={review.name} age={review.age} />
        <button className="review-expand" type="button" aria-expanded={expanded} aria-controls="featured-review-text" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'Read full review'}
          <ChevronDown size={16} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

function Reviews() {
  const reviewButtonRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const button = reviewButtonRef.current;
    const finePointer = window.matchMedia('(pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!button || !finePointer.matches || reducedMotion.matches) return;

    let frame = 0;
    let pointer: { x: number; y: number } | null = null;
    const reset = () => {
      pointer = null;
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      button.style.removeProperty('--magnetic-x');
      button.style.removeProperty('--magnetic-y');
    };
    const onMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (!pointer || reducedMotion.matches) {
          reset();
          return;
        }
        const rect = button.getBoundingClientRect();
        const nearestX = Math.max(rect.left, Math.min(pointer.x, rect.right));
        const nearestY = Math.max(rect.top, Math.min(pointer.y, rect.bottom));
        const outsideDistance = Math.hypot(pointer.x - nearestX, pointer.y - nearestY);
        const strength = Math.max(0, 1 - outsideDistance / 40);
        const offsetX = pointer.x - (rect.left + rect.width / 2);
        const offsetY = pointer.y - (rect.top + rect.height / 2);
        const distance = Math.hypot(offsetX, offsetY) || 1;
        const pull = Math.min(distance, 6) * strength;
        if (!strength) {
          button.style.removeProperty('--magnetic-x');
          button.style.removeProperty('--magnetic-y');
          return;
        }
        button.style.setProperty('--magnetic-x', `${offsetX / distance * pull}px`);
        button.style.setProperty('--magnetic-y', `${offsetY / distance * pull}px`);
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('blur', reset);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('blur', reset);
      reset();
    };
  }, []);

  return (
    <section className="section reviews-section" id="reviews" aria-labelledby="reviews-heading">
      <div className="container">
        <div className="section-heading review-heading reveal">
          <span className="eyebrow">Patient experiences</span>
          <h2 id="reviews-heading">
            <span className="review-heading-line">
              <span className="review-word"><span>Words</span></span>{' '}
              <span className="review-word"><span>from</span></span>{' '}
              <span className="review-word"><span>our</span></span>
            </span>
            <br />
            <em><span className="review-heading-line"><span className="review-word"><span>community.</span></span></span></em>
          </h2>
          <p>Experiences shared by people who have visited Veda Hospital.</p>
        </div>
        <div className="reviews-showcase">
          <aside className="rating-panel reveal" aria-label="Google rating">
            <p className="rating-panel-label">Google rating</p>
            <div className="review-summary reveal">
              <div className="review-rating">
                <span className="review-score" aria-label="4.5 out of 5">4.5</span>
                <span className="rating-out-of" aria-hidden="true">/ 5</span>
              </div>
              <span className="review-stars" aria-label="4.5 stars">
                {[0, 1, 2, 3, 4].map((star) => (
                  <ReviewStar key={star} index={star} half={star + 0.5 === reviewRating} gradientId="review-star-half" />
                ))}
              </span>
              <span className="review-count">Based on 42 Google reviews</span>
            </div>
            <p className="rating-panel-note">Reviews are shown as patients wrote them on Google.</p>
            <a ref={reviewButtonRef} className="button reviews-button" href={reviewsUrl} target="_blank" rel="noreferrer" data-testid="button-more-google-reviews"><span data-label="More Google reviews">More Google reviews</span><ArrowRight size={16} /></a>
          </aside>
          <div className="reviews-stream">
            <FeaturedReview review={featuredReview} />
            <div className="review-minis">
              {otherReviews.map((review, index) => (
                <article className="review-mini reveal" key={review.name} style={{ transitionDelay: `${(index + 1) * 120}ms` }} data-testid={`card-review-${index + 2}`}>
                  <blockquote>“{review.quote}”</blockquote>
                  <ReviewAuthor name={review.name} age={review.age} />
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Visit() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInteractive, setMapInteractive] = useState(false);
  return (
    <section className="section section-white visit-section" id="visit" aria-labelledby="visit-heading">
      <div className="container">
        <div className="section-heading reveal">
          <span className="eyebrow">Find us in Tanuku</span>
          <h2 id="visit-heading">
            <span className="visit-heading-word"><span>We’re</span></span>{' '}
            <span className="visit-heading-word"><span>here</span></span>{' '}
            <span className="visit-heading-word"><span>when</span></span>{' '}
            <em><span className="visit-heading-word"><span>you need us.</span></span></em>
          </h2>
          <p>Plan your visit or call the hospital for assistance.</p>
        </div>
        <div className="visit-grid">
          <div className="visit-panel">
            <div className="visit-block reveal" style={{ '--visit-index': 0 } as React.CSSProperties}>
              <p className="visit-label">Address</p>
              {/* Provisional: door number conflict (35-1-22/1 vs 35-1-11/1). [Need to confirm with hospital] */}
              <p className="visit-value address">35-1-22/1, Railway Flyover Service Road, beside R&amp;B Office, Venkatarayapuram, Sajjapuram, Andhra Pradesh 534211</p>
            </div>
            <div className="visit-block reveal" style={{ '--visit-index': 1 } as React.CSSProperties}>
              <p className="visit-label">Call</p>
              <div className="visit-actions">
                <a className="button button-primary" href={`tel:${phone}`} data-testid="button-call-visit"><PhoneIcon /> +91 86888 77831</a>
              </div>
            </div>
            <div className="visit-block reveal" style={{ '--visit-index': 2 } as React.CSSProperties}>
              <p className="visit-label">Hospital hours</p>
              <div className="hours-table">
                <div className="hours-row reveal" style={{ '--hours-index': 0 } as React.CSSProperties}><span>Monday–Sunday · Hospital</span><span>Open 24 hours</span></div>
                <div className="hours-row reveal" style={{ '--hours-index': 1 } as React.CSSProperties}><span>Emergency and casualty</span><span>24 hours</span></div>
                <div className="hours-row reveal" style={{ '--hours-index': 2 } as React.CSSProperties}><span>Doctor consultation timings</span><span>[Need to confirm with hospital]</span></div>
              </div>
            </div>
            <div className="visit-block casualty-block reveal" style={{ '--visit-index': 3 } as React.CSSProperties}>
              <p className="visit-label">Casualty</p>
              <p className="visit-value"><span className="casualty-dot" aria-hidden="true" />24-hour casualty services</p>
            </div>
          </div>
          <div
            className={`map-frame reveal${mapLoaded ? ' is-loaded' : ''}${mapInteractive ? ' is-interactive' : ''}`}
            data-testid="card-hospital-map"
          >
            <div className="map-shimmer" aria-hidden="true" />
            <a className="map-directions" href={directions} target="_blank" rel="noopener noreferrer" aria-label="Go to Veda Hospital location in Google Maps" data-testid="link-go-to-location">
              <MapPin size={17} strokeWidth={1.8} aria-hidden="true" /> Go to location
            </a>
            <iframe
              title="Veda Hospital, Railway Flyover Service Road, Venkatarayapuram"
              data-testid="frame-hospital-map"
              src="https://www.google.com/maps?q=16.7563933,81.6753105&z=17&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              onLoad={() => setMapLoaded(true)}
            />
            {!mapInteractive && (
              <button
                className="map-interaction-enable"
                type="button"
                aria-label="Enable map interaction"
                onClick={() => setMapInteractive(true)}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const homePrefix = isStandaloneRoute() ? '/' : '';
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand reveal" style={{ '--footer-index': 0 } as React.CSSProperties}>
            <img src="/assets/veda-hospital-logo.png" alt="Veda Hospital logo" />
            <h2>Veda Hospital (Life Care)</h2>
            <p className="font-telugu" lang="te">[Need to confirm with hospital]</p>
            <p className="footer-location">Venkatarayapuram, Sajjapuram, Andhra Pradesh</p>
          </div>
          <div className="footer-explore-column reveal" style={{ '--footer-index': 1 } as React.CSSProperties}>
            <p className="footer-label">Explore</p>
            <nav className="footer-nav" aria-label="Footer navigation">
              <a href={`${homePrefix}#services`} data-testid="link-footer-services">Services</a><a href={`${homePrefix}#why-choose`} data-testid="link-footer-why-choose">Why choose us</a>
              <a href={`${homePrefix}#doctors`} data-testid="link-footer-doctors">Our doctors</a><a href={`${homePrefix}#gallery`} data-testid="link-footer-hospital">Hospital</a>
              <a href={`${homePrefix}#reviews`} data-testid="link-footer-reviews">Reviews</a><a href={`${homePrefix}#insurance`} data-testid="link-footer-insurance">Insurance</a><a href={`${homePrefix}#faq`} data-testid="link-footer-faq">FAQ</a>
              <a href={`${homePrefix}#visit`} data-testid="link-footer-visit">Visit us</a>
            </nav>
          </div>
          <div className="footer-connect-column reveal" style={{ '--footer-index': 2 } as React.CSSProperties}>
            <p className="footer-label">Connect</p>
            <div className="footer-social">
              <a href={`tel:${phone}`} data-testid="link-footer-call"><PhoneCall size={18} strokeWidth={1.6} aria-hidden="true" />Call +91 86888 77831</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>Information only. This website does not replace a consultation or emergency care.</p>
          <p>© Veda Hospital (Life Care)</p>
        </div>
      </div>
    </footer>
  );
}

function MobileActions() {
  return (
    <div className="mobile-actions" aria-label="Quick contact">
      <a className="call" href={`tel:${phone}`} data-testid="button-call-mobile"><PhoneIcon /> Call</a>
    </div>
  );
}

function App() {
  const [pageRoute, setPageRoute] = useState<PageRoute>(getPageRoute);
  const isGalleryPage = pageRoute === 'gallery';
  useReveal(isGalleryPage);
  useMagneticButtons(isGalleryPage);
  usePhotoParallax(isGalleryPage);
  useEffect(() => {
    const legacySection = legacySectionPaths[window.location.pathname];
    if (legacySection) window.history.replaceState(null, '', `/#${legacySection}`);
    const updateRoute = () => setPageRoute(getPageRoute());
    window.addEventListener('hashchange', updateRoute);
    window.addEventListener('popstate', updateRoute);
    updateRoute();
    return () => {
      window.removeEventListener('hashchange', updateRoute);
      window.removeEventListener('popstate', updateRoute);
    };
  }, []);
  useEffect(() => {
    // Sections render after load, so the browser cannot scroll to a hash target on its own.
    if (pageRoute !== 'home' || window.location.hash.length < 2) return;
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      target?.scrollIntoView({ block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pageRoute]);
  useEffect(() => {
    const pageMetadata = {
      home: {
        title: 'Veda Hospital (Life Care)',
        description: "Veda Hospital (Life Care), Andhra Pradesh. Orthopaedic care, women's health, maternity services and 24-hour emergency care.",
      },
      gallery: {
        title: 'Veda Hospital (Life Care)',
        description: "Veda Hospital (Life Care), Andhra Pradesh. Orthopaedic care, women's health, maternity services and 24-hour emergency care.",
      },
    } satisfies Record<PageRoute, { title: string; description: string }>;
    document.title = pageMetadata[pageRoute].title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = pageMetadata[pageRoute].description;
  }, [pageRoute]);
  useEffect(() => {
    if (!isGalleryPage) return;
    const frame = window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    return () => window.cancelAnimationFrame(frame);
  }, [isGalleryPage]);
  return (
    <>
      <ProgressLine />
      <SiteHeader />
      {isGalleryPage ? (
        <Suspense fallback={<main className="gallery-page" aria-busy="true" />}>
          <GalleryPage />
        </Suspense>
      ) : (
        <main>
          <HomeHero phone={phone} phoneLabel="+91 86888 77831" directions={directions} isOpenAt={getOpenState} />
          <Services />
          <WhyChooseSection />
          <Doctors />
          <Gallery />
          <Reviews />
          <InsuranceSection />
          <FaqSection />
          <Visit />
        </main>
      )}
      <Footer />
      {!isGalleryPage && <MobileActions />}
    </>
  );
}

export default App;
