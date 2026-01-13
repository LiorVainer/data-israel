import { WebsiteSuggestionCard } from '@/components/website-suggestions/WebsiteSuggestionCard';
import { THREADS_MESSAGES_PAGE_SIZE, useWebsiteSuggestions } from '@/context/WebsiteSuggestionsContext';
import { WebsiteSuggestionCardSkeleton } from '@/components/website-suggestions/WebsiteSuggestionCardSkeleton';
import { TextShimmer } from '@/components/ui/text-shimmer';
import { LoadMoreButton } from '@/components/LoadMoreButton';
import { useCallback, useEffect, useRef } from 'react';
import { useAction } from 'convex/react';
import { api } from '@convex/api';
import { AMOUNT_OF_SUGGESTIONS_PER_GENERATION } from '@/constants/prompts.const';
import { WebsiteSuggestionSchema } from '@/models/website-suggestion.model';

export interface ChatMessagesProps {}

const MAX_AMOUNT_OF_LOADING_WEBSITES_SKELETONS = 3;

export const ChatMessages = ({}: ChatMessagesProps) => {
    const {
        threadMessages,
        isGenerating,
        threadSuggestions,
        currentThreadId,
        suggestedUrls,
        setIsGenerating,
        loadMoreThreadMessages,
        isLoadingThreadMessages,
    } = useWebsiteSuggestions();

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const loadMoreSuggestionsMutation = useAction(api.websiteSuggestions.loadMoreSuggestions);
    const isAutoLoadingRef = useRef(false);

    const skeletonCount = Math.max(MAX_AMOUNT_OF_LOADING_WEBSITES_SKELETONS - (threadSuggestions?.length ?? 0), 1);

    const expectedCount = isGenerating
        ? Math.ceil(
              (threadSuggestions.length + AMOUNT_OF_SUGGESTIONS_PER_GENERATION) / AMOUNT_OF_SUGGESTIONS_PER_GENERATION,
          ) * AMOUNT_OF_SUGGESTIONS_PER_GENERATION
        : threadSuggestions.length;

    const progressCount = Math.min(threadSuggestions.length, expectedCount);

    // Auto-load more thread messages when scrolling to bottom
    const handleScroll = useCallback(() => {
        const scrollableParent = scrollContainerRef.current?.closest('.overflow-auto') as HTMLElement;
        if (!scrollableParent || !currentThreadId || isAutoLoadingRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollableParent;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold

        if (isNearBottom && !isGenerating && !isLoadingThreadMessages) {
            // Prevent multiple simultaneous loads
            isAutoLoadingRef.current = true;

            // Auto-load more thread messages using the loadMore from useThreadMessages
            loadMoreThreadMessages(THREADS_MESSAGES_PAGE_SIZE);

            // Reset the flag after a short delay
            setTimeout(() => {
                isAutoLoadingRef.current = false;
            }, 1000);
        }
    }, [currentThreadId, isGenerating, isLoadingThreadMessages, loadMoreThreadMessages]);

    useEffect(() => {
        const scrollableParent = scrollContainerRef.current?.closest('.overflow-auto') as HTMLElement;
        if (!scrollableParent) return;

        scrollableParent.addEventListener('scroll', handleScroll);
        return () => scrollableParent.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const handleLoadMore = async () => {
        if (!currentThreadId) return;

        try {
            setIsGenerating(true);

            setTimeout(() => {
                const scrollableParent = scrollContainerRef.current?.closest('.overflow-auto') as HTMLElement;
                if (scrollableParent) {
                    scrollableParent.scrollTo({
                        top: scrollableParent.scrollHeight,
                        behavior: 'smooth',
                    });
                }
            }, 50); // Shorter delay to scroll as soon as skeleton renders

            await loadMoreSuggestionsMutation({
                amount: AMOUNT_OF_SUGGESTIONS_PER_GENERATION,
                threadId: currentThreadId,
                existingUrls: suggestedUrls,
            });

            setIsGenerating(false);
        } catch (error) {
            console.error('Error loading more suggestions:', error);
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        const scrollToBottom = () => {
            // Find the scrollable parent container (TabsContent with overflow-auto)
            const scrollableParent = scrollContainerRef.current?.closest('.overflow-auto') as HTMLElement;
            if (scrollableParent) {
                scrollableParent.scrollTo({
                    top: scrollableParent.scrollHeight,
                    behavior: 'smooth',
                });
            }
        };

        const rafId = requestAnimationFrame(() => {
            scrollToBottom();
        });

        return () => cancelAnimationFrame(rafId);
    }, [threadMessages?.length, currentThreadId]);

    useEffect(() => {
        const scrollToBottom = () => {
            if (threadMessages && threadMessages.length > 0) {
                const scrollableParent = scrollContainerRef.current?.closest('.overflow-auto') as HTMLElement;
                if (scrollableParent) {
                    scrollableParent.scrollTo({
                        top: scrollableParent.scrollHeight,
                        behavior: 'instant',
                    });
                }
            }
        };

        // Use double RAF to ensure all layout calculations are complete
        const rafId = requestAnimationFrame(() => {
            requestAnimationFrame(scrollToBottom);
        });

        return () => cancelAnimationFrame(rafId);
    }, []); // Empty dependency array ensures this runs only on mount

    return (
        <div ref={scrollContainerRef} className='flex flex-col gap-6 h-full'>
            <div className='grid gap-6'>
                {threadMessages?.map((message, index) => {
                    if (message.role === 'assistant') {
                        // Try to parse suggestion JSON for assistant messages
                        let suggestion = null;
                        try {
                            suggestion = JSON.parse(message.content);
                        } catch {
                            suggestion = null;
                        }

                        const { data: validSuggestion, success: isValidSuggestion } =
                            WebsiteSuggestionSchema.safeParse(suggestion);

                        if (isValidSuggestion) {
                            return <WebsiteSuggestionCard key={index} websiteSuggestion={validSuggestion} />;
                        }
                        // If not a valid suggestion, skip rendering
                        return null;
                    }

                    return (
                        <div
                            key={index}
                            className='rounded-lg bg-background px-4 py-2 text-sm text-foreground w-fit max-w-2xl'
                        >
                            {message.content}
                        </div>
                    );
                })}
                {isGenerating && progressCount < expectedCount && (
                    <WebsiteSuggestionCardSkeleton count={Math.min(skeletonCount, expectedCount - progressCount)} />
                )}
                {/* Show streaming status with progress */}
                {isGenerating && (
                    <div className='text-sm text-gray-500 flex items-center justify-between'>
                        <TextShimmer>{`Generating suggestions...`}</TextShimmer>
                    </div>
                )}

                {/* Load More Button - only show when not generating and have suggestions */}
                {threadSuggestions.length > 0 && !isGenerating && (
                    <LoadMoreButton className='self-center' handleLoadMore={handleLoadMore} />
                )}
            </div>
        </div>
    );
};
