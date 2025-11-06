
# Adaptive Matematik – Emner & niveauer (1–10)

**Funktioner:**
- Adaptiv blanding pr. niveau (8 opgaver/quiz) fra **30+ opgaver pr. niveau**.
- **Opgavebanke**: Brøker, Procent, Geometri med kontekst- og enhedsopgaver.
- **Progression** (localStorage) + “Fortsæt hvor du slap”.
- **Feedback-bank** for typiske fejl (procentpoint vs %, radius vs diameter, areal/omkreds, enheder m.m.).
- **Enheds-tilstand** + **streng enhedsvalidering** (kan toggles i headeren).
- **XP & Badges**: XP-bar, streak-bonus, level-up, badges med strip/panel og toasts.
- Klar til **statisk deploy på Vercel** (ingen build).

## Struktur
```
adaptive-math-levels/
├─ index.html
├─ styles.css
├─ app.js
├─ vercel.json
└─ data/
   ├─ data.json                 # Emner og niveau-beskrivelser
   ├─ feedback.json             # Feedback-bank
   ├─ broeker-n1.json … n10     # Opgaver pr. niveau (30+)
   ├─ procent-n1.json … n10
   ├─ geometri-n1.json … n10
   ├─ broeker-index.json
   ├─ procent-index.json
   └─ geometri-index.json
```

## Træningstilstande & enheder
- **Træning** (i headeren): vælg *Alle opgaver* eller *Kun enheder*.
- **Kræv korrekt enhed**: Når slået til, skal eleven angive korrekt enhed for numeric-opgaver med `unit` (fx `78,5 m^2`).
- **Sværhedsvægte**: Justér fordeling (let/mellem/svær) pr. niveau-interval direkte i headeren.

**Enhedstjek (lenient):**
- Accepterer varianter som `m2`/`m^2`, `cm2`/`cm^2`, `L`/`liter`, `m/s`/`m s^-1`.
- Ved manglende/forkert enhed gives targeted feedback (fx `unit_missing_or_wrong`).

## XP & Badges
- **XP pr. korrekt**: easy 10, medium 20, hard 35; **streak-bonus** +5 pr. korrekt i træk (maks +25).
- **Beståelsesbonus**: +50 XP ved ≥6/8.
- **Badges**: Perfekt runde, Streak‑10, Speedrunner, Enheds‑Ace, Brøk‑mester, Procent‑Pro, Geometri‑Guru.

## Deploy til Vercel
- Importér som statisk projekt (ingen build) eller deploy via CLI:
```bash
npm i -g vercel
vercel login
vercel --prod
```

## Licens
Fri brug i undervisning. © 2025



## Enhedskonvertering
- Tilføjet opgaver for længde (mm↔cm↔m), areal (cm²↔m²), volumen (mL↔L, cm³↔m³), hastighed (km/h↔m/s), tid (min↔s), masse (g↔kg) og valuta (kr↔øre).
- Opgaverne har targeted feedback ved klassiske fejl (f.eks. areal i anden, volumen i tredje, km/h↔m/s med 3,6 osv.).
