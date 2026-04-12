'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQuery as useConvexQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { AgentConfig } from '@/agents/agent.config';
import { threadService } from '@/services/thread.service';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { MessageItem } from '@/components/chat/MessageItem';
import { InputSection } from '@/components/chat/InputSection';
import { Suggestions } from './Suggestions';
import { extractSuggestions } from './extract-suggestions';
import { EmptyConversation } from './EmptyConversation';
import { MessageListSkeleton } from '@/components/chat/MessageListSkeleton';
import { LoadingShimmer } from '@/components/chat/LoadingShimmer';
import { ContextWindowIndicator } from '@/components/chat/ContextWindowIndicator';
import { AIDevtools } from '@ai-sdk-tools/devtools';
import { useSessionStorage } from '@/hooks/use-session-storage';
import { INITIAL_MESSAGE_KEY, type InitialMessageData } from '@/constants/chat';
import { useUser } from '@/context/UserContext';
import { useSearchParams } from 'next/navigation';
import { usePushSubscription } from '@/hooks/use-push-subscription';
import { NotificationPrompt } from '@/components/chat/NotificationPrompt';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { LogIn, X } from 'lucide-react';
import { ALL_DATA_SOURCE_IDS } from '@/data-sources/registry';
import type { DataSource } from '@/data-sources/registry';

/** Header name for passing user ID to API */
const USER_ID_HEADER = 'x-user-id';

interface ChatThreadProps {
    id: string;
}

const LOGIN_PROMPT_KEY = 'login-prompt-dismissed';

function extractMessageText(message: UIMessage): string {
    return message.parts
        .filter((p): p is Extract<UIMessage['parts'][number], { type: 'text' }> => p.type === 'text')
        .map((p) => p.text)
        .join('\n')
        .trim();
}

