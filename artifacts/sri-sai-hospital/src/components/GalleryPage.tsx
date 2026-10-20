import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Camera, X } from 'lucide-react';
import { galleryItems, type GalleryCategory, type GalleryItem } from '../data/gallery';

const filters: { label: string; value: GalleryCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Building', value: 'building' },
  { label: 'Reception', value: 'reception' },
  { label: 'Consultation room', value: 'consultation' },
  { label: 'Waiting area', value: 'waiting' },
  { label: 'Laboratory', value: 'laboratory' },
];

export function GalleryPage() {
  const [activeFilter, setActiveFilter] = useState<GalleryCategory | 'all'>('all');
  const [displayFilter, setDisplayFilter] = useState<GalleryCategory | 'all'>('all');
  const [exitingIds, setExitingIds] = useState<Set<string>>(() => new Set());
  const [enteringIds, setEnteringIds] = useState<Set<string>>(() => new Set());
  const [revealedIds, setRevealedIds] = useState<Set<string>>(() => new Set());
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);
  const [slideDirection, setSlideDirection] = useState<'next' | 'previous'>('next');
  const cardRefs = useRef(new Map<string, HTMLButtonElement>());
  const previousPositions = useRef(new Map<string, DOMRect>());
  const filterTimer = useRef<number | undefined>(undefined);
  const enterTimer = useRef<number | undefined>(undefined);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useRef(false);

  const visibleItems = useMemo(
    () => galleryItems.filter((item) => displayFilter === 'all' || item.category === displayFilter),
    [displayFilter],
  );

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => {
      reducedMotion.current = motionPreference.matches;
    };
    updateMotionPreference();
    motionPreference.addEventListener('change', updateMotionPreference);
    return () => {
      motionPreference.removeEventListener('change', updateMotionPreference);
      window.clearTimeout(filterTimer.current);
      window.clearTimeout(enterTimer.current);
    };
  }, []);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.gallery-page .reveal'));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!activeItem) return;
    const previousFocus = returnFocusRef.current;
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent | globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveItem(null);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const currentIndex = visibleItems.findIndex((item) => item.id === activeItem.id);
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const nextIndex = (currentIndex + direction + visibleItems.length) % visibleItems.length;
        setSlideDirection(direction === 1 ? 'next' : 'previous');
        setActiveItem(visibleItems[nextIndex] ?? null);
      } else if (event.key === 'Tab') {
        const focusable = Array.from(
          document.querySelectorAll<HTMLElement>('.gallery-lightbox button:not(:disabled)'),
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.classList.add('gallery-lightbox-open');
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('gallery-lightbox-open');
      previousFocus?.focus();
    };
  }, [activeItem, visibleItems]);

  function changeFilter(value: GalleryCategory | 'all') {
    window.clearTimeout(filterTimer.current);
    window.clearTimeout(enterTimer.current);
    const nextItems = galleryItems.filter((item) => value === 'all' || item.category === value);
    const nextIds = new Set(nextItems.map(({ id }) => id));
    const leavingIds = visibleItems.filter(({ id }) => !nextIds.has(id)).map(({ id }) => id);
    const currentIds = new Set(visibleItems.map(({ id }) => id));
    const incomingIds = nextItems.filter(({ id }) => !currentIds.has(id)).map(({ id }) => id);
    setActiveFilter(value);
    if (reducedMotion.current) {
      setDisplayFilter(value);
      setExitingIds(new Set());
      setEnteringIds(new Set());
      setRevealedIds((current) => new Set([...current, ...incomingIds]));
      return;
    }
    previousPositions.current = new Map(
      Array.from(cardRefs.current, ([id, card]) => [id, card.getBoundingClientRect()]),
    );
    setExitingIds(new Set(leavingIds));
    filterTimer.current = window.setTimeout(() => {
      setDisplayFilter(value);
      setExitingIds(new Set());
      setEnteringIds(new Set(incomingIds));
      setRevealedIds((current) => new Set([...current, ...incomingIds]));
      enterTimer.current = window.setTimeout(() => setEnteringIds(new Set()), 450);
    }, 250);
  }

  function openLightbox(item: GalleryItem, card: HTMLButtonElement) {
    returnFocusRef.current = card;
    setActiveItem(item);
  }

  function openWithKeyboard(event: KeyboardEvent<HTMLButtonElement>, item: GalleryItem) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      const index = visibleItems.findIndex(({ id }) => id === item.id);
      cardRefs.current.get(visibleItems[(index + 1) % visibleItems.length]?.id)?.focus();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      const index = visibleItems.findIndex(({ id }) => id === item.id);
      cardRefs.current.get(visibleItems[(index - 1 + visibleItems.length) % visibleItems.length]?.id)?.focus();
    }
  }

  function setCardRef(id: string, node: HTMLButtonElement | null) {
    if (node) cardRefs.current.set(id, node);
    else cardRefs.current.delete(id);
  }

  useLayoutEffect(() => {
    if (reducedMotion.current || !previousPositions.current.size) return;
    visibleItems.forEach(({ id }) => {
      const card = cardRefs.current.get(id);
      if (!card) return;
      const cardId = card.dataset.galleryCard;
      const previous = cardId ? previousPositions.current.get(cardId) : undefined;
      if (!previous) return;
      const next = card.getBoundingClientRect();
      const deltaX = previous.left - next.left;
      const deltaY = previous.top - next.top;
      if (deltaX || deltaY) {
        card.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        card.style.transition = 'none';
        requestAnimationFrame(() => {
          card.style.transition = '';
          card.style.transform = '';
        });
      }
    });
    previousPositions.current.clear();
  }, [displayFilter, visibleItems]);

  function closeLightbox() {
    setActiveItem(null);
  }

  function moveLightbox(direction: -1 | 1) {
    if (!activeItem) return;
    const index = visibleItems.findIndex(({ id }) => id === activeItem.id);
    setSlideDirection(direction === 1 ? 'next' : 'previous');
    setActiveItem(visibleItems[(index + direction + visibleItems.length) % visibleItems.length] ?? null);
  }

  return (
    <main className="gallery-page">
      <div className="container">
        <header className="gallery-page-heading reveal">
          <span className="gallery-page-eyebrow">Gallery</span>
          <h1>Inside Veda Hospital.</h1>
          <p>Explore the spaces where patients are received and cared for.</p>
          <a href="/" className="gallery-back-link">Back to home</a>
        </header>

        <div className="gallery-filters" role="group" aria-label="Filter photographs">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={activeFilter === filter.value}
              className={activeFilter === filter.value ? 'is-active' : ''}
              onClick={() => changeFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {galleryItems.every(({ src }) => src === null) && (
          <p className="gallery-empty-note">Photographs will be added soon.</p>
        )}
        <div className="gallery-page-grid">
          {visibleItems.map((item, index) => (
            <button
              key={item.id}
              ref={(node) => setCardRef(item.id, node)}
              type="button"
              className={`gallery-page-card reveal${revealedIds.has(item.id) ? ' is-visible' : ''}${exitingIds.has(item.id) ? ' is-exiting' : ''}${enteringIds.has(item.id) ? ' is-entering' : ''}`}
              data-gallery-card={item.id}
              style={{ '--gallery-index': index } as CSSProperties}
              disabled={exitingIds.has(item.id)}
              onClick={(event) => openLightbox(item, event.currentTarget)}
              onKeyDown={(event) => openWithKeyboard(event, item)}
              aria-label={`Open ${item.caption}`}
            >
              {item.src ? (
                <img src={item.src} alt={item.alt} loading="lazy" />
              ) : (
                <span className="gallery-placeholder" role="img" aria-label={item.caption}>
                  <Camera size={30} strokeWidth={1.3} aria-hidden="true" />
                </span>
              )}
              <span className="gallery-caption">{item.caption}</span>
            </button>
          ))}
        </div>
      </div>

      {activeItem && (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.caption}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeLightbox();
          }}
        >
          <button className="gallery-lightbox-close" ref={closeButtonRef} onClick={closeLightbox} aria-label="Close gallery image">
            <X size={24} aria-hidden="true" />
          </button>
          <button className="gallery-lightbox-arrow previous" onClick={() => moveLightbox(-1)} aria-label="Previous photograph">‹</button>
          <figure className={`gallery-lightbox-content slide-${slideDirection}`} key={activeItem.id}>
            {activeItem.src ? (
              <img src={activeItem.src} alt={activeItem.alt} />
            ) : (
              <div className="gallery-lightbox-placeholder" role="img" aria-label={activeItem.caption}>
                <Camera size={40} strokeWidth={1.2} aria-hidden="true" />
              </div>
            )}
            <figcaption>{activeItem.caption}</figcaption>
          </figure>
          <button className="gallery-lightbox-arrow next" onClick={() => moveLightbox(1)} aria-label="Next photograph">›</button>
        </div>
      )}
    </main>
  );
}
