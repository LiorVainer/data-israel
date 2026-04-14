import type { LucideIcon } from 'lucide-react';
import { SearchIcon } from 'lucide-react';
import { getAllTranslations } from '@/data-sources/registry';
import type { ToolTranslation } from '@/data-sources/types';

/** Tool info containing display name and icon */
export interface ToolInfo {
    name: string;
    icon: LucideIcon;
}

/** Lazy-initialized translations cache */
let _translations: Record<string, ToolTranslation> | null = null;

function getTranslations(): Record<string, ToolTranslation> {
    if (!_translations) {
        _translations = getAllTranslations();
    }
    return _translations;
}

/**
 * Get tool info (Hebrew name + icon) from the data-source translation registry.
 * Falls back to the raw tool key as name and SearchIcon if no translation exists.
 */
export function getToolInfo(toolKey: string): ToolInfo {
    const translations = getTranslations();
    const meta = translations[toolKey];
    return {
        name: meta?.name ?? toolKey,
        icon: meta?.icon ?? SearchIcon,
    };
}
