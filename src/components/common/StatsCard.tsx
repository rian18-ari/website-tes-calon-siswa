import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description: string;
  accentColor?: 'gold' | 'blue' | 'emerald' | 'amber' | 'slate';
  badgeText?: string;
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  accentColor = 'blue',
  badgeText,
  onClick,
}) => {
  const colorMap = {
    gold: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-300/60',
      text: 'text-amber-800',
      iconBg: 'bg-gradient-to-br from-amber-400 to-amber-600 text-white',
      badge: 'bg-amber-100 text-amber-800',
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-300/60',
      text: 'text-blue-900',
      iconBg: 'bg-gradient-to-br from-[#0f2b5c] to-[#1e4277] text-white',
      badge: 'bg-blue-100 text-blue-800',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-300/60',
      text: 'text-emerald-900',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white',
      badge: 'bg-emerald-100 text-emerald-800',
    },
    amber: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-300/60',
      text: 'text-orange-900',
      iconBg: 'bg-gradient-to-br from-orange-400 to-amber-600 text-white',
      badge: 'bg-orange-100 text-orange-800',
    },
    slate: {
      bg: 'bg-slate-500/10',
      border: 'border-slate-300/60',
      text: 'text-slate-900',
      iconBg: 'bg-gradient-to-br from-slate-600 to-slate-800 text-white',
      badge: 'bg-slate-100 text-slate-800',
    },
  };

  const scheme = colorMap[accentColor];

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-white border ${scheme.border} p-5 shadow-sm transition-all duration-200 hover:shadow-md ${
        onClick ? 'cursor-pointer hover:border-amber-400' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
              {value}
            </span>
            {badgeText && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${scheme.badge}`}>
                {badgeText}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-600">
            {description}
          </p>
        </div>
        <div className={`p-3 rounded-xl shadow-md ${scheme.iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-slate-100/50 pointer-events-none -z-0" />
    </div>
  );
};
