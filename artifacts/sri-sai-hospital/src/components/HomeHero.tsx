import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, MapPin, PhoneCall, Siren, Star, Stethoscope } from 'lucide-react';

type HomeHeroProps = {
  phone: string;
  phoneLabel: string;
  directions: string;
  isOpenAt: (date: Date) => boolean;
};

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

// Line-art symbols drawn on a 120 x 120 grid; every path uses pathLength 1 so the panel can draw them on.
function OrthoSymbol() {
  return (
    <svg className="vh-spec-symbol" viewBox="0 0 120 120" aria-hidden="true">
      {/* Femur coming down into the knee */}
      <path pathLength="1" d="M47 8V40c0 7-9 9-9 18 0 8 10 10 22 6 12 4 22 2 22-6 0-9-9-11-9-18V8" />
      {/* Tibia rising from below */}
      <path pathLength="1" d="M47 112V84c0-5-7-6-8-11 6 5 13 6 21 3 8 3 15 2 21-3-1 5-8 6-8 11v28" />
      {/* Kneecap */}
      <circle pathLength="1" cx="91" cy="67" r="7" />
      {/* Joint movement arc */}
      <path className="vh-spec-accent" pathLength="1" d="M24 52a42 42 0 0 0 0 28" />
    </svg>
  );
}

function ObgSymbol() {
  return (
    <svg className="vh-spec-symbol" viewBox="0 0 120 120" aria-hidden="true">
      {/* Expectant mother in profile: head, back, then the curve of the belly */}
      <circle pathLength="1" cx="50" cy="20" r="11" />
      <path pathLength="1" d="M44 34c-8 12-9 30-3 44 4 10 3 22-1 34" />
      <path pathLength="1" d="M57 34c6 8 5 16 2 22 17 4 28 16 27 31-1 12-11 17-22 17-5 1-6 4-4 8" />
      {/* Baby */}
      <circle className="vh-spec-accent" pathLength="1" cx="68" cy="80" r="8" />
      {/* Heart above */}
      <path className="vh-spec-accent" pathLength="1" d="M92 26c-3-6-12-5-12 2 0 6 8 10 12 13 4-3 12-7 12-13 0-7-9-8-12-2Z" />
    </svg>
  );
}

type Speciality = {
  id: string;
  title: string;
  doctor: string;
  degree: string;
  areas: string[];
  href: string;
  symbol: ReactNode;
};

// Doctor details and areas of care match DoctorsSection; registration numbers are still pending there.
const specialities: Speciality[] = [
  {
    id: 'orthopaedics',
    title: 'Orthopaedics',
    doctor: 'Dr. Reddy Jyothi Krishna',
    degree: 'M.B.B.S., M.S. Ortho',
    areas: ['Trauma and fracture care', 'Knee and joint pain'],
    href: '#doctor-jyothi-krishna',
    symbol: <OrthoSymbol />,
  },
  {
    id: 'obstetrics',
    title: 'Obstetrics & Gynaecology',
    doctor: 'Dr. Reddy Vedavathi',
    degree: 'M.B.B.S., M.S. Obs & Gynaec',
    areas: ['Pregnancy care and prenatal checkups', 'High-risk pregnancy assessment'],
    href: '#doctor-vedavathi',
    symbol: <ObgSymbol />,
  },
];

const ROTATE_MS = 5000;

