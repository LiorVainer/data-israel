import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { LandingConfig, DataSourceConfig } from '@/data-sources/types';
import type { AgentDisplayInfo } from '@/data-sources/types';

interface SourceCardProps {
    source: {
        id: string;
        landing: LandingConfig;
        badge: DataSourceConfig;
        display: AgentDisplayInfo;
    };
}

/** Known logo files in /public */
const LOGO_FILES = new Set(['datagov-logo.svg', 'cbs-logo.svg']);

function hasLogoFile(logo: string): boolean {
    const filename = logo.replace(/^\//, '');
    return LOGO_FILES.has(filename);
}

export function SourceCard({ source }: SourceCardProps) {
    const { landing, badge, display } = source;
    const DisplayIcon = display.icon;

    return (
        <Card className='group relative overflow-hidden transition-shadow hover:shadow-md'>
            <CardHeader className='flex flex-col items-center gap-4'>
                <a
                    href={badge.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='hover:opacity-70 transition-opacity'
                >
                    {hasLogoFile(landing.logo) ? (
                        <Image src={landing.logo} alt={badge.nameLabel} width={120} height={50} />
                    ) : (
                        <div className='flex flex-col items-center gap-2'>
                            <DisplayIcon className='w-10 h-10 text-primary' />
                            <span className='text-sm font-semibold text-foreground'>{badge.nameLabel}</span>
                        </div>
                    )}
                </a>
                <p className='text-sm text-muted-foreground text-center leading-relaxed'>{landing.description}</p>
            </CardHeader>

            <CardContent className='flex flex-col gap-4'>
                <div className='grid grid-cols-3 gap-3'>
                    {landing.stats.map((stat) => (
                        <div key={stat.label} className='flex flex-col items-center gap-1.5 text-center'>
                            <div className='flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary'>
                                <stat.icon className='w-4 h-4' />
                            </div>
                            <span className='text-lg font-bold tabular-nums text-foreground'>{stat.value}</span>
                            <span className='text-xs text-muted-foreground'>{stat.label}</span>
                        </div>
                    ))}
                </div>

                <a
                    href={badge.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors pt-2 border-t border-border/50'
                >
                    <span>{badge.urlLabel}</span>
                    <ExternalLink className='w-3 h-3' />
                </a>
            </CardContent>
        </Card>
    );
}
