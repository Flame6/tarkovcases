import React from 'react';
import { CrosshairIcon } from './Icons';

export const Header: React.FC = () => {
  return (
    <header className="text-center mb-4 pb-6 border-b-2 border-amber-500/50">
      <div className="flex items-center justify-center gap-4">
        <CrosshairIcon className="w-12 h-12 text-amber-500" />
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-200 tracking-wider uppercase">
          Tarkov Stash Optimizer
        </h1>
      </div>
      <p className="mt-4 text-lg text-gray-400">
        Arrange your cases for maximum space efficiency. Enter your counts below and hit Optimize.
      </p>
    </header>
  );
};