
# Adaptive Matematik – Komplet gamificeret suite

Denne pakke er klar til at blive lagt direkte i et tomt GitHub‑repo og **deployed på Vercel** eller kørt lokalt. Den indeholder:

- Statisk webapp (`index.html`, `app.js`, `styles.css`) med
  - **Gamification**: XP (base + streak + beståelsesbonus), level‑up, **badges** (strip, panel, toasts)
  - **Adaptiv quiz** (8 opgaver): let/mellem/svær fordelt per niveau
  - **“Kun enheder”**‑tilstand + **streng enhedsvalidering** af numeric‑svar
- **Opgavebank** (`data/`): 30+ opgaver pr. niveau for **Brøker, Procent, Geometri** inkl. **real‑life** og **enhedskonvertering**
- **Feedback‑bank** (`data/feedback.json`) for typiske fejl
- **Scripts** (`scripts/`) til at regenerere hele opgavebanken eller starte lokal server
- **Vercel‑config** (`vercel.json`) og **package.json** (dev scripts)

---
## Kør lokalt
**Uden Node** (Python 3):
```bash
python3 scripts/local_server.py 8080
# åbn http://localhost:8080
```

**Med Node (anbefalet, auto‑reload via din editor/browser)**:
```bash
npm install
npm run dev
# åbn http://localhost:8080
```

---
## Deploy (Vercel)
1) Skub til GitHub → Opret Vercel‑projekt fra repo (Framework: **Other**, Build: **None**).
2) Eller kør direkte fra lokale filer:
```bash
npm i -g vercel
vercel login
vercel --prod
```

`vercel.json` sætter cache‑headers for `/data/*`.

---
## Regenerér opgavebanken
Der medfølger et fuldt script, som kan generere **alle** JSON‑filer i `data/` fra bunden.

```bash
# regenerér alt
python3 scripts/generate_taskbanks.py --out data --seed 20251106 --min-per-level 30

# kun ét emne
python3 scripts/generate_taskbanks.py --subject procent --out data

# kun et bestemt niveau
python3 scripts/generate_taskbanks.py --subject geometri --level 7 --out data
```

Parametre:
- `--subject {broeker,procent,geometri}` (udeladt = alle)
- `--level 1..10` (udeladt = alle niveauer i valgt emne)
- `--min-per-level N` (default 30)
- `--seed` for deterministisk output

---
## Struktur
```
adaptive-math-levels/
├─ index.html
├─ styles.css
├─ app.js
├─ vercel.json
├─ package.json
├─ data/
│  ├─ data.json
│  ├─ feedback.json
│  ├─ broeker-n1.json … broeker-n10.json
│  ├─ procent-n1.json … procent-n10.json
│  ├─ geometri-n1.json … geometri-n10.json
│  ├─ broeker-index.json
│  ├─ procent-index.json
│  └─ geometri-index.json
└─ scripts/
   ├─ generate_taskbanks.py    # fuld generator (CLI)
   └─ local_server.py          # simpel dev-server
```

---
## Licens
Fri brug i undervisning. © 2025


## Scripts
- `python3 scripts/generate_taskbanks.py --out data` — generér alle opgaver igen.
- `python3 scripts/local_server.py 8080` — kør lokalt dev‑server.
