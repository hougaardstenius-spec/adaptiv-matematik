
# Adaptive Matematik – Emner & niveauer (1–10)

Statisk site med **adaptiv sværhedsgrad**, **elevprogression (localStorage)** og **kontekst-opgaver** for Procent & Geometri.

## Ny funktionalitet
- **(1) Adaptiv blanding** af opgaver i hvert niveau (8 spørgsmål):
  - Niv. 1–3: 4 let / 3 mellem / 1 svær
  - Niv. 4–6: 3 let / 3 mellem / 2 svær
  - Niv. 7–8: 2 let / 3 mellem / 3 svær
  - Niv. 9–10: 1 let / 3 mellem / 4 svær
- **(2) Elevprogression** lagres i `localStorage`:
  - Beståelseskrav: **6/8 korrekte** -> næste niveau låses op
  - Progress-bar pr. emne, **Fortsæt hvor du slap** i header
  - Historik pr. emne: beståede niveauer og højeste låste op
- **(4) Kontekst-opgaver**:
  - Procent: rabat, moms, (på n10 også rentes rente)
  - Geometri: realistiske areal-/perimeter-scenarier (gulv, plæne)

## Struktur
```
adaptive-math-levels/
├─ index.html
├─ styles.css
├─ app.js
├─ vercel.json
└─ data/
   ├─ data.json
   ├─ broeker-n1.json … broeker-n10.json
   ├─ procent-n1.json … procent-n10.json
   ├─ geometri-n1.json … geometri-n10.json
   ├─ broeker-index.json
   ├─ procent-index.json
   └─ geometri-index.json
```

## Deploy til Vercel
Ingen build. Kør `vercel --prod` eller importér via GitHub. `vercel.json` sætter caching for `/data/*`.

## Udvikling
- Tilføj egne opgaver i `data/{subject}-n{level}.json` og sæt `difficulty` til `easy|medium|hard`.
- Numeriske opgaver har tolerance ±0,01.
- MCQ angiver `answer` som index i `choices`.

## Licens
Fri brug i undervisning. © DHS 2025