// Shows one speciality at a time; it advances on its own, pauses while the visitor is on it, and never moves for reduced motion.
function SpecialityShowcase({ isOpen }: { isOpen: boolean }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(() => setActive((current) => (current + 1) % specialities.length), ROTATE_MS);
    return () => window.clearTimeout(timer);
  }, [active, paused]);

  const onTabKey = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + specialities.length) % specialities.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <aside
      className="vh-dial-card vh-spec-card"
      aria-label="Our specialities"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setPaused(false); }}
    >
      <div className="vh-spec-top">
        <span className={`vh-spec-status${isOpen ? '' : ' is-closed'}`} data-testid="status-open">
          <span aria-hidden="true" />{isOpen ? 'Open now' : 'Closed now'} · 24 hours
        </span>
        <div className="vh-spec-tabs" role="tablist" aria-label="Choose a speciality">
          {specialities.map((item, index) => (
            <button
              key={item.id}
              ref={(node) => { tabRefs.current[index] = node; }}
              className={`vh-spec-tab${index === active ? ' is-active' : ''}`}
              type="button"
              role="tab"
              id={`vh-spec-tab-${item.id}`}
              aria-selected={index === active}
              aria-controls={`vh-spec-panel-${item.id}`}
              aria-label={item.title}
              tabIndex={index === active ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={(event) => onTabKey(event, index)}
            >
              <span className="vh-spec-tab-fill" style={{ animationDuration: `${ROTATE_MS}ms`, animationPlayState: paused ? 'paused' : 'running' }} />
            </button>
          ))}
        </div>
      </div>

      <div className="vh-spec-stage">
        {specialities.map((item, index) => {
          const isActive = index === active;
          return (
            <div
              key={item.id}
              className={`vh-spec-panel${isActive ? ' is-active' : ''}`}
              role="tabpanel"
              id={`vh-spec-panel-${item.id}`}
              aria-labelledby={`vh-spec-tab-${item.id}`}
              aria-hidden={!isActive}
              inert={!isActive}
            >
              <div className="vh-spec-emblem">{item.symbol}</div>
              <h2 className="vh-spec-title">{item.title}</h2>
              <p className="vh-spec-doctor">{item.doctor}<span>{item.degree}</span></p>
              <ul className="vh-spec-areas">
                {item.areas.map((area) => <li key={area}>{area}</li>)}
              </ul>
              <a className="vh-spec-link" href={item.href}>Meet the doctor <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" /></a>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export function HomeHero({ phone, phoneLabel, directions, isOpenAt }: HomeHeroProps) {
  const now = useNow();
  const isOpen = isOpenAt(now);

  return (
    <section className="vh-hero" id="home" aria-labelledby="hero-title">
      <div className="vh-hero-media" aria-hidden="true">
        <img src="/assets/hero-veda-building.webp" alt="" width="1651" height="953" fetchPriority="high" />
      </div>
      <div className="vh-hero-shade" aria-hidden="true" />

      <div className="container vh-hero-inner">
        <div className="vh-hero-copy">
          <p className="vh-hero-pill"><span aria-hidden="true" /> Veda Hospital · Life Care</p>
          <h1 id="hero-title">
            <span className="vh-line"><span>Veda Hospital</span></span>
            <span className="vh-line vh-line-soft"><span>Life Care</span></span>
          </h1>
          <p className="vh-telugu font-telugu" lang="te" data-testid="text-hospital-name-telugu">[Need to confirm with hospital]</p>
          <p className="vh-hero-description">Orthopaedic care, women's health, maternity services and emergency care, with 24-hour hospital services.</p>
          <div className="vh-hero-actions">
            <a className="vh-button vh-button-solid" href={`tel:${phone}`} data-testid="button-call-hero"><PhoneCall size={18} strokeWidth={1.8} aria-hidden="true" /> Call now</a>
            <a className="vh-button vh-button-glass" href={directions} target="_blank" rel="noreferrer" data-testid="button-directions"><MapPin size={18} strokeWidth={1.8} aria-hidden="true" /> Get directions</a>
          </div>
        </div>

        <SpecialityShowcase isOpen={isOpen} />
      </div>

      <div className="vh-rail" aria-label="Key facts about Veda Hospital">
        <div className="container vh-rail-inner">
          <a className="vh-rail-item vh-rail-emergency" href={`tel:${phone}`} data-testid="button-call-emergency">
            <span className="vh-rail-icon"><Siren size={20} strokeWidth={1.6} aria-hidden="true" /></span>
            <span className="vh-rail-text" data-testid="text-emergency-contact">
              <span className="vh-rail-title">24-hour casualty and emergency care</span>
              <span className="vh-rail-meta">24/7 Casualty Services · {phoneLabel}</span>
            </span>
          </a>
          {/* The doctors already rotate in the panel above, so the rail carries where to go and what patients say. */}
          <a className="vh-rail-item" href={directions} target="_blank" rel="noreferrer" aria-label="Find us: Railway Flyover Service Road. Opens directions in Google Maps">
            <span className="vh-rail-icon"><MapPin size={20} strokeWidth={1.6} aria-hidden="true" /></span>
            <span className="vh-rail-text">
              <span className="vh-rail-title">Find us</span>
              <span className="vh-rail-meta">Railway Flyover Service Road</span>
            </span>
            <ArrowUpRight className="vh-rail-arrow" size={18} strokeWidth={1.6} aria-hidden="true" />
          </a>
          <a className="vh-rail-item" href="#reviews">
            <span className="vh-rail-icon"><Star size={20} strokeWidth={1.6} aria-hidden="true" /></span>
            <span className="vh-rail-text">
              <span className="vh-rail-title">4.5 Google rating</span>
              <span className="vh-rail-meta">42 Google reviews</span>
            </span>
            <ArrowUpRight className="vh-rail-arrow" size={18} strokeWidth={1.6} aria-hidden="true" />
          </a>
          <div className="vh-rail-item vh-rail-static">
            <span className="vh-rail-icon"><Stethoscope size={20} strokeWidth={1.6} aria-hidden="true" /></span>
            <span className="vh-rail-text">
              <span className="vh-rail-title">Two Specialist Doctors</span>
              <span className="vh-rail-meta">Open 24 Hours, 7 Days</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
