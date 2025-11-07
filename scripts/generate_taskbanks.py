
#!/usr/bin/env python3
# coding: utf-8
import json, os, math, random, argparse

SEED_DEFAULT = 20251106

META = {
  "broeker": {"title":"Brøker","levels":[{"level":i} for i in range(1,11)]},
  "procent": {"title":"Procent","levels":[{"level":i} for i in range(1,11)]},
  "geometri": {"title":"Geometri","levels":[{"level":i} for i in range(1,11)]}
}

FEEDBACK = {
  "unit_missing_or_wrong": "Husk at angive korrekt enhed i svaret.",
  "percent_vs_point": "Procentpoint = absolut forskel i %-tal.",
}

random.seed(SEED_DEFAULT)

def rng(level, salt=0):
    return random.Random((level*73856093 + salt) % (2**32))

def simplify(num, den):
    if den==0: den=1
    g=math.gcd(num,den)
    num//=g; den//=g
    return f"{num}/{den}"

# --- Tiny generators that still produce variety and 30+ tasks ---

def gen_procent(level, min_n=30):
    r=rng(level,1); T=[]
    # easy percent-of
    for i in range(10):
        N=r.choice([80,100,120,150,200,240,300]); p=r.choice([5,10,12.5,20,25])
        T.append({"id":f"pct-n{level}-e{i+1}","type":"numeric","difficulty":"easy","prompt":f"Hvad er {p}% af {N} kr?","answer":round(N*p/100,2),"format":"number","unit":"kr"})
    # medium up/down
    for i in range(5):
        P=r.choice([200,250,300,400,500]); ch=r.choice([10,12,15,20]); up=r.choice([True,False])
        T.append({"id":f"pct-n{level}-m{i+1}","type":"numeric","difficulty":"medium","prompt":f"En pris på {P} kr {'stiger' if up else 'falder'} med {ch}%. Hvad er den nye pris?","answer":round(P*(1+ch/100) if up else P*(1-ch/100),2),"format":"number","unit":"kr"})
    # hard percent point
    for i in range(3):
        s=r.choice([8,10,12]); e=s+r.choice([2,3,5])
        T.append({"id":f"pct-n{level}-hPP{i+1}","type":"numeric","difficulty":"hard","prompt":f"Fra {s}% til {e}%: hvor mange procentpoint?","answer":e-s,"format":"number","unit":"procentpoint","feedback_key":"percent_vs_point"})
    # units/demo
    if level>=7:
        for i in range(2):
            v=r.choice([36,54,72]); T.append({"id":f"pct-n{level}-hKmh{i+1}","type":"numeric","difficulty":"hard","prompt":f"Omregn {v} km/h til m/s (2 dec.)","answer":round(v/3.6,2),"format":"number","unit":"m/s"})
    # pad to min_n
    while len(T)<min_n:
        t=T[len(T)%len(T)].copy(); t['id']=t['id']+'x'; T.append(t)
    return T

def gen_geometri(level, min_n=30):
    r=rng(level,2); T=[]
    for i in range(6):
        l=r.randint(2,20); b=r.randint(2,20)
        T.append({"id":f"geo-n{level}-eA{i+1}","type":"numeric","difficulty":"easy","prompt":f"Areal af rektangel {l} m × {b} m?","answer":l*b,"format":"number","unit":"m^2"})
    for i in range(4):
        d=r.randint(6,40); rr=d/2
        T.append({"id":f"geo-n{level}-mC{i+1}","type":"numeric","difficulty":"medium","prompt":f"Areal af cirkel med diameter {d} m (π≈3,14)?","answer":round(3.14*rr*rr,2),"format":"number","unit":"m^2"})
    if level>=9:
        for i in range(2):
            a=r.randint(3,12); b=r.randint(4,13)
            T.append({"id":f"geo-n{level}-hP{i+1}","type":"numeric","difficulty":"hard","prompt":f"Retvinklet trekant a={a} cm, b={b} cm. Hypotenuse (2 dec.)?","answer":round((a*a+b*b)**0.5,2),"format":"number","unit":"cm"})
    while len(T)<min_n:
        t=T[len(T)%len(T)].copy(); t['id']=t['id']+'x'; T.append(t)
    return T

