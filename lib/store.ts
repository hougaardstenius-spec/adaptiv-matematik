
import type { Progress } from './adaptive';
let memory=new Map<string,Progress>();
export async function getProgress(id:string){
  try{ if(process.env.KV_URL){ const { kv } = await import('@vercel/kv'); return await kv.get<Progress>(`progress:${id}`); } }
  catch{} return memory.get(id)||null;
}
export async function setProgress(p:Progress){
  try{ if(process.env.KV_URL){ const { kv } = await import('@vercel/kv'); await kv.set(`progress:${p.studentId}`, p); return; } }
  catch{} memory.set(p.studentId, p);
}
