import { describe, expect, it } from 'vitest';
import {
    GOVMAP_BASE_URL,
    GOVMAP_PORTAL_BASE_URL,
    buildGovmapUrl,
    buildGovmapPortalUrl,
    buildLayerMetadataUrl,
} from '../api/govmap.endpoints';

describe('buildGovmapUrl', () => {
    it('normalizes path with leading slash', () => {
        const url = buildGovmapUrl('/search-service/autocomplete');
        expect(url).toBe(`${GOVMAP_BASE_URL}/search-service/autocomplete`);
    });

    it('normalizes path without leading slash', () => {
        const url = buildGovmapUrl('search-service/autocomplete');
        expect(url).toBe(`${GOVMAP_BASE_URL}/search-service/autocomplete`);
    });

    it('appends query params', () => {
        const url = buildGovmapUrl('/test', { q: 'hello', limit: 10 });
        const parsed = new URL(url);
        expect(parsed.searchParams.get('q')).toBe('hello');
        expect(parsed.searchParams.get('limit')).toBe('10');
    });

    it('omits undefined and null params', () => {
        const url = buildGovmapUrl('/test', { a: 'keep', b: undefined, c: null, d: 0 });
        const parsed = new URL(url);
        expect(parsed.searchParams.get('a')).toBe('keep');
        expect(parsed.searchParams.has('b')).toBe(false);
        expect(parsed.searchParams.has('c')).toBe(false);
        expect(parsed.searchParams.get('d')).toBe('0');
    });
});

describe('buildLayerMetadataUrl', () => {
    it('encodes the layer id in the URL', () => {
        const url = buildLayerMetadataUrl('bus_stops');
        expect(url).toBe(`${GOVMAP_BASE_URL}/layers-catalog/layer/bus_stops/metadata`);
    });

    it('encodes special characters in the layer id', () => {
        const url = buildLayerMetadataUrl('layer with spaces');
        expect(url).toContain('layer%20with%20spaces');
        expect(url).toContain('/layers-catalog/layer/');
        expect(url).toContain('/metadata');
    });
});

describe('buildGovmapPortalUrl — positional overload', () => {
    it('returns base URL when no arguments provided', () => {
        const url = buildGovmapPortalUrl();
        expect(url).toBe(`${GOVMAP_PORTAL_BASE_URL}/`);
    });

    it('builds URL with coordinates and default zoom', () => {
        const url = buildGovmapPortalUrl(182595, 655716);
        const parsed = new URL(url);
        expect(parsed.searchParams.get('c')).toBe('182595,655716');
        expect(parsed.searchParams.get('z')).toBe('6');
    });

    it('builds URL with query parameter', () => {
        const url = buildGovmapPortalUrl(undefined, undefined, 'תל אביב');
        const parsed = new URL(url);
        expect(parsed.searchParams.get('q')).toBe('תל אביב');
        expect(parsed.searchParams.has('c')).toBe(false);
    });

    it('builds URL with a single layer', () => {
        const url = buildGovmapPortalUrl(undefined, undefined, undefined, 'NADLAN');
        const parsed = new URL(url);
        expect(parsed.searchParams.get('lay')).toBe('NADLAN');
    });

    it('builds URL with multiple layers', () => {
        const url = buildGovmapPortalUrl(undefined, undefined, undefined, ['NADLAN', 'bus_stops']);
        const parsed = new URL(url);
        expect(parsed.searchParams.get('lay')).toBe('NADLAN,bus_stops');
    });
});

describe('buildGovmapPortalUrl — options overload', () => {
    it('builds URL with full options object', () => {
        const url = buildGovmapPortalUrl({
            longitude: 182595,
            latitude: 655716,
            zoom: 8,
            query: 'חיפה',
            layers: ['NADLAN', 'bus_stops'],
        });
        const parsed = new URL(url);
        expect(parsed.searchParams.get('c')).toBe('182595,655716');
        expect(parsed.searchParams.get('z')).toBe('8');
        expect(parsed.searchParams.get('q')).toBe('חיפה');
        expect(parsed.searchParams.get('lay')).toBe('NADLAN,bus_stops');
    });

    it('adds bs param when selectedEntity is provided', () => {
        const url = buildGovmapPortalUrl({
            longitude: 182595,
            latitude: 655716,
            selectedEntity: { layer: 'bus_stops', centroid: [182000, 655000] },
        });
        const parsed = new URL(url);
        expect(parsed.searchParams.get('bs')).toBe('bus_stops|182000,655000');
    });

    it('supports custom zoom level', () => {
        const url = buildGovmapPortalUrl({
            longitude: 182595,
            latitude: 655716,
            zoom: 10,
        });
        const parsed = new URL(url);
        expect(parsed.searchParams.get('z')).toBe('10');
    });

    it('omits bs when selectedEntity is undefined', () => {
        const url = buildGovmapPortalUrl({
            longitude: 182595,
            latitude: 655716,
        });
        const parsed = new URL(url);
        expect(parsed.searchParams.has('bs')).toBe(false);
    });

    it('returns base URL for empty options', () => {
        const url = buildGovmapPortalUrl({});
        expect(url).toBe(`${GOVMAP_PORTAL_BASE_URL}/`);
    });
});
