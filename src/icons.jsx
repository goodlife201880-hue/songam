import React from 'react';
function icon(paths) {
  return function Icon({size = 20, ...props}) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>{paths.map((d, i) => <path key={i} d={d}/>)}</svg>; };
}
export const Users = icon(['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0', 'M20 21v-2a4 4 0 0 0-3-3.9', 'M17 3.1a4 4 0 0 1 0 7.8']);
export const Package = icon(['M3 7l9-5 9 5v10l-9 5-9-5Z', 'M3 7l9 5 9-5M12 12v10M7.5 4.5l9 5']);
export const UtensilsCrossed = icon(['M4 3v5c0 3 6 3 6 0V3M7 3v18', 'M20 3c-5 1-5 10 0 10V3v18']);
export const ArrowDownToLine = icon(['M12 3v12M7 10l5 5 5-5M4 17v4h16v-4']);
export const ArrowUpFromLine = icon(['M12 15V3M7 8l5-5 5 5M4 17v4h16v-4']);
export const ClipboardList = icon(['M9 4H5v18h14V4h-4M9 2h6v5H9ZM8 12h8M8 17h8']);
