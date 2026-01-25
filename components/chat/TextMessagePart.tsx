'use client';

import { CopyIcon, RefreshCcwIcon } from 'lucide-react';
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from '@/components/ai-elements/message';

export interface TextMessagePartProps {
  messageId: string;
  text: string;
  role: 'user' | 'assistant' | 'system';
  isLastMessage: boolean;
  onRegenerate: () => void;
}

export function TextMessagePart({
  text,
  role,
  isLastMessage,
  onRegenerate,
}: TextMessagePartProps) {
  return (
    <Message from={role}>
      <MessageContent>
        <MessageResponse>{text}</MessageResponse>
      </MessageContent>
      {role === 'assistant' && isLastMessage && (
        <MessageActions>
          <MessageAction onClick={onRegenerate} label="נסה שוב">
            <RefreshCcwIcon className="size-3" />
          </MessageAction>
          <MessageAction
            onClick={() => navigator.clipboard.writeText(text)}
            label="העתק"
          >
            <CopyIcon className="size-3" />
          </MessageAction>
        </MessageActions>
      )}
    </Message>
  );
}
