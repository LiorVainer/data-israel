import { describe, expect, it } from 'vitest';
import { cleanEntity, createEntityCleaner, flattenVisibleFields } from '../api/layers/entity-cleaner';

describe('flattenVisibleFields', () => {
    it('filters invisible and null fields', () => {
        const result = flattenVisibleFields([
            { fieldName: 'שם', fieldValue: 'איכילוב', isVisible: true },
            { fieldName: 'כתובת', fieldValue: 'ויצמן 6', isVisible: true },
            { fieldName: 'נסתר', fieldValue: 'לא אמור להופיע', isVisible: false },
            { fieldName: 'ריק', fieldValue: null, isVisible: true },
        ]);

        expect(result).toEqual({
            שם: 'איכילוב',
            כתובת: 'ויצמן 6',
        });
    });

    it('supports keepFirstDuplicate', () => {
        const result = flattenVisibleFields(
            [
                { fieldName: 'שם', fieldValue: 'ראשון', isVisible: true },
                { fieldName: 'שם', fieldValue: 'שני', isVisible: true },
            ],
            { keepFirstDuplicate: true },
        );

        expect(result).toEqual({
            שם: 'ראשון',
        });
    });
});

describe('cleanEntity', () => {
    it('drops geom and promotes name/address', () => {
        const entity = cleanEntity({
            id: 123,
            geom: 'MULTIPOLYGON(((3874203.202 ... huge wkt ... )))',
            fields: [
                { fieldName: 'שם', fieldValue: 'איכילוב', isVisible: true, fieldType: 1 },
                { fieldName: 'כתובת', fieldValue: 'ויצמן 6', isVisible: true, fieldType: 1 },
                { fieldName: 'קוד', fieldValue: 42, isVisible: true, fieldType: 2 },
            ],
        });

        expect(entity).toEqual({
            id: 123,
            name: 'איכילוב',
            address: 'ויצמן 6',
            fields: {
                שם: 'איכילוב',
                כתובת: 'ויצמן 6',
                קוד: 42,
            },
        });

        expect('geom' in entity).toBe(false);
    });

    it('supports layer-specific aliases', () => {
        const cleaner = createEntityCleaner({
            nameFieldAliases: ['התחנה'],
            addressFieldAliases: ['מען'],
        });

        const entity = cleaner({
            id: 'abc',
            geom: 'POINT(...)',
            fields: [
                { fieldName: 'התחנה', fieldValue: 'מרכזית', isVisible: true },
                { fieldName: 'מען', fieldValue: 'תל אביב', isVisible: true },
            ],
        });

        expect(entity.name).toBe('מרכזית');
        expect(entity.address).toBe('תל אביב');
    });
});
