
export const EPS=1e-9;
export const nearlyEqual=(a:number,b:number,eps=EPS)=>Math.abs(a-b)<=eps;
export const normalizeNumberInput=(s:string)=>s.trim().replace(/\s+/g,'').replace(',', '.');
export const parseNumberSafe=(s:string)=>{const n=Number(normalizeNumberInput(s));return Number.isFinite(n)?n:null};
export const gcd=(a:number,b:number):number=>b?gcd(b,a%b):Math.abs(a);
export const normalizeFraction=(s:string)=>{const m=s.trim().replace(/\s+/g,'').match(/^(-?\d+)\/(\d+)$/);if(!m)return null;let num=parseInt(m[1],10),den=parseInt(m[2],10);if(den===0)return null;const g=gcd(num,den);num/=g;den/=g;if(den<0){den=-den;num=-num}return `${num}/${den}`};
export const fractionEquals=(a:string,b:string)=>{const na=normalizeFraction(a);const nb=normalizeFraction(b);return na!==null&&nb!==null&&na===nb};
export const normalizeString=(s:string)=>s.normalize('NFKC').replace(/ /g,' ').trim();
export const parsePercent=(s:string)=>{const m=s.trim().replace(/\s+/g,'').replace(',', '.').match(/^(-?\d+(?:\.\d+)?)%?$/);if(!m)return null;const v=Number(m[1]);return Number.isFinite(v)?v/100:null};
