import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { InputForm } from './components/InputForm';
import { StashGridDisplay } from './components/StashGridDisplay';
import { Header } from './components/Header';
import { ActionButtons } from './components/ActionButtons';
import { AlertTriangleIcon } from './components/Icons';
import { optimizeStashLayout } from './services/optimizer';
import { incrementUsageCount, getUsageCount } from './services/usageCounter';
import type { CaseCounts, StashLayout, StashEdition, PlacedCase, CaseType } from './types';
import { STASH_DIMENSIONS, GRID_WIDTH } from './constants';

const DEFAULT_STASH_EDITION: StashEdition = 'Edge of Darkness';

const App: React.FC = () => {
  const [caseCounts, setCaseCounts] = useState<CaseCounts>(() => {
    // Load from InputForm's storage if available
    try {
      const stored = localStorage.getItem('tarkovStashOptimizerFormData');
      if (stored) {
        const data = JSON.parse(stored);
        return data.caseCounts || {};
      }
    } catch (error) {
      console.error('Could not load case counts', error);
    }
    return {} as CaseCounts;
  });
  const [manuallyPlacedCases, setManuallyPlacedCases] = useState<PlacedCase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const stashHeight = STASH_DIMENSIONS[DEFAULT_STASH_EDITION].height;
  const stashLayoutRef = useRef<HTMLDivElement>(null);

  // Calculate placed counts for display - recalculate when manuallyPlacedCases changes
  const placedCounts: CaseCounts = useMemo(() => {
    const counts: CaseCounts = {} as CaseCounts;
    manuallyPlacedCases.forEach((placed: PlacedCase) => {
      const type = placed.type as keyof CaseCounts;
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [manuallyPlacedCases]);

  const handleOptimize = useCallback(async (newCaseCounts: CaseCounts, edition: StashEdition) => {
    setIsLoading(true);
    await incrementUsageCount();
    await getUsageCount(true); // Refresh counter
    setCaseCounts(newCaseCounts);
    setTimeout(() => {
      const height = STASH_DIMENSIONS[edition].height;
      // Calculate remaining counts: newCaseCounts - manually placed cases
      const remainingCounts: CaseCounts = { ...newCaseCounts };
      manuallyPlacedCases.forEach((placed: PlacedCase) => {
        const type = placed.type as keyof CaseCounts;
        remainingCounts[type] = Math.max(0, (remainingCounts[type] || 0) - 1);
      });
      // Pass all manually placed cases as "locked" constraints
      const layout = optimizeStashLayout(remainingCounts, height, manuallyPlacedCases);
      // Filter out manually placed cases from optimizer output (they're already in manuallyPlacedCases)
      const manualIds = new Set(manuallyPlacedCases.map((c: PlacedCase) => c.id));
      const autoFilledCases = layout.placedCases.filter((c: PlacedCase) => !manualIds.has(c.id));
      // Merge manually placed cases with auto-filled cases
      const allPlaced = [...manuallyPlacedCases, ...autoFilledCases];
      setManuallyPlacedCases(allPlaced);
      // Update caseCounts to reflect remaining (unplaced) cases
      const finalRemaining: CaseCounts = { ...newCaseCounts };
      allPlaced.forEach((placed: PlacedCase) => {
        const type = placed.type as keyof CaseCounts;
        finalRemaining[type] = Math.max(0, (finalRemaining[type] || 0) - 1);
      });
      setCaseCounts(finalRemaining);
      setIsLoading(false);
      // Scroll to stash layout section
      setTimeout(() => {
        stashLayoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }, 500);
  }, [manuallyPlacedCases]);

  const handleOptimizeAll = useCallback(async (newCaseCounts: CaseCounts, edition: StashEdition) => {
    setIsLoading(true);
    await incrementUsageCount();
    await getUsageCount(true); // Refresh counter
    setCaseCounts(newCaseCounts);
    // Clear all manually placed cases (soft reset)
    setManuallyPlacedCases([]);
    setTimeout(() => {
      const height = STASH_DIMENSIONS[edition].height;
      // Optimize everything from scratch with no locked positions
      const layout = optimizeStashLayout(newCaseCounts, height, []);
      setManuallyPlacedCases(layout.placedCases);
      // All cases are placed, so remaining is empty
      setCaseCounts({} as CaseCounts);
      setIsLoading(false);
      // Scroll to stash layout section
      setTimeout(() => {
        stashLayoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }, 500);
  }, []);

  const handleCasePlaced = useCallback((placedCase: PlacedCase) => {
    setManuallyPlacedCases(prev => [...prev, placedCase]);
    // Decrement count
    setCaseCounts(prev => ({
      ...prev,
      [placedCase.type]: Math.max(0, (prev[placedCase.type] || 0) - 1),
    }));
  }, []);

  const handleCaseRemoved = useCallback((caseId: string) => {
    const caseToRemove = manuallyPlacedCases.find(c => c.id === caseId);
    if (caseToRemove) {
      setManuallyPlacedCases(prev => prev.filter(c => c.id !== caseId));
      // Increment count back
      setCaseCounts(prev => ({
        ...prev,
        [caseToRemove.type]: (prev[caseToRemove.type] || 0) + 1,
      }));
    }
  }, [manuallyPlacedCases]);

  const handleCaseMoved = useCallback((caseId: string, newX: number, newY: number, newWidth?: number, newHeight?: number, newRotated?: boolean) => {
    setManuallyPlacedCases(prev => prev.map(c => 
      c.id === caseId ? { 
        ...c, 
        x: newX, 
        y: newY,
        ...(newWidth !== undefined && { width: newWidth }),
        ...(newHeight !== undefined && { height: newHeight }),
        ...(newRotated !== undefined && { rotated: newRotated }),
      } : c
    ));
  }, []);

  const handleCaseDecrement = useCallback((caseType: CaseType) => {
    setCaseCounts(prev => ({
      ...prev,
      [caseType]: Math.max(0, (prev[caseType] || 0) - 1),
    }));
  }, []);

  // Calculate total owned cases (remaining + placed) for action buttons
  const totalOwnedCases = useMemo(() => {
    const remaining = Object.values(caseCounts).reduce((sum: number, count: number) => sum + count, 0);
    const placed = Object.values(placedCounts).reduce((sum: number, count: number) => sum + count, 0);
    return remaining + placed;
  }, [caseCounts, placedCounts]);

  // Calculate total cases for action buttons (same as totalOwnedCases for now)
  const totalCases = totalOwnedCases;
  
  // Calculate total owned case counts (remaining + placed) for optimization
  const totalOwnedCaseCounts = useMemo(() => {
    const total: CaseCounts = { ...caseCounts };
    Object.keys(placedCounts).forEach((type) => {
      const key = type as keyof CaseCounts;
      total[key] = (total[key] || 0) + (placedCounts[key] || 0);
    });
    return total;
  }, [caseCounts, placedCounts]);

  // Create a layout object for display
  const currentLayout: StashLayout | null = manuallyPlacedCases.length > 0
    ? {
        grid: Array.from({ length: stashHeight }, () => Array(GRID_WIDTH).fill(null)),
        placedCases: manuallyPlacedCases,
        unplacedCases: [],
        stashHeight,
      }
    : (Object.values(caseCounts).some(count => count > 0) 
        ? {
            grid: Array.from({ length: stashHeight }, () => Array(GRID_WIDTH).fill(null)),
            placedCases: [],
            unplacedCases: [],
            stashHeight,
          }
        : null);

  return (
    <div className="bg-transparent text-gray-300 min-h-screen font-['Chakra_Petch']">
      <div className="container mx-auto px-4 py-8">
        <Header />
        
        {/* Development Warning Banner */}
        <div className="mt-6 mb-6 p-4 bg-yellow-900/40 border border-yellow-700/50 text-yellow-300 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangleIcon className="w-6 h-6 flex-shrink-0" />
            <p className="font-semibold">
              ⚠️ Manual case placement is still in development. Some features may not work as expected.
            </p>
          </div>
        </div>
        
        {/* Action Buttons - Prominently displayed below warning */}
        <ActionButtons
          onOptimize={handleOptimize}
          onOptimizeAll={handleOptimizeAll}
          isLoading={isLoading}
          caseCounts={totalOwnedCaseCounts}
          totalCases={totalCases}
        />

        <main className="mt-8 flex flex-wrap -mx-4">
          <div className="w-full lg:w-1/2 px-4 mb-8 lg:mb-0">
            <div className="bg-[#2D2D2D]/80 backdrop-blur-sm p-6 sm:p-8 shadow-2xl border border-white/20 h-full">
              <InputForm 
                onOptimize={handleOptimize}
                onOptimizeAll={handleOptimizeAll}
                isLoading={isLoading}
                caseCounts={caseCounts}
                onCaseCountsChange={setCaseCounts}
                onDecrement={handleCaseDecrement}
                placedCounts={placedCounts}
              />
            </div>
          </div>
          <div className="w-full lg:w-1/2 px-4">
            <div ref={stashLayoutRef} className="bg-[#2D2D2D]/80 backdrop-blur-sm p-6 sm:p-8 shadow-2xl border border-white/20 h-full">
              {currentLayout ? (
                <StashGridDisplay
                  layout={currentLayout}
                  caseCounts={caseCounts}
                  onCasePlaced={handleCasePlaced}
                  onCaseRemoved={handleCaseRemoved}
                  onCaseMoved={handleCaseMoved}
                  isLoading={isLoading}
                />
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <p>Drag cases from the left to place them in your stash, or submit your case counts to auto-optimize.</p>
                </div>
              )}
            </div>
          </div>
        </main>
        <footer className="text-center mt-8 text-gray-500 text-sm">
          <p>This is a fan-made tool and is not affiliated with Battlestate Games.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;