'use client';

import { DATA_SOURCE_CONFIG } from '@/constants/tool-data-sources';

export function Footer() {
    return (
        <footer className='w-full border-t border-border/40 bg-card/40 backdrop-blur-sm'>
            <div className='max-w-4xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground'>
                <div className='flex items-center gap-1'>
                    <span>מבוסס על נתונים ממקורות רשמיים של ממשלת ישראל</span>
                </div>

                <div className='flex items-center gap-4'>
                    <a
                        href={DATA_SOURCE_CONFIG.datagov.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='hover:text-foreground transition-colors'
                    >
                        data.gov.il
                    </a>
                    <span className='text-border'>|</span>
                    <a
                        href={DATA_SOURCE_CONFIG.cbs.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='hover:text-foreground transition-colors'
                    >
                        הלמ&quot;ס
                    </a>
                </div>
            </div>
        </footer>
    );
}
