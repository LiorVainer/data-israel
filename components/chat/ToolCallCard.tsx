'use client';

import {
  Card,
  CardContent,
  CardTitle,
} from '@/components/ui/card';
import {
  Loader2Icon,
  CheckCircle2Icon,
  XCircleIcon,
  SearchIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ToolName,
  ToolInput,
  ToolOutput,
} from '@/lib/tools/types';
import {
  toolTranslations,
  type ToolTranslation,
} from '@/constants/tool-translations';

type ToolState = 'input-streaming' | 'input-available' | 'output-available' | 'output-error' | 'approval-requested' | 'approval-responded' | 'output-denied';

export interface ToolCallCardProps {
  part: {
    type: string;
    state: ToolState;
    input?: unknown;
    output?: unknown;
    errorText?: string;
  };
}

function getStateIcon(state: ToolCallCardProps['part']['state']) {
  switch (state) {
    case 'input-streaming':
    case 'input-available':
    case 'approval-requested':
      return <Loader2Icon className="h-4 w-4 animate-spin text-blue-500" />;
    case 'output-available':
    case 'approval-responded':
      return <CheckCircle2Icon className="h-4 w-4 text-green-500" />;
    case 'output-error':
    case 'output-denied':
      return <XCircleIcon className="h-4 w-4 text-red-500" />;
    default:
      return null;
  }
}

function getStateLabel(state: ToolCallCardProps['part']['state']): string {
  switch (state) {
    case 'input-streaming':
    case 'input-available':
      return 'מעבד...';
    case 'approval-requested':
      return 'ממתין לאישור';
    case 'output-available':
    case 'approval-responded':
      return 'הושלם';
    case 'output-error':
      return 'שגיאה';
    case 'output-denied':
      return 'נדחה';
    default:
      return '';
  }
}

/**
 * Type guard to check if a string is a valid tool name
 */
function isValidToolName(key: string): key is ToolName {
  return key in toolTranslations;
}

/**
 * Get typed tool translation for a given tool key
 */
function getToolMeta<T extends ToolName>(key: T): ToolTranslation<T> | undefined {
  return toolTranslations[key] as ToolTranslation<T> | undefined;
}

/**
 * Format input description with proper typing
 */
function formatInputDescription(toolKey: string, input: unknown): string | null {
  if (!isValidToolName(toolKey) || input === undefined) {
    return null;
  }
  const meta = getToolMeta(toolKey);
  if (!meta) return null;
  // We know the input matches the tool's expected type based on runtime behavior
  return meta.formatInput(input as ToolInput<typeof toolKey>) ?? null;
}

/**
 * Format output description with proper typing
 */
function formatOutputDescription(toolKey: string, output: unknown): string | null {
  if (!isValidToolName(toolKey) || output === undefined) {
    return null;
  }
  const meta = getToolMeta(toolKey);
  if (!meta) return null;
  // We know the output matches the tool's expected type based on runtime behavior
  return meta.formatOutput(output as ToolOutput<typeof toolKey>);
}

export function ToolCallCard({ part }: ToolCallCardProps) {
  const toolKey = part.type.replace('tool-', '');
  const isKnownTool = isValidToolName(toolKey);
  const toolMeta = isKnownTool ? toolTranslations[toolKey] : undefined;

  const toolName = toolMeta?.name || toolKey;
  const toolIcon = toolMeta?.icon || <SearchIcon className="h-4 w-4" />;

  const hasInput = part.input !== undefined;
  const hasOutput = part.state === 'output-available' && part.output !== undefined;
  const hasError = part.state === 'output-error' && part.errorText;

  // Format human-readable descriptions using type-safe helpers
  const inputDescription = hasInput
    ? formatInputDescription(toolKey, part.input)
    : null;
  const outputDescription = hasOutput
    ? formatOutputDescription(toolKey, part.output)
    : null;

  const isLoading = part.state === 'input-streaming' || part.state === 'input-available';

  return (
    <Card className={cn(
      "my-2 py-3 transition-all duration-200",
      hasError && "border-red-200 dark:border-red-800"
    )}>


      <CardContent className="px-3 pb-0 space-y-1">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {getStateIcon(part.state)}
            <span className="text-muted-foreground">{toolIcon}</span>
            <CardTitle className="text-sm font-medium">{toolName}</CardTitle>
            <span className="text-xs text-muted-foreground">
              {getStateLabel(part.state)}
            </span>
          </div>
        </div>
        {/* Input description */}
        {inputDescription && (
          <div className="text-sm text-muted-foreground">
            {inputDescription}
          </div>
        )}

        {/* Output description */}
        {outputDescription && (
          <div className="text-sm text-green-600 dark:text-green-400 font-medium">
            {outputDescription}
          </div>
        )}

        {/* Loading state */}
        {isLoading && !inputDescription && (
          <div className="text-sm text-muted-foreground">
            מעבד...
          </div>
        )}

        {/* Error message */}
        {hasError && (
          <div className="text-sm text-red-600 dark:text-red-400">
            {part.errorText}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
