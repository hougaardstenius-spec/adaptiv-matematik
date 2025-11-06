
# Adaptive Matematik – Emner & niveauer (1–10)

Dette er en **statisk** struktur for tre emner – *Brøker, Procent, Geometri* – hver med **niveau 1–10**. Klar til at blive deployet på **Vercel**.

## Struktur
```
adaptive-math-levels/
├─ index.html
├─ styles.css
├─ app.js
└─ data/
   └─ data.json
```

## Lokal test (frivillig)
Åbn `index.html` i en browser, eller kør en simpel server:
```bash
python3 -m http.server 8080
```
Gå til http://localhost:8080

## Deploy til Vercel (uden build)
1. **Opret repo** (valgfrit): push mappen til GitHub som `adaptive-math-levels`.
2. Gå til **vercel.com** og vælg **Add New Project** → importér repo *eller* brug **Vercel CLI**.
3. Hvis du bruger CLI:
   ```bash
   npm i -g vercel
   vercel login
   vercel init  # valgfrit
   vercel --prod
   ```
4. Vercel registrerer dette som et **statisk site** (ingen build). `index.html` er entrypoint.

## Brug i Microsoft Teams (web-faneblad)
- Brug den publicerede Vercel-URL som **Websted**-faneblad i Teams.

## Udvidelse
- Tilføj flere emner ved at redigere `data/data.json`.
- Tilføj opgavebank per niveau (fx `data/broeker-n3.json`).
- Tilføj elevprogression ved at gemme status i `localStorage` eller ved at koble et backend-API på.

## Licens
Fri brug i undervisning. © 2025
