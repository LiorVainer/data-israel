import { cn } from '@/lib/utils';

interface AiDisclaimerProps {
    className?: string;
}

export function AiDisclaimer({ className }: AiDisclaimerProps) {
    return (
        <p className={cn('text-xs text-muted-foreground/60 text-center', className)} dir='rtl'>
            התשובות מבוססות על נתונים רשמיים ממאגרים ציבוריים.
            כמו בכל מערכת מבוססת AI, מומלץ לאמת נתונים קריטיים מול המקור.
        </p>
    );
}
