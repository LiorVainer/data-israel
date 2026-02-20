'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import { useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { useQuery as useConvexQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { AgentConfig } from '@/agents/agent.config';
import { threadService } from '@/services/thread.service';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { MessageItem } from '@/components/chat/MessageItem';
import { InputSection } from '@/components/chat/InputSection';
import { Suggestions } from './Suggestions';
import { EmptyConversation } from './EmptyConversation';
import { LoadingShimmer } from '@/components/chat/LoadingShimmer';
import { ContextWindowIndicator } from '@/components/chat/ContextWindowIndicator';
import { GeometricBackground } from '@/components/ui/shape-landing-hero';
import { useSessionStorage } from '@/hooks/use-session-storage';
import { INITIAL_MESSAGE_KEY, type InitialMessageData } from '@/constants/chat';
import { useUser } from '@/context/UserContext';

/** Header name for passing user ID to API */
const USER_ID_HEADER = 'x-user-id';

interface ChatThreadProps {
    id: string;
}

export function ChatThread({ id }: ChatThreadProps) {
    const { userId: clerkUserId, isLoaded: isAuthLoaded } = useAuth();
    const { guestId } = useUser();

    const userId = clerkUserId ?? guestId;

    const contextWindow = useConvexQuery(api.threads.getThreadContextWindow, { threadId: id });
    const totalTokens = contextWindow?.totalTokens ?? 0;

    const [initialMessageData, , removeInitialMessage] = useSessionStorage<InitialMessageData>(INITIAL_MESSAGE_KEY);
    const isNewConversation = initialMessageData?.chatId === id;

    const transport = useMemo(
        () =>
            new DefaultChatTransport({
                api: '/api/chat',
                headers: {
                    [USER_ID_HEADER]: userId ?? 'anonymous',
                },
                prepareSendMessagesRequest({ messages }) {
                    console.log(userId);
                    return {
                        body: {
                            messages,
                            memory: {
                                thread: id,
                                resource: userId,
                            },
                        },
                    };
                },
            }),
        [id, userId],
    );

    const { messages, sendMessage, setMessages, status, regenerate, stop } = useChat({
        messages: [] as UIMessage[],
        transport,
    });

    // Hydrate existing messages for returning conversations (not new ones)
    const { data: hydratedMessages } = useQuery({
        queryKey: ['threads', id, 'messages', userId],
        queryFn: () => threadService.getMessages(id, userId!),
        enabled: !isNewConversation && isAuthLoaded && !!userId,
    });

    const didHydrate = useRef(false);

    useEffect(() => {
        if (didHydrate.current || !hydratedMessages?.length) return;
        didHydrate.current = true;
        setMessages(hydratedMessages);
    }, [hydratedMessages, setMessages]);

    useEffect(() => {
        if (!initialMessageData || initialMessageData.chatId !== id || !isAuthLoaded) return;

        removeInitialMessage();
        void sendMessage({ text: initialMessageData.text });
    }, [id, initialMessageData, removeInitialMessage, sendMessage, isAuthLoaded]);

    const isStreaming = status === 'submitted' || status === 'streaming';
    const hasMessages = messages.length > 0;

    const lastAssistantMessage = messages.filter((m) => m.role === 'assistant').at(-1);
    const { suggestions: suggestionsFromTool, loading: suggestionsLoading } = useMemo(() => {
        if (!lastAssistantMessage) return { suggestions: undefined, loading: false };

        const suggestPart = lastAssistantMessage.parts.find((p) => p.type === 'tool-suggestFollowUps' && 'state' in p);

        if (!suggestPart || !('state' in suggestPart)) return { suggestions: undefined, loading: false };

        const state = suggestPart.state as string;

        // Tool is still being called — show skeleton
        if (state === 'input-streaming' || state === 'input-available') {
            return { suggestions: undefined, loading: true };
        }

        // Tool finished — extract suggestions from input
        if (state === 'output-available' && 'input' in suggestPart) {
            const input = suggestPart.input as { suggestions: string[] };
            return { suggestions: input.suggestions, loading: false };
        }

        return { suggestions: undefined, loading: false };
    }, [lastAssistantMessage]);

    return (
        <div className='relative h-full w-full'>
            <GeometricBackground noShapes />

            <div className='mx-auto px-4 md:px-0 pb-4 md:pb-6 relative h-full w-full'>
                <div className='flex flex-col gap-4 md:gap-6 h-full w-full items-center'>
                    {!hasMessages && !isStreaming ? (
                        <div className='flex-1 min-h-0 w-full md:w-4xl'>
                            <EmptyConversation onClick={(text) => void sendMessage({ text })} />
                        </div>
                    ) : (
                        <Conversation className='w-full children-noscrollbar'>
                            <ConversationContent className='w-full md:w-4xl pt-14 md:pt-5 mx-auto'>
                                {messages.map((message, messageIndex) => (
                                    <MessageItem
                                        key={message.id}
                                        message={message}
                                        isLastMessage={messageIndex === messages.length - 1}
                                        isStreaming={isStreaming}
                                        onRegenerate={regenerate}
                                    />
                                ))}
                                {status === 'submitted' && <LoadingShimmer />}
                            </ConversationContent>
                            <ConversationScrollButton />
                        </Conversation>
                    )}

                    {!isStreaming && hasMessages && (suggestionsLoading || suggestionsFromTool) && (
                        <div className='relative z-20 w-full md:w-4xl'>
                            <Suggestions
                                suggestions={suggestionsFromTool}
                                loading={suggestionsLoading}
                                onClick={(text) => void sendMessage({ text })}
                            />
                        </div>
                    )}

                    <div className='w-full md:w-4xl flex gap-1  flex-col'>
                        <InputSection onSubmit={(text) => void sendMessage({ text })} status={status} onStop={stop} />
                        {!!totalTokens && totalTokens > 0 && (
                            <ContextWindowIndicator
                                usedTokens={totalTokens}
                                maxTokens={AgentConfig.CHAT.MAX_CONTEXT_TOKENS}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
