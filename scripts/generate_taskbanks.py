# scripts/generate_taskbanks.py
# -*- coding: utf-8 -*-
import os, json, random, math
from pathlib import Path
random.seed(20251106)

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"; DATA.mkdir(parents=True, exist_ok=True)

meta = json.loads((DATA/"data.json").read_text(encoding="utf-8"))

def simplify(num, den):
    if den==0: den=1
    g = math.gcd(num, den); num//=g; den//=g
    s = f"{abs(num)}/{abs(den)}"; return ("-"+s) if num*den<0 else s

def rng(level, salt=0): return random.Random((level*73856093+salt)%(2**32))

# ---- Procent (base + kontekst + vanskeligheder) ----
def gen_procent(level):
    r=rng(level,1); T=[]
    # easy: p% af N
    for _ in range(10):
        N=r.choice([80,100,120,150,200,240,300]); p=r.choice([5,10,12.5,20,25]); T.append({
            "id":f"procent-n{level}-e{_+1}","type":"numeric","difficulty":"easy",
            "prompt":f"Hvad er {p}% af {N} kr?","answer":round(N*p/100,2),"format":"number","unit":"kr",
            "hint":"(procent/100)×tal","distractors":[round(N*(p+5)/100,2)],"feedback_map":{str(round(N*(p+5)/100,2)):"pi_rounding"}})
    # medium: prisændring+rabatter+omvendt procent (fra n5)
    for _ in range(6):
        P=r.choice([200,250,300,400,500]); ch=r.choice([10,12,15,20]); up=r.choice([True,False])
        T.append({"id":f"procent-n{level}-m{_+1}","type":"numeric","difficulty":"medium",
                  "prompt":f"En pris på {P} kr {'stiger' if up else 'falder'} med {ch}%. Hvad er den nye pris?",
                  "answer":round(P*(1+ch/100) if up else P*(1-ch/100),2),"format":"number","unit":"kr","hint":"Gange med 1±p%"})
    for _ in range(4):
        P=r.choice([350,480,560,800]); d=r.choice([15,20,30,40])
        T.append({"id":f"procent-n{level}-disc{_+1}","type":"numeric","difficulty":"medium",
                  "prompt":f"En vare koster {P} kr. Der gives {d}% rabat. Hvad betaler du?",
                  "answer":round(P*(1-d/100),2),"format":"number","unit":"kr","hint":"Pris×(1−rabat%)"})
    if level>=5:
        for _ in range(3):
            A=r.choice([80,120,160,225]); p=r.choice([20,25,10]); bef=round(A/(1-p/100),2)
            T.append({"id":f"procent-n{level}-rev{_+1}","type":"numeric","difficulty":"medium",
                      "prompt":f"En vare koster {A} kr efter {p}% rabat. Hvad kostede den før?",
                      "answer":bef,"format":"number","unit":"kr","hint":"Divider med 1−p%",
                      "distractors":[round(A*(1+p/100),2)],"feedback_map":{str(round(A*(1+p/100),2)):"reverse_percent_base"}})
    # hard: procentpoint, sekvens, moms+rabat, rente (n9+)
    for _ in range(3):
        s=r.choice([8,10,12,20]); e=s+r.choice([2,3,5]); rel=round((e-s)/s*100,2)
        T.append({"id":f"procent-n{level}-pp{_+1}","type":"numeric","difficulty":"hard",
                  "prompt":f"Renten stiger fra {s}% til {e}%. Hvor mange procentpoint?",
                  "answer":e-s,"format":"number","unit":"procentpoint","hint":"Absolut forskel",
                  "distractors":[rel],"feedback_map":{str(rel):"percent_vs_point"}})
    for _ in range(2):
        x=r.choice([10,20,25]); base=r.choice([100,200]); fin=round(base*(1+x/100)*(1-x/100),2)
        T.append({"id":f"procent-n{level}-seq{_+1}","type":"numeric","difficulty":"hard",
                  "prompt":f"En vare op {x}% og derefter ned {x}%. Hvad ender prisen på (start {base} kr)?",
                  "answer":fin,"format":"number","unit":"kr","hint":"(1+x%)(1−x%)",
                  "distractors":[float(base)],"feedback_map":{str(float(base)):"sequential_changes_not_cancel"}})
    for _ in range(2):
        P=r.choice([500,800,1200]); d=r.choice([20,30]); moms=25
        rgt=round(P*(1-d/100)*(1+moms/100),2); fkt=round(P*(1+moms/100)*(1-d/100),2)
        T.append({"id":f"procent-n{level}-ord{_+1}","type":"numeric","difficulty":"hard",
                  "prompt":f"Pris: {P} kr. Først {d}% rabat, derefter {moms}% moms. Hvad betaler du?",
                  "answer":rgt,"format":"number","unit":"kr","hint":"Rabat først → moms",
                  "distractors":[fkt],"feedback_map":{str(fkt):"order_discount_vat"}})
    if level>=9:
        for _ in range(3):
            K=r.choice([1500,2000,2500]); rnt=r.choice([1.0,1.25,1.5,2.0]); m=r.choice([6,12,18])
            A=K*((1+rnt/100)**(m/12)); T.append({"id":f"procent-n{level}-ci{_+1}","type":"numeric","difficulty":"hard",
                                                "prompt":f"Opsparing {K} kr vokser {rnt}%/md i {m} mdr. Gevinst?",
                                                "answer":round(A-K,2),"format":"number","unit":"kr","hint":"A=P(1+r)^t"})
    return T