export function ChatThread({ id }: ChatThreadProps) {
    const { userId: clerkUserId, isLoaded: isAuthLoaded } = useAuth();
    const { guestId } = useUser();
    const isMobile = useIsMobile();
    const router = useRouter();

    // Wait for auth to load before resolving userId — prevents storing
    // messages with guestId when the user is actually authenticated.
    const userId = isAuthLoaded ? (clerkUserId ?? guestId) : null;

    const contextWindow = useConvexQuery(api.threads.getThreadContextWindow, { threadId: id });
    const totalTokens = contextWindow?.totalTokens ?? 0;

    const threadSettings = useConvexQuery(api.threads.getThreadSettings, { threadId: id });
    const userSettings = useConvexQuery(api.users.getUserSettings);
    const upsertThreadSettings = useMutation(api.threads.upsertThreadSettings);

    const createAnswer = useMutation(api.ratings.createAnswer);
    const upsertRating = useMutation(api.ratings.upsertRating);
    const threadRatings = useConvexQuery(api.ratings.getRatingsForThread, userId ? { threadId: id, userId } : 'skip');

    const searchParams = useSearchParams();
    const [initialMessageData, , removeInitialMessage] = useSessionStorage<InitialMessageData>(INITIAL_MESSAGE_KEY);
    const startedAsNew = useRef(initialMessageData?.chatId === id || searchParams.has('new'));

    // Use a ref so transport callbacks always read the latest userId
    // without recreating the transport on every auth state change.
    const userIdRef = useRef(userId);
    userIdRef.current = userId;

    const [enabledSources, setEnabledSources] = useState<DataSource[]>([...ALL_DATA_SOURCE_IDS]);
    const didInitSources = useRef(false);

    useEffect(() => {
        if (didInitSources.current) return;
        // Wait for queries to resolve (undefined = loading, null = no record)
        if (threadSettings === undefined || userSettings === undefined) return;
        didInitSources.current = true;

        if (threadSettings?.length) {
            setEnabledSources(threadSettings as DataSource[]);
        } else if (userSettings?.length) {
            setEnabledSources(userSettings as DataSource[]);
        }
        // else: keep default (all sources)
    }, [threadSettings, userSettings]);

    const isInitialMount = useRef(true);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        // All selected = delete the record (default state)
        const sourcesToSave = enabledSources.length === ALL_DATA_SOURCE_IDS.length ? [] : enabledSources;
        void upsertThreadSettings({ threadId: id, enabledSources: sourcesToSave });
    }, [enabledSources, id, upsertThreadSettings]);

    // Ref so the memoized transport always reads the latest value
    const enabledSourcesRef = useRef(enabledSources);
    enabledSourcesRef.current = enabledSources;

    const handleToggleSource = useCallback((sourceId: DataSource) => {
        setEnabledSources((prev) => {
            const next = prev.includes(sourceId) ? prev.filter((id) => id !== sourceId) : [...prev, sourceId];
            // Prevent empty: if nothing left, re-enable all
            return next.length === 0 ? [...ALL_DATA_SOURCE_IDS] : next;
        });
    }, []);

    const handleSelectAllSources = useCallback(() => setEnabledSources([...ALL_DATA_SOURCE_IDS]), []);
    const handleUnselectAllSources = useCallback(() => setEnabledSources([]), []);

    const transport = useMemo(
        () =>
            new DefaultChatTransport({
                api: '/api/chat',
                headers: () => ({
                    [USER_ID_HEADER]: userIdRef.current ?? 'anonymous',
                }),
                prepareSendMessagesRequest({ messages }) {
                    // Only send the last user message — server reconstructs
                    // full history from Convex memory. This prevents the
                    // request body from growing unboundedly with tool results.
                    const lastUserMessage = messages.filter((m) => m.role === 'user').at(-1);
                    return {
                        body: {
                            id,
                            messages: lastUserMessage ? [lastUserMessage] : messages,
                            memory: {
                                thread: id,
                                resource: userIdRef.current,
                            },
                            // Only send filter when not all sources are selected
                            ...(enabledSourcesRef.current.length < ALL_DATA_SOURCE_IDS.length && {
                                enabledSources: enabledSourcesRef.current,
                            }),
                        },
                    };
                },
            }),
        [id],
    );

    const { messages, sendMessage, setMessages, status, regenerate, stop } = useChat({
        id,
        messages: [] as UIMessage[],
        transport,
        resume: true,
        experimental_throttle: 50,
        onError: (error) => {
            console.error('[ChatThread] useChat error:', error.message);
            toast.error('חלה שגיאה. נסו שוב או פתחו שיחה חדשה.');
        },
    });

    const isNewConversation = startedAsNew.current && !messages.length;

    const { data: savedMessages, isFetching: isLoadingMessages } = useQuery({
        queryKey: ['threads', id, 'messages', userId],
        queryFn: () => threadService.getMessages(id, userId!),
        enabled: !startedAsNew.current && !!userId,
    });

    const didLoad = useRef(false);

    useEffect(() => {
        if (didLoad.current || !savedMessages?.length) return;
        didLoad.current = true;
        setMessages(savedMessages);
    }, [savedMessages, setMessages]);

    useEffect(() => {
        if (!initialMessageData || initialMessageData.chatId !== id || !isAuthLoaded) return;

        removeInitialMessage();
        void sendMessage({ text: initialMessageData.text });
    }, [id, initialMessageData, removeInitialMessage, sendMessage, isAuthLoaded]);

    // Show login prompt toast after first assistant response for guest users
    // const loginPromptShown = useRef(false);
    // useEffect(() => {
    //     if (loginPromptShown.current) return;
    //     if (clerkUserId) return; // already logged in
    //
    //     const hasAssistantMessage = messages.some(
    //         (m) => m.role === 'assistant' && m.parts.find((p) => p.type === 'text' && !!p.text.trim()),
    //     );
    //     if (!hasAssistantMessage && messages.length > 2) return;
    //
    //     loginPromptShown.current = true;
    //     toast.custom(
    //         (t) => (
    //             <div
    //                 dir='rtl'
    //                 className='flex items-start gap-3 rounded-lg border bg-card p-4 text-card-foreground shadow-lg max-w-sm'
    //             >
    //                 <LogIn className='mt-0.5 h-5 w-5 shrink-0 text-primary' />
    //                 <div className='flex-1 space-y-2'>
    //                     <p className='text-sm font-medium'>שמרו על השיחות שלכם</p>
    //                     <p className='text-xs text-muted-foreground'>
    //                         התחברו עם חשבון Google כדי לשמור היסטוריית שיחות וליהנות מפיצ&apos;רים נוספים בעתיד.
    //                     </p>
    //                     <button
    //                         onClick={() => {
    //                             toast.dismiss(t);
    //                             router.push('/sign-in');
    //                         }}
    //                         className='mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors'
    //                     >
    //                         התחברות עם Google
    //                     </button>
    //                 </div>
    //                 <button
    //                     onClick={() => {
    //                         toast.dismiss(t);
    //                     }}
    //                     className='shrink-0 rounded-sm p-0.5 text-muted-foreground hover:text-foreground transition-colors'
    //                     aria-label='סגור'
    //                 >
    //                     <X className='h-4 w-4' />
    //                 </button>
    //             </div>
    //         ),
    //         { duration: Infinity },
    //     );
    // }, [messages, clerkUserId, router]);

    const prevStatus = useRef(status);
    useEffect(() => {
        const wasStreaming = prevStatus.current === 'streaming' || prevStatus.current === 'submitted';
        prevStatus.current = status;

        if (!wasStreaming || status !== 'ready') return;
        if (!userId) return;

        const lastAssistant = messages.filter((m) => m.role === 'assistant').at(-1);
        const lastUser = messages.filter((m) => m.role === 'user').at(-1);
        if (!lastAssistant || !lastUser) return;

        const assistantResponse = extractMessageText(lastAssistant);
        const userPrompt = extractMessageText(lastUser);
        if (!assistantResponse) return;

        void createAnswer({
            threadId: id,
            messageId: lastAssistant.id,
            userId,
            userPrompt,
            assistantResponse,
        });
    }, [status, messages, userId, id, createAnswer]);

    const handleSend = useCallback(
        (text: string) => {
            if (!messages.length && startedAsNew.current) {
                window.history.replaceState(null, '', `/chat/${id}`);
            }
            void sendMessage({ text });
        },
        [messages.length, id, sendMessage],
    );

    const handleRate = useCallback(
        (messageId: string, rating: 'good' | 'bad') => {
            if (!userId) return;
            void upsertRating({ messageId, userId, rating });
        },
        [userId, upsertRating],
    );

    const isStreaming = status === 'submitted' || status === 'streaming';
    const hasMessages = messages.length > 0;
    const isLoading = (!userId || isLoadingMessages) && !didLoad.current;

    const pushSubscription = usePushSubscription(userId);

    const lastAssistantMessage = messages.filter((m) => m.role === 'assistant').at(-1);
    const { suggestions: suggestionsFromTool, loading: suggestionsLoading } = useMemo(
        () => extractSuggestions(lastAssistantMessage),
        [lastAssistantMessage],
    );

    return (
        <div className='relative h-full w-full overflow-hidden'>
            <div className='mx-auto px-4 md:px-0 pb-4 md:pb-6 relative h-full w-full pt-14 md:pt-6'>
                <div className='flex flex-col gap-4 md:gap-6 h-full w-full items-center'>
                    {isLoading && !isNewConversation ? (
                        <div className='flex-1 w-full md:w-4xl mx-auto overflow-hidden'>
                            <MessageListSkeleton />
                        </div>
                    ) : isNewConversation ? (
                        <div className='relative flex-1 min-h-0 w-full md:w-4xl flex items-center justify-center'>
                            <EmptyConversation onClick={handleSend} />
                        </div>
                    ) : (
                        <Conversation className='w-full children-noscrollbar'>
                            <ConversationContent className='w-full md:w-4xl mx-auto'>
                                {messages.map((message, messageIndex) => (
                                    <MessageItem
                                        key={message.id}
                                        message={message}
                                        isLastMessage={messageIndex === messages.length - 1}
                                        isStreaming={isStreaming && messageIndex === messages.length - 1}
                                        onRegenerate={regenerate}
                                        currentRating={threadRatings?.[message.id] ?? null}
                                        onRate={(rating) => handleRate(message.id, rating)}
                                    />
                                ))}
                                {status === 'submitted' && <LoadingShimmer />}
                            </ConversationContent>
                            <ConversationScrollButton />
                        </Conversation>
                    )}

                    <div className='w-full md:w-4xl flex gap-1  flex-col'>
                        {!isStreaming && hasMessages && (suggestionsLoading || suggestionsFromTool) && (
                            <div className='relative z-20 w-full md:w-4xl'>
                                <Suggestions
                                    suggestions={suggestionsFromTool}
                                    loading={suggestionsLoading}
                                    onClick={handleSend}
                                />
                            </div>
                        )}
                        <InputSection
                            onSubmit={handleSend}
                            status={startedAsNew.current && !hasMessages ? undefined : status}
                            onStop={stop}
                            enabledSources={enabledSources}
                            onToggleSource={handleToggleSource}
                            onSelectAllSources={handleSelectAllSources}
                            onUnselectAllSources={handleUnselectAllSources}
                        />
                        <NotificationPrompt
                            isSupported={pushSubscription.isSupported}
                            isSubscribed={pushSubscription.isSubscribed}
                            subscribe={pushSubscription.subscribe}
                            unsubscribe={pushSubscription.unsubscribe}
                            hasMessages={hasMessages}
                        />
                        {!!totalTokens && totalTokens > 0 && (
                            <ContextWindowIndicator
                                usedTokens={totalTokens}
                                maxTokens={AgentConfig.CHAT.MAX_CONTEXT_TOKENS}
                            />
                        )}
                    </div>
                </div>
            </div>

            {process.env.NODE_ENV === 'development' && !isMobile && (
                <AIDevtools
                    enabled
                    maxEvents={1000}
                    config={{
                        position: 'bottom',
                        height: 400,
                        streamCapture: {
                            enabled: true,
                            endpoint: '/api/chat',
                            autoConnect: true,
                        },
                    }}
                />
            )}
        </div>
    );
}
