# -*- coding: utf-8 -*-
"""
Tilføjer enhedskonverterings-opgaver til alle niveauer:
- Procent: kr↔øre, mL→L→kr/L, km/h↔m/s
- Geometri: mm↔cm↔m, cm²↔m², mL↔L, cm³↔m³
- Brøker: g↔kg, min↔sek
Bevarer eksisterende opgaver og appender nye. Tilføjer feedback-nøgler og README-afsnit.
Kør fra projektrod:  python3 scripts/add_unit_conversion_tasks.py
"""
import os, json, random, math
from pathlib import Path

random.seed(20251106)

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
if not DATA.exists():
    raise SystemExit("Kan ikke finde mappen 'data/'. Kør først den oprindelige opsætning.")

meta_path = DATA / "data.json"
if not meta_path.exists():
    raise SystemExit("Kan ikke finde 'data/data.json'. Kør først den oprindelige opsætning.")

subjects = json.loads(meta_path.read_text(encoding="utf-8"))

# --------- Feedback-bank: udvid med enheds-nøgler ----------
fb_path = DATA / "feedback.json"
feedback = {}
if fb_path.exists():
    feedback = json.loads(fb_path.read_text(encoding="utf-8"))
feedback.update({
    "length_factor_wrong": "Længde: 1 m = 100 cm = 1000 mm. Brug den rigtige faktor for retning.",
    "area_factor_not_squared": "Areal: enhedsfaktoren skal i anden (1 m² = 10.000 cm²).",
    "volume_factor_not_cubed": "Volumen: enhedsfaktoren skal i tredje (1 m³ = 1.000.000 cm³).",
    "ml_l_confusion": "1 L = 1000 mL. For mL→L divider med 1000 (omvendt: gang).",
    "g_kg_confusion": "1 kg = 1000 g. g→kg: divider med 1000 (omvendt: gang).",
    "kmh_ms_confusion": "km/h↔m/s: divider/multiplicer med 3,6 (1 m/s = 3,6 km/h).",
    "time_conversion_confusion": "Tid: 1 min = 60 s, 1 h = 60 min. Brug korrekt faktor og retning.",
    "currency_ore_confusion": "Valuta: 1 kr = 100 øre. Divider/gange 100 i korrekt retning."
})
fb_path.write_text(json.dumps(feedback, ensure_ascii=False, indent=2), encoding="utf-8")

# ---------- Hjælpere ----------
def uniq_id(base, used):
    if base not in used: return base
    i = 2
    while f"{base}-{i}" in used:
        i += 1
    return f"{base}-{i}"

# ---------- Generators ----------
def unit_tasks_procent(level):
    t = []
    # kr ↔ øre (easy)
    if level <= 3:
        for i in range(2):
            kr = random.choice([12, 25, 37])
            ore = kr * 100
            t.append({
                "id": f"procent-unit-kr2ore-{level}-{i+1}",
                "type": "numeric", "difficulty": "easy",
                "prompt": f"Omregn {kr} kr til øre.",
                "answer": ore, "format": "number", "unit": "øre",
                "hint": "1 kr = 100 øre.", "feedback_key": "currency_ore_confusion"
            })
            t.append({
                "id": f"procent-unit-ore2kr-{level}-{i+1}",
                "type": "numeric", "difficulty": "easy",
                "prompt": f"Omregn {ore} øre til kroner.",
                "answer": kr, "format": "number", "unit": "kr",
                "hint": "1 kr = 100 øre.", "feedback_key": "currency_ore_confusion"
            })
    # mL → L → kr/L (medium)
    if 3 <= level <= 6:
        for i in range(2):
            ml = random.choice([330, 500, 750])
            price = random.choice([9.0, 12.0, 15.0])
            per_l = round(price / (ml/1000), 2)
            t.append({
                "id": f"procent-unit-perL-{level}-{i+1}",
                "type": "numeric", "difficulty": "medium",
                "prompt": f"En flaske på {ml} mL koster {price} kr. Hvad er prisen pr. liter?",
                "answer": per_l, "format": "number", "unit": "kr/L",
                "hint": "Omregn mL→L (divider med 1000).", "feedback_key": "ml_l_confusion"
            })
    # km/h ↔ m/s (hard)
    if level >= 7:
        for i in range(2):
            v_kmh = random.choice([36, 54, 72])
            v_ms = round(v_kmh / 3.6, 2)
            t.append({
                "id": f"procent-unit-kmh2ms-{level}-{i+1}",
                "type": "numeric", "difficulty": "hard",
                "prompt": f"Omregn {v_kmh} km/h til m/s (afrund 2 dec.).",
                "answer": v_ms, "format": "number", "unit": "m/s",
                "hint": "m/s = km/h ÷ 3,6.", "feedback_key": "kmh_ms_confusion"
            })
    return t

