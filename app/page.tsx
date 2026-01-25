'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { EmptyConversation } from '@/components/chat/EmptyConversation';
import { MessageItem } from '@/components/chat/MessageItem';
import { ModelSelectorSection } from '@/components/chat/ModelSelectorSection';
import type { DataAgentUIMessage } from '@/agents/data-agent';
import { AgentConfig } from '@/agents/agent.config';

function LoadingShimmer() {
  return (
    <div className="flex gap-3 animate-in fade-in duration-300">
      <div className="flex-1">
        <Shimmer as="p" duration={1.5}>
          מעבד את הבקשה שלך...
        </Shimmer>
      </div>
    </div>
  );
}

export default function Home() {
  const [selectedModel, setSelectedModel] = useState(AgentConfig.AVAILABLE_MODELS[0].id);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const modelRef = useRef(selectedModel);

  // Keep modelRef in sync with selectedModel for use in callbacks
  useEffect(() => {
    modelRef.current = selectedModel;
  }, [selectedModel]);

  const { messages, sendMessage, status, regenerate, stop } = useChat<DataAgentUIMessage>();

  const handleSuggestionClick = (prompt: string) => {
    sendMessage({ text: prompt }, { body: { model: modelRef.current } });
  };

  const isStreaming = status === 'submitted' || status === 'streaming';

  return (
    <div className="max-w-4xl mx-auto p-6 relative h-dvh">
      <div className="flex flex-col h-full">
        <Conversation className="h-full flex-1">
          <ConversationContent>
            {messages.length === 0 ? (
              <EmptyConversation onSuggestionClick={handleSuggestionClick} />
            ) : (
              <>
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
              </>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput
          className="mt-4"
          onSubmit={(message) => {
            if (!message.text.trim()) return;
            sendMessage(
              { text: message.text },
              { body: { model: modelRef.current } }
            );
          }}
        >
          <PromptInputTextarea placeholder="שאל על מאגרי מידע" />
          <PromptInputFooter>
            <PromptInputTools>
              <ModelSelectorSection
                selectedModel={selectedModel}
                open={modelSelectorOpen}
                onOpenChange={setModelSelectorOpen}
                onSelectModel={setSelectedModel}
              />
            </PromptInputTools>
            <PromptInputSubmit
              status={status}
              onClick={status === 'streaming' ? stop : undefined}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
