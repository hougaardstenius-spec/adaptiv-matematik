
import React from 'react';
export type Variant = 'primary'|'secondary'|'outline'|'ghost'|'success';
export function Button({variant='primary', className, children, ...props}:{variant?:Variant}&React.ButtonHTMLAttributes<HTMLButtonElement>){
  return <button className={[`btn btn--${variant}`, className].filter(Boolean).join(' ')} {...props}>{children}</button>;
}
