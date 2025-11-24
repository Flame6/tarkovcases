import React, { useState } from 'react';
import { CASES, CLICK_ANIMATION_DURATION } from '../constants';
import type { CaseType } from '../types';
import { PlusIcon, XIcon } from './Icons';

interface CaseCardProps {
  caseType: CaseType;
  count: number;
  onIncrement: () => void;
  onReset: () => void;
  onDecrement?: () => void;
  onRemovePlacedCase?: () => void;
  placedCount?: number;
}

export const CaseCard: React.FC<CaseCardProps> = ({ 
  caseType, 
  count, 
  onIncrement, 
  onReset,
  onDecrement,
  onRemovePlacedCase,
  placedCount = 0
}) => {
  const [isClicked, setIsClicked] = useState(false);
  // count represents remaining (after decrements), so owned = count + placedCount
  const owned = count + placedCount;
  const isActive = owned > 0;
  const caseData = CASES[caseType];
  const remaining = count;

  const handleClick = (e: React.MouseEvent) => {
    // Prevent increment if clicking the reset button
    if ((e.target as HTMLElement).closest('.reset-button')) {
      return;
    }



    setIsClicked(true);
    setTimeout(() => setIsClicked(false), CLICK_ANIMATION_DURATION);
    onIncrement();
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReset();
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (remaining <= 0) {
      e.preventDefault();
      return;
    }
    // Set drag data with case information
    const dragData = {
      type: caseType,
      width: caseData.width,
      height: caseData.height,
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
    // Dispatch custom event with drag data for preview
    window.dispatchEvent(new CustomEvent('caseDragStart', { 
      detail: { 
        width: caseData.width, 
        height: caseData.height
      } 
    }));
    // Add visual feedback
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Dispatch event to notify drag end
    window.dispatchEvent(new CustomEvent('caseDragEnd'));
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // If there are placed cases, remove the lower/right most one
    if (onRemovePlacedCase && placedCount > 0) {
      onRemovePlacedCase();
    } 
    // Otherwise, if there are remaining cases, decrement the count
    else if (onDecrement && count > 0) {
      onDecrement();
    }
  };

  return (
    <div
      className={`case-card relative p-3 border flex flex-col transition-all duration-300 h-[180px] ${
        isActive
          ? 'bg-[#1a1a1a] border-white/20 cursor-grab active:cursor-grabbing case-card-active'
          : 'bg-[#0f0f0f] border-white/15 cursor-pointer case-card-inactive'
      } ${isClicked ? 'scale-95' : ''}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      draggable={remaining > 0}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Plus icon overlay - only shows on hover for inactive cards */}
      {!isActive && (
        <div className="plus-overlay absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 pointer-events-none z-10">
          <PlusIcon className="w-8 h-8 text-white" />
        </div>
      )}

      {/* Case title at top */}
      <div className="text-center mb-2">
        <div className="font-medium text-gray-200 text-xs leading-tight line-clamp-2">
          {caseData.name}
        </div>
      </div>

      {/* Case image or placeholder - main focus, fills most of card */}
      <div className="flex-1 flex items-center justify-center mb-2 min-h-0">
        {caseData.image ? (
          <img 
            src={caseData.image} 
            alt={caseData.name}
            loading="lazy"
            decoding="async"
            fetchpriority={isActive && owned <= 3 ? "high" : "auto"}
            className="max-w-full max-h-full object-contain bg-black/30 p-2 border border-gray-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black/30 border border-gray-700 p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400 mb-1">
                {caseData.width}×{caseData.height}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                Custom Box
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Count and info at bottom */}
      <div className="mt-auto">
        {isActive ? (
          <>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Owned:</span>
                <span className="text-sm font-bold text-white">{owned}</span>
              </div>
              <button
                className="reset-button flex items-center justify-center w-6 h-6 rounded bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300 hover:text-white transition-colors border border-white/20 hover:border-white/40"
                onClick={handleReset}
                title="Reset count"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-gray-400 space-y-0.5">
              <div>Placed: <span className="text-gray-300 font-medium">{placedCount}</span></div>
              <div>Remaining: <span className="text-gray-300 font-medium">{remaining}</span></div>
            </div>
          </>
        ) : (
          <div className="text-xs text-gray-500 text-center case-card-hint">
            Click to add | Right-click to remove
          </div>
        )}
        {isActive && placedCount > 0 && (
          <div className="text-xs text-gray-500 text-center mt-1">
            Right-click to remove placed case
          </div>
        )}
      </div>
    </div>
  );
};
