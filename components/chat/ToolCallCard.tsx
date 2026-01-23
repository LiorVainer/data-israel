'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Loader2Icon,
  CheckCircle2Icon,
  XCircleIcon,
  SearchIcon,
  FileTextIcon,
  FolderIcon,
  TagIcon,
  DatabaseIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToolCallCardProps {
  part: {
    type: string;
    state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error' | 'approval-requested' | 'approval-responded' | 'output-denied';
    input?: unknown;
    output?: unknown;
    errorText?: string;
  };
}

/**
 * Translate common field names to Hebrew
 */
const fieldTranslations: Record<string, string> = {
  package_count: 'מספר מאגרים',
  name: 'שם',
  title: 'כותרת',
  created: 'תאריך יצירה',
  modified: 'תאריך עדכון',
  metadata_modified: 'תאריך עדכון',
  metadata_created: 'תאריך יצירה',
  score: 'רלוונטיות',
  popularity: 'פופולריות',
  views: 'צפיות',
  downloads: 'הורדות',
  size: 'גודל',
  year: 'שנה',
  date: 'תאריך',
  city: 'עיר',
  population: 'אוכלוסייה',
  price: 'מחיר',
  count: 'כמות',
};

/**
 * Translate sort direction to Hebrew
 */
function translateSortDirection(dir: string): string {
  const normalized = dir.toLowerCase().trim();
  if (normalized === 'desc' || normalized === 'descending') {
    return 'יורד';
  }
  if (normalized === 'asc' || normalized === 'ascending') {
    return 'עולה';
  }
  return dir;
}

/**
 * Translate a sort string like "package_count desc" to Hebrew
 */
function translateSort(sort: string): string {
  if (!sort) return '';

  // Handle multiple sort fields separated by comma
  const parts = sort.split(',').map(part => {
    const trimmed = part.trim();
    const [field, direction] = trimmed.split(/\s+/);

    const hebrewField = fieldTranslations[field] || field;
    const hebrewDir = direction ? translateSortDirection(direction) : '';

    return hebrewDir ? `${hebrewField} (${hebrewDir})` : hebrewField;
  });

  return parts.join(', ');
}

/**
 * Tool translations and metadata
 */
const toolTranslations: Record<string, {
  name: string;
  icon: React.ReactNode;
  formatInput: (input: Record<string, unknown>) => string;
  formatOutput: (output: Record<string, unknown>) => string;
}> = {
  searchDatasets: {
    name: 'חיפוש מאגרי מידע',
    icon: <SearchIcon className="h-4 w-4" />,
    formatInput: (input) => {
      const parts: string[] = [];
      if (input.query) {
        parts.push(`מחפש: "${input.query}"`);
      } else {
        parts.push('מציג את כל המאגרים');
      }
      if (input.rows) {
        parts.push(`עד ${input.rows} תוצאות`);
      }
      if (input.sort) {
        parts.push(`ממוין לפי ${translateSort(String(input.sort))}`);
      }
      return parts.join(' • ');
    },
    formatOutput: (output) => {
      if (!output.success) {
        return `שגיאה: ${output.error}`;
      }
      const count = output.count as number;
      const datasets = output.datasets as Array<{ title: string }>;
      if (count === 0) {
        return 'לא נמצאו מאגרים';
      }
      return `נמצאו ${count} מאגרים`;
    },
  },
  getDatasetDetails: {
    name: 'טוען פרטי מאגר',
    icon: <FileTextIcon className="h-4 w-4" />,
    formatInput: (input) => {
      // Don't show the technical ID, just say we're loading details
      return 'טוען פרטים מלאים...';
    },
    formatOutput: (output) => {
      if (!output.success) {
        return `שגיאה: ${output.error}`;
      }
      const dataset = output.dataset as { title: string; resources: unknown[] };
      const resourceCount = dataset?.resources?.length || 0;
      const title = dataset?.title || 'מאגר';
      return `${title} • ${resourceCount} קבצים`;
    },
  },
  listGroups: {
    name: 'רשימת ארגונים',
    icon: <FolderIcon className="h-4 w-4" />,
    formatInput: (input) => {
      const parts: string[] = ['מציג ארגונים מפרסמים'];
      if (input.limit) {
        parts.push(`עד ${input.limit} תוצאות`);
      }
      if (input.orderBy) {
        parts.push(`ממוין לפי ${translateSort(String(input.orderBy))}`);
      }
      return parts.join(' • ');
    },
    formatOutput: (output) => {
      if (!output.success) {
        return `שגיאה: ${output.error}`;
      }
      const groups = output.groups as unknown[];
      const count = groups?.length || 0;
      return count === 0 ? 'לא נמצאו ארגונים' : `נמצאו ${count} ארגונים`;
    },
  },
  listTags: {
    name: 'רשימת תגיות',
    icon: <TagIcon className="h-4 w-4" />,
    formatInput: (input) => {
      if (input.query) {
        return `מחפש תגיות: "${input.query}"`;
      }
      return 'מציג את כל התגיות';
    },
    formatOutput: (output) => {
      if (!output.success) {
        return `שגיאה: ${output.error}`;
      }
      const tags = output.tags as unknown[];
      const count = tags?.length || 0;
      return count === 0 ? 'לא נמצאו תגיות' : `נמצאו ${count} תגיות`;
    },
  },
  queryDatastoreResource: {
    name: 'שליפת נתונים',
    icon: <DatabaseIcon className="h-4 w-4" />,
    formatInput: (input) => {
      const parts: string[] = [];

      if (input.q) {
        parts.push(`מחפש: "${input.q}"`);
      }

      if (input.filters && typeof input.filters === 'object') {
        const filterEntries = Object.entries(input.filters as Record<string, unknown>);
        if (filterEntries.length > 0) {
          const filterStr = filterEntries
            .map(([key, value]) => {
              const hebrewKey = fieldTranslations[key] || key;
              return `${hebrewKey}="${value}"`;
            })
            .join(', ');
          parts.push(`מסנן לפי: ${filterStr}`);
        }
      }

      if (input.limit) {
        parts.push(`עד ${input.limit} רשומות`);
      }

      if (input.sort) {
        parts.push(`ממוין לפי ${translateSort(String(input.sort))}`);
      }

      if (parts.length === 0) {
        parts.push('שולף נתונים מהמאגר');
      }

      return parts.join(' • ');
    },
    formatOutput: (output) => {
      if (!output.success) {
        return `שגיאה: ${output.error}`;
      }
      const total = output.total as number;
      const records = output.records as unknown[];
      const recordCount = records?.length || 0;

      if (total === 0) {
        return 'לא נמצאו רשומות';
      }

      if (recordCount === total) {
        return `נמצאו ${total} רשומות`;
      }

      return `מציג ${recordCount} מתוך ${total} רשומות`;
    },
  },
};

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

export function ToolCallCard({ part }: ToolCallCardProps) {
  const toolKey = part.type.replace('tool-', '');
  const toolMeta = toolTranslations[toolKey];

  const toolName = toolMeta?.name || toolKey;
  const toolIcon = toolMeta?.icon || <SearchIcon className="h-4 w-4" />;

  const hasInput = part.input !== undefined;
  const hasOutput = part.state === 'output-available' && part.output !== undefined;
  const hasError = part.state === 'output-error' && part.errorText;

  // Format human-readable descriptions
  const inputDescription = hasInput && toolMeta
    ? toolMeta.formatInput(part.input as Record<string, unknown>)
    : null;
  const outputDescription = hasOutput && toolMeta
    ? toolMeta.formatOutput(part.output as Record<string, unknown>)
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
