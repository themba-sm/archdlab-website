# ARCHD LAB — Architectural Design Lab Website

Static, mobile-first, editorial-style website for ARCHD LAB (Boksburg, Johannesburg East).

## Structure
- `index.html` — single-page site
- `css/main.css` — styles
- `js/main.js` — navigation, services accordion, 8-step guided enquiry wizard, WhatsApp triggers
- `assets/` — images

## Notes
- Enquiry form posts to a Base44 backend function (`captureArchdLead`) that stores leads in the ArchdLead entity. Email relay to info@archdlab.co.za is intentionally disabled until go-live.
- No CI; deploy by pointing your host (e.g. Vercel) at this repository.
