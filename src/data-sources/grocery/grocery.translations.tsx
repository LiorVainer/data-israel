/**
 * Grocery Tool Translations
 *
 * Hebrew translations and formatters for grocery tools displayed in the UI.
 * Icons are LucideIcon components (not JSX elements).
 */

import { LinkIcon, SearchIcon, ShoppingCartIcon, StoreIcon, TagIcon } from 'lucide-react';
import type { ToolTranslation } from '@/data-sources/types';
import type { GroceryToolName } from './tools';

export const groceryTranslations: Partial<Record<GroceryToolName, ToolTranslation>> = {
    searchProductPrice: {
        name: 'חיפוש מחיר מוצר',
        icon: SearchIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.searchedResourceName === 'string') return i.searchedResourceName;
            if (typeof i.query === 'string') return `מחפש: "${i.query}"`;
            return 'מחפש מוצר...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const items = o.items as unknown[] | undefined;
            const chainName = typeof o.chainName === 'string' ? o.chainName : '';
            return `נמצאו ${items?.length ?? 0} מוצרים ב${chainName}`;
        },
    },
    compareAcrossChains: {
        name: 'השוואת מחירים בין רשתות',
        icon: ShoppingCartIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.searchedResourceName === 'string') return i.searchedResourceName;
            if (typeof i.barcode === 'string') return `משווה מחיר: ${i.barcode}`;
            return 'משווה מחירים...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const chainsWithProduct = typeof o.chainsWithProduct === 'number' ? o.chainsWithProduct : 0;
            return `נמצא ב-${chainsWithProduct} רשתות`;
        },
    },
    getChainStores: {
        name: 'חיפוש סניפי רשת',
        icon: StoreIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.searchedResourceName === 'string') return i.searchedResourceName;
            return 'טוען סניפים...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const totalStores = typeof o.totalStores === 'number' ? o.totalStores : 0;
            return `נמצאו ${totalStores} סניפים`;
        },
    },
    getActivePromotions: {
        name: 'חיפוש מבצעים',
        icon: TagIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.searchedResourceName === 'string') return i.searchedResourceName;
            return 'טוען מבצעים...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === false && typeof o.error === 'string') return `שגיאה: ${o.error}`;
            const totalPromotions = typeof o.totalPromotions === 'number' ? o.totalPromotions : 0;
            return `נמצאו ${totalPromotions} מבצעים`;
        },
    },
    generateGrocerySourceUrl: {
        name: 'יצירת קישור למקור מחירים',
        icon: LinkIcon,
        formatInput: (input) => {
            const i = input as Record<string, unknown>;
            if (typeof i.title === 'string') return `יוצר קישור: "${i.title}"`;
            return 'יוצר קישור למקור...';
        },
        formatOutput: (output) => {
            const o = output as Record<string, unknown>;
            if (o.success === true && typeof o.title === 'string') return o.title;
            return undefined;
        },
    },
};
