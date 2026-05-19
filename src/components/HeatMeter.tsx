import React from 'react';

export const HeatMeter = ({ value }: { value: number }) => {
  const color = value < 40 ? 'text-risk-safe' : value < 75 ? 'text-risk-med' : 'text-risk-high';
  const borderColor = value < 40 ? 'rgb(16, 185, 129)' : value < 75 ? 'rgb(245, 158, 11)' : 'rgb(239, 68, 96)';

  return (
    <div className="relative w-64 h-64 mx-auto">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          cx="50" cy="50" r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-white/5"
        />
        <circle
          cx="50" cy="50" r="45"
          fill="none"
          stroke={borderColor}
          strokeWidth="8"
          strokeDasharray="283"
          strokeDashoffset={283 - (283 * (value / 100))}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`text-5xl font-extrabold ${color}`}>{value}%</span>
        <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1 font-bold">Fraud Risk</span>
      </div>
    </div>
  );
};
