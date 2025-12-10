import { CASES, GRID_WIDTH, CASE_TYPES } from '../constants';
import type { CaseCounts, CaseInstance, PlacedCase, StashLayout, StashGrid, CaseType, OptimizationMethod } from '../types';

// Runtime validation helper to ensure caseType is valid
function isValidCaseType(caseType: string): caseType is CaseType {
  return CASE_TYPES.includes(caseType as CaseType);
}

// Greedy optimization algorithm
function greedyOptimization(
  allCases: CaseInstance[],
  stashHeight: number,
  lockedPositions: PlacedCase[] = []
): StashLayout {
  const grid: StashGrid = Array.from({ length: stashHeight }, () => Array(GRID_WIDTH).fill(null));
  const placedCases: PlacedCase[] = [];
  
  // First, place all locked cases at their fixed positions
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
  
  // Iterate through the stash grid from top-to-bottom, left-to-right.
  for (let y = 0; y < stashHeight; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      // If the current cell is already occupied, skip it.
      if (grid[y][x] !== null) {
        continue;
      }

      // Find the BEST case that can fit in this empty spot.
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

// Best-Fit optimization algorithm
function bestFitOptimization(
  allCases: CaseInstance[],
  stashHeight: number,
  lockedPositions: PlacedCase[] = []
): StashLayout {
  const grid: StashGrid = Array.from({ length: stashHeight }, () => Array(GRID_WIDTH).fill(null));
  const placedCases: PlacedCase[] = [];
  
  // First, place all locked cases at their fixed positions
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
  
  // Helper function to check if a case fits at a specific position
  function canPlaceCase(
    caseToPlace: CaseInstance,
    x: number,
    y: number,
    width: number,
    height: number
  ): boolean {
    // Check if the case fits within the grid boundaries
    if (x + width > GRID_WIDTH || y + height > stashHeight) {
      return false;
    }
    
    // Check for collisions with already placed items
    for (let y_check = y; y_check < y + height; y_check++) {
      for (let x_check = x; x_check < x + width; x_check++) {
        if (grid[y_check][x_check] !== null) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  // Helper function to place a case at a specific position
  function placeCase(
    caseToPlace: CaseInstance,
    x: number,
    y: number,
    width: number,
    height: number,
    rotated: boolean
  ): void {
    const placedItem: PlacedCase = {
      id: caseToPlace.id,
      type: caseToPlace.type,
      x, y,
      width,
      height,
      rotated
    };
    placedCases.push(placedItem);

    // Mark the grid cells as occupied
    for (let y_fill = y; y_fill < y + height; y_fill++) {
      for (let x_fill = x; x_fill < x + width; x_fill++) {
        grid[y_fill][x_fill] = caseToPlace.id;
      }
    }
  }
  
  // Helper function to calculate the waste area for a placement
  function calculateWaste(
    x: number,
    y: number,
    width: number,
    height: number
  ): number {
    // Find the bounding box of empty space around the placement
    let maxX = x + width;
    let maxY = y + height;
    
    // Expand to the right until hitting a boundary or occupied cell
    for (let x_check = maxX; x_check < GRID_WIDTH; x_check++) {
      let canExpand = true;
      for (let y_check = y; y_check < maxY; y_check++) {
        if (grid[y_check][x_check] !== null) {
          canExpand = false;
          break;
        }
      }
      if (!canExpand) break;
      maxX++;
    }
    
    // Expand downward until hitting a boundary or occupied cell
    for (let y_check = maxY; y_check < stashHeight; y_check++) {
      let canExpand = true;
      for (let x_check = x; x_check < maxX; x_check++) {
        if (grid[y_check][x_check] !== null) {
          canExpand = false;
          break;
        }
      }
      if (!canExpand) break;
      maxY++;
    }
    
    // Calculate the total area of the bounding box
    const boundingBoxArea = (maxX - x) * (maxY - y);
    const caseArea = width * height;
    
    // Return the waste area
    return boundingBoxArea - caseArea;
  }
  
  // For each case in sorted order, find the best position (but respect order)
  // Try positions top-to-bottom, left-to-right to maintain grouping
  for (const caseToPlace of remainingCases) {
    let bestPlacement: {
      x: number;
      y: number;
      width: number;
      height: number;
      rotated: boolean;
      waste: number;
    } | null = null;
    
    // Check both normal and rotated orientations
    const orientations = [{
      width: caseToPlace.width,
      height: caseToPlace.height,
      rotated: false
    }];
    
    if (caseToPlace.width !== caseToPlace.height) {
      orientations.push({
        width: caseToPlace.height,
        height: caseToPlace.width,
        rotated: true
      });
    }
    
    // Try positions in order (top-to-bottom, left-to-right) to maintain grouping
    // Accept the first position that fits well (waste < threshold) or the best overall
    const WASTE_THRESHOLD = 10; // Accept positions with waste less than this
    
    for (const orient of orientations) {
      for (let y = 0; y < stashHeight; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
          // Check if the case fits at this position
          if (canPlaceCase(caseToPlace, x, y, orient.width, orient.height)) {
            // Calculate the waste for this placement
            const waste = calculateWaste(x, y, orient.width, orient.height);
            
            // If we find a good enough position early, use it to maintain order
            if (!bestPlacement || waste < bestPlacement.waste) {
              bestPlacement = {
                x,
                y,
                width: orient.width,
                height: orient.height,
                rotated: orient.rotated,
                waste
              };
              
              // If waste is below threshold, use this position immediately
              if (waste <= WASTE_THRESHOLD) {
                break;
              }
            }
          }
        }
        if (bestPlacement && bestPlacement.waste <= WASTE_THRESHOLD) break;
      }
      if (bestPlacement && bestPlacement.waste <= WASTE_THRESHOLD) break;
    }
    
    // Place the case at the best position found
    if (bestPlacement) {
      placeCase(
        caseToPlace,
        bestPlacement.x,
        bestPlacement.y,
        bestPlacement.width,
        bestPlacement.height,
        bestPlacement.rotated
      );
      
      // Remove the placed case from the remaining cases
      const index = remainingCases.indexOf(caseToPlace);
      if (index !== -1) {
        remainingCases.splice(index, 1);
      }
    }
  }

  return { grid, placedCases, unplacedCases: remainingCases, stashHeight };
}

// First-Fit optimization algorithm
function firstFitOptimization(
  allCases: CaseInstance[],
  stashHeight: number,
  lockedPositions: PlacedCase[] = []
): StashLayout {
  const grid: StashGrid = Array.from({ length: stashHeight }, () => Array(GRID_WIDTH).fill(null));
  const placedCases: PlacedCase[] = [];
  
  // First, place all locked cases at their fixed positions
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
  
  // Helper function to check if a case fits at a specific position
  function canPlaceCase(
    caseToPlace: CaseInstance,
    x: number,
    y: number,
    width: number,
    height: number
  ): boolean {
    // Check if the case fits within the grid boundaries
    if (x + width > GRID_WIDTH || y + height > stashHeight) {
      return false;
    }
    
    // Check for collisions with already placed items
    for (let y_check = y; y_check < y + height; y_check++) {
      for (let x_check = x; x_check < x + width; x_check++) {
        if (grid[y_check][x_check] !== null) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  // Helper function to place a case at a specific position
  function placeCase(
    caseToPlace: CaseInstance,
    x: number,
    y: number,
    width: number,
    height: number,
    rotated: boolean
  ): void {
    const placedItem: PlacedCase = {
      id: caseToPlace.id,
      type: caseToPlace.type,
      x, y,
      width,
      height,
      rotated
    };
    placedCases.push(placedItem);

    // Mark the grid cells as occupied
    for (let y_fill = y; y_fill < y + height; y_fill++) {
      for (let x_fill = x; x_fill < x + width; x_fill++) {
        grid[y_fill][x_fill] = caseToPlace.id;
      }
    }
  }
  
  // For each case, find the first position where it fits
  // Use a copy of the array to avoid modification issues during iteration
  const casesToProcess = [...remainingCases];
  const placedCaseIds = new Set<string>();
  
  for (const caseToPlace of casesToProcess) {
    // Skip if already placed
    if (placedCaseIds.has(caseToPlace.id)) continue;
    
    let placed = false;
    
    // Check both normal and rotated orientations
    const orientations = [{
      width: caseToPlace.width,
      height: caseToPlace.height,
      rotated: false
    }];
    
    if (caseToPlace.width !== caseToPlace.height) {
      orientations.push({
        width: caseToPlace.height,
        height: caseToPlace.width,
        rotated: true
      });
    }
    
    // Try every possible position in the grid, but stop at the first one that fits
    for (const orient of orientations) {
      if (placed) break;
      
      for (let y = 0; y < stashHeight; y++) {
        if (placed) break;
        
        for (let x = 0; x < GRID_WIDTH; x++) {
          // Check if the case fits at this position
          if (canPlaceCase(caseToPlace, x, y, orient.width, orient.height)) {
            // Place the case at this position
            placeCase(
              caseToPlace,
              x,
              y,
              orient.width,
              orient.height,
              orient.rotated
            );
            
            placedCaseIds.add(caseToPlace.id);
            placed = true;
            break;
          }
        }
      }
    }
  }
  
  // Calculate unplaced cases based on what wasn't placed
  const unplacedCases = remainingCases.filter(c => !placedCaseIds.has(c.id));

  return { grid, placedCases, unplacedCases, stashHeight };
}

// Genetic Algorithm optimization
function geneticOptimization(
  allCases: CaseInstance[],
  stashHeight: number,
  lockedPositions: PlacedCase[] = []
): StashLayout {
  // Genetic algorithm parameters
  const POPULATION_SIZE = 50;
  const GENERATIONS = 100;
  const MUTATION_RATE = 0.1;
  const ELITISM_RATE = 0.2; // Percentage of elite individuals to carry over to next generation
  
  // Helper function to create a random individual (solution)
  function createIndividual(): PlacedCase[] {
    // Start with a copy of the locked cases
    const individual: PlacedCase[] = lockedPositions.map(pos => ({ ...pos, isLocked: true }));
    
    // Create a grid to track occupied cells
    const grid: StashGrid = Array.from({ length: stashHeight }, () => Array(GRID_WIDTH).fill(null));
    
    // Mark locked positions as occupied
    for (const lockedCase of lockedPositions) {
      for (let y = lockedCase.y; y < lockedCase.y + lockedCase.height; y++) {
        for (let x = lockedCase.x; x < lockedCase.x + lockedCase.width; x++) {
          if (y >= 0 && y < stashHeight && x >= 0 && x < GRID_WIDTH) {
            grid[y][x] = lockedCase.id;
          }
        }
      }
    }
    
    // Use sorted cases to maintain grouping (don't shuffle)
    // This respects the sorting rules: grouping same types, prioritizing wider cases
    const casesToPlace = [...allCases];
    
    // Try to place each case in order (maintains grouping)
    for (const caseToPlace of casesToPlace) {
      let placed = false;
      
      // Check both normal and rotated orientations
      const orientations = [{
        width: caseToPlace.width,
        height: caseToPlace.height,
        rotated: false
      }];
      
      if (caseToPlace.width !== caseToPlace.height) {
        orientations.push({
          width: caseToPlace.height,
          height: caseToPlace.width,
          rotated: true
        });
      }
      
      // Try random positions until we find one that fits
      const maxAttempts = 100;
      for (let attempt = 0; attempt < maxAttempts && !placed; attempt++) {
        const randomOrientation = orientations[Math.floor(Math.random() * orientations.length)];
        const randomX = Math.floor(Math.random() * GRID_WIDTH);
        const randomY = Math.floor(Math.random() * stashHeight);
        
        // Check if the case fits at this position
        if (randomX + randomOrientation.width <= GRID_WIDTH && 
            randomY + randomOrientation.height <= stashHeight) {
          let canPlace = true;
          
          for (let y = randomY; y < randomY + randomOrientation.height && canPlace; y++) {
            for (let x = randomX; x < randomX + randomOrientation.width && canPlace; x++) {
              if (grid[y][x] !== null) {
                canPlace = false;
              }
            }
          }
          
          if (canPlace) {
            // Place the case
            const placedCase: PlacedCase = {
              id: caseToPlace.id,
              type: caseToPlace.type,
              x: randomX,
              y: randomY,
              width: randomOrientation.width,
              height: randomOrientation.height,
              rotated: randomOrientation.rotated
            };
            
            individual.push(placedCase);
            
            // Mark the grid cells as occupied
            for (let y = randomY; y < randomY + randomOrientation.height; y++) {
              for (let x = randomX; x < randomX + randomOrientation.width; x++) {
                grid[y][x] = caseToPlace.id;
              }
            }
            
            placed = true;
          }
        }
      }
    }
    
    return individual;
  }
  
  // Helper function to evaluate the fitness of an individual
  function evaluateFitness(individual: PlacedCase[]): number {
    // Fitness is based on:
    // 1. Number of placed cases (higher is better)
    // 2. Compactness of the layout (lower bounding box area is better)
    // 3. Row alignment (bonus for cases that align to grid rows)
    
    let placedCount = individual.filter(c => !c.isLocked).length;
    let totalCases = allCases.length;
    
    // Calculate bounding box
    let maxX = 0;
    let maxY = 0;
    
    for (const placedCase of individual) {
      maxX = Math.max(maxX, placedCase.x + placedCase.width);
      maxY = Math.max(maxY, placedCase.y + placedCase.height);
    }
    
    const boundingBoxArea = maxX * maxY;
    const maxPossibleArea = GRID_WIDTH * stashHeight;
    
    // Calculate row alignment bonus
    let rowAlignmentBonus = 0;
    for (const placedCase of individual) {
      if (placedCase.x % placedCase.width === 0) {
        rowAlignmentBonus += 10;
      }
    }
    
    // Calculate fitness (higher is better)
    const placedRatio = placedCount / totalCases;
    const compactness = 1 - (boundingBoxArea / maxPossibleArea);
    
    return placedRatio * 1000 + compactness * 500 + rowAlignmentBonus;
  }
  
  // Helper function to perform crossover between two parents
  function crossover(parent1: PlacedCase[], parent2: PlacedCase[]): PlacedCase[] {
    // Create a child by taking some cases from parent1 and some from parent2
    const child: PlacedCase[] = [];
    
    // Start with all locked cases
    const lockedCases = parent1.filter(c => c.isLocked);
    child.push(...lockedCases);
    
    // Create a grid to track occupied cells
    const grid: StashGrid = Array.from({ length: stashHeight }, () => Array(GRID_WIDTH).fill(null));
    
    // Mark locked positions as occupied
    for (const lockedCase of lockedCases) {
      for (let y = lockedCase.y; y < lockedCase.y + lockedCase.height; y++) {
        for (let x = lockedCase.x; x < lockedCase.x + lockedCase.width; x++) {
          if (y >= 0 && y < stashHeight && x >= 0 && x < GRID_WIDTH) {
            grid[y][x] = lockedCase.id;
          }
        }
      }
    }
    
    // Randomly choose cases from either parent
    const parent1Cases = parent1.filter(c => !c.isLocked);
    const parent2Cases = parent2.filter(c => !c.isLocked);
    
    // Create a list of all unique case IDs
    const allCaseIds = new Set<string>();
    parent1Cases.forEach(c => allCaseIds.add(c.id));
    parent2Cases.forEach(c => allCaseIds.add(c.id));
    
    // For each case ID, randomly choose from parent1 or parent2
    for (const caseId of allCaseIds) {
      const fromParent1 = parent1Cases.find(c => c.id === caseId);
      const fromParent2 = parent2Cases.find(c => c.id === caseId);
      
      const chosenCase = Math.random() < 0.5 ? fromParent1 : fromParent2;
      
      if (chosenCase) {
        // Check if the case fits in the grid
        let canPlace = true;
        
        for (let y = chosenCase.y; y < chosenCase.y + chosenCase.height && canPlace; y++) {
          for (let x = chosenCase.x; x < chosenCase.x + chosenCase.width && canPlace; x++) {
            if (y >= 0 && y < stashHeight && x >= 0 && x < GRID_WIDTH && grid[y][x] !== null) {
              canPlace = false;
            }
          }
        }
        
        if (canPlace) {
          child.push(chosenCase);
          
          // Mark the grid cells as occupied
          for (let y = chosenCase.y; y < chosenCase.y + chosenCase.height; y++) {
            for (let x = chosenCase.x; x < chosenCase.x + chosenCase.width; x++) {
              if (y >= 0 && y < stashHeight && x >= 0 && x < GRID_WIDTH) {
                grid[y][x] = caseId;
              }
            }
          }
        }
      }
    }
    
    return child;
  }
  
  // Helper function to mutate an individual
  function mutate(individual: PlacedCase[]): PlacedCase[] {
    // Create a copy of the individual
    const mutated = [...individual];
    
    // Find a non-locked case to mutate
    const nonLockedCases = mutated.filter(c => !c.isLocked);
    
    if (nonLockedCases.length === 0) {
      return mutated;
    }
    
    // Randomly select a case to mutate
    const caseToMutate = nonLockedCases[Math.floor(Math.random() * nonLockedCases.length)];
    const index = mutated.indexOf(caseToMutate);
    
    // Create a grid to track occupied cells
    const grid: StashGrid = Array.from({ length: stashHeight }, () => Array(GRID_WIDTH).fill(null));
    
    // Mark all positions as occupied except the one we're mutating
    for (const placedCase of mutated) {
      if (placedCase.id !== caseToMutate.id) {
        for (let y = placedCase.y; y < placedCase.y + placedCase.height; y++) {
          for (let x = placedCase.x; x < placedCase.x + placedCase.width; x++) {
            if (y >= 0 && y < stashHeight && x >= 0 && x < GRID_WIDTH) {
              grid[y][x] = placedCase.id;
            }
          }
        }
      }
    }
    
    // Try to place the case in a new random position
    const caseDef = allCases.find(c => c.id === caseToMutate.id);
    if (!caseDef) {
      return mutated;
    }
    
    // Check both normal and rotated orientations
    const orientations = [{
      width: caseDef.width,
      height: caseDef.height,
      rotated: false
    }];
    
    if (caseDef.width !== caseDef.height) {
      orientations.push({
        width: caseDef.height,
        height: caseDef.width,
        rotated: true
      });
    }
    
    // Try random positions until we find one that fits
    const maxAttempts = 50;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const randomOrientation = orientations[Math.floor(Math.random() * orientations.length)];
      const randomX = Math.floor(Math.random() * GRID_WIDTH);
      const randomY = Math.floor(Math.random() * stashHeight);
      
      // Check if the case fits at this position
      if (randomX + randomOrientation.width <= GRID_WIDTH && 
          randomY + randomOrientation.height <= stashHeight) {
        let canPlace = true;
        
        for (let y = randomY; y < randomY + randomOrientation.height && canPlace; y++) {
          for (let x = randomX; x < randomX + randomOrientation.width && canPlace; x++) {
            if (grid[y][x] !== null) {
              canPlace = false;
            }
          }
        }
        
        if (canPlace) {
          // Update the case position
          mutated[index] = {
            ...caseToMutate,
            x: randomX,
            y: randomY,
            width: randomOrientation.width,
            height: randomOrientation.height,
            rotated: randomOrientation.rotated
          };
          
          break;
        }
      }
    }
    
    return mutated;
  }
  
  // Initialize population with mix of sorted-order and random individuals
  let population: PlacedCase[][] = [];
  
  // First, add some individuals that respect sorted order (use greedy for these)
  const sortedIndividualCount = Math.floor(POPULATION_SIZE * 0.3); // 30% sorted
  for (let i = 0; i < sortedIndividualCount; i++) {
    const greedyResult = greedyOptimization(allCases, stashHeight, lockedPositions);
    population.push(greedyResult.placedCases);
  }
  
  // Then add random individuals for diversity
  for (let i = sortedIndividualCount; i < POPULATION_SIZE; i++) {
    // Create individual with shuffled cases for diversity
    const individual: PlacedCase[] = lockedPositions.map(pos => ({ ...pos, isLocked: true }));
    const grid: StashGrid = Array.from({ length: stashHeight }, () => Array(GRID_WIDTH).fill(null));
    
    // Mark locked positions as occupied
    for (const lockedCase of lockedPositions) {
      for (let y = lockedCase.y; y < lockedCase.y + lockedCase.height; y++) {
        for (let x = lockedCase.x; x < lockedCase.x + lockedCase.width; x++) {
          if (y >= 0 && y < stashHeight && x >= 0 && x < GRID_WIDTH) {
            grid[y][x] = lockedCase.id;
          }
        }
      }
    }
    
    // Shuffle cases for random placement
    const shuffledCases = [...allCases].sort(() => Math.random() - 0.5);
    
    // Try to place each case in a random position
    for (const caseToPlace of shuffledCases) {
      let placed = false;
      const orientations = [{
        width: caseToPlace.width,
        height: caseToPlace.height,
        rotated: false
      }];
      
      if (caseToPlace.width !== caseToPlace.height) {
        orientations.push({
          width: caseToPlace.height,
          height: caseToPlace.width,
          rotated: true
        });
      }
      
      const maxAttempts = 100;
      for (let attempt = 0; attempt < maxAttempts && !placed; attempt++) {
        const randomOrientation = orientations[Math.floor(Math.random() * orientations.length)];
        const randomX = Math.floor(Math.random() * GRID_WIDTH);
        const randomY = Math.floor(Math.random() * stashHeight);
        
        if (randomX + randomOrientation.width <= GRID_WIDTH && 
            randomY + randomOrientation.height <= stashHeight) {
          let canPlace = true;
          
          for (let y = randomY; y < randomY + randomOrientation.height && canPlace; y++) {
            for (let x = randomX; x < randomX + randomOrientation.width && canPlace; x++) {
              if (grid[y][x] !== null) {
                canPlace = false;
              }
            }
          }
          
          if (canPlace) {
            const placedCase: PlacedCase = {
              id: caseToPlace.id,
              type: caseToPlace.type,
              x: randomX,
              y: randomY,
              width: randomOrientation.width,
              height: randomOrientation.height,
              rotated: randomOrientation.rotated
            };
            
            individual.push(placedCase);
            
            for (let y = randomY; y < randomY + randomOrientation.height; y++) {
              for (let x = randomX; x < randomX + randomOrientation.width; x++) {
                grid[y][x] = caseToPlace.id;
              }
            }
            
            placed = true;
          }
        }
      }
    }
    
    population.push(individual);
  }
  
  // Evolve the population
  for (let generation = 0; generation < GENERATIONS; generation++) {
    // Evaluate fitness for each individual
    const fitnessScores = population.map(individual => ({
      individual,
      fitness: evaluateFitness(individual)
    }));
    
    // Sort by fitness (descending)
    fitnessScores.sort((a, b) => b.fitness - a.fitness);
    
    // Create new population
    const newPopulation: PlacedCase[][] = [];
    
    // Elitism: carry over the best individuals
    const eliteCount = Math.floor(POPULATION_SIZE * ELITISM_RATE);
    for (let i = 0; i < eliteCount; i++) {
      newPopulation.push(fitnessScores[i].individual);
    }
    
    // Fill the rest of the population with offspring
    while (newPopulation.length < POPULATION_SIZE) {
      // Select parents using tournament selection
      const tournamentSize = 5;
      
      const parent1 = (() => {
        const tournament = [];
        for (let i = 0; i < tournamentSize; i++) {
          const randomIndex = Math.floor(Math.random() * fitnessScores.length);
          tournament.push(fitnessScores[randomIndex]);
        }
        tournament.sort((a, b) => b.fitness - a.fitness);
        return tournament[0].individual;
      })();
      
      const parent2 = (() => {
        const tournament = [];
        for (let i = 0; i < tournamentSize; i++) {
          const randomIndex = Math.floor(Math.random() * fitnessScores.length);
          tournament.push(fitnessScores[randomIndex]);
        }
        tournament.sort((a, b) => b.fitness - a.fitness);
        return tournament[0].individual;
      })();
      
      // Create offspring through crossover
      let offspring = crossover(parent1, parent2);
      
      // Apply mutation
      if (Math.random() < MUTATION_RATE) {
        offspring = mutate(offspring);
      }
      
      newPopulation.push(offspring);
    }
    
    population = newPopulation;
  }
  
  // Get the best individual from the final population
  const fitnessScores = population.map(individual => ({
    individual,
    fitness: evaluateFitness(individual)
  }));
  
  fitnessScores.sort((a, b) => b.fitness - a.fitness);
  const bestIndividual = fitnessScores[0].individual;
  
  // Create the grid for the best individual
  const grid: StashGrid = Array.from({ length: stashHeight }, () => Array(GRID_WIDTH).fill(null));
  
  for (const placedCase of bestIndividual) {
    for (let y = placedCase.y; y < placedCase.y + placedCase.height; y++) {
      for (let x = placedCase.x; x < placedCase.x + placedCase.width; x++) {
        if (y >= 0 && y < stashHeight && x >= 0 && x < GRID_WIDTH) {
          grid[y][x] = placedCase.id;
        }
      }
    }
  }
  
  // Find unplaced cases
  const placedCaseIds = new Set(bestIndividual.map(c => c.id));
  const unplacedCases = allCases.filter(c => !placedCaseIds.has(c.id));
  
  return { grid, placedCases: bestIndividual, unplacedCases, stashHeight };
}

// Simulated Annealing optimization algorithm
function simulatedAnnealingOptimization(
  allCases: CaseInstance[],
  stashHeight: number,
  lockedPositions: PlacedCase[] = []
): StashLayout {
  // Simulated annealing parameters
  const INITIAL_TEMPERATURE = 1000;
  const COOLING_RATE = 0.95;
  const MIN_TEMPERATURE = 1;
  const MAX_ITERATIONS_PER_TEMP = 100;
  
  // Helper function to create an initial solution using greedy algorithm
  function createInitialSolution(): PlacedCase[] {
    // Use greedy algorithm as a starting point
    const greedyResult = greedyOptimization(allCases, stashHeight, lockedPositions);
    return greedyResult.placedCases;
  }
  
  // Helper function to calculate the energy (cost) of a solution
  function calculateEnergy(solution: PlacedCase[]): number {
    // Energy is based on:
    // 1. Number of unplaced cases (higher is worse)
    // 2. Compactness of layout (higher bounding box area is worse)
    // 3. Gaps in the layout (more gaps is worse)
    
    // Count placed cases
    const placedCaseIds = new Set(solution.map(c => c.id));
    const placedCount = placedCaseIds.size - lockedPositions.length; // Exclude locked cases
    const totalCases = allCases.length;
    const unplacedCount = totalCases - placedCount;
    
    // Calculate bounding box
    let maxX = 0;
    let maxY = 0;
    
    for (const placedCase of solution) {
      maxX = Math.max(maxX, placedCase.x + placedCase.width);
      maxY = Math.max(maxY, placedCase.y + placedCase.height);
    }
    
    const boundingBoxArea = maxX * maxY;
    
    // Calculate gaps in the layout
    const grid: StashGrid = Array.from({ length: stashHeight }, () => Array(GRID_WIDTH).fill(null));
    
    // Mark all placed cases
    for (const placedCase of solution) {
      for (let y = placedCase.y; y < placedCase.y + placedCase.height; y++) {
        for (let x = placedCase.x; x < placedCase.x + placedCase.width; x++) {
          if (y >= 0 && y < stashHeight && x >= 0 && x < GRID_WIDTH) {
            grid[y][x] = placedCase.id;
          }
        }
      }
    }
    
    // Count empty cells within the bounding box
    let emptyCells = 0;
    for (let y = 0; y < maxY; y++) {
      for (let x = 0; x < maxX; x++) {
        if (grid[y][x] === null) {
          emptyCells++;
        }
      }
    }
    
    // Calculate energy (lower is better)
    const unplacedPenalty = unplacedCount * 1000;
    const boundingBoxPenalty = boundingBoxArea * 2;
    const gapsPenalty = emptyCells * 10;
    
    return unplacedPenalty + boundingBoxPenalty + gapsPenalty;
  }
  
  // Helper function to create a neighbor solution by making a small change
  function createNeighbor(currentSolution: PlacedCase[]): PlacedCase[] {
    // Create a copy of the current solution
    const neighbor = [...currentSolution];
    
    // Find a non-locked case to modify
    const nonLockedCases = neighbor.filter(c => !c.isLocked);
    
    if (nonLockedCases.length === 0) {
      return neighbor;
    }
    
    // Randomly select a case to modify
    const caseToModify = nonLockedCases[Math.floor(Math.random() * nonLockedCases.length)];
    const index = neighbor.indexOf(caseToModify);
    
    // Create a grid to track occupied cells
    const grid: StashGrid = Array.from({ length: stashHeight }, () => Array(GRID_WIDTH).fill(null));
    
    // Mark all positions as occupied except the one we're modifying
    for (const placedCase of neighbor) {
      if (placedCase.id !== caseToModify.id) {
        for (let y = placedCase.y; y < placedCase.y + placedCase.height; y++) {
          for (let x = placedCase.x; x < placedCase.x + placedCase.width; x++) {
            if (y >= 0 && y < stashHeight && x >= 0 && x < GRID_WIDTH) {
              grid[y][x] = placedCase.id;
            }
          }
        }
      }
    }
    
    // Randomly choose an operation: move, rotate, or swap
    const operation = Math.random();
    
    if (operation < 0.6) {
      // Move the case to a new position
      const caseDef = allCases.find(c => c.id === caseToModify.id);
      if (!caseDef) {
        return neighbor;
      }
      
      // Check both normal and rotated orientations
      const orientations = [{
        width: caseDef.width,
        height: caseDef.height,
        rotated: false
      }];
      
      if (caseDef.width !== caseDef.height) {
        orientations.push({
          width: caseDef.height,
          height: caseDef.width,
          rotated: true
        });
      }
      
      // Try random positions until we find one that fits
      const maxAttempts = 50;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const randomOrientation = orientations[Math.floor(Math.random() * orientations.length)];
        const randomX = Math.floor(Math.random() * GRID_WIDTH);
        const randomY = Math.floor(Math.random() * stashHeight);
        
        // Check if the case fits at this position
        if (randomX + randomOrientation.width <= GRID_WIDTH && 
            randomY + randomOrientation.height <= stashHeight) {
          let canPlace = true;
          
          for (let y = randomY; y < randomY + randomOrientation.height && canPlace; y++) {
            for (let x = randomX; x < randomX + randomOrientation.width && canPlace; x++) {
              if (grid[y][x] !== null) {
                canPlace = false;
              }
            }
          }
          
          if (canPlace) {
            // Update the case position
            neighbor[index] = {
              ...caseToModify,
              x: randomX,
              y: randomY,
              width: randomOrientation.width,
              height: randomOrientation.height,
              rotated: randomOrientation.rotated
            };
            
            break;
          }
        }
      }
    } else if (operation < 0.8) {
      // Rotate the case
      if (caseToModify.width !== caseToModify.height) {
        // Check if the rotated case fits
        const rotatedWidth = caseToModify.height;
        const rotatedHeight = caseToModify.width;
        
        if (caseToModify.x + rotatedWidth <= GRID_WIDTH && 
            caseToModify.y + rotatedHeight <= stashHeight) {
          let canRotate = true;
          
          for (let y = caseToModify.y; y < caseToModify.y + rotatedHeight && canRotate; y++) {
            for (let x = caseToModify.x; x < caseToModify.x + rotatedWidth && canRotate; x++) {
              if (grid[y][x] !== null) {
                canRotate = false;
              }
            }
          }
          
          if (canRotate) {
            neighbor[index] = {
              ...caseToModify,
              width: rotatedWidth,
              height: rotatedHeight,
              rotated: !caseToModify.rotated
            };
          }
        }
      }
    } else {
      // Swap with another case
      if (nonLockedCases.length > 1) {
        const otherCase = nonLockedCases[Math.floor(Math.random() * nonLockedCases.length)];
        if (otherCase.id !== caseToModify.id) {
          const otherIndex = neighbor.indexOf(otherCase);
          
          // Swap positions
          neighbor[index] = {
            ...caseToModify,
            x: otherCase.x,
            y: otherCase.y
          };
          
          neighbor[otherIndex] = {
            ...otherCase,
            x: caseToModify.x,
            y: caseToModify.y
          };
        }
      }
    }
    
    return neighbor;
  }
  
  // Initialize with a greedy solution
  let currentSolution = createInitialSolution();
  let bestSolution = [...currentSolution];
  let currentEnergy = calculateEnergy(currentSolution);
  let bestEnergy = currentEnergy;
  
  let temperature = INITIAL_TEMPERATURE;
  
  // Main simulated annealing loop
  while (temperature > MIN_TEMPERATURE) {
    for (let iteration = 0; iteration < MAX_ITERATIONS_PER_TEMP; iteration++) {
      // Create a neighbor solution
      const neighborSolution = createNeighbor(currentSolution);
      const neighborEnergy = calculateEnergy(neighborSolution);
      
      // Calculate energy difference
      const energyDiff = neighborEnergy - currentEnergy;
      
      // Decide whether to accept the neighbor solution
      if (energyDiff < 0 || Math.random() < Math.exp(-energyDiff / temperature)) {
        currentSolution = neighborSolution;
        currentEnergy = neighborEnergy;
        
        // Update best solution if needed
        if (currentEnergy < bestEnergy) {
          bestSolution = [...currentSolution];
          bestEnergy = currentEnergy;
        }
      }
    }
    
    // Cool down
    temperature *= COOLING_RATE;
  }
  
  // Create grid for the best solution
  const grid: StashGrid = Array.from({ length: stashHeight }, () => Array(GRID_WIDTH).fill(null));
  
  for (const placedCase of bestSolution) {
    for (let y = placedCase.y; y < placedCase.y + placedCase.height; y++) {
      for (let x = placedCase.x; x < placedCase.x + placedCase.width; x++) {
        if (y >= 0 && y < stashHeight && x >= 0 && x < GRID_WIDTH) {
          grid[y][x] = placedCase.id;
        }
      }
    }
  }
  
  // Find unplaced cases
  const placedCaseIds = new Set(bestSolution.map(c => c.id));
  const unplacedCases = allCases.filter(c => !placedCaseIds.has(c.id));
  
  return { grid, placedCases: bestSolution, unplacedCases, stashHeight };
}

export function optimizeStashLayout(
  caseCounts: CaseCounts, 
  stashHeight: number, 
  lockedPositions: PlacedCase[] = [],
  method: OptimizationMethod = 'greedy'
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

  // 3. Use the selected optimization method
  switch (method) {
    case 'greedy':
      return greedyOptimization(allCases, stashHeight, lockedPositions);
    case 'genetic':
      return geneticOptimization(allCases, stashHeight, lockedPositions);
    default:
      // Fallback to greedy for any unknown methods (including removed simulated-annealing, first-fit, and best-fit)
      return greedyOptimization(allCases, stashHeight, lockedPositions);
  }
}