def unit_tasks_geometri(level):
    t = []
    # Længde (easy)
    if level <= 3:
        for i in range(2):
            mm = random.choice([120, 350, 500])
            cm = mm / 10
            t.append({
                "id": f"geo-unit-mm2cm-{level}-{i+1}",
                "type": "numeric", "difficulty": "easy",
                "prompt": f"Omregn {mm} mm til cm.",
                "answer": cm, "format": "number", "unit": "cm",
                "hint": "1 cm = 10 mm.", "feedback_key": "length_factor_wrong"
            })
            m = random.choice([2, 3, 5])
            cm2 = m * 100
            t.append({
                "id": f"geo-unit-m2cm-{level}-{i+1}",
                "type": "numeric", "difficulty": "easy",
                "prompt": f"Omregn {m} m til cm.",
                "answer": cm2, "format": "number", "unit": "cm",
                "hint": "1 m = 100 cm.", "feedback_key": "length_factor_wrong"
            })
    # Areal (medium)
    if 3 <= level <= 7:
        for i in range(2):
            cm2 = random.choice([2500, 3600, 10000])
            m2 = round(cm2 / 10000, 4)
            t.append({
                "id": f"geo-unit-cm2tom2-{level}-{i+1}",
                "type": "numeric", "difficulty": "medium",
                "prompt": f"Omregn {cm2} cm² til m².",
                "answer": m2, "format": "number", "unit": "m^2",
                "hint": "1 m² = 10.000 cm².", "feedback_key": "area_factor_not_squared"
            })
    # Volumen (medium/hard)
    if level >= 6:
        for i in range(2):
            ml = random.choice([750, 1500, 2500])
            L = round(ml / 1000, 3)
            t.append({
                "id": f"geo-unit-ml2l-{level}-{i+1}",
                "type": "numeric", "difficulty": "medium",
                "prompt": f"Omregn {ml} mL til liter.",
                "answer": L, "format": "number", "unit": "L",
                "hint": "1 L = 1000 mL.", "feedback_key": "ml_l_confusion"
            })
        for i in range(2):
            cm3 = random.choice([1000, 8000, 27000])
            m3 = round(cm3 / 1_000_000, 6)
            t.append({
                "id": f"geo-unit-cm3tom3-{level}-{i+1}",
                "type": "numeric", "difficulty": "hard",
                "prompt": f"Omregn {cm3} cm³ til m³.",
                "answer": m3, "format": "number", "unit": "m^3",
                "hint": "1 m³ = 1.000.000 cm³.", "feedback_key": "volume_factor_not_cubed"
            })
    return t

def unit_tasks_broeker(level):
    t = []
    # Masse g↔kg
    for i in range(2):
        g = random.choice([250, 500, 750, 1200])
        kg = round(g / 1000, 3)
        t.append({
            "id": f"broeker-unit-g2kg-{level}-{i+1}",
            "type": "numeric", "difficulty": "easy",
            "prompt": f"Omregn {g} g til kg.",
            "answer": kg, "format": "number", "unit": "kg",
            "hint": "1 kg = 1000 g.", "feedback_key": "g_kg_confusion"
        })
    # Tid min↔sek
    for i in range(2):
        mins = random.choice([3, 7, 12])
        sec = mins * 60
        t.append({
            "id": f"broeker-unit-min2s-{level}-{i+1}",
            "type": "numeric", "difficulty": "easy",
            "prompt": f"Omregn {mins} min til sekunder.",
            "answer": sec, "format": "number", "unit": "s",
            "hint": "1 min = 60 s.", "feedback_key": "time_conversion_confusion"
        })
    return t

# ---------- Append til alle niveauer ----------
for key in subjects.keys():
    for lvl in range(1, 11):
        fpath = DATA / f"{key}-n{lvl}.json"
        if not fpath.exists():
            continue
        obj = json.loads(fpath.read_text(encoding="utf-8"))
        tasks = obj.get("tasks", [])
        used = {t.get("id") for t in tasks}

        if key == "procent":
            extra = unit_tasks_procent(lvl)
        elif key == "geometri":
            extra = unit_tasks_geometri(lvl)
        else:
            extra = unit_tasks_broeker(lvl)

        for t in extra:
            t["id"] = uniq_id(t["id"], used)
            used.add(t["id"])
            tasks.append(t)

        obj["tasks"] = tasks
        fpath.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")

# ---------- README-append ----------
readme_path = ROOT / "README.md"
readme_append = """
## Enhedskonvertering
- Tilføjet opgaver for længde (mm↔cm↔m), areal (cm²↔m²), volumen (mL↔L, cm³↔m³), hastighed (km/h↔m/s), tid (min↔s), masse (g↔kg) og valuta (kr↔øre).
- Opgaverne har targeted feedback ved klassiske fejl (f.eks. areal i anden, volumen i tredje, km/h↔m/s med 3,6 osv.).
"""
with readme_path.open("a", encoding="utf-8") as f:
    f.write("\n\n" + readme_append)

print("✔ Enhedskonverterings-opgaver tilføjet til alle niveau-filer.")
