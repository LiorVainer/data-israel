import { z } from 'zod';

/**
 * Primitive field values that may arrive from GovMap entity fields.
 */
export type FieldValue = string | number | boolean;

/**
 * Raw GovMap field object.
 */
export const GovMapEntityFieldSchema = z.object({
    fieldName: z.string(),
    fieldValue: z.union([z.string(), z.number(), z.boolean(), z.null(), z.undefined()]),
    fieldType: z.number().optional(),
    isVisible: z.boolean().optional().default(true),
});

export type GovMapEntityField = z.infer<typeof GovMapEntityFieldSchema>;

/**
 * Raw GovMap layer entity from entitiesByPoint.
 * Add extra optional properties if your actual payload contains them.
 */
export const GovMapLayerEntitySchema = z.object({
    id: z.union([z.string(), z.number()]).optional(),
    geom: z.string().optional(),
    fields: z.array(GovMapEntityFieldSchema).default([]),
    distance: z.number().optional(),
});

export type GovMapLayerEntity = z.infer<typeof GovMapLayerEntitySchema>;

/**
 * Compact entity returned to tools/AI.
 */
export type CleanEntity = {
    id?: string | number;
    name?: string;
    address?: string;
    fields: Record<string, FieldValue>;
    distance?: number;
};

export type EntityCleanerOptions = {
    /**
     * Candidate field names that may contain the primary display name.
     * Example: ["שם", "שם מלא", "שם העסק"]
     */
    nameFieldAliases?: readonly string[];

    /**
     * Candidate field names that may contain the primary address.
     * Example: ["כתובת", "כתובת מלאה", "מען"]
     */
    addressFieldAliases?: readonly string[];

    /**
     * Whether duplicate keys should keep the first seen value instead of the last.
     * Default: false (last wins)
     */
    keepFirstDuplicate?: boolean;
};

const DEFAULT_NAME_FIELD_ALIASES = ['שם', 'שם מלא', 'שם העסק', 'שם מוסד'] as const;
const DEFAULT_ADDRESS_FIELD_ALIASES = ['כתובת', 'כתובת מלאה', 'מען', 'רחוב'] as const;

function normalizeFieldKey(key: string): string {
    return key.trim().replace(/\s+/g, ' ');
}

function isNonNullFieldValue(value: unknown): value is FieldValue {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

/**
 * Flatten GovMap fields array into a compact key-value object.
 * Preserves original fieldName exactly as returned by the API.
 */
export function flattenVisibleFields(
    fields: GovMapEntityField[],
    options?: Pick<EntityCleanerOptions, 'keepFirstDuplicate'>,
): Record<string, FieldValue> {
    const keepFirstDuplicate = options?.keepFirstDuplicate ?? false;

    return fields.reduce<Record<string, FieldValue>>((acc, field) => {
        const isVisible = field.isVisible ?? true;
        if (!isVisible) return acc;
        if (!isNonNullFieldValue(field.fieldValue)) return acc;

        if (keepFirstDuplicate && field.fieldName in acc) {
            return acc;
        }

        acc[field.fieldName] = field.fieldValue;
        return acc;
    }, {});
}

/**
 * Find a promoted string field from the flattened fields map.
 * Matching is done first by exact key, then by normalized key.
 */
export function pickPromotedStringField(
    fields: Record<string, FieldValue>,
    candidateKeys: readonly string[],
): string | undefined {
    for (const key of candidateKeys) {
        const value = fields[key];
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
    }

    const normalizedEntries = Object.entries(fields).map(([key, value]) => ({
        originalKey: key,
        normalizedKey: normalizeFieldKey(key),
        value,
    }));

    for (const candidate of candidateKeys) {
        const normalizedCandidate = normalizeFieldKey(candidate);
        const match = normalizedEntries.find((entry) => entry.normalizedKey === normalizedCandidate);

        if (match && typeof match.value === 'string' && match.value.trim()) {
            return match.value.trim();
        }
    }

    return undefined;
}

/**
 * Pure transformation from validated GovMapLayerEntity to compact CleanEntity.
 * geom is intentionally omitted.
 */
export function mapLayerEntityToCleanEntity(entity: GovMapLayerEntity, options?: EntityCleanerOptions): CleanEntity {
    const fields = flattenVisibleFields(entity.fields, {
        keepFirstDuplicate: options?.keepFirstDuplicate,
    });

    const name = pickPromotedStringField(fields, options?.nameFieldAliases ?? DEFAULT_NAME_FIELD_ALIASES);

    const address = pickPromotedStringField(fields, options?.addressFieldAliases ?? DEFAULT_ADDRESS_FIELD_ALIASES);

    return {
        id: entity.id,
        name,
        address,
        fields,
        ...(entity.distance !== undefined && { distance: Math.round(entity.distance) }),
    };
}

/**
 * Factory for creating reusable cleaners per GovMap layer.
 */
export function createEntityCleaner(options?: EntityCleanerOptions) {
    return function cleanEntity(raw: unknown): CleanEntity {
        const entity = GovMapLayerEntitySchema.parse(raw);
        return mapLayerEntityToCleanEntity(entity, options);
    };
}

/**
 * Default generic cleaner.
 */
export const cleanEntity = createEntityCleaner();

/**
 * Example cleaner for a specific layer.
 * Add/remove aliases based on that layer's actual field names.
 */
export const cleanInstitutionEntity = createEntityCleaner({
    nameFieldAliases: ['שם', 'שם מלא', 'שם העסק', 'שם מוסד', 'התחנה'],
    addressFieldAliases: ['כתובת', 'כתובת מלאה', 'מען', 'רחוב'],
});
