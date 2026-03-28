import React from 'react';

interface StorageBarProps {
  usedBytes: number;
  limitBytes: number;
  isPremium: boolean;
}

export const StorageBar: React.FC<StorageBarProps> = ({ usedBytes, limitBytes, isPremium }) => {
  const usedMB = usedBytes / 1024 / 1024;
  const percentage = Math.min(100, (usedBytes / limitBytes) * 100);

  const limitLabel = isPremium ? '5GB' : '50MB';

  const barColor =
    percentage >= 90
      ? 'bg-red-400'
      : percentage >= 70
      ? 'bg-amber-400'
      : 'bg-rose-400';

  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>Storage used</span>
        <span>
          {usedMB.toFixed(1)}MB / {limitLabel}
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5">
        <div
          className={`${barColor} h-1.5 rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};