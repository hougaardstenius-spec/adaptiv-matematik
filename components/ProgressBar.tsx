
import React from 'react';
export function ProgressBar({value}:{value:number}){
  const v=Math.max(0,Math.min(100,value));
  return <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v}><span style={{width:`${v}%`}}/></div>;
}
