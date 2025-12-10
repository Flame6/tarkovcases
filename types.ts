import { CASE_TYPES } from './constants';

export type CaseType = typeof CASE_TYPES[number];

export type OptimizationMethod = 'greedy' | 'genetic';

export type StashEdition = 'Standard' | 'Left Behind' | 'Prepare for Escape' | 'Edge of Darkness';

export interface CaseDefinition {
  name: string;
  width: number;
  height: number;
  color: string;
  image: string;
  rotatedImage: string;
}

export type CaseDefinitions = Record<CaseType, CaseDefinition>;

export type CaseCounts = Record<CaseType, number>;

export interface CaseInstance {
  id: string;
  type: CaseType;
  width: number;
  height: number;
}

export interface PlacedCase {
  id: string;
  type: CaseType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
  isLocked?: boolean;
}

export type StashGrid = (string | null)[][];

export interface StashLayout {
  grid: StashGrid;
  placedCases: PlacedCase[];
  unplacedCases: CaseInstance[];
  stashHeight: number;
}
