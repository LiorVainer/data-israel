/**
 * Layers-Catalog Constants
 *
 * Layer group definitions for grouped tool queries.
 */

import { z } from 'zod';
import { GOVMAP_LAYERS } from '../govmap.constants';
import { typedKeys, typedValues } from '@/lib/typescript/typed-object';
import type { CleanEntity } from './entity-cleaner';

// ============================================================================
// Category -> Layer ID (single source of truth for service / tourism groups)
// ============================================================================

/** Category key -> GovMap layer id for the "nearby services" tool */
export const SERVICE_CATEGORY_TO_LAYER_ID = {
    hospitals: GOVMAP_LAYERS.HOSPITALS,
    policeStations: GOVMAP_LAYERS.POLICE_STATIONS,
    fireStations: GOVMAP_LAYERS.FIRE_STATIONS,
    mdaStations: GOVMAP_LAYERS.MDA_STATIONS,
    gasStations: GOVMAP_LAYERS.GAS_STATIONS,
    banks: GOVMAP_LAYERS.BANKS,
    busStops: GOVMAP_LAYERS.BUS_STOPS,
} as const;

/** Category key -> GovMap layer id for the "nearby tourism" tool */
export const TOURISM_CATEGORY_TO_LAYER_ID = {
    hotels: GOVMAP_LAYERS.HOTELS,
    zimmers: GOVMAP_LAYERS.ZIMMERS,
    attractions: GOVMAP_LAYERS.ATTRACTIONS,
    wineries: GOVMAP_LAYERS.WINERIES,
    archaeologicalSites: GOVMAP_LAYERS.ARCHAEOLOGICAL_SITES,
    sportsFacilities: GOVMAP_LAYERS.SPORTS,
} as const;

// ============================================================================
// Derived: category unions, Zod enums, layer id tuples
// ============================================================================

export type ServiceCategory = keyof typeof SERVICE_CATEGORY_TO_LAYER_ID;
export type TourismCategory = keyof typeof TOURISM_CATEGORY_TO_LAYER_ID;

const SERVICE_CATEGORY_KEYS = typedKeys(SERVICE_CATEGORY_TO_LAYER_ID);
const TOURISM_CATEGORY_KEYS = typedKeys(TOURISM_CATEGORY_TO_LAYER_ID);

export const serviceCategorySchema = z.enum(SERVICE_CATEGORY_KEYS as [ServiceCategory, ...ServiceCategory[]]);
export const tourismCategorySchema = z.enum(TOURISM_CATEGORY_KEYS as [TourismCategory, ...TourismCategory[]]);

/** Service/emergency layers for findNearbyServices */
export const SERVICE_LAYER_IDS: readonly string[] = typedValues(SERVICE_CATEGORY_TO_LAYER_ID);

/** Tourism/recreation layers for findNearbyTourism */
export const TOURISM_LAYER_IDS: readonly string[] = typedValues(TOURISM_CATEGORY_TO_LAYER_ID);

/** Land/property layers for getParcelInfo */
export const PARCEL_LAYER_IDS = [
    GOVMAP_LAYERS.PARCEL_ALL,
    GOVMAP_LAYERS.SUB_GUSH_ALL,
    GOVMAP_LAYERS.NEIGHBORHOODS,
] as const;

/** Context/demographics layers for getLocationContext */
export const CONTEXT_LAYER_IDS = [GOVMAP_LAYERS.NEIGHBORHOODS, GOVMAP_LAYERS.STATISTICAL_AREAS] as const;

// ============================================================================
// Hebrew labels + tool description / describe string builders
// ============================================================================

export const SERVICE_CATEGORY_HEBREW: Record<ServiceCategory, string> = {
    hospitals: 'בתי חולים',
    policeStations: 'תחנות משטרה',
    fireStations: 'כיבוי אש',
    mdaStations: 'מד"א',
    gasStations: 'תחנות דלק',
    banks: 'בנקים',
    busStops: 'תחנות אוטובוס',
};

export const TOURISM_CATEGORY_HEBREW: Record<TourismCategory, string> = {
    hotels: 'בתי מלון',
    zimmers: 'צימרים',
    attractions: 'אטרקציות',
    wineries: 'יקבים',
    archaeologicalSites: 'אתרי עתיקות',
    sportsFacilities: 'מתקני ספורט',
};

function buildCategoriesDescribe<K extends string>(hebrew: Record<K, string>): string {
    const pairs = (Object.entries(hebrew) as [K, string][])
        .map(([key, label]) => '"' + key + '" (' + label + ')')
        .join(', ');
    return (
        'סוגים לחיפוש. אם המשתמש שואל על סוג ספציפי — העבר רק אותו כדי לצמצם את שכבות המפה שיוצגו בקישור לפורטל. ערכים אפשריים: ' +
        pairs +
        '. ברירת מחדל: כל הסוגים'
    );
}

function buildFilterSuffix(keys: readonly string[]): string {
    return (
        'אפשר לצמצם לסוגים ספציפיים דרך `categories` (' + keys.join(' | ') + '). ללא `categories` — מחזיר את כל הסוגים'
    );
}

export const SERVICE_CATEGORIES_DESCRIBE = buildCategoriesDescribe(SERVICE_CATEGORY_HEBREW);
export const TOURISM_CATEGORIES_DESCRIBE = buildCategoriesDescribe(TOURISM_CATEGORY_HEBREW);
export const SERVICE_FILTER_SUFFIX = buildFilterSuffix(SERVICE_CATEGORY_KEYS);
export const TOURISM_FILTER_SUFFIX = buildFilterSuffix(TOURISM_CATEGORY_KEYS);

