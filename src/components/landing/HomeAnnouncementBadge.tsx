'use client';

import { Building2, HeartPulse, Landmark, Map, MapPin, ShoppingCart, SlidersHorizontal, Store } from 'lucide-react';
import { AnnouncementBadge } from '@/components/chat/AnnouncementBadge';

const announcementDetails = (
    <div className='flex flex-col gap-5'>
        <p className='text-foreground/70 text-sm leading-relaxed'>
            עדכון חדש למערכת — נוספו 6 מקורות מידע חדשים, הצגת מפה אינטראקטיבית, ויכולת סינון מקורות מידע לתשובות
            מדויקות יותר.
        </p>

        <div className='flex flex-col gap-3'>
            <h3 className='text-foreground text-sm font-semibold'>מקורות מידע חדשים</h3>

            <div className='flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-3'>
                <Landmark className='text-primary mt-0.5 h-4 w-4 shrink-0' />
                <div>
                    <p className='text-foreground text-sm font-medium'>תקציב המדינה — מפתח התקציב</p>
                    <p className='text-foreground/60 mt-0.5 text-xs'>
                        חיפוש בתקציב המדינה 1997–2025, חוזים, מכרזים, גופים מתוקצבים והכנסות המדינה.
                    </p>
                </div>
            </div>

            <div className='flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-3'>
                <Building2 className='text-primary mt-0.5 h-4 w-4 shrink-0' />
                <div>
                    <p className='text-foreground text-sm font-medium'>הכנסת</p>
                    <p className='text-foreground/60 mt-0.5 text-xs'>
                        חיפוש הצעות חוק, חברי כנסת, ועדות והצבעות — ישירות ממאגר הכנסת.
                    </p>
                </div>
            </div>

            <div className='flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-3'>
                <MapPin className='text-primary mt-0.5 h-4 w-4 shrink-0' />
                <div>
                    <p className='text-foreground text-sm font-medium'>מערכת המפות הממשלתית — GovMap</p>
                    <p className='text-foreground/60 mt-0.5 text-xs'>
                        עסקאות נדל״ן, מחירי שוק, גוש-חלקה, שירותים ציבוריים וממשק מפה אינטראקטיבי.
                    </p>
                </div>
            </div>

            <div className='flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-3'>
                <HeartPulse className='text-primary mt-0.5 h-4 w-4 shrink-0' />
                <div>
                    <p className='text-foreground text-sm font-medium'>משרד הבריאות</p>
                    <p className='text-foreground/60 mt-0.5 text-xs'>
                        לוחות בריאות הציבור — נתוני קופות חולים, שירותים ואיכות טיפול. כולל מאגר התרופות הלאומי: חיפוש
                        לפי שם, סימפטום, גנריות וסל הבריאות.
                    </p>
                </div>
            </div>

            <div className='flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-3'>
                <ShoppingCart className='text-primary mt-0.5 h-4 w-4 shrink-0' />
                <div>
                    <p className='text-foreground text-sm font-medium'>רמי לוי</p>
                    <p className='text-foreground/60 mt-0.5 text-xs'>
                        מחירי מוצרים, מבצעים ועדכוני מלאי בזמן אמת מרשת רמי לוי.
                    </p>
                </div>
            </div>

            <div className='flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-3'>
                <Store className='text-primary mt-0.5 h-4 w-4 shrink-0' />
                <div>
                    <p className='text-foreground text-sm font-medium'>שופרסל</p>
                    <p className='text-foreground/60 mt-0.5 text-xs'>מחירי מוצרים ומבצעים עדכניים מרשת שופרסל.</p>
                </div>
            </div>
        </div>

        <div className='flex flex-col gap-3'>
            <h3 className='text-foreground text-sm font-semibold'>יכולות חדשות</h3>

            <div className='flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-3'>
                <Map className='text-primary mt-0.5 h-4 w-4 shrink-0' />
                <div>
                    <p className='text-foreground text-sm font-medium'>הצגת מפה אינטראקטיבית</p>
                    <p className='text-foreground/60 mt-0.5 text-xs'>
                        שאלות על נדל״ן, תכנון עירוני, שירותים ציבוריים וגוש-חלקה מוצגות כעת על מפה.
                    </p>
                </div>
            </div>

            <div className='flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-3'>
                <SlidersHorizontal className='text-primary mt-0.5 h-4 w-4 shrink-0' />
                <div>
                    <p className='text-foreground text-sm font-medium'>בחירת מקורות מידע</p>
                    <p className='text-foreground/60 mt-0.5 text-xs'>
                        ניתן לסנן ולבחור אילו מקורות מידע ישמשו לתשובה — דרך כפתור הסינון בשורת הקלט. בחירת מקורות
                        ספציפיים יכולה להפוך את התשובה למדויקת ורלוונטית יותר עבורך.
                    </p>
                </div>
            </div>
        </div>
    </div>
);

export function HomeAnnouncementBadge({ className }: { className?: string }) {
    return (
        <AnnouncementBadge
            label='חדש'
            text='נוספו מקורות מידע חדשים והצגת מפה'
            learnMoreText='למידע נוסף'
            details={announcementDetails}
            dialogTitle='עדכון חדש - אפריל 2026'
            className={className}
        />
    );
}
