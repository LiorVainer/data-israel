'use client';

interface UserGuestBreakdownCardProps {
    title: string;
    total: number;
    active: number;
    conversionPct: number;
    avgThreads: number;
    avgMessages: number;
}

interface MetricRowProps {
    label: string;
    value: string | number;
}

function MetricRow({ label, value }: MetricRowProps) {
    return (
        <div className='flex items-center justify-between py-2'>
            <span className='text-muted-foreground text-sm'>{label}</span>
            <span className='text-sm font-semibold'>{value}</span>
        </div>
    );
}

export function UserGuestBreakdownCard({
    title,
    total,
    active,
    conversionPct,
    avgThreads,
    avgMessages,
}: UserGuestBreakdownCardProps) {
    return (
        <div className='rounded-lg border bg-card p-4'>
            <h3 className='mb-2 text-base font-semibold'>{title}</h3>
            <div className='divide-y'>
                <MetricRow label='סה״כ' value={total} />
                <MetricRow label='פתחו שיחה' value={`${active} (${conversionPct}%)`} />
                <MetricRow label='ממוצע שיחות' value={avgThreads} />
                <MetricRow label='ממוצע הודעות' value={avgMessages} />
            </div>
        </div>
    );
}
