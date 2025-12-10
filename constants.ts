import type { CaseDefinitions, CaseType, StashEdition, OptimizationMethod } from './types';

export const GRID_WIDTH = 10;

// Default stash edition
export const DEFAULT_STASH_EDITION: StashEdition = 'Edge of Darkness';

// Default optimization method
export const DEFAULT_OPTIMIZATION_METHOD: OptimizationMethod = 'greedy';

// Optimization methods with descriptions
export const OPTIMIZATION_METHODS: Record<OptimizationMethod, { 
  name: string; 
  description: string; 
  complexity: 'low' | 'medium' | 'high';
  speed: 'fast' | 'medium' | 'slow';
}> = {
  'greedy': {
    name: 'Greedy',
    description: 'Fast algorithm that places items in the first available position with the best local fit. Good for most cases but not always optimal.',
    complexity: 'low',
    speed: 'fast'
  },
  'genetic': {
    name: 'Genetic Algorithm',
    description: 'Evolutionary approach that creates a population of solutions and evolves them over generations. Can find near-optimal solutions but takes longer.',
    complexity: 'high',
    speed: 'slow'
  }
};

// Timing constants (in milliseconds)
export const OPTIMIZATION_DELAY = 500; // Delay before running optimization to allow UI updates
export const SCROLL_DELAY = 100; // Delay before scrolling to layout after optimization
export const CLICK_ANIMATION_DURATION = 200; // Duration for click animation feedback

export const STASH_DIMENSIONS = {
  'Standard': { width: 10, height: 28 },
  'Left Behind': { width: 10, height: 38 },
  'Prepare for Escape': { width: 10, height: 48 },
  'Edge of Darkness': { width: 10, height: 68 },
};

export const CASE_TYPES = [
  "ammo", "cards", "docs", "food", "grenades", "items", "junk", "Key_case", "keytool", "mags", "medicine", "money", "pistol", "plates", "sicc", "stims", "tags", "THICCItems", "thiicweapons", "toolbox", "twitch", "wallet", "weapons",
  "custom_1x1", "custom_1x2", "custom_2x1", "custom_2x2", "custom_2x3", "custom_3x1", "custom_3x2", "custom_3x3", "custom_3x4", "custom_4x1", "custom_4x3", "custom_4x4"
] as const;

// Helper to generate conventional image paths
const img = (name: string, ext: string = 'webp') => `/Case Images/${name}.${ext}`;
const img_r = (name: string, ext: string = 'webp') => `/Case Images/${name}_rotated.${ext}`;

