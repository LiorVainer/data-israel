/**
 * Layers-Catalog Constants
 *
 * Layer group definitions for grouped tool queries.
 */

import { z } from 'zod';
import { GOVMAP_LAYERS } from '../govmap.constants';
import type { CleanEntity } from './entity-cleaner';

/** Service/emergency layers for findNearbyServices */
export const SERVICE_LAYER_IDS = [
    GOVMAP_LAYERS.HOSPITALS,
    GOVMAP_LAYERS.POLICE_STATIONS,
    GOVMAP_LAYERS.FIRE_STATIONS,
    GOVMAP_LAYERS.MDA_STATIONS,
    GOVMAP_LAYERS.GAS_STATIONS,
    GOVMAP_LAYERS.BANKS,
    GOVMAP_LAYERS.BUS_STOPS,
] as const;

/** Land/property layers for getParcelInfo */
export const PARCEL_LAYER_IDS = [
    GOVMAP_LAYERS.PARCEL_ALL,
    GOVMAP_LAYERS.SUB_GUSH_ALL,
    GOVMAP_LAYERS.NEIGHBORHOODS,
] as const;

/** Tourism/recreation layers for findNearbyTourism */
export const TOURISM_LAYER_IDS = [
    GOVMAP_LAYERS.HOTELS,
    GOVMAP_LAYERS.ZIMMERS,
    GOVMAP_LAYERS.ATTRACTIONS,
    GOVMAP_LAYERS.WINERIES,
    GOVMAP_LAYERS.ARCHAEOLOGICAL_SITES,
    GOVMAP_LAYERS.SPORTS,
] as const;

/** Context/demographics layers for getLocationContext */
export const CONTEXT_LAYER_IDS = [GOVMAP_LAYERS.NEIGHBORHOODS, GOVMAP_LAYERS.STATISTICAL_AREAS] as const;

// ============================================================================
// Typed Category Unions
// ============================================================================

export type ServiceCategory =
    | 'hospitals'
    | 'policeStations'
    | 'fireStations'
    | 'mdaStations'
    | 'gasStations'
    | 'banks'
    | 'busStops';
export type TourismCategory =
    | 'hotels'
    | 'zimmers'
    | 'attractions'
    | 'wineries'
    | 'archaeologicalSites'
    | 'sportsFacilities';

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

export function emptyServiceResults(): Record<ServiceCategory, CleanEntity[]> {
    return {
        hospitals: [],
        policeStations: [],
        fireStations: [],
        mdaStations: [],
        gasStations: [],
        banks: [],
        busStops: [],
    };
}

export function emptyTourismResults(): Record<TourismCategory, CleanEntity[]> {
    return {
        hotels: [],
        zimmers: [],
        attractions: [],
        wineries: [],
        archaeologicalSites: [],
        sportsFacilities: [],
    };
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
