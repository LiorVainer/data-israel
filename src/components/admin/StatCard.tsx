'use client';

interface StatCardProps {
    label: string;
    value: string | number;
    subtitle?: string;
}

export function StatCard({ label, value, subtitle }: StatCardProps) {
    return (
        <div className='rounded-lg border bg-card px-3 py-3 sm:p-4'>
            <p className='text-muted-foreground text-xs sm:text-sm'>{label}</p>
            <p className='mt-0.5 text-2xl font-bold tracking-tight sm:mt-1 sm:text-3xl'>{value}</p>
            {subtitle !== undefined && <p className='text-muted-foreground mt-0.5 text-xs'>{subtitle}</p>}
        </div>
    );
}
