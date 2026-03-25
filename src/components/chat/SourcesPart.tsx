'use client';

import { useMemo } from 'react';
import { Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources';
import { DATA_SOURCE_CONFIG, type DataSource } from '@/data-sources/registry';
import { ChevronDownIcon, CodeIcon, ExternalLinkIcon, GlobeIcon } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { EnrichedSourceUrl } from './types';

/** Provider group key including 'other' for unclassified sources */
type GroupKey = DataSource | 'other';

interface ProviderGroup {
    portal: EnrichedSourceUrl[];
    api: EnrichedSourceUrl[];
}

/** Display config per provider group — full Hebrew names for readability */
const PROVIDER_DISPLAY: Record<
    GroupKey,
    { nameLabel: string; summaryLabel: string; borderClass: string; tintClass: string }
> = {
    datagov: {
        nameLabel: 'מידע ממשלתי — data.gov.il',
        summaryLabel: DATA_SOURCE_CONFIG.datagov.nameLabel,
        borderClass: 'border-r-badge-datagov',
        tintClass: 'bg-badge-datagov/10 text-badge-datagov-foreground',
    },
    cbs: {
        nameLabel: 'הלשכה המרכזית לסטטיסטיקה',
        summaryLabel: 'הלמ"ס',
        borderClass: 'border-r-badge-cbs',
        tintClass: 'bg-badge-cbs/10 text-badge-cbs-foreground',
    },
    budget: {
        nameLabel: 'תקציב המדינה — מפתח התקציב',
        summaryLabel: DATA_SOURCE_CONFIG.budget.nameLabel,
        borderClass: 'border-r-badge-budget',
        tintClass: 'bg-badge-budget/10 text-badge-budget-foreground',
    },
    nadlan: {
        nameLabel: 'עסקאות נדל"ן — govmap.gov.il',
        summaryLabel: DATA_SOURCE_CONFIG.nadlan.nameLabel,
        borderClass: 'border-r-badge-nadlan',
        tintClass: 'bg-badge-nadlan/10 text-badge-nadlan-foreground',
    },
    drugs: {
        nameLabel: 'מאגר התרופות — משרד הבריאות',
        summaryLabel: DATA_SOURCE_CONFIG.drugs.nameLabel,
        borderClass: 'border-r-badge-drugs',
        tintClass: 'bg-badge-drugs/10 text-badge-drugs-foreground',
    },
    health: {
        nameLabel: 'נתוני בריאות — משרד הבריאות',
        summaryLabel: DATA_SOURCE_CONFIG.health.nameLabel,
        borderClass: 'border-r-badge-health',
        tintClass: 'bg-badge-health/10 text-badge-health-foreground',
    },
    grocery: {
        nameLabel: 'מחירי מזון — סופרמרקטים',
        summaryLabel: DATA_SOURCE_CONFIG.grocery.nameLabel,
        borderClass: 'border-r-badge-grocery',
        tintClass: 'bg-badge-grocery/10 text-badge-grocery-foreground',
    },
    knesset: {
        nameLabel: 'הכנסת — הצעות חוק וועדות',
        summaryLabel: 'כנסת',
        borderClass: 'border-r-badge-knesset',
        tintClass: 'bg-badge-knesset/10 text-badge-knesset-foreground',
    },
    other: {
        nameLabel: 'מקורות נוספים',
        summaryLabel: 'אחר',
        borderClass: 'border-r-muted-foreground/40',
        tintClass: 'bg-muted/30 text-muted-foreground',
    },
};

/** Ordered keys for rendering sections */
const PROVIDER_ORDER: GroupKey[] = [
    'datagov',
    'cbs',
    'budget',
    'knesset',
    'nadlan',
    'drugs',
    'health',
    'grocery',
    'other',
];

export interface SourcesPartProps {
    sources: EnrichedSourceUrl[];
}

export function SourcesPart({ sources }: SourcesPartProps) {
    const grouped = useMemo(() => {
        const groups: Record<GroupKey, ProviderGroup> = {
            datagov: { portal: [], api: [] },
            cbs: { portal: [], api: [] },
            budget: { portal: [], api: [] },
            nadlan: { portal: [], api: [] },
            drugs: { portal: [], api: [] },
            health: { portal: [], api: [] },
            grocery: { portal: [], api: [] },
            knesset: { portal: [], api: [] },
            other: { portal: [], api: [] },
        };
        for (const s of sources) {
            const key: GroupKey = s.dataSource && s.dataSource in groups ? s.dataSource : 'other';
            groups[key][s.urlType].push(s);
        }
        return groups;
    }, [sources]);

    const providerSummary = useMemo(() => {
        const parts: string[] = [];
        for (const key of PROVIDER_ORDER) {
            const group = grouped[key];
            const count = group.portal.length + group.api.length;
            if (count > 0) {
                parts.push(`${PROVIDER_DISPLAY[key].summaryLabel} ${count}`);
            }
        }
        return parts.length > 1 ? parts.join(' \u00b7 ') : '';
    }, [grouped]);

    if (sources.length === 0) return null;

    return (
        <Sources className='mb-0'>
            <SourcesTrigger count={sources.length}>
                <span className='font-medium'>
                    המידע הגיע מ-{sources.length} מקורות
                    {providerSummary && `: ${providerSummary}`}
                </span>
                <ChevronDownIcon className='h-4 w-4' />
            </SourcesTrigger>
            <SourcesContent className='w-full flex-col gap-4'>
                {PROVIDER_ORDER.map((key) => {
                    const group = grouped[key];
                    const total = group.portal.length + group.api.length;
                    if (total === 0) return null;
                    return <ProviderSection key={key} groupKey={key} group={group} />;
                })}
            </SourcesContent>
        </Sources>
    );
}

// ---------------------------------------------------------------------------
// Provider Section
// ---------------------------------------------------------------------------

interface ProviderSectionProps {
    groupKey: GroupKey;
    group: ProviderGroup;
}

function ProviderSection({ groupKey, group }: ProviderSectionProps) {
    const display = PROVIDER_DISPLAY[groupKey];
    const hasPortal = group.portal.length > 0;
    const hasApi = group.api.length > 0;

    return (
        <div className={cn('border-r-2 space-y-3', display.borderClass)}>
            {/* Provider header badge */}
            <span className={cn('inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold', display.tintClass)}>
                {display.nameLabel}
            </span>

            {/* Portal links */}
            {hasPortal && (
                <SubSourceGroup icon={<GlobeIcon className='h-3 w-3' />} label='דפי מקור' count={group.portal.length}>
                    {group.portal.map((source) => (
                        <SourceLink key={source.sourceId} source={source} icon='portal' className={display.tintClass} />
                    ))}
                </SubSourceGroup>
            )}

            {/* API / raw data links */}
            {hasApi && (
                <SubSourceGroup icon={<CodeIcon className='h-3 w-3' />} label='מידע גולמי' count={group.api.length}>
                    {group.api.map((source) => (
                        <SourceLink
                            key={source.sourceId}
                            source={source}
                            icon='api'
                            className='bg-muted/30 text-muted-foreground'
                        />
                    ))}
                </SubSourceGroup>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Sub Source Group (nested collapsible — styled differently from root)
// ---------------------------------------------------------------------------

interface SubSourceGroupProps {
    icon: React.ReactNode;
    label: string;
    count: number;
    children: React.ReactNode;
}

function SubSourceGroup({ icon, label, count, children }: SubSourceGroupProps) {
    return (
        <Collapsible>
            <CollapsibleTrigger className='flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pr-3'>
                {icon}
                <span>
                    {label} ({count})
                </span>
                <ChevronDownIcon className='h-3 w-3 transition-transform duration-200 [[data-state=open]>&]:rotate-180' />
            </CollapsibleTrigger>
            <CollapsibleContent className='mt-1.5 space-y-1 pr-3'>{children}</CollapsibleContent>
        </Collapsible>
    );
}

// ---------------------------------------------------------------------------
// Single Source Link
// ---------------------------------------------------------------------------

interface SourceLinkProps {
    source: EnrichedSourceUrl;
    icon: 'portal' | 'api';
    className?: string;
}

/** Format URL for display — hostname + path (up to 6 segments) + query params, max 100 chars */
function formatUrlForDisplay(url: string): string {
    try {
        const parsed = new URL(url);
        const segments = parsed.pathname.split('/').filter(Boolean).slice(0, 6);
        const path = segments.length > 0 ? '/' + segments.join('/') : '';
        const query = parsed.search ? parsed.search : '';
        const display = parsed.hostname + path + query;
        return display.length > 100 ? display.slice(0, 100) + '…' : display;
    } catch {
        return url.slice(0, 100);
    }
}

function SourceLink({ source, icon, className }: SourceLinkProps) {
    const Icon = icon === 'portal' ? GlobeIcon : CodeIcon;

    return (
        <a
            href={source.url}
            target='_blank'
            rel='noreferrer'
            className={cn(
                'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors hover:opacity-80',
                className,
            )}
        >
            <Icon className='h-3.5 w-3.5 shrink-0' />
            <span className='truncate flex-1 min-w-0'>{source.title ?? new URL(source.url).hostname}</span>
            <span
                className='hidden md:inline truncate max-w-[300px] text-[11px] opacity-60 text-muted-foreground'
                dir='ltr'
            >
                {formatUrlForDisplay(source.url)}
            </span>
            <ExternalLinkIcon className='h-3 w-3 shrink-0 mr-auto opacity-50' />
        </a>
    );
}
