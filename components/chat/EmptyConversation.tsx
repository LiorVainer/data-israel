'use client';

import { MessageSquare } from 'lucide-react';
import { PromptSuggestions } from './PromptSuggestions';

export interface EmptyConversationProps {
  onSuggestionClick: (prompt: string) => void;
}

export function EmptyConversation({ onSuggestionClick }: EmptyConversationProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-in fade-in duration-500">
      <MessageSquare className="size-16 text-muted-foreground mb-6 animate-pulse" />
      <h2 className="text-3xl font-semibold mb-3">
        שאל על נתונים פתוחים ישראליים
      </h2>
      <p className="text-muted-foreground max-w-md mb-6">
        חפש מאגרי מידע, חקור קטגוריות וגלה נתונים ציבוריים מאתר data.gov.il
      </p>
      <div className="w-full max-w-2xl">
        <div className="text-muted-foreground font-medium mb-3 text-center">
          דוגמאות לשאלות:
        </div>
        <PromptSuggestions onSuggestionClick={onSuggestionClick} />
      </div>
    </div>
  );
}