export const CASES: CaseDefinitions = {
  items:       { name: "Item Case", width: 4, height: 4, color: "bg-blue-800", image: img('items', 'webp'), rotatedImage: img_r('items', 'webp') },
  THICCItems:  { name: "T H I C C Item Case", width: 5, height: 3, color: "bg-blue-600", image: img('THICCItems', 'webp'), rotatedImage: img_r('THICCItems', 'webp') },
  weapons:     { name: "Weapon Case", width: 5, height: 2, color: "bg-red-800", image: img('weapons', 'webp'), rotatedImage: img_r('weapons', 'webp') },
  thiicweapons:{ name: "T H I C C Weapon Case", width: 5, height: 2, color: "bg-red-600", image: img('thiicweapons', 'webp'), rotatedImage: img_r('thiicweapons', 'webp') },
  food:        { name: "Thermal Bag", width: 3, height: 3, color: "bg-green-800", image: img('food', 'webp'), rotatedImage: img_r('food', 'webp') },
  medicine:    { name: "Medicine Case", width: 3, height: 3, color: "bg-yellow-800", image: img('medicine', 'webp'), rotatedImage: img_r('medicine', 'webp') },
  grenades:    { name: "Grenade Case", width: 3, height: 3, color: "bg-red-900", image: img('grenades', 'webp'), rotatedImage: img_r('grenades', 'webp') },
  mags:        { name: "Magazine Case", width: 3, height: 2, color: "bg-gray-600", image: img('mags', 'webp'), rotatedImage: img_r('mags', 'webp') },
  money:       { name: "Money Case", width: 3, height: 2, color: "bg-green-600", image: img('money', 'webp'), rotatedImage: img_r('money', 'webp') },
  ammo:        { name: "Ammunition Case", width: 2, height: 2, color: "bg-yellow-600", image: img('ammo', 'webp'), rotatedImage: img_r('ammo', 'webp') },
  pistol:      { name: "Pistol Case", width: 2, height: 2, color: "bg-gray-700", image: img('pistol', 'webp'), rotatedImage: img_r('pistol', 'webp') },
  toolbox:     { name: "Toolbox", width: 2, height: 2, color: "bg-orange-700", image: img('Toolbox', 'webp'), rotatedImage: img_r('Toolbox', 'webp') },
  junk:        { name: "Lucky Scav Junk Box", width: 4, height: 4, color: "bg-purple-800", image: img('junk', 'webp'), rotatedImage: img_r('junk', 'webp') },
  docs:        { name: "Documents Case", width: 1, height: 2, color: "bg-indigo-700", image: img('docs', 'webp'), rotatedImage: img_r('docs', 'webp') },
  sicc:        { name: "S I C C Pouch", width: 2, height: 1, color: "bg-gray-500", image: img('sicc', 'png'), rotatedImage: img_r('sicc', 'png') },
  plates:      { name: "Ballistic Plate Case", width: 4, height: 2, color: "bg-slate-600", image: img('Plates', 'webp'), rotatedImage: img_r('Plates', 'webp')},
  Key_case:    { name: "Key Case", width: 3, height: 2, color: "bg-cyan-600", image: img('Key_case', 'webp'), rotatedImage: img_r('Key_case', 'webp') },
  cards:       { name: "Keycard Holder", width: 1, height: 1, color: "bg-blue-500", image: img('cards', 'webp'), rotatedImage: img_r('cards', 'webp') },
  keytool:     { name: "Key Tool", width: 1, height: 1, color: "bg-yellow-500", image: img('keytool', 'webp'), rotatedImage: img_r('keytool', 'webp') },
  stims:       { name: "Injector Case", width: 1, height: 1, color: "bg-orange-500", image: img('stims', 'webp'), rotatedImage: img_r('stims', 'webp') },
  tags:        { name: "Dogtag Case", width: 1, height: 1, color: "bg-red-500", image: img('tags', 'webp'), rotatedImage: img_r('tags', 'webp') },
  wallet:      { name: "WZ Wallet", width: 1, height: 1, color: "bg-green-500", image: img('wallet', 'webp'), rotatedImage: img_r('wallet', 'webp') },
  twitch:      { name: "Twitch Rivals Bag", width: 3, height: 3, color: "bg-purple-600", image: img('Twitch', 'webp'), rotatedImage: img_r('Twitch', 'webp') },
  custom_1x1:  { name: "Custom 1x1", width: 1, height: 1, color: "bg-slate-800", image: "", rotatedImage: "" },
  custom_2x1:  { name: "Custom 2x1", width: 2, height: 1, color: "bg-slate-800", image: "", rotatedImage: "" },
  custom_1x2:  { name: "Custom 1x2", width: 1, height: 2, color: "bg-slate-800", image: "", rotatedImage: "" },
  custom_2x2:  { name: "Custom 2x2", width: 2, height: 2, color: "bg-slate-800", image: "", rotatedImage: "" },
  custom_2x3:  { name: "Custom 2x3", width: 2, height: 3, color: "bg-slate-800", image: "", rotatedImage: "" },
  custom_3x1:  { name: "Custom 3x1", width: 3, height: 1, color: "bg-slate-800", image: "", rotatedImage: "" },
  custom_3x2:  { name: "Custom 3x2", width: 3, height: 2, color: "bg-slate-800", image: "", rotatedImage: "" },
  custom_3x3:  { name: "Custom 3x3", width: 3, height: 3, color: "bg-slate-800", image: "", rotatedImage: "" },
  custom_3x4:  { name: "Custom 3x4", width: 3, height: 4, color: "bg-slate-800", image: "", rotatedImage: "" },
  custom_4x1:  { name: "Custom 4x1", width: 4, height: 1, color: "bg-slate-800", image: "", rotatedImage: "" },
  custom_4x3:  { name: "Custom 4x3", width: 4, height: 3, color: "bg-slate-800", image: "", rotatedImage: "" },
  custom_4x4:  { name: "Custom 4x4", width: 4, height: 4, color: "bg-slate-800", image: "", rotatedImage: "" },
};