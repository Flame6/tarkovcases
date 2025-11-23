import React from 'react';
import { TrendingUpIcon } from './Icons';

interface UsageCounterProps {
  count: number;
}

export const UsageCounter: React.FC<UsageCounterProps> = ({ count }) => {
  return (
    <div className="mt-4 sm:mt-0 flex items-center gap-3 bg-black/20 border border-gray-600/50 px-4 py-2">
        <TrendingUpIcon className="w-5 h-5 text-amber-500" />
        <div>
            <span className="text-xs text-gray-400 uppercase">Optimizations Ran</span>
            <p className="font-bold text-lg text-white">{count.toLocaleString()}</p>
        </div>
    </div>
  );
};