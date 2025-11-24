import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { InputForm } from './components/InputForm';
import { StashGridDisplay } from './components/StashGridDisplay';
import { Header } from './components/Header';
import { ActionButtons } from './components/ActionButtons';
import { Instructions } from './components/Instructions';
import { WelcomeModal } from './components/WelcomeModal';
import { StashInstructions } from './components/StashInstructions';
import { TarkovExclamationIcon } from './components/Icons';
import { optimizeStashLayout } from './services/optimizer';
import { incrementUsageCount, getUsageCount } from './services/usageCounter';
import type { CaseCounts, StashLayout, StashEdition, PlacedCase, CaseType } from './types';
import { STASH_DIMENSIONS, GRID_WIDTH, OPTIMIZATION_DELAY, SCROLL_DELAY, DEFAULT_STASH_EDITION, CASE_TYPES } from './constants';

const App: React.FC = () => {
  const [caseCounts, setCaseCounts] = useState<CaseCounts>(() => {
    // Initialize with all case types set to 0
    const initialCounts = Object.fromEntries(
      CASE_TYPES.map(type => [type, 0])
    ) as CaseCounts;
    
    // Load from InputForm's storage if available
    try {
      const stored = localStorage.getItem('tarkovStashOptimizerFormData');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.caseCounts) {
          // Merge saved counts with initial counts to ensure all types exist
          return { ...initialCounts, ...data.caseCounts };
        }
      }
    } catch (error) {
      console.error('Could not load case counts', error);
    }
    return initialCounts;
  });
  const [manuallyPlacedCases, setManuallyPlacedCases] = useState<PlacedCase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const stashHeight = STASH_DIMENSIONS[DEFAULT_STASH_EDITION].height;
  const stashLayoutRef = useRef<HTMLDivElement>(null);
  const caseCountsRef = useRef<CaseCounts>(caseCounts);
  
  // Keep ref in sync with state
  useEffect(() => {
    caseCountsRef.current = caseCounts;
  }, [caseCounts]);

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
    // newCaseCounts is total owned (remaining + placed) from the form
    setTimeout(() => {
      // Use functional state update to get latest manuallyPlacedCases
      setManuallyPlacedCases((currentManuallyPlaced) => {
        const height = STASH_DIMENSIONS[edition].height;
        // Calculate remaining counts: newCaseCounts (total owned) - manually placed cases
        const remainingCounts: CaseCounts = { ...newCaseCounts };
        currentManuallyPlaced.forEach((placed: PlacedCase) => {
          const type = placed.type as keyof CaseCounts;
          remainingCounts[type] = Math.max(0, (remainingCounts[type] || 0) - 1);
        });
        // Separate locked (manually placed) from unlocked (auto-placed) cases
        const lockedCases = currentManuallyPlaced.filter(c => c.isLocked);
        
        // Pass only locked cases as constraints (auto-placed cases will be re-optimized)
        const layout = optimizeStashLayout(remainingCounts, height, lockedCases);
        
        // Filter out locked cases from optimizer output (they're already locked)
        const lockedIds = new Set(lockedCases.map((c: PlacedCase) => c.id));
        const autoFilledCases = layout.placedCases.filter((c: PlacedCase) => !lockedIds.has(c.id));
        
        // Merge locked (manual) cases with auto-filled cases
        const allPlaced = [...lockedCases, ...autoFilledCases];
        
        // Update caseCounts to reflect remaining (unplaced) cases
        // finalRemaining = newCaseCounts (total owned) - all placed
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
        }, SCROLL_DELAY);
        
        return allPlaced;
      });
    }, 500);
  }, []);

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
      }, SCROLL_DELAY);
    }, OPTIMIZATION_DELAY);
  }, []);

  const handleCasePlaced = useCallback((placedCase: PlacedCase) => {
    // Mark manually placed cases as locked
    const lockedCase: PlacedCase = { ...placedCase, isLocked: true };
    
    setManuallyPlacedCases((currentPlaced) => {
      // Add the new manually placed (locked) case
      const updatedPlaced = [...currentPlaced, lockedCase];
      
      // Separate locked (manually placed) from unlocked (auto-placed)
      const lockedCases = updatedPlaced.filter(c => c.isLocked);
      
      // Calculate total owned counts: current remaining + all placed cases
      const totalOwned: CaseCounts = {} as CaseCounts;
      
      // Start with current caseCounts (remaining) - use ref to get latest value
      const currentCounts = caseCountsRef.current;
      Object.keys(currentCounts).forEach((type) => {
        const key = type as keyof CaseCounts;
        totalOwned[key] = currentCounts[key] || 0;
      });
      
      // Add all placed cases to total owned
      updatedPlaced.forEach((placed: PlacedCase) => {
        const type = placed.type as keyof CaseCounts;
        totalOwned[type] = (totalOwned[type] || 0) + 1;
      });
      
      // Calculate remaining counts: total owned - all placed
      const remainingCounts: CaseCounts = { ...totalOwned };
      updatedPlaced.forEach((placed: PlacedCase) => {
        const type = placed.type as keyof CaseCounts;
        remainingCounts[type] = Math.max(0, (remainingCounts[type] || 0) - 1);
      });
      
      // Re-optimize with locked cases as constraints
      const height = STASH_DIMENSIONS[DEFAULT_STASH_EDITION].height;
      const layout = optimizeStashLayout(remainingCounts, height, lockedCases);
      
      // Filter out locked cases from optimizer output (they're already locked)
      const lockedIds = new Set(lockedCases.map((c: PlacedCase) => c.id));
      const autoFilledCases = layout.placedCases.filter((c: PlacedCase) => !lockedIds.has(c.id));
      
      // Merge locked (manual) cases with auto-filled cases
      const allPlaced = [...lockedCases, ...autoFilledCases];
      
      // Update caseCounts to reflect remaining (unplaced) cases
      const finalRemaining: CaseCounts = { ...totalOwned };
      allPlaced.forEach((placed: PlacedCase) => {
        const type = placed.type as keyof CaseCounts;
        finalRemaining[type] = Math.max(0, (finalRemaining[type] || 0) - 1);
      });
      
      // Update counts
      setCaseCounts(finalRemaining);
      
      return allPlaced;
    });
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

  const handleRemovePlacedCase = useCallback((caseType: CaseType) => {
    // Find all cases of this type
    const casesOfType = manuallyPlacedCases.filter(c => c.type === caseType);
    
    if (casesOfType.length === 0) {
      return; // No cases of this type to remove
    }
    
    // Find the lower/right most case
    // Sort by y position descending (lower first), then x position descending (right first)
    const sortedCases = [...casesOfType].sort((a, b) => {
      // First compare by bottom edge (y + height) - lower is better
      const aBottom = a.y + a.height;
      const bBottom = b.y + b.height;
      if (aBottom !== bBottom) {
        return bBottom - aBottom; // Descending: lower first
      }
      // If same row, compare by right edge (x + width) - right is better
      const aRight = a.x + a.width;
      const bRight = b.x + b.width;
      return bRight - aRight; // Descending: right first
    });
    
    // Remove the first one (lowest/rightmost)
    const caseToRemove = sortedCases[0];
    handleCaseRemoved(caseToRemove.id);
  }, [manuallyPlacedCases, handleCaseRemoved]);

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
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-black focus:rounded focus:font-bold">
        Skip to main content
      </a>
      
      <div className="container mx-auto px-4 py-8">
        <Header />
        
        {/* Instructions Section */}
        <Instructions defaultExpanded={false} />
        
        {/* Welcome Modal - handles its own visibility */}
        <WelcomeModal onDismiss={() => {}} />
        
        {/* Tarkov-Style Beta Warning Banner */}
        <div className="flex justify-center mt-6 mb-6">
          <aside 
            role="alert" 
            aria-live="polite" 
            className="inline-flex items-center" 
            style={{ 
              backgroundColor: '#c67826',
              padding: '14px 22px',
              gap: '16px',
              boxShadow: '0 0 0 2px #111',
              fontFamily: "'Rajdhani', system-ui, sans-serif"
            }}
          >
            <div 
              className="flex items-center justify-center flex-shrink-0"
              style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                background: '#000' 
              }}
            >
              <span style={{ color: '#f6d98b', fontSize: '28px', marginTop: '-2px', fontWeight: 600 }}>!</span>
            </div>
            <div className="flex flex-col" style={{ gap: '2px' }}>
              <p 
                className="uppercase"
                style={{ 
                  fontSize: '24px', 
                  fontWeight: 700, 
                  letterSpacing: '0.02em', 
                  lineHeight: 1.05,
                  color: '#000000'
                }}
              >
                Attention! This is a Beta version of the Tarkov Stash Optimizer for testing purposes.
              </p>
              <p 
                style={{ 
                  fontSize: '15px', 
                  fontWeight: 400, 
                  letterSpacing: '0.01em', 
                  color: '#1a1a1a',
                  marginTop: '2px'
                }}
              >
                It doesn't represent the final quality of the tool. Thank you for your understanding and support. Good luck!
              </p>
              <p 
                className="italic"
                style={{ 
                  fontSize: '13px', 
                  color: '#1a1a1a',
                  marginTop: '4px'
                }}
              >
                Note: Manual case placement is still under development and may not function as intended.
              </p>
            </div>
          </aside>
        </div>
        
        {/* Action Buttons - Prominently displayed below warning */}
        <section id="optimization-actions" aria-label="Optimization actions" className="sticky top-0 z-50 -mx-4 px-4">
          <ActionButtons
            onOptimize={handleOptimize}
            onOptimizeAll={handleOptimizeAll}
            isLoading={isLoading}
            caseCounts={totalOwnedCaseCounts}
            totalCases={totalCases}
          />
        </section>

        <main id="main-content" className="mt-8 flex flex-wrap -mx-4" role="main">
          <section id="case-input-form" className="w-full lg:w-1/2 px-4 mb-8 lg:mb-0" aria-label="Case input form">
            <h2 className="sr-only">Case Input Form</h2>
            <div className="bg-[#2D2D2D]/80 backdrop-blur-sm p-6 sm:p-8 shadow-2xl border border-white/20 h-full">
              <InputForm 
                onOptimize={handleOptimize}
                onOptimizeAll={handleOptimizeAll}
                isLoading={isLoading}
                caseCounts={totalOwnedCaseCounts}
                onCaseCountsChange={(newTotalOwned) => {
                  // When user changes counts in form, update remaining counts
                  // newTotalOwned = remaining + placed, so remaining = newTotalOwned - placed
                  const newRemaining: CaseCounts = {} as CaseCounts;
                  Object.keys(newTotalOwned).forEach((type) => {
                    const key = type as keyof CaseCounts;
                    const total = newTotalOwned[key] || 0;
                    const placed = placedCounts[key] || 0;
                    newRemaining[key] = Math.max(0, total - placed);
                  });
                  setCaseCounts(newRemaining);
                }}
                onDecrement={handleCaseDecrement}
                onRemovePlacedCase={handleRemovePlacedCase}
                onClearAll={() => {
                  // Clear all placed cases and reset counts
                  setManuallyPlacedCases([]);
                  const initialCounts = Object.fromEntries(
                    CASE_TYPES.map(type => [type, 0])
                  ) as CaseCounts;
                  setCaseCounts(initialCounts);
                }}
                placedCounts={placedCounts}
              />
            </div>
          </section>
          <section id="stash-layout" className="w-full lg:w-1/2 px-4" aria-label="Stash layout preview">
            <h2 className="sr-only">Stash Layout Preview</h2>
            <div ref={stashLayoutRef} className="bg-[#2D2D2D]/80 backdrop-blur-sm p-6 sm:p-8 shadow-2xl border border-white/20 h-full">
              {manuallyPlacedCases.length > 0 ? (
                <StashGridDisplay
                  layout={currentLayout!}
                  caseCounts={caseCounts}
                  onCasePlaced={handleCasePlaced}
                  onCaseRemoved={handleCaseRemoved}
                  onCaseMoved={handleCaseMoved}
                  isLoading={isLoading}
                />
              ) : (
                <StashInstructions totalCases={totalCases} />
              )}
            </div>
          </section>
        </main>
        <footer className="text-center mt-8 text-gray-500 text-sm" role="contentinfo">
          <p className="mb-4">This is a fan-made tool and is not affiliated with Battlestate Games.</p>
          <div className="max-w-4xl mx-auto px-4">
            <p className="text-gray-400 text-sm leading-relaxed">
              Use Tarkov Stash Optimizer to calculate optimal case layouts for Escape from Tarkov. This free web tool helps you maximize your stash space efficiency by automatically arranging cases for the best fit. Whether you're organizing Item Cases, Weapon Cases, THICC Cases, or any other storage container, our optimizer supports all stash editions including Standard, Left Behind, Prepare for Escape, and Edge of Darkness. Simply enter your case counts and let the algorithm find the optimal layout, or manually drag and drop cases to customize your arrangement.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;