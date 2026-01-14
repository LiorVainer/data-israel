'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CopyButton } from '@/components/animate-ui/buttons/copy';
import { WebsiteSuggestion } from '@/models/website-suggestion.model';
import { Folder } from 'lucide-react';
import { api } from '@convex/api';
import { useMutation, useQuery } from 'convex/react';
import { Button } from '../ui/button';
import { AuthSensitiveWrapper } from '@/components/wrappers/AuthSensitiveWrapper';
import { Dialog, DialogTrigger } from '../ui/dialog';
import { BookmarkSaveModal } from '@/components/bookmarks/BookmarkSaveModal';
import { WebsiteLogo } from '@/components/websites/WebsiteLogo';
import { WebsitesVotes } from '@/components/website-suggestions/WebsitesVotes';
import { useEffect } from 'react';

interface WebsiteSuggestionCardProps {
    websiteSuggestion: WebsiteSuggestion;
}

const RESPONSE_STREAM_SPEED = 30; // Adjust speed as needed

export const WebsiteSuggestionCard = ({ websiteSuggestion }: WebsiteSuggestionCardProps) => {
    const video = websiteSuggestion?.videosOfWebsite?.[0];
    const videoUrl = video?.url;
    const videoId = videoUrl?.split('v=')[1]?.split('&')[0];
    // Fallback thumbnail sizes: default → mqdefault → hqdefault
    const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
    const addWebsiteIfNotExists = useMutation(api.websites.addWebsiteIfNotExists);

    const website = useQuery(
        api.websites.getWebsiteByUrl,
        websiteSuggestion?.url ? { url: websiteSuggestion.url } : 'skip',
    );

    useEffect(() => {
        if (!website) {
            // Only call if website doesn't exist
            void addWebsiteIfNotExists({
                url: websiteSuggestion.url,
                name: websiteSuggestion.title,
                description: websiteSuggestion.description,
            });
        }
    }, [addWebsiteIfNotExists, website, websiteSuggestion.description, websiteSuggestion.title, websiteSuggestion.url]);

    return (
        <Card className='transition hover:shadow-md dark:hover:shadow-lg border border-border py-4 @xl/main:py-6'>
            <CardContent className='space-y-4 px-4 @xl/main:px-6'>
                <div className='flex flex-col-reverse gap-6 @xl/main:flex-row @xl/main:justify-between items-start'>
                    <div className='flex items-center gap-3'>
                        {websiteSuggestion?.url && <WebsiteLogo url={websiteSuggestion?.url} />}
                        <a
                            href={websiteSuggestion?.url ?? '#'}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline text-nowrap'
                        >
                            {websiteSuggestion?.title}
                        </a>
                        {websiteSuggestion?.url && (
                            <CopyButton variant='outline' content={websiteSuggestion?.url} size='sm' />
                        )}
                    </div>
                    <div className='flex flex-row-reverse gap-4 justify-between lg:justify-end w-full md:w-fit @xl/main:items-center justify-between'>
                        <div className='flex gap-2'>
                            <AuthSensitiveWrapper>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button size='sm'>Save</Button>
                                    </DialogTrigger>
                                    <BookmarkSaveModal websiteSuggestion={websiteSuggestion as WebsiteSuggestion} />
                                </Dialog>
                            </AuthSensitiveWrapper>
                        </div>
                        {website && <WebsitesVotes website={website} />}
                    </div>
                </div>

                {/*{websiteSuggestion?.url && (*/}
                {/*    <WebPreview defaultUrl={websiteSuggestion.url} style={{ height: '400px' }}>*/}
                {/*        <WebPreviewNavigation>*/}
                {/*            <WebPreviewUrl src={websiteSuggestion.url} />*/}
                {/*        </WebPreviewNavigation>*/}
                {/*        <WebPreviewBody src={websiteSuggestion.url} />*/}
                {/*    </WebPreview>*/}
                {/*)}*/}

                <div className='grid grid-cols-1 md:grid-cols-8 gap-6 items-center '>
                    <div className='col-span-1 md:col-span-5 flex flex-col justify-between gap-4 h-full'>
                        <div className='flex flex-col gap-2'>
                            <p className='text-sm text-gray-700 dark:text-gray-300'>{websiteSuggestion?.description}</p>
                        </div>

                        <div className='flex flex-col gap-2'>
                            {websiteSuggestion?.tags && websiteSuggestion?.tags?.length > 0 && (
                                <div className='flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 pt-1'>
                                    {websiteSuggestion.tags.map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className='bg-muted dark:bg-slate-800 px-2 py-0.5 rounded-full border border-border dark:border-slate-600'
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {websiteSuggestion?.suggestedFolderPath &&
                                websiteSuggestion?.suggestedFolderPath?.length > 0 && (
                                    <div className='flex items-center gap-1 text-xs text-purple-500 dark:text-purple-400'>
                                        <Folder className='w-3.5 h-3.5 shrink-0' />
                                        <span className='truncate'>
                                            {websiteSuggestion.suggestedFolderPath.join(' / ')}
                                        </span>
                                    </div>
                                )}
                        </div>
                    </div>
                    {thumbnail && videoUrl && (
                        <a
                            href={videoUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='col-span-3 hidden block'
                        >
                            <img
                                src={thumbnail}
                                alt={video?.title}
                                className='hidden md:block w-full aspect-16/9 rounded-xl'
                            />
                        </a>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
