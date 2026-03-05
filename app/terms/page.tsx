import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export const metadata: Metadata = {
    title: 'תנאי שימוש | דאטה ישראל',
    description: 'תנאי השימוש של דאטה ישראל — הכללים והתנאים לשימוש בשירות.',
};

export default function TermsOfServicePage() {
    return (
        <div className='overflow-auto'>
            <div className='mx-auto max-w-3xl px-6 py-16 text-foreground'>
                <div className='mb-12 flex flex-col items-center gap-4'>
                    <Link href='/'>
                        <Logo className='size-12' />
                    </Link>
                    <h1 className='text-3xl font-bold'>תנאי שימוש</h1>
                    <p className='text-sm text-muted-foreground'>עודכן לאחרונה: 5 במרץ 2026</p>
                </div>

                <div className='prose prose-sm dark:prose-invert max-w-none space-y-8 leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pr-6 [&_li]:mb-1'>
                    <section>
                        <h2>הסכמה לתנאים</h2>
                        <p>
                            בגישה ושימוש בשירות דאטה ישראל (להלן: &quot;השירות&quot;), הנגיש בכתובת{' '}
                            <a href='https://data-israel.org' className='text-primary hover:underline'>
                                data-israel.org
                            </a>
                            , הנך מסכים/ה להיות כפוף/ה לתנאי שימוש אלו. אם אינך מסכים/ה לתנאים אלו, אנא הימנע/י משימוש
                            בשירות.
                        </p>
                    </section>

                    <section>
                        <h2>תיאור השירות</h2>
                        <p>
                            דאטה ישראל הוא שירות חינמי המספק ממשק שיחה (צ&apos;אט) מבוסס בינה מלאכותית לחקירת נתונים
                            ציבוריים ממאגרי מידע ממשלתיים של מדינת ישראל, כולל:
                        </p>
                        <ul>
                            <li>data.gov.il — פורטל הנתונים הפתוחים של ממשלת ישראל</li>
                            <li>הלשכה המרכזית לסטטיסטיקה (למ&quot;ס) — נתונים סטטיסטיים</li>
                        </ul>
                    </section>

                    <section>
                        <h2>חשבון משתמש</h2>
                        <p>
                            השימוש בשירות מחייב יצירת חשבון באמצעות Google OAuth. הנך אחראי/ת לשמירה על אבטחת חשבונך
                            ולכל פעולה המתבצעת דרכו. אנא הודע/י לנו מיד על כל שימוש לא מורשה.
                        </p>
                    </section>

                    <section>
                        <h2>שימוש מותר</h2>
                        <p>הנך מתחייב/ת:</p>
                        <ul>
                            <li>להשתמש בשירות למטרות חוקיות בלבד</li>
                            <li>לא לנסות לעקוף מגבלות טכניות או אבטחה של השירות</li>
                            <li>לא להשתמש בשירות באופן שעלול לפגוע בפעילותו או בזמינותו</li>
                            <li>לא להעביר תוכן פוגעני, מזיק או בלתי חוקי דרך השירות</li>
                            <li>לא לבצע שימוש אוטומטי מסיבי (scraping) ללא אישור מראש</li>
                        </ul>
                    </section>

                    <section>
                        <h2>תוכן ודיוק המידע</h2>
                        <p>השירות מספק תשובות המבוססות על מודלי בינה מלאכותית ונתונים ממאגרים ציבוריים. חשוב להבין:</p>
                        <ul>
                            <li>
                                <strong>התשובות אינן מהוות ייעוץ מקצועי</strong> — המידע מסופק למטרות מידע כללי בלבד
                                ואינו מהווה ייעוץ משפטי, כלכלי, רפואי או מקצועי אחר.
                            </li>
                            <li>
                                <strong>מודלי AI עלולים לטעות</strong> — תשובות הבינה המלאכותית עלולות להכיל אי-דיוקים.
                                מומלץ לאמת מידע חשוב ממקורות רשמיים.
                            </li>
                            <li>
                                <strong>הנתונים מקורם במאגרים ציבוריים</strong> — איננו אחראים לדיוק, עדכניות או שלמות
                                הנתונים המקוריים.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2>קניין רוחני</h2>
                        <p>
                            הממשק, העיצוב, הקוד והתוכן המקורי של השירות הם רכושו של דאטה ישראל. הנתונים הציבוריים שאליהם
                            השירות מספק גישה כפופים לתנאי הרישוי של המקורות הממשלתיים המתאימים.
                        </p>
                    </section>

                    <section>
                        <h2>זמינות השירות</h2>
                        <p>
                            אנו שואפים לספק שירות רציף וזמין, אך איננו מתחייבים לזמינות של 100%. השירות עשוי להיות לא
                            זמין באופן זמני עקב תחזוקה, עדכונים, או נסיבות שאינן בשליטתנו. אנו שומרים לעצמנו את הזכות
                            לשנות, להשהות או להפסיק את השירות בכל עת.
                        </p>
                    </section>

                    <section>
                        <h2>הגבלת אחריות</h2>
                        <p>
                            השירות מסופק כמות שהוא (&quot;AS IS&quot;) וכפי שהוא זמין (&quot;AS AVAILABLE&quot;). במידה
                            המרבית המותרת על פי חוק:
                        </p>
                        <ul>
                            <li>
                                איננו מעניקים כל אחריות, מפורשת או משתמעת, לגבי דיוק, שלמות או התאמת המידע למטרה מסוימת.
                            </li>
                            <li>לא נהיה אחראים לכל נזק ישיר, עקיף, מקרי או תוצאתי הנובע מהשימוש בשירות.</li>
                            <li>לא נהיה אחראים לאובדן נתונים, הפסקת שירות או בעיות אבטחה שאינן בשליטתנו.</li>
                        </ul>
                    </section>

                    <section>
                        <h2>סיום שימוש</h2>
                        <p>
                            אנו שומרים לעצמנו את הזכות להשעות או לסגור חשבון משתמש במקרה של הפרת תנאי שימוש אלו, שימוש
                            לרעה בשירות, או על פי שיקול דעתנו.
                        </p>
                    </section>

                    <section>
                        <h2>שינויים בתנאים</h2>
                        <p>
                            אנו עשויים לעדכן תנאים אלו מעת לעת. שינויים מהותיים יפורסמו באתר. המשך השימוש בשירות לאחר
                            עדכון מהווה הסכמה לתנאים המעודכנים.
                        </p>
                    </section>

                    <section>
                        <h2>דין חל וסמכות שיפוט</h2>
                        <p>
                            תנאי שימוש אלו כפופים לדיני מדינת ישראל. כל מחלוקת תידון בבתי המשפט המוסמכים במדינת ישראל.
                        </p>
                    </section>

                    <section>
                        <h2>יצירת קשר</h2>
                        <p>
                            לשאלות בנושא תנאי שימוש אלו, ניתן לפנות אלינו בכתובת:{' '}
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
                    <Link href='/privacy' className='text-primary hover:underline'>
                        מדיניות פרטיות
                    </Link>
                </div>
            </div>
        </div>
    );
}