# ---- Geometri ----
def gen_geometri(level):
    r=rng(level,2); T=[]
    for _ in range(5):
        l=r.randint(2,20); b=r.randint(2,20)
        T.append({"id":f"geo-n{level}-eA{_+1}","type":"numeric","difficulty":"easy",
                  "prompt":f"Areal af rektangel {l} m × {b} m?","answer":l*b,"format":"number","unit":"m^2",
                  "hint":"A=l×b","distractors":[l+b],"feedback_map":{str(l+b):"rectangle_area_add"}})
    for _ in range(5):
        l=r.randint(2,30); b=r.randint(2,30)
        T.append({"id":f"geo-n{level}-eP{_+1}","type":"numeric","difficulty":"easy",
                  "prompt":f"Omkreds af rektangel {l} m × {b} m?","answer":2*(l+b),"format":"number","unit":"m","hint":"2(l+b)"})
    for _ in range(4):
        g=r.randint(4,20); h=r.randint(3,15); A=round(g*h/2,2)
        T.append({"id":f"geo-n{level}-mT{_+1}","type":"numeric","difficulty":"medium",
                  "prompt":f"Areal af trekant g={g} cm, h={h} cm?","answer":A,"format":"number","unit":"cm^2",
                  "hint":"A=g·h/2","distractors":[round(g*h,2)],"feedback_map":{str(round(g*h,2)):"triangle_area_half_missing"}})
    for _ in range(4):
        if r.choice([True,False]):
            d=r.randint(6,40); rr=d/2; A=round(3.14*rr*rr,2); wrong=round(3.14*d*d,2)
            T.append({"id":f"geo-n{level}-mC{_+1}","type":"numeric","difficulty":"medium",
                      "prompt":f"Areal af cirkel med diameter {d} m (π≈3,14)?","answer":A,"format":"number","unit":"m^2",
                      "hint":"r=d/2, A=πr²","distractors":[wrong],"feedback_map":{str(wrong):"radius_diameter_confusion"}})
        else:
            rr=r.randint(2,20); T.append({"id":f"geo-n{level}-mCr{_+1}","type":"numeric","difficulty":"medium",
                                          "prompt":f"Areal af cirkel med radius {rr} m (π≈3,14)?",
                                          "answer":round(3.14*rr*rr,2),"format":"number","unit":"m^2","hint":"A=πr²"})
    for _ in range(2):
        a=r.randint(3,10); b=r.randint(3,10); c=r.randint(2,8); d=r.randint(2,8)
        T.append({"id":f"geo-n{level}-mS{_+1}","type":"numeric","difficulty":"medium",
                  "prompt":f"Areal af sammensat figur: {a}×{b} + {c}×{d} (m). Angiv m².",
                  "answer":a*b+c*d,"format":"number","unit":"m^2","hint":"Del i rektangler"})
    for _ in range(3):
        L=r.randint(5,30); W=r.randint(4,25); area=L*W; per=2*(L+W)
        T.append({"id":f"geo-n{level}-hPer{_+1}","type":"numeric","difficulty":"hard",
                  "prompt":f"Hvor mange meter fodliste langs kanten af et rum {L}×{W} m?",
                  "answer":per,"format":"number","unit":"m","hint":"Omkreds 2(l+b)",
                  "distractors":[area],"feedback_map":{str(area):"area_vs_perimeter"}})
    for _ in range(3):
        cm2=r.choice([2500,3600,10000,22500,40000])
        T.append({"id":f"geo-n{level}-hConv{_+1}","type":"numeric","difficulty":"hard",
                  "prompt":f"Omregn {cm2} cm² til m².","answer":round(cm2/10000,4),"format":"number","unit":"m^2",
                  "hint":"1 m² = 10.000 cm²","feedback_key":"area_factor_not_squared"})
    for _ in range(2):
        k=r.choice([1.5,2,3]); A=r.choice([6,8,10])
        T.append({"id":f"geo-n{level}-hScale{_+1}","type":"numeric","difficulty":"hard",
                  "prompt":f"Areal {A} m². Skaler alle sider med {k}. Nyt areal?",
                  "answer":round(A*(k**2),2),"format":"number","unit":"m^2","hint":"k²","distractors":[round(A*k,2)],
                  "feedback_map":{str(round(A*k,2)):"scale_factor_area"}})
    if level>=9:
        for _ in range(2):
            a=r.randint(3,12); b=r.randint(4,13)
            T.append({"id":f"geo-n{level}-hPyt{_+1}","type":"numeric","difficulty":"hard",
                      "prompt":f"Retvinklet trekant med kateter {a} cm og {b} cm. Hypotenusen (2 dec.)?",
                      "answer":round(math.sqrt(a*a+b*b),2),"format":"number","unit":"cm",
                      "hint":"c²=a²+b²","feedback_key":"pythagoras_confusion"})
    # real-life + enhedskonverteringer (udvidelse)
    T.append({"id":f"geo-n{level}-rl-paint","type":"numeric","difficulty":"medium",
              "prompt":"Et rum 5m×4m×2.5m males i 2 lag. Dækkeevne 10 m²/L. Hvor mange liter?",
              "answer":round(2*(5+4)*2.5*2/10,2),"format":"number","unit":"L",
              "hint":"2(L+W)H×lag / dækkeevne","feedback_key":"paint_coverage_confusion"})
    T.append({"id":f"geo-n{level}-rl-tiles","type":"numeric","difficulty":"medium",
              "prompt":"Terrasse 6×4 m. Beregn m² inkl. 10% spild.",
              "answer":round(6*4*1.10,2),"format":"number","unit":"m^2","hint":"Areal×(1+spild%)",
              "feedback_key":"tile_waste_missing"})
    T.append({"id":f"geo-n{level}-rl-walk","type":"numeric","difficulty":"hard",
              "prompt":"Rund sti radius 100 m. 3 omgange med 1.5 m/s. Tid (s)?",
              "answer":round((2*math.pi*100*3)/1.5),"format":"number","unit":"s","hint":"Omkreds=2πr; tid=s/v",
              "feedback_key":"speed_time_distance"})
    return T

