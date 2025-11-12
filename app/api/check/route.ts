
import { NextRequest, NextResponse } from 'next/server';
import { nearlyEqual, fractionEquals, parseNumberSafe, parsePercent, normalizeString } from '@/lib/validation';
export const runtime='nodejs';
export async function POST(req:NextRequest){
  const { userAnswer, expected, expectedType } = await req.json();
  let ok=false;
  if(expectedType==='fraction') ok=fractionEquals(String(userAnswer), String(expected));
  else if(expectedType==='percent'){ const u=parsePercent(String(userAnswer)); const e=parsePercent(String(expected)); ok=u!==null&&e!==null&&nearlyEqual(u,e); }
  else if(expectedType==='number'){ const u=parseNumberSafe(String(userAnswer)); const e=parseNumberSafe(String(expected)); ok=u!==null&&e!==null&&nearlyEqual(u,e); }
  else ok = normalizeString(String(userAnswer))===normalizeString(String(expected));
  return NextResponse.json({ correct: ok });
}
