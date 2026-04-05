/**
 * IL Health API Endpoint Definitions
 *
 * Provides constants and URL builders for the Israeli Ministry of Health
 * data dashboard API (datadashboard.health.gov.il).
 *
 * All requests are GET with JSON responses.
 */

// ============================================================================
// Base URLs
// ============================================================================

/** Base URL for health dashboard metadata (subject info) */
export const HEALTH_METADATA_BASE_URL = 'https://datadashboard.health.gov.il/api/content/dashboard';

/** Base URL for health dashboard data endpoints */
export const HEALTH_DATA_BASE_URL = 'https://datadashboard.health.gov.il/api';

// ============================================================================
// Available Subjects
// ============================================================================

/** Available health data subjects */
export const HEALTH_SUBJECTS = [
    'warCasualties',
    'medicalServices',
    'beaches',
    'HMO_insured_main',
    'childKi',
    'childCheckup',
    'serviceQuality',
] as const;

/** Type for valid health subject keys */
export type HealthSubject = (typeof HEALTH_SUBJECTS)[number];

/** Subject metadata with Hebrew names and descriptions */
export const HEALTH_SUBJECTS_INFO: Record<HealthSubject, { name: string; description: string }> = {
    warCasualties: {
        name: 'נפגעי מלחמה',
        description: 'נתוני נפגעי מלחמה ופעולות איבה',
    },
    medicalServices: {
        name: 'שירותי רפואה',
        description: 'נתונים על שירותי רפואה ובתי חולים',
    },
    beaches: {
        name: 'חופים',
        description: 'איכות מי רחצה בחופי ישראל',
    },
    HMO_insured_main: {
        name: 'מבוטחי קופות חולים',
        description: 'נתוני מבוטחים בקופות החולים השונות',
    },
    childKi: {
        name: 'חיסוני ילדים',
        description: 'נתוני חיסוני ילדים ותינוקות',
    },
    childCheckup: {
        name: 'בדיקות ילדים',
        description: 'נתוני בדיקות התפתחותיות לילדים',
    },
    serviceQuality: {
        name: 'איכות שירות',
        description: 'מדדי איכות השירות במערכת הבריאות',
    },
};

// ============================================================================
// URL Builder Functions
// ============================================================================

/**
 * Builds a metadata URL for a specific health subject.
 *
 * @param subject - The health subject key
 * @returns Metadata API URL
 *
 * @example
 * buildHealthMetadataUrl('beaches')
 * // Returns: "https://datadashboard.health.gov.il/api/content/dashboard/beaches"
 */
export function buildHealthMetadataUrl(subject: HealthSubject): string {
    return `${HEALTH_METADATA_BASE_URL}/${subject}`;
}

/**
 * Builds a data endpoint URL.
 *
 * @param endpointName - The endpoint name from metadata
 * @returns Data API URL
 *
 * @example
 * buildHealthDataUrl('beachWaterQuality')
 * // Returns: "https://datadashboard.health.gov.il/api/beachWaterQuality"
 */
export function buildHealthDataUrl(endpointName: string): string {
    return `${HEALTH_DATA_BASE_URL}/${endpointName}`;
}

/**
 * Builds a portal URL for the health data dashboard.
 *
 * @param subject - Optional subject for direct link
 * @returns Portal URL
 */
export function buildHealthPortalUrl(subject?: string): string {
    if (subject) {
        return `https://datadashboard.health.gov.il/dashboard/${encodeURIComponent(subject)}`;
    }
    return 'https://datadashboard.health.gov.il';
}
