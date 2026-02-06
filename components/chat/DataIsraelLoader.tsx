'use client';

import Image from 'next/image';

export interface DataIsraelLoaderProps {
    size?: number;
}

export function DataIsraelLoader({ size = 20 }: DataIsraelLoaderProps) {
    return (
        <Image
            src='/data-israel.svg'
            alt='טוען...'
            width={size}
            height={size}
            className='inline-block animate-spin'
        />
    );
}
