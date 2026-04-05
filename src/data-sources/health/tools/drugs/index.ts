/**
 * Israel Drugs Tools
 *
 * Re-exports all drugs tools and collects source URL resolvers.
 */

import type { ToolSourceResolver } from '@/data-sources/types';

// Tool imports
import { searchDrugByName } from './search-drug-by-name.tool';
import { searchDrugBySymptom } from './search-drug-by-symptom.tool';
import { exploreGenericAlternatives } from './explore-generic-alternatives.tool';
import { exploreTherapeuticCategories } from './explore-therapeutic-categories.tool';
import { browseSymptoms } from './browse-symptoms.tool';
import { getDrugDetails } from './get-drug-details.tool';
import { suggestDrugNames } from './suggest-drug-names.tool';

// Re-exports
export { searchDrugByName } from './search-drug-by-name.tool';
export { searchDrugBySymptom } from './search-drug-by-symptom.tool';
export { exploreGenericAlternatives } from './explore-generic-alternatives.tool';
export { exploreTherapeuticCategories } from './explore-therapeutic-categories.tool';
export { browseSymptoms } from './browse-symptoms.tool';
export { getDrugDetails } from './get-drug-details.tool';
export { suggestDrugNames } from './suggest-drug-names.tool';

// ============================================================================
// Collected tool object
// ============================================================================

/** All Drugs tools as a single object */
export const DrugsTools = {
    searchDrugByName,
    searchDrugBySymptom,
    exploreGenericAlternatives,
    exploreTherapeuticCategories,
    browseSymptoms,
    getDrugDetails,
    suggestDrugNames,
};

/** Union of all Drugs tool names, derived from the DrugsTools object */
export type DrugsToolName = keyof typeof DrugsTools;

// ============================================================================
// Source URL resolvers (custom — typed, tool-specific field access)
// ============================================================================

import { resolveSourceUrl as searchDrugByNameResolver } from './search-drug-by-name.tool';
import { resolveSourceUrl as getDrugDetailsResolver } from './get-drug-details.tool';

/**
 * Custom source resolvers for Drugs tools (non-standard field access).
 * Each resolver is typed at its definition site; widened here for registry compatibility.
 */
export const drugsSourceResolvers: Partial<Record<DrugsToolName, ToolSourceResolver>> = {
    searchDrugByName: searchDrugByNameResolver as ToolSourceResolver,
    getDrugDetails: getDrugDetailsResolver as ToolSourceResolver,
};
