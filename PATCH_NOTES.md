# Patch Notes - Optimization Algorithms & Bug Fixes

## Version Update - Multiple Optimization Methods

### 🎯 Major Features

#### Multiple Optimization Algorithms
- **Added Optimization Method Selector**: New dropdown in the input form to choose between different optimization algorithms
- **Greedy Algorithm** (Default): Fast algorithm that places items efficiently with good local fits
- **Genetic Algorithm**: Evolutionary approach that can find near-optimal solutions, though slower
- Each algorithm includes tooltips with descriptions, complexity ratings, and speed indicators

### 🐛 Bug Fixes

#### Case Count Preservation Bug (CRITICAL FIX)
- **Fixed persistent bug** where case counts would disappear from the input form during optimization
- Added `ensureAllCaseTypes()` helper function to preserve all case types in state, even when count is 0
- Applied fix to all case count update operations:
  - Optimization functions
  - Case placement/removal handlers
  - Count increment/decrement operations
  - Form data updates

#### Auto-Rerun Behavior
- Removed automatic re-optimization when adding/removing cases
- Removed automatic re-optimization when changing algorithms
- Optimization now only runs when explicitly clicking "Place Remaining Cases" or "Optimize All" buttons
- Provides better user control over when optimization occurs

### ✨ Improvements

#### Custom Boxes
- Added **Custom 3x1** box (3 wide × 1 tall)
- Added **Custom 4x1** box (4 wide × 1 tall)
- Note: Custom 2x1 already existed

#### Algorithm Refinements
- **Greedy Algorithm**: Maintains sorting rules (grouping same types, prioritizing wider cases)
- **Genetic Algorithm**: 
  - Initializes 30% of population with sorted-order solutions (respects grouping)
  - Remaining 70% uses random placement for diversity
  - Better respects user's sorting preferences while exploring solution space

#### UI/UX Enhancements
- Optimization method selector matches the theme of "Custom Boxes / Rigs" dropdown
- Added "(Advanced)" label to optimization method selector
- Improved visual consistency across the interface

### 🗑️ Removed Features

- **Simulated Annealing**: Removed due to infinite optimization loop bug (can be re-added later when fixed)
- **Best-Fit Algorithm**: Removed to simplify options
- **First-Fit Algorithm**: Removed due to bugs with case count management

### 🔧 Technical Changes

#### Code Structure
- Created `OptimizationMethodSelector` component with dropdown and tooltips
- Refactored optimization algorithms into separate functions:
  - `greedyOptimization()`
  - `geneticOptimization()`
  - `bestFitOptimization()` (kept in code but not accessible)
  - `firstFitOptimization()` (kept in code but not accessible)
  - `simulatedAnnealingOptimization()` (kept in code but not accessible)
- Added `OptimizationMethod` type to TypeScript definitions
- Added optimization method constants with metadata

#### State Management
- Added localStorage persistence for optimization method preference
- Added localStorage persistence for manually placed cases
- Improved state synchronization between remaining and placed cases
- Fixed case count calculations to always include all case types

### 📝 Migration Notes

- Users with saved "simulated-annealing", "first-fit", or "best-fit" preferences will automatically be migrated to "greedy"
- All case counts are preserved and will not disappear during optimization
- Manually placed cases are now saved and restored on page refresh

### 🎮 User Experience

- **Before**: Only one optimization method (greedy), cases could disappear, auto-rerun was unpredictable
- **After**: Choice of algorithms, stable case counts, manual control over optimization timing

---

**Commit**: `8d152f1`  
**Date**: Current Update  
**Files Changed**: 7 files, 1571 insertions(+), 103 deletions(-)

