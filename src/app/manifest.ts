import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'דאטה ישראל',
        short_name: 'דאטה ישראל',
        description: 'מערכת בינה מלאכותית המחוברת למאגרי המידע הציבוריים של ישראל.',
        start_url: '/',
        display: 'standalone',
        dir: 'rtl',
        lang: 'he',
        theme_color: '#2d4b8e',
        background_color: '#f7f8fc',
        icons: [
            {
                src: '/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
        ],
    };
}
