import { CASES, GRID_WIDTH, CASE_TYPES } from '../constants';
import type { CaseCounts, CaseInstance, PlacedCase, StashLayout, StashGrid, CaseType } from '../types';

// Runtime validation helper to ensure caseType is valid
function isValidCaseType(caseType: string): caseType is CaseType {
  return CASE_TYPES.includes(caseType as CaseType);
}

export function optimizeStashLayout(
  caseCounts: CaseCounts, 
  stashHeight: number, 
  lockedPositions: PlacedCase[] = []
): StashLayout {
  // 1. Create a flat list of all case instances from user counts.
  let allCases: CaseInstance[] = [];
  let idCounter = 0;
  const caseTypeCounts: Map<string, number> = new Map();
  
  for (const caseType in caseCounts) {
    // Runtime validation: skip invalid case types
    if (!isValidCaseType(caseType)) {
      console.warn(`Invalid case type encountered: ${caseType}`);
      continue;
    }
    
    const count = caseCounts[caseType];
    if (count > 0) {
      caseTypeCounts.set(caseType, count);
      const caseDef = CASES[caseType];
      for (let i = 0; i < count; i++) {
        allCases.push({
          id: `${caseType}-${idCounter++}`,
          type: caseType,
          width: caseDef.width,
          height: caseDef.height,
        });
      }
    }
  }

  // 2. Sort cases to prioritize row-filling efficiency and grouping:
  // - Group same-type cases together (by sorting by type first when counts are equal)
  // - Prioritize wider cases to fill rows efficiently
  // - For same width, prefer taller cases
  allCases.sort((a, b) => {
    const aCount = caseTypeCounts.get(a.type) || 0;
    const bCount = caseTypeCounts.get(b.type) || 0;
    
    // If one type has multiple instances and the other doesn't, prioritize the one with multiples
    // This helps group same-type cases together
    if (aCount > 1 && bCount === 1) return -1;
    if (aCount === 1 && bCount > 1) return 1;
    
    // Sort by width first (wider cases fill rows better)
    if (a.width !== b.width) {
      return b.width - a.width;
    }
    
    // Then by height (taller cases create solid baseline)
    if (a.height !== b.height) {
      return b.height - a.height;
    }
    
    // Finally, group same types together
    return a.type.localeCompare(b.type);
  });

  const grid: StashGrid = Array.from({ length: stashHeight }, () => Array(GRID_WIDTH).fill(null));
  const placedCases: PlacedCase[] = [];
  
  // 3. First, place all locked cases at their fixed positions
  for (const lockedCase of lockedPositions) {
    placedCases.push({ ...lockedCase, isLocked: true });
    // Mark grid cells as occupied
    for (let y = lockedCase.y; y < lockedCase.y + lockedCase.height; y++) {
      for (let x = lockedCase.x; x < lockedCase.x + lockedCase.width; x++) {
        if (y >= 0 && y < stashHeight && x >= 0 && x < GRID_WIDTH) {
          grid[y][x] = lockedCase.id;
        }
      }
    }
  }
  
  const remainingCases = [...allCases];
  
  // Helper function to calculate how much contiguous space is available from a position
  function getAvailableSpace(x: number, y: number): { width: number; height: number } {
    let maxWidth = 0;
    let maxHeight = 0;
    
    // Find max width (contiguous empty cells to the right)
    for (let x_check = x; x_check < GRID_WIDTH; x_check++) {
      if (grid[y][x_check] !== null) break;
      maxWidth++;
    }
    
    // Find max height (contiguous empty rows below)
    for (let y_check = y; y_check < stashHeight; y_check++) {
      if (grid[y_check][x] !== null) break;
      maxHeight++;
    }
    
    // Find actual rectangular area available
    let actualWidth = maxWidth;
    let actualHeight = maxHeight;
    
    for (let y_check = y; y_check < y + maxHeight && y_check < stashHeight; y_check++) {
      let rowWidth = 0;
      for (let x_check = x; x_check < x + maxWidth && x_check < GRID_WIDTH; x_check++) {
        if (grid[y_check][x_check] !== null) break;
        rowWidth++;
      }
      actualWidth = Math.min(actualWidth, rowWidth);
    }
    
    return { width: actualWidth, height: actualHeight };
  }
  
  // Helper function to score a placement based on efficiency
  function scorePlacement(
    caseWidth: number, 
    caseHeight: number, 
    availableWidth: number, 
    availableHeight: number
  ): number {
    const caseArea = caseWidth * caseHeight;
    const availableArea = availableWidth * availableHeight;
    const waste = availableArea - caseArea;
    
    // Prefer placements that:
    // 1. Fill rows completely (width matches available width) - high bonus
    // 2. Use more space (larger cases) - medium bonus
    // 3. Minimize waste - low penalty
    
    let score = caseArea * 1000; // Base score: prefer larger cases
    
    // Bonus for filling width completely
    if (caseWidth === availableWidth) {
      score += 5000;
    }
    
    // Bonus for filling height completely
    if (caseHeight === availableHeight) {
      score += 3000;
    }
    
    // Penalty for waste (but not too harsh - we want to place things)
    score -= waste * 10;
    
    // Prefer cases that are closer to filling the available space
    const widthFit = caseWidth / availableWidth;
    const heightFit = caseHeight / availableHeight;
    score += (widthFit + heightFit) * 1000;
    
    return score;
  }
  
  // 3. Iterate through the stash grid from top-to-bottom, left-to-right.
  for (let y = 0; y < stashHeight; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      // 4. If the current cell is already occupied, skip it.
      if (grid[y][x] !== null) {
        continue;
      }

      // 5. Find the BEST case that can fit in this empty spot.
      // Evaluate all possible placements and choose the one with the best score.
      const availableSpace = getAvailableSpace(x, y);
      let bestPlacement: {
        caseIndex: number;
        orientation: { width: number; height: number; rotated: boolean };
        score: number;
      } | null = null;

      for (let i = 0; i < remainingCases.length; i++) {
        const caseToTry = remainingCases[i];
        
        // Check both normal and rotated orientations.
        const orientations = [{
            width: caseToTry.width,
            height: caseToTry.height,
            rotated: false
        }];
        if (caseToTry.width !== caseToTry.height) {
            orientations.push({
                width: caseToTry.height,
                height: caseToTry.width,
                rotated: true
            });
        }

        for (const orient of orientations) {
            // Check if the case fits within the grid boundaries and available space.
            if (orient.width <= availableSpace.width && 
                orient.height <= availableSpace.height &&
                x + orient.width <= GRID_WIDTH && 
                y + orient.height <= stashHeight) {
                // Check for collisions with already placed items.
                let hasCollision = false;
                for (let y_check = y; y_check < y + orient.height; y_check++) {
                    for (let x_check = x; x_check < x + orient.width; x_check++) {
                        if (grid[y_check][x_check] !== null) {
                            hasCollision = true;
                            break;
                        }
                    }
                    if (hasCollision) break;
                }

                if (!hasCollision) {
                    // Score this placement
                    const score = scorePlacement(
                        orient.width, 
                        orient.height, 
                        availableSpace.width, 
                        availableSpace.height
                    );
                    
                    // Keep track of the best placement so far
                    if (!bestPlacement || score > bestPlacement.score) {
                        bestPlacement = {
                            caseIndex: i,
                            orientation: orient,
                            score: score
                        };
                    }
                }
            }
        }
      }
      
      // If we found a valid placement, place it
      if (bestPlacement) {
        const caseToPlace = remainingCases[bestPlacement.caseIndex];
        const orient = bestPlacement.orientation;
        
        const placedItem: PlacedCase = {
            id: caseToPlace.id,
            type: caseToPlace.type,
            x, y,
            width: orient.width,
            height: orient.height,
            rotated: orient.rotated
        };
        placedCases.push(placedItem);

        // Mark the grid cells as occupied.
        for (let y_fill = y; y_fill < y + orient.height; y_fill++) {
            for (let x_fill = x; x_fill < x + orient.width; x_fill++) {
                grid[y_fill][x_fill] = caseToPlace.id;
            }
        }

        // Remove the placed case from the available pool.
        remainingCases.splice(bestPlacement.caseIndex, 1);
      }
    }
  }

  return { grid, placedCases, unplacedCases: remainingCases, stashHeight };
}