import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export const metadata: Metadata = {
    title: 'מדיניות פרטיות | דאטה ישראל',
    description: 'מדיניות הפרטיות של דאטה ישראל — כיצד אנו אוספים, משתמשים ומגנים על המידע שלך.',
};

export default function PrivacyPolicyPage() {
    return (
        <div className='relative'>
            <div className='mx-auto max-w-3xl px-6 py-16 text-foreground overflow-auto'>
                <div className='mb-12 flex flex-col items-center gap-4'>
                    <Link href='/'>
                        <Logo className='size-12' />
                    </Link>
                    <h1 className='text-3xl font-bold'>מדיניות פרטיות</h1>
                    <p className='text-sm text-muted-foreground'>עודכן לאחרונה: 5 במרץ 2026</p>
                </div>

                <div className='prose prose-sm dark:prose-invert max-w-none space-y-8 leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pr-6 [&_li]:mb-1'>
                    <section>
                        <h2>מבוא</h2>
                        <p>
                            מדיניות פרטיות זו חלה על אתר דאטה ישראל (להלן: &quot;השירות&quot;), הנגיש בכתובת{' '}
                            <a href='https://data-israel.org' className='text-primary hover:underline'>
                                data-israel.org
                            </a>
                            . השירות הוא מערכת בינה מלאכותית (AI) המאפשרת למשתמשים לחקור ולשאול שאלות אודות נתונים
                            ציבוריים ממאגרי המידע הפתוחים של מדינת ישראל, כולל data.gov.il והלשכה המרכזית לסטטיסטיקה
                            (למ&quot;ס).
                        </p>
                        <p>
                            בשימוש בשירות, הנך מסכים/ה לאיסוף ושימוש במידע בהתאם למדיניות זו. אם אינך מסכים/ה לתנאים
                            אלו, אנא הימנע/י משימוש בשירות.
                        </p>
                    </section>

                    <section>
                        <h2>מידע שאנו אוספים</h2>

                        <h3>מידע אישי (באמצעות Google OAuth)</h3>
                        <p>בעת ההרשמה לשירות דרך חשבון Google, אנו מקבלים את הפרטים הבאים:</p>
                        <ul>
                            <li>שם מלא</li>
                            <li>כתובת דוא&quot;ל</li>
                            <li>תמונת פרופיל</li>
                            <li>מזהה חשבון Google</li>
                        </ul>

                        <h3>נתוני שימוש</h3>
                        <p>אנו אוספים באופן אוטומטי מידע על אופן השימוש בשירות, לרבות:</p>
                        <ul>
                            <li>היסטוריית שיחות עם מערכת ה-AI (שאלות ותשובות)</li>
                            <li>נתוני שימוש במודלים של בינה מלאכותית (סוג מודל, מספר בקשות)</li>
                            <li>מידע טכני כגון סוג דפדפן, מערכת הפעלה, וכתובת IP</li>
                            <li>שגיאות ונתוני ביצועים</li>
                        </ul>
                    </section>

                    <section>
                        <h2>כיצד אנו משתמשים במידע</h2>
                        <p>המידע שנאסף משמש למטרות הבאות:</p>
                        <ul>
                            <li>מתן גישה לשירות ותחזוקת חשבון המשתמש</li>
                            <li>שמירת היסטוריית שיחות לנוחות המשתמש</li>
                            <li>שיפור איכות השירות וחוויית המשתמש</li>
                            <li>ניתוח דפוסי שימוש ואופטימיזציה של מודלי ה-AI</li>
                            <li>איתור ומניעת שגיאות טכניות</li>
                            <li>עמידה בדרישות חוקיות</li>
                        </ul>
                    </section>

                    <section>
                        <h2>שירותי צד שלישי</h2>
                        <p>אנו משתמשים בשירותי צד שלישי לצורך הפעלת השירות. לכל שירות מדיניות פרטיות משלו:</p>
                        <ul>
                            <li>
                                <strong>Clerk</strong> — ניהול אימות משתמשים וחשבונות (
                                <a href='https://clerk.com/privacy' className='text-primary hover:underline'>
                                    מדיניות פרטיות
                                </a>
                                )
                            </li>
                            <li>
                                <strong>Convex</strong> — אחסון נתונים ושיחות בענן (
                                <a href='https://www.convex.dev/privacy' className='text-primary hover:underline'>
                                    מדיניות פרטיות
                                </a>
                                )
                            </li>
                            <li>
                                <strong>OpenRouter</strong> — עיבוד שאילתות באמצעות מודלי AI (
                                <a href='https://openrouter.ai/privacy' className='text-primary hover:underline'>
                                    מדיניות פרטיות
                                </a>
                                )
                            </li>
                            <li>
                                <strong>PostHog</strong> — ניתוח שימוש ואנליטיקה (
                                <a href='https://posthog.com/privacy' className='text-primary hover:underline'>
                                    מדיניות פרטיות
                                </a>
                                )
                            </li>
                            <li>
                                <strong>Sentry</strong> — מעקב אחר שגיאות ודיווח (
                                <a href='https://sentry.io/privacy/' className='text-primary hover:underline'>
                                    מדיניות פרטיות
                                </a>
                                )
                            </li>
                            <li>
                                <strong>Upstash Redis</strong> — מטמון והגבלת קצב בקשות (
                                <a
                                    href='https://upstash.com/trust/privacy.pdf'
                                    className='text-primary hover:underline'
                                >
                                    מדיניות פרטיות
                                </a>
                                )
                            </li>
                            <li>
                                <strong>Vercel</strong> — אירוח האתר (
                                <a
                                    href='https://vercel.com/legal/privacy-policy'
                                    className='text-primary hover:underline'
                                >
                                    מדיניות פרטיות
                                </a>
                                )
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2>שימוש בבינה מלאכותית (AI)</h2>
                        <p>
                            השירות משתמש במודלים של בינה מלאכותית לעיבוד שאלות המשתמשים ומתן תשובות מבוססות נתונים
                            ציבוריים. השאלות שלך נשלחות לשירותי AI חיצוניים (באמצעות OpenRouter) לצורך עיבוד. אנו לא
                            מוכרים או משתפים את תוכן השיחות שלך למטרות פרסום.
                        </p>
                    </section>

                    <section>
                        <h2>עוגיות (Cookies)</h2>
                        <p>
                            השירות משתמש בעוגיות הכרחיות לצורך אימות משתמשים (Clerk session cookies) ושמירת העדפות. אנו
                            לא משתמשים בעוגיות למטרות פרסום.
                        </p>
                    </section>

                    <section>
                        <h2>אבטחת מידע</h2>
                        <p>
                            אנו נוקטים באמצעי אבטחה סבירים להגנה על המידע האישי שלך, לרבות הצפנת תעבורה (HTTPS), אימות
                            מאובטח, והגבלת גישה. עם זאת, אין שיטת העברה או אחסון באינטרנט שהיא מאובטחת ב-100%.
                        </p>
                    </section>

                    <section>
                        <h2>שמירת מידע</h2>
                        <p>
                            אנו שומרים את המידע האישי שלך כל עוד חשבונך פעיל או כנדרש לצורך מתן השירות. היסטוריית שיחות
                            נשמרת לנוחות המשתמש וניתנת למחיקה על פי בקשה.
                        </p>
                    </section>

                    <section>
                        <h2>זכויותיך</h2>
                        <p>
                            בהתאם לחוק הגנת הפרטיות, התשמ&quot;א-1981 (כולל תיקון 13) ותקנות ה-GDPR, עומדות לך הזכויות
                            הבאות:
                        </p>
                        <ul>
                            <li>
                                <strong>זכות גישה</strong> — לבקש עותק של המידע האישי שלך
                            </li>
                            <li>
                                <strong>זכות תיקון</strong> — לבקש תיקון מידע לא מדויק
                            </li>
                            <li>
                                <strong>זכות מחיקה</strong> — לבקש מחיקת המידע האישי שלך
                            </li>
                            <li>
                                <strong>זכות הגבלת עיבוד</strong> — לבקש הגבלת השימוש במידע שלך
                            </li>
                            <li>
                                <strong>זכות ניוד נתונים</strong> — לבקש העברת הנתונים שלך
                            </li>
                            <li>
                                <strong>זכות התנגדות</strong> — להתנגד לעיבוד המידע שלך
                            </li>
                        </ul>
                        <p>
                            לבקשות בנושא פרטיות, ניתן לפנות אלינו בכתובת:{' '}
                            <a href='mailto:privacy@dataisrael.co.il' className='text-primary hover:underline'>
                                privacy@dataisrael.co.il
                            </a>
                        </p>
                    </section>

                    <section>
                        <h2>פרטיות ילדים</h2>
                        <p>
                            השירות אינו מיועד לילדים מתחת לגיל 13. איננו אוספים ביודעין מידע אישי מילדים. אם נודע לנו
                            שאספנו מידע של ילד, נמחק אותו מיידית.
                        </p>
                    </section>

                    <section>
                        <h2>שינויים במדיניות</h2>
                        <p>
                            אנו עשויים לעדכן מדיניות זו מעת לעת. שינויים מהותיים יפורסמו באתר. המשך השימוש בשירות לאחר
                            עדכון מהווה הסכמה למדיניות המעודכנת.
                        </p>
                    </section>

                    <section>
                        <h2>יצירת קשר</h2>
                        <p>
                            לשאלות בנושא מדיניות פרטיות זו, ניתן לפנות אלינו בכתובת:{' '}
                            <a href='mailto:privacy@dataisrael.co.il' className='text-primary hover:underline'>
                                privacy@dataisrael.co.il
                            </a>
                        </p>
                    </section>
                </div>

                <div className='mt-16 border-t border-border/40 pt-6 text-center text-sm text-muted-foreground'>
                    <Link href='/' className='text-primary hover:underline'>
                        חזרה לדף הבית
                    </Link>
                    {' · '}
                    <Link href='/terms' className='text-primary hover:underline'>
                        תנאי שימוש
                    </Link>
                </div>
            </div>
        </div>
    );
}