/** Maps layer technical names (returned in response) to human-readable category keys */
export const LAYER_NAME_TO_SERVICE_KEY: Record<string, ServiceCategory> = {
    emergancy_hospitals: 'hospitals',
    police_yehida_location: 'policeStations',
    fire_stations: 'fireStations',
    mada_stations: 'mdaStations',
    gasstations: 'gasStations',
    banks: 'banks',
    bus_stops: 'busStops',
};

export const LAYER_NAME_TO_TOURISM_KEY: Record<string, TourismCategory> = {
    hotels: 'hotels',
    zimmer: 'zimmers',
    atractions: 'attractions',
    winery: 'wineries',
    atikot_sites_itm: 'archaeologicalSites',
    sport: 'sportsFacilities',
};

/** Common primary name field names across layers (Hebrew display names) */
export const PRIMARY_NAME_FIELDS = ['שם', 'שם התחנה', 'שם בנק', 'שם מתקן', 'שם אתר', 'שם שכונה/אזור'];
export const PRIMARY_ADDRESS_FIELDS = ['כתובת', 'כתובת האתר'];

// ============================================================================
// Typed Category Lookup Functions
// ============================================================================

export function getServiceCategory(layerName: string): ServiceCategory | undefined {
    return LAYER_NAME_TO_SERVICE_KEY[layerName];
}

export function getTourismCategory(layerName: string): TourismCategory | undefined {
    return LAYER_NAME_TO_TOURISM_KEY[layerName];
}

// ============================================================================
// Empty Result Factories
// ============================================================================

function emptyResultsFrom<K extends string>(keys: readonly K[]): Record<K, CleanEntity[]> {
    const result = {} as Record<K, CleanEntity[]>;
    for (const key of keys) result[key] = [];
    return result;
}

export function emptyServiceResults(): Record<ServiceCategory, CleanEntity[]> {
    return emptyResultsFrom(SERVICE_CATEGORY_KEYS);
}

export function emptyTourismResults(): Record<TourismCategory, CleanEntity[]> {
    return emptyResultsFrom(TOURISM_CATEGORY_KEYS);
}

// ============================================================================
// Shared CleanEntity Zod Schema (used by tool output schemas)
// ============================================================================

/** Zod schema matching the CleanEntity interface — for use in tool output schemas */
export const cleanEntitySchema = z.object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().optional(),
    address: z.string().optional(),
    fields: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
    distance: z.number().optional().describe('Distance in meters from the search point'),
    centroid: z.tuple([z.number(), z.number()]).optional().describe('X,Y coordinates of the entity'),
});

// ============================================================================
// Zod Field Schemas — parse raw entity fields into typed objects
// ============================================================================

const coerceString = z.coerce.string();

export const neighborhoodFieldsSchema = z
    .object({
        'שם שכונה/אזור': coerceString,
        'שם ישוב': coerceString,
    })
    .transform(({ 'שם שכונה/אזור': name, 'שם ישוב': settlement }) => ({
        name,
        settlement,
    }));

export type NeighborhoodFields = z.infer<typeof neighborhoodFieldsSchema>;

export const statisticalAreaFieldsSchema = z
    .object({
        'אזור סטטיסטי 2008': coerceString.optional(),
        'אוכלוסיה (באלפים)': coerceString.optional(),
        מחוז: coerceString.optional(),
        נפה: coerceString.optional(),
        'אזור טבעי': coerceString.optional(),
        'דת עיקרית לישוב': coerceString.optional(),
        'צורת ישוב': coerceString.optional(),
        'שנת יסוד': coerceString.optional(),
    })
    .transform((data) => ({
        code: data['אזור סטטיסטי 2008'],
        population: data['אוכלוסיה (באלפים)'],
        district: data['מחוז'],
        subDistrict: data['נפה'],
        naturalRegion: data['אזור טבעי'],
        mainReligion: data['דת עיקרית לישוב'],
        settlementType: data['צורת ישוב'],
        yearEstablished: data['שנת יסוד'],
    }));

export type StatisticalAreaFields = z.infer<typeof statisticalAreaFieldsSchema>;

export const parcelFieldsSchema = z
    .object({
        'מספר גוש': coerceString.optional(),
        חלקה: coerceString.optional(),
        'תת גוש': coerceString.nullable().optional(),
        'שטח רשום (מ"ר)': coerceString.optional(),
        סטטוס: coerceString.optional(),
        הערה: coerceString.optional(),
    })
    .transform((data) => ({
        gushNum: data['מספר גוש'],
        parcel: data['חלקה'],
        gushSuffix: data['תת גוש'] ?? undefined,
        legalArea: data['שטח רשום (מ"ר)'],
        status: data['סטטוס'],
        note: data['הערה'],
    }));

export type ParcelFields = z.infer<typeof parcelFieldsSchema>;

export const blockFieldsSchema = z
    .object({
        'מספר גוש': coerceString.optional(),
        סטטוס: coerceString.optional(),
    })
    .transform((data) => ({
        gushNum: data['מספר גוש'],
        status: data['סטטוס'],
    }));

export type BlockFields = z.infer<typeof blockFieldsSchema>;
