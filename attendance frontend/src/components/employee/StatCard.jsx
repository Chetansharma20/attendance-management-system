import React from 'react';

export default function StatCard({ icon: Icon, label, value, subValue, color }) {
  const colorMap = {
    violet: 'text-violet-650 dark:text-violet-400 border-violet-500/20',
    emerald: 'text-emerald-650 dark:text-emerald-400 border-emerald-500/20',
    sky: 'text-sky-650 dark:text-sky-400 border-sky-500/20',
    amber: 'text-amber-650 dark:text-amber-400 border-amber-500/20',
  };
  const iconColorMap = {
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    emerald: 'bg-emerald-500/10 text-emerald-650 dark:text-emerald-400',
    sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  };

  return (
    <div className={`flex items-center gap-4 bg-theme-card border border-theme-border rounded-2xl p-5 shadow-lg transition-colors duration-200 ${colorMap[color] || ''}`}>
      <div className={`p-3 rounded-xl shrink-0 ${iconColorMap[color] || ''}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-theme-muted font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-theme-bright mt-0.5">{value}</p>
        {subValue && <p className="text-xs text-theme-muted mt-0.5">{subValue}</p>}
      </div>
    </div>
  );
}
