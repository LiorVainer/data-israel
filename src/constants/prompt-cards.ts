import {
    Building2Icon,
    HomeIcon,
    PackageIcon,
    PlaneIcon,
    ShieldAlertIcon,
    TrainFrontIcon,
    TrendingUpIcon,
    WindIcon,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

export interface PromptCard {
    label: string;
    prompt: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export const PROMPT_CARDS: PromptCard[] = [
    {
        label: 'מחירים ומדדים',
        prompt: 'איך השתנה סל יוקר המחיה בישראל בעשור האחרון, ואילו סעיפים התייקרו הכי הרבה?',
        icon: TrendingUpIcon,
    },
    {
        label: 'רכבת ישראל',
        prompt: 'מה אחוז הדיוק של רכבת ישראל בחודשים האחרונים, ובאילו תחנות יש הכי הרבה איחורים?',
        icon: TrainFrontIcon,
    },
    {
        label: 'בנייה ודיור',
        prompt: 'מה מגמת התחלות הבנייה בישראל בשנים האחרונות, ובאילו אזורים הבנייה הכי פעילה?',
        icon: Building2Icon,
    },
    {
        label: 'מחירי דירות',
        prompt: 'איך השתנה מדד מחירי הדירות בישראל בשנה האחרונה, ומה המגמה לעומת מדד המחירים לצרכן?',
        icon: HomeIcon,
    },
    {
        label: 'טיסות מנתבג',
        prompt: 'אילו יעדים מופעלים היום משדה התעופה בן גוריון, ואילו חברות תעופה פועלות?',
        icon: PlaneIcon,
    },
    {
        label: 'תאונות דרכים',
        prompt: 'מה המגמה בתאונות דרכים עם נפגעים בישראל לפי סוג דרך וחומרת התאונה?',
        icon: ShieldAlertIcon,
    },
    {
        label: 'סחר חוץ',
        prompt: 'מה הגירעון המסחרי של ישראל, ואילו קבוצות סחורות מובילות ביבוא וביצוא?',
        icon: PackageIcon,
    },
    {
        label: 'איכות אוויר',
        prompt: 'מה מצב איכות האוויר היום באזורים השונים בישראל?',
        icon: WindIcon,
    },
];