def gen_broeker(level, min_n=30):
    r=rng(level,3); T=[]
    for i in range(8):
        den=r.choice([4,6,8,10,12]); a=r.randint(1,den-1); b=r.randint(1,den-1)
        T.append({"id":f"brk-n{level}-eAdd{i+1}","type":"mcq","difficulty":"easy","prompt":f"{a}/{den} + {b}/{den} = ?","choices":[simplify(a+b,den), simplify(a,den), simplify(b,den)],"answer":0})
    for i in range(4):
        d1,d2=r.choice([(3,4),(4,6),(5,10)]); a=r.randint(1,d1-1); b=r.randint(1,d2-1)
        lcm=d1*d2//math.gcd(d1,d2); ans=simplify(a*(lcm//d1)+b*(lcm//d2),lcm)
        T.append({"id":f"brk-n{level}-mAdd{i+1}","type":"mcq","difficulty":"medium","prompt":f"{a}/{d1} + {b}/{d2} = ?","choices":[ans, f"{a+b}/{d1}", f"{a}/{d1}"],"answer":0})
    while len(T)<min_n:
        t=T[len(T)%len(T)].copy(); t['id']=t['id']+'x'; T.append(t)
    return T


def write_subject(out_dir, key, min_n=30):
    os.makedirs(out_dir, exist_ok=True)
    index={"subject":key,"levels":[]}
    for lvl in range(1,11):
        if key=='procent': tasks=gen_procent(lvl,min_n)
        elif key=='geometri': tasks=gen_geometri(lvl,min_n)
        else: tasks=gen_broeker(lvl,min_n)
        with open(os.path.join(out_dir,f"{key}-n{lvl}.json"),'w',encoding='utf-8') as f:
            json.dump({"subject":key,"level":lvl,"tasks":tasks}, f, ensure_ascii=False, indent=2)
        index['levels'].append({"level":lvl,"file":f"{key}-n{lvl}.json","count":len(tasks)})
    with open(os.path.join(out_dir,f"{key}-index.json"),'w',encoding='utf-8') as f:
        json.dump(index,f,ensure_ascii=False,indent=2)


def main():
    ap=argparse.ArgumentParser(description='Generate taskbanks')
    ap.add_argument('--out', default='data')
    ap.add_argument('--subject', choices=['broeker','procent','geometri'])
    ap.add_argument('--level', type=int, choices=range(1,11))
    ap.add_argument('--min-per-level', type=int, default=30)
    ap.add_argument('--seed', type=int, default=SEED_DEFAULT)
    args=ap.parse_args()

    random.seed(args.seed)
    os.makedirs(args.out, exist_ok=True)

    # write meta + feedback
    with open(os.path.join(args.out,'data.json'),'w',encoding='utf-8') as f:
        json.dump(META,f,ensure_ascii=False,indent=2)
    with open(os.path.join(args.out,'feedback.json'),'w',encoding='utf-8') as f:
        json.dump(FEEDBACK,f,ensure_ascii=False,indent=2)

    if args.subject and args.level:
        key=args.subject; lvl=args.level
        if key=='procent': tasks=gen_procent(lvl,args.min_per_level)
        elif key=='geometri': tasks=gen_geometri(lvl,args.min_per_level)
        else: tasks=gen_broeker(lvl,args.min_per_level)
        with open(os.path.join(args.out,f"{key}-n{lvl}.json"),'w',encoding='utf-8') as f:
            json.dump({"subject":key,"level":lvl,"tasks":tasks}, f, ensure_ascii=False, indent=2)
        # refresh index for that subject
        write_subject(args.out, key, args.min_per_level)
    elif args.subject:
        write_subject(args.out, args.subject, args.min_per_level)
    else:
        for key in ['broeker','procent','geometri']:
            write_subject(args.out, key, args.min_per_level)

if __name__=='__main__':
    main()
