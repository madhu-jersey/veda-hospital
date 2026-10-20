# Veda Hospital (Life Care) — static website

Single-page public website for Veda Hospital (Life Care). The site is frontend-only and static-hostable.

## Hospital photographs

To add a photo, place the file in public/assets/gallery/ and set src in src/data/gallery.ts.
The hero uses `public/assets/hero-veda-building.webp`, the building photograph supplied by the hospital (unmodified copy in `original-assets/`).

## Assets

- `public/assets/doctor-portrait-placeholder.svg` — placeholder used for both doctors until doctor-approved portraits are supplied (set `image` in `src/components/DoctorsSection.tsx`)
- `public/assets/veda-hospital-logo.png` — Veda Hospital logo (trimmed from the supplied file), used in the header, hero badge and footer
- `original-assets/veda-hospital-logo.webp` — the supplied logo, unmodified
- Favicons and app icons in `public/` are generated from the same logo

## Sections

FAQ and Why choose us are sections on the home page (`#faq`, `#why-choose`), defined in `src/components/InfoPages.tsx`. The old `/faq` and `/why-choose` URLs redirect to those sections.

## Videos

No YouTube channel or videos were supplied, so the videos section is not rendered. `src/components/VideosSection.tsx` is kept for later use.