# ---- Brøker ----
def gen_broeker(level):
    r=rng(level,3); T=[]
    for _ in range(4):
        den=r.choice([4,6,8,10,12]); a=r.randint(1,den-1); b=r.randint(1,den-1); op=r.choice(['+','-'])
        if op=='-' and a<b: a,b=b,a
        ans=simplify(a+b if op=='+' else a-b, den)
        T.append({"id":f"brk-n{level}-eAdd{_+1}","type":"mcq","difficulty":"easy",
                  "prompt":f"Beregn: {a}/{den} {op} {b}/{den}",
                  "choices":[ans,simplify(a,den),simplify(b,den)],"answer":0,"hint":"fraction_same_den_rule"})
    for _ in range(3):
        den=r.choice([5,6,7,8]); a=r.randint(1,den-1); b=r.randint(1,den-1)
        correct=('>' if a>b else '<') if a!=b else '='
        T.append({"id":f"brk-n{level}-eCmp{_+1}","type":"mcq","difficulty":"easy",
                  "prompt":f"Hvad er korrekt: {a}/{den} __ {b}/{den}?","choices":['<','>','='],
                  "answer":['<','>','='].index(correct),"hint":"Sammenlign tællere ved samme nævner"})
    for _ in range(3):
        num=r.randint(1,9); den=r.randint(2,12); k=r.choice([2,3,4]); eq=simplify(num*k,den*k)
        T.append({"id":f"brk-n{level}-eEq{_+1}","type":"mcq","difficulty":"easy",
                  "prompt":f"Hvilken brøk er ækvivalent med {num}/{den}?","choices":[eq,simplify(num,den),f\"{num}/{den}\"],
                  "answer":0,"hint":"Gange både tæller og nævner"})
    for _ in range(4):
        d1,d2=r.choice([(3,4),(4,6),(5,10),(6,8),(8,12)]); a=r.randint(1,d1-1); b=r.randint(1,d2-1)
        lcm=d1*d2//math.gcd(d1,d2); ans=simplify(a*(lcm//d1)+b*(lcm//d2),lcm)
        T.append({"id":f"brk-n{level}-mAdd{_+1}","type":"mcq","difficulty":"medium",
                  "prompt":f"Beregn: {a}/{d1} + {b}/{d2}","choices":[ans,f\"{a+b}/{d1}\",f\"{a}/{d1}\"],"answer":0,"hint":"lcm_needed"})
    for _ in range(3):
        num=r.randint(2,18); den=r.randint(2,18); simp=simplify(num,den)
        T.append({"id":f"brk-n{level}-mSimp{_+1}","type":"mcq","difficulty":"medium",
                  "prompt":f"Forkort brøken {num}/{den}.","choices":[simp,f\"{num}/{den}\",simplify(num+1,den)],"answer":0,"hint":"Fælles faktor"})
    for _ in range(3):
        num=r.randint(1,9); den=r.choice([2,4,5,8,10,20,25]); proc=round(100*num/den,1)
        T.append({"id":f"brk-n{level}-mConv{_+1}","type":"mcq","difficulty":"medium",
                  "prompt":f"Hvad er {num}/{den} som procent?","choices":[f\"{proc}%\",f\"{round(proc+5,1)}%\",f\"{round(proc-5,1)}%\"],"answer":0,"hint":"decimal_percent_convert"})
    for _ in range(4):
        a=r.randint(1,4); b=r.randint(1,5); c=r.randint(1,5); den=r.choice([3,4,5,6,8])
        num=a*den+b+c; ans=simplify(num,den)
        T.append({"id":f"brk-n{level}-hMix{_+1}","type":"mcq","difficulty":"hard",
                  "prompt":f"Beregn: {a} {b}/{den} + {c}/{den}","choices":[ans,simplify(a*den+b,den),simplify(b+c,den)],
                  "answer":0,"hint":"mixed_to_improper"})
    for _ in range(4):
        den=r.choice([6,8,10,12]); a=r.randint(1,den-2); tgt=r.randint(a+1,den-1); x=tgt-a
        T.append({"id":f"brk-n{level}-hMiss{_+1}","type":"mcq","difficulty":"hard",
                  "prompt":f"Find x: x/{den} + {a}/{den} = {tgt}/{den}","choices":[str(x),str(a),str(tgt)],"answer":0,"hint":"Læg tællerne"})
    for _ in range(2):
        have_num=r.choice([1,2,3]); have=have_num/2; need=0.75; diff=round(need-have,2)
        T.append({"id":f"brk-n{level}-hCtx{_+1}","type":"short","difficulty":"hard",
                  "prompt":f"Opskrift kræver 3/4 L mælk. Du har {have_num}/2 L. Mangler du mælk, og hvor meget?",
                  "answer":"Nej, du mangler ikke." if diff<=0 else f\"Ja, {diff} liter.\", "hint":"Sammenlign decimaler"})
    # Enheder (masse/tid)
    for _ in range(2):
        g=r.choice([250,500,750,1200]); T.append({"id":f"brk-n{level}-g2kg{_+1}","type":"numeric","difficulty":"easy",
                                                  "prompt":f"Omregn {g} g til kg.","answer":round(g/1000,3),"format":"number","unit":"kg",
                                                  "hint":"1 kg=1000 g","feedback_key":"g_kg_confusion"})
    for _ in range(2):
        mins=r.choice([3,7,12]); T.append({"id":f"brk-n{level}-min2s{_+1}","type":"numeric","difficulty":"easy",
                                           "prompt":f"Omregn {mins} min til sekunder.","answer":mins*60,"format":"number","unit":"s",
                                           "hint":"1 min=60 s","feedback_key":"time_conversion_confusion"})
    return T

# Byg 30+ pr. niveau
for subj in meta.keys():
    index={"subject":subj,"levels":[]}
    for lvl in range(1,11):
        if subj=="procent": tasks=gen_procent(lvl)
        elif subj=="geometri": tasks=gen_geometri(lvl)
        else: tasks=gen_broeker(lvl)
        if len(tasks)<30:  # sikkerhedsnet
            tasks = tasks + [dict(tasks[i%len(tasks)], id=tasks[i%len(tasks)]['id']+f\"x{i}\") for i in range(30-len(tasks))]
        out={"subject":subj,"level":lvl,"tasks":tasks}
        (DATA/f\"{subj}-n{lvl}.json\").write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding=\"utf-8")
        index["levels"].append({"level":lvl,"file":f\"{subj}-n{lvl}.json\",\"count\":len(tasks)})
    (DATA/f\"{subj}-index.json\").write_text(json.dumps(index,ensure_ascii=False,indent=2),encoding=\"utf-8")
print(\"✔ 30+ tasks pr. niveau genereret.\")
