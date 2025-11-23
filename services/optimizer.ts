import { CASES, GRID_WIDTH } from '../constants';
import type { CaseCounts, CaseInstance, PlacedCase, StashLayout, StashGrid } from '../types';

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
    const count = caseCounts[caseType as keyof CaseCounts];
    if (count > 0) {
      caseTypeCounts.set(caseType, count);
      const caseDef = CASES[caseType as keyof CaseCounts];
      for (let i = 0; i < count; i++) {
        allCases.push({
          id: `${caseType}-${idCounter++}`,
          type: caseType as keyof CaseCounts,
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
  
  // 3. Iterate through the stash grid from top-to-bottom, left-to-right.
  for (let y = 0; y < stashHeight; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      // 4. If the current cell is already occupied, skip it.
      if (grid[y][x] !== null) {
        continue;
      }

      // 5. Find the FIRST case in our sorted list that can fit in this empty spot.
      let placedSomething = false;
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
            // Check if the case fits within the grid boundaries.
            if (x + orient.width <= GRID_WIDTH && y + orient.height <= stashHeight) {
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
                    // This is the first valid placement we've found. Place it immediately.
                    const placedItem: PlacedCase = {
                        id: caseToTry.id,
                        type: caseToTry.type,
                        x, y,
                        width: orient.width,
                        height: orient.height,
                        rotated: orient.rotated
                    };
                    placedCases.push(placedItem);

                    // Mark the grid cells as occupied.
                    for (let y_fill = y; y_fill < y + orient.height; y_fill++) {
                        for (let x_fill = x; x_fill < x + orient.width; x_fill++) {
                            grid[y_fill][x_fill] = caseToTry.id;
                        }
                    }

                    // Remove the placed case from the available pool.
                    remainingCases.splice(i, 1);
                    
                    placedSomething = true;
                    break; // Exit the orientation loop.
                }
            }
        }
        
        if (placedSomething) {
            break; // Exit the case-finding loop and move to the next grid cell.
        }
      }
    }
  }

  return { grid, placedCases, unplacedCases: remainingCases, stashHeight };
}