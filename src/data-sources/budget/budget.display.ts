/**
 * BudgetKey Display Configuration
 *
 * Agent display metadata and badge configuration for BudgetKey data source.
 */

import { LandmarkIcon } from 'lucide-react';
import type { DataSourceConfig } from '@/data-sources/types';

/** BudgetKey agent display label (Hebrew) */
export const budgetDisplayLabel = 'סוכן תקציב המדינה';

/** BudgetKey agent display icon */
export const budgetDisplayIcon = LandmarkIcon;

/** BudgetKey badge configuration for data source attribution */
export const budgetBadgeConfig: DataSourceConfig = {
    urlLabel: 'next.obudget.org',
    nameLabel: 'תקציב המדינה',
    url: 'https://next.obudget.org',
    className: 'bg-[var(--badge-budget)] text-[var(--badge-budget-foreground)] hover:bg-[var(--badge-budget)]/80',
};
