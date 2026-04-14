import { describe, expect, it } from 'vitest';
import {
    SERVICE_CATEGORY_TO_LAYER_ID,
    TOURISM_CATEGORY_TO_LAYER_ID,
    SERVICE_LAYER_IDS,
    TOURISM_LAYER_IDS,
    serviceCategorySchema,
    tourismCategorySchema,
    SERVICE_CATEGORY_HEBREW,
    TOURISM_CATEGORY_HEBREW,
    emptyServiceResults,
    emptyTourismResults,
    LAYER_NAME_TO_SERVICE_KEY,
    LAYER_NAME_TO_TOURISM_KEY,
    SERVICE_CATEGORIES_DESCRIBE,
    TOURISM_CATEGORIES_DESCRIBE,
    SERVICE_FILTER_SUFFIX,
    TOURISM_FILTER_SUFFIX,
    getServiceCategory,
    getTourismCategory,
} from '../api/layers/layers.constants';

describe('SERVICE_LAYER_IDS derivation', () => {
    it('matches Object.values(SERVICE_CATEGORY_TO_LAYER_ID)', () => {
        expect([...SERVICE_LAYER_IDS]).toEqual(Object.values(SERVICE_CATEGORY_TO_LAYER_ID));
    });
});

describe('TOURISM_LAYER_IDS derivation', () => {
    it('matches Object.values(TOURISM_CATEGORY_TO_LAYER_ID)', () => {
        expect([...TOURISM_LAYER_IDS]).toEqual(Object.values(TOURISM_CATEGORY_TO_LAYER_ID));
    });
});

describe('serviceCategorySchema', () => {
    it('accepts valid category keys', () => {
        for (const key of Object.keys(SERVICE_CATEGORY_TO_LAYER_ID)) {
            expect(serviceCategorySchema.safeParse(key).success).toBe(true);
        }
    });

    it('rejects invalid category keys', () => {
        expect(serviceCategorySchema.safeParse('notACategory').success).toBe(false);
        expect(serviceCategorySchema.safeParse('').success).toBe(false);
        expect(serviceCategorySchema.safeParse(123).success).toBe(false);
    });
});

describe('tourismCategorySchema', () => {
    it('accepts valid category keys', () => {
        for (const key of Object.keys(TOURISM_CATEGORY_TO_LAYER_ID)) {
            expect(tourismCategorySchema.safeParse(key).success).toBe(true);
        }
    });

    it('rejects invalid category keys', () => {
        expect(tourismCategorySchema.safeParse('notACategory').success).toBe(false);
    });
});

describe('SERVICE_CATEGORY_HEBREW', () => {
    it('covers all service category keys', () => {
        const categoryKeys = Object.keys(SERVICE_CATEGORY_TO_LAYER_ID);
        const hebrewKeys = Object.keys(SERVICE_CATEGORY_HEBREW);
        expect(hebrewKeys).toEqual(expect.arrayContaining(categoryKeys));
        expect(categoryKeys).toEqual(expect.arrayContaining(hebrewKeys));
    });
});

describe('TOURISM_CATEGORY_HEBREW', () => {
    it('covers all tourism category keys', () => {
        const categoryKeys = Object.keys(TOURISM_CATEGORY_TO_LAYER_ID);
        const hebrewKeys = Object.keys(TOURISM_CATEGORY_HEBREW);
        expect(hebrewKeys).toEqual(expect.arrayContaining(categoryKeys));
        expect(categoryKeys).toEqual(expect.arrayContaining(hebrewKeys));
    });
});

describe('emptyServiceResults', () => {
    it('has keys matching service category keys and all arrays are empty', () => {
        const results = emptyServiceResults();
        const categoryKeys = Object.keys(SERVICE_CATEGORY_TO_LAYER_ID);
        expect(Object.keys(results)).toEqual(expect.arrayContaining(categoryKeys));
        for (const key of categoryKeys) {
            expect(results[key as keyof typeof results]).toEqual([]);
        }
    });
});

describe('emptyTourismResults', () => {
    it('has keys matching tourism category keys and all arrays are empty', () => {
        const results = emptyTourismResults();
        const categoryKeys = Object.keys(TOURISM_CATEGORY_TO_LAYER_ID);
        expect(Object.keys(results)).toEqual(expect.arrayContaining(categoryKeys));
        for (const key of categoryKeys) {
            expect(results[key as keyof typeof results]).toEqual([]);
        }
    });
});

describe('LAYER_NAME_TO_SERVICE_KEY', () => {
    it('values are all valid service category keys', () => {
        const validKeys = new Set(Object.keys(SERVICE_CATEGORY_TO_LAYER_ID));
        for (const value of Object.values(LAYER_NAME_TO_SERVICE_KEY)) {
            expect(validKeys.has(value)).toBe(true);
        }
    });
});

describe('LAYER_NAME_TO_TOURISM_KEY', () => {
    it('values are all valid tourism category keys', () => {
        const validKeys = new Set(Object.keys(TOURISM_CATEGORY_TO_LAYER_ID));
        for (const value of Object.values(LAYER_NAME_TO_TOURISM_KEY)) {
            expect(validKeys.has(value)).toBe(true);
        }
    });
});

describe('SERVICE_CATEGORIES_DESCRIBE', () => {
    it('contains all service category keys and Hebrew labels', () => {
        for (const [key, label] of Object.entries(SERVICE_CATEGORY_HEBREW)) {
            expect(SERVICE_CATEGORIES_DESCRIBE).toContain(key);
            expect(SERVICE_CATEGORIES_DESCRIBE).toContain(label);
        }
    });
});

describe('TOURISM_CATEGORIES_DESCRIBE', () => {
    it('contains all tourism category keys and Hebrew labels', () => {
        for (const [key, label] of Object.entries(TOURISM_CATEGORY_HEBREW)) {
            expect(TOURISM_CATEGORIES_DESCRIBE).toContain(key);
            expect(TOURISM_CATEGORIES_DESCRIBE).toContain(label);
        }
    });
});

describe('SERVICE_FILTER_SUFFIX', () => {
    it('contains all service category keys', () => {
        for (const key of Object.keys(SERVICE_CATEGORY_TO_LAYER_ID)) {
            expect(SERVICE_FILTER_SUFFIX).toContain(key);
        }
    });
});

describe('TOURISM_FILTER_SUFFIX', () => {
    it('contains all tourism category keys', () => {
        for (const key of Object.keys(TOURISM_CATEGORY_TO_LAYER_ID)) {
            expect(TOURISM_FILTER_SUFFIX).toContain(key);
        }
    });
});

describe('getServiceCategory', () => {
    it('returns correct category for known layer names', () => {
        for (const [layerName, category] of Object.entries(LAYER_NAME_TO_SERVICE_KEY)) {
            expect(getServiceCategory(layerName)).toBe(category);
        }
    });

    it('returns undefined for unknown layer names', () => {
        expect(getServiceCategory('unknown_layer')).toBeUndefined();
    });
});

describe('getTourismCategory', () => {
    it('returns correct category for known layer names', () => {
        for (const [layerName, category] of Object.entries(LAYER_NAME_TO_TOURISM_KEY)) {
            expect(getTourismCategory(layerName)).toBe(category);
        }
    });

    it('returns undefined for unknown layer names', () => {
        expect(getTourismCategory('unknown_layer')).toBeUndefined();
    });
});
