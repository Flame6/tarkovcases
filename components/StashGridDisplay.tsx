import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CASES, GRID_WIDTH } from '../constants';
import type { StashLayout, PlacedCase, CaseType, CaseCounts } from '../types';
import { AlertTriangleIcon, CheckCircleIcon, ChevronLeftIcon, TrashIcon, XIcon } from './Icons';

interface StashGridDisplayProps {
  layout: StashLayout;
  caseCounts: CaseCounts;
  onCasePlaced: (placedCase: PlacedCase) => void;
  onCaseRemoved: (caseId: string) => void;
  onCaseMoved: (caseId: string, newX: number, newY: number, newWidth?: number, newHeight?: number, newRotated?: boolean) => void;
  isLoading: boolean;
  onBack?: () => void;
}

export const StashGridDisplay: React.FC<StashGridDisplayProps> = ({
  layout,
  caseCounts,
  onCasePlaced,
  onCaseRemoved,
  onCaseMoved,
  isLoading,
  onBack,
}) => {
  const { placedCases, unplacedCases, stashHeight } = layout;
  const [dragOverPosition, setDragOverPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isDraggingOverTrash, setIsDraggingOverTrash] = useState(false);
  const [currentDragData, setCurrentDragData] = useState<{ width: number; height: number; caseId?: string } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const idCounterRef = useRef<number>(Date.now());
  const dragDataRef = useRef<{ width: number; height: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const calculateGridPosition = useCallback((e: React.DragEvent): { x: number; y: number } | null => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * GRID_WIDTH);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * stashHeight);
    if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < stashHeight) {
      return { x, y };
    }
    return null;
  }, [stashHeight]);

  const canPlaceCase = useCallback((_caseType: CaseType, x: number, y: number, width: number, height: number, excludeCaseId?: string): boolean => {
    // Check bounds
    if (x + width > GRID_WIDTH || y + height > stashHeight) return false;
    
    // Check collisions with existing cases (excluding the case being moved)
    for (const placed of placedCases) {
      if (excludeCaseId && placed.id === excludeCaseId) {
        continue; // Skip the case being moved
      }
      if (
        x < placed.x + placed.width &&
        x + width > placed.x &&
        y < placed.y + placed.height &&
        y + height > placed.y
      ) {
        return false;
      }
    }
    return true;
  }, [placedCases, stashHeight]);

  // Listen for drag start events from CaseCard to get drag data for preview
  useEffect(() => {
    const handleCaseDragStart = (e: Event) => {
      const customEvent = e as CustomEvent<{ width: number; height: number }>;
      if (customEvent.detail) {
        isDraggingRef.current = true;
        // Set both ref and state synchronously for immediate access
        dragDataRef.current = { 
          width: customEvent.detail.width, 
          height: customEvent.detail.height
        };
        setCurrentDragData({ 
          width: customEvent.detail.width, 
          height: customEvent.detail.height
        });
      }
    };
    
    const handleCaseDragEnd = () => {
      // Don't clear here - let handleDrop handle cleanup to prevent flicker
      // The drag might still be ongoing on the grid even if CaseCard drag ended
    };
    
    window.addEventListener('caseDragStart', handleCaseDragStart);
    window.addEventListener('caseDragEnd', handleCaseDragEnd);
    return () => {
      window.removeEventListener('caseDragStart', handleCaseDragStart);
      window.removeEventListener('caseDragEnd', handleCaseDragEnd);
    };
  }, []);


  const handleDragEnter = useCallback((e: React.DragEvent) => {
    // Set dragging state when entering grid
    isDraggingRef.current = true;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (trashRef.current && trashRef.current.contains(e.target as Node)) {
      setIsDraggingOverTrash(true);
      setDragOverPosition(null);
      return;
    }
    
    setIsDraggingOverTrash(false);
    const pos = calculateGridPosition(e);
    if (pos) {
      // Try to get drag data:
      // 1. From dragDataRef (set when dragging from input cards)
      // 2. From currentDragData (works for both input cards and placed cases)
      // 3. Default to 1x1 if we can't determine
      let dragData: { width: number; height: number } | null = null;
      
      if (dragDataRef.current) {
        // Prefer dragDataRef for input cards (it's set via custom event)
        dragData = {
          width: dragDataRef.current.width,
          height: dragDataRef.current.height
        };
      } else if (currentDragData) {
        // Use currentDragData for placed cases
        dragData = {
          width: currentDragData.width,
          height: currentDragData.height
        };
      }
      
      if (dragData) {
        setDragOverPosition({ 
          ...pos, 
          width: dragData.width, 
          height: dragData.height 
        });
      } else {
        // Default preview size - will be updated on drop
        setDragOverPosition({ ...pos, width: 1, height: 1 });
      }
    } else {
      setDragOverPosition(null);
    }
  }, [calculateGridPosition, currentDragData]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverTrash(false);
    setDragOverPosition(null);
    isDraggingRef.current = false;
    setCurrentDragData(null);
    dragDataRef.current = null;

    const dragData = e.dataTransfer.getData('application/json');
    if (!dragData) return;

    try {
      const parsed = JSON.parse(dragData);
      
      // Check if dropped on trash
      if (trashRef.current && trashRef.current.contains(e.target as Node)) {
        // If dragging a placed case from grid, remove it
        if (parsed.caseId) {
          onCaseRemoved(parsed.caseId);
        }
        // If dragging from input, just cancel (no action needed)
        return;
      }

      // Handle moving a placed case to a new position
      if (parsed.caseId) {
        const caseToMove = placedCases.find((c: PlacedCase) => c.id === parsed.caseId);
        if (!caseToMove) {
          return; // Case not found
        }

        const pos = calculateGridPosition(e);
        if (!pos) return;

        // Try to place at new position with current orientation (excluding the case being moved from collision check)
        if (canPlaceCase(caseToMove.type, pos.x, pos.y, parsed.width, parsed.height, parsed.caseId)) {
          onCaseMoved(parsed.caseId, pos.x, pos.y, parsed.width, parsed.height, parsed.rotated);
          return;
        }

        // Try rotated orientation if different dimensions
        if (parsed.width !== parsed.height && canPlaceCase(caseToMove.type, pos.x, pos.y, parsed.height, parsed.width, parsed.caseId)) {
          // Move and rotate
          onCaseMoved(parsed.caseId, pos.x, pos.y, parsed.height, parsed.width, !parsed.rotated);
          return;
        }

        // Invalid position, don't move
        return;
      }

      const { type, width, height } = parsed as { type: CaseType; width: number; height: number };
      
      // Store drag data for preview (only if not a placed case)
      if (!parsed.caseId) {
        setCurrentDragData({ width, height });
        dragDataRef.current = { width, height };
      }
      
      // Check if we have available count
      // caseCounts represents remaining, so total owned = caseCounts[type] + placedCount
      const placedCount = placedCases.filter((c: PlacedCase) => c.type === type).length;
      const remainingCount = caseCounts[type] || 0;
      if (remainingCount === 0) {
        return; // No more cases of this type available
      }

      const pos = calculateGridPosition(e);
      if (!pos) return;

      // Try normal orientation first
      if (canPlaceCase(type, pos.x, pos.y, width, height)) {
        const newCase: PlacedCase = {
          id: `${type}-${idCounterRef.current++}`,
          type,
          x: pos.x,
          y: pos.y,
          width,
          height,
          rotated: false,
        };
        onCasePlaced(newCase);
        return;
      }

      // Try rotated orientation if different dimensions
      if (width !== height && canPlaceCase(type, pos.x, pos.y, height, width)) {
        const newCase: PlacedCase = {
          id: `${type}-${idCounterRef.current++}`,
          type,
          x: pos.x,
          y: pos.y,
          width: height,
          height: width,
          rotated: true,
        };
        onCasePlaced(newCase);
        return;
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  }, [calculateGridPosition, canPlaceCase, caseCounts, placedCases, onCasePlaced]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're actually leaving the grid area (not just moving to a child)
    if (!gridRef.current?.contains(e.relatedTarget as Node)) {
      setDragOverPosition(null);
      setIsDraggingOverTrash(false);
    }
  }, []);

  const handleDeleteCase = useCallback((caseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onCaseRemoved(caseId);
  }, [onCaseRemoved]);

  const handleContextMenu = useCallback((caseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCaseRemoved(caseId);
  }, [onCaseRemoved]);


  const summaryMessage = unplacedCases.length === 0 
    ? {
        text: 'All items were placed successfully!',
        Icon: CheckCircleIcon,
        className: "bg-green-900/40 border-green-700/50 text-green-300"
      }
    : {
        text: `${unplacedCases.length} item(s) could not be placed in the stash.`,
        Icon: AlertTriangleIcon,
        className: "bg-yellow-900/40 border-yellow-700/50 text-yellow-300"
      };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-200 uppercase tracking-wide">Optimized Stash Layout</h2>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 font-semibold uppercase text-sm transition-colors border border-white/30 hover:border-white/50"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            Back to Inputs
          </button>
        )}
      </div>
      

      <div className={`flex items-center p-4 mb-6 border border-white/30 ${summaryMessage.className}`}>
        <summaryMessage.Icon className="w-6 h-6 mr-3 flex-shrink-0" />
        <p className="font-semibold">{summaryMessage.text}</p>
      </div>

      <div className="relative">
        {/* Trash zone */}
        <div
          ref={trashRef}
          className={`absolute top-2 right-2 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isDraggingOverTrash
              ? 'bg-red-600 scale-110 border-2 border-red-400'
              : 'bg-[#1a1a1a] border border-white/30 opacity-50 hover:opacity-100'
          }`}
          onDragOver={(e: React.DragEvent) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setIsDraggingOverTrash(true);
          }}
          onDrop={(e: React.DragEvent) => {
            e.preventDefault();
            setIsDraggingOverTrash(false);
            const dragData = e.dataTransfer.getData('application/json');
            if (dragData) {
              try {
                const parsed = JSON.parse(dragData);
                if (parsed.caseId) {
                  const caseToRemove = placedCases.find((c: PlacedCase) => c.id === parsed.caseId);
                  if (caseToRemove && !caseToRemove.isLocked) {
                    onCaseRemoved(parsed.caseId);
                  }
                }
              } catch (error) {
                console.error('Error handling trash drop:', error);
              }
            }
          }}
          onDragLeave={() => setIsDraggingOverTrash(false)}
          title="Drag here to discard"
        >
          <TrashIcon className="w-6 h-6 text-white" />
        </div>

        <div className="bg-[#0a0a0a] p-2 border border-white/30 w-full" style={{ minHeight: '400px' }}>
          <div
            ref={gridRef}
            className="relative grid w-full"
            style={{
              gridTemplateColumns: `repeat(${GRID_WIDTH}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${stashHeight}, minmax(0, 1fr))`,
              gap: '1px',
              aspectRatio: `${GRID_WIDTH} / ${stashHeight}`,
              backgroundImage: `linear-gradient(rgba(0, 255, 0, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.08) 1px, transparent 1px)`,
              backgroundSize: `calc(100% / ${GRID_WIDTH}) calc(100% / ${stashHeight})`,
              backgroundColor: '#0a0a0a',
            }}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
          >
            {/* Drop preview */}
            {dragOverPosition && dragOverPosition.width && dragOverPosition.height && (
              <div
                className="absolute border-2 border-dashed border-green-400 bg-green-400/20 pointer-events-none z-10"
                style={{
                  left: `calc(${(dragOverPosition.x / GRID_WIDTH) * 100}% + 2px)`,
                  top: `calc(${(dragOverPosition.y / stashHeight) * 100}% + 2px)`,
                  width: `calc(${(dragOverPosition.width / GRID_WIDTH) * 100}% - 4px)`,
                  height: `calc(${(dragOverPosition.height / stashHeight) * 100}% - 4px)`,
                }}
              />
            )}

            {placedCases.map((item: PlacedCase) => (
              <div
                key={item.id}
                className="relative border border-white/40 overflow-hidden transition-colors group hover:border-white/60"
                style={{
                  gridColumnStart: item.x + 1,
                  gridColumnEnd: item.x + item.width + 1,
                  gridRowStart: item.y + 1,
                  gridRowEnd: item.y + item.height + 1,
                }}
                title={`${CASES[item.type].name} (${item.width}x${item.height}) - Right-click to remove`}
                draggable={true}
                onDragStart={(e: React.DragEvent) => {
                  e.dataTransfer.setData('application/json', JSON.stringify({
                    caseId: item.id,
                    type: item.type,
                    width: item.width,
                    height: item.height,
                    rotated: item.rotated,
                  }));
                  e.dataTransfer.effectAllowed = 'move';
                  // Set dragging state
                  isDraggingRef.current = true;
                  // Clear dragDataRef (from input cards) and store in ref for immediate access
                  dragDataRef.current = null;
                  // Store drag data in ref for immediate access during dragOver (React state is async)
                  dragDataRef.current = { 
                    width: item.width, 
                    height: item.height
                  };
                  // Also store in state for consistency
                  setCurrentDragData({ width: item.width, height: item.height, caseId: item.id });
                  // Add visual feedback
                  const target = e.currentTarget as HTMLElement;
                  target.style.opacity = '0.5';
                }}
                onDragEnd={(e: React.DragEvent) => {
                  isDraggingRef.current = false;
                  const target = e.currentTarget as HTMLElement;
                  target.style.opacity = '1';
                  // Clear drag data immediately when drag ends
                  setCurrentDragData(null);
                  dragDataRef.current = null;
                }}
                onContextMenu={(e: React.MouseEvent) => handleContextMenu(item.id, e)}
              >
                <img
                  src={item.rotated ? CASES[item.type].rotatedImage : CASES[item.type].image}
                  alt={CASES[item.type].name}
                  className="w-full h-full object-cover"
                />
                
                {/* Delete button */}
                <button
                  onClick={(e) => handleDeleteCase(item.id, e)}
                  className="absolute top-1 left-1 p-1 rounded bg-red-600/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  title="Remove case"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {unplacedCases.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold text-gray-300 mb-3 uppercase">Unplaced Items</h3>
          <div className="flex flex-wrap gap-3">
            {unplacedCases.map((item: { type: CaseType }, index: number) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-[#1a1a1a] border border-white/30">
                <img src={CASES[item.type].image} alt={CASES[item.type].name} className="w-8 h-8 object-contain bg-black/40" />
                <span className="text-sm text-gray-300 font-medium">{CASES[item.type].name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};