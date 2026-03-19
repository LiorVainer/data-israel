'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Send, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function FeedbackPage() {
    const submitFeedback = useMutation(api.feedback.submit);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;

        const form = e.currentTarget;
        try {
            await submitFeedback({ name, email, title, description });
            toast.success('המשוב נשלח בהצלחה! תודה רבה.');
            form.reset();
        } catch (err) {
            console.error('Feedback submit error:', err);
            toast.error('שגיאה בשליחת המשוב. נסו שוב מאוחר יותר.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className='flex flex-1 items-center pt-14 md:pt-0 justify-center p-4 md:p-8'>
            <Card className='w-full max-w-lg'>
                <CardHeader className='text-center'>
                    <CardTitle className='text-2xl'>שלחו לנו משוב</CardTitle>
                    <CardDescription>שאלות, הצעות לשיפור או סתם רוצים לדבר? נשמח לשמוע מכם.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
                        <div className='flex flex-col gap-1.5'>
                            <Label htmlFor='name'>שם</Label>
                            <Input id='name' name='name' required placeholder='השם שלכם' />
                        </div>

                        <div className='flex flex-col gap-1.5'>
                            <Label htmlFor='email'>אימייל</Label>
                            <Input
                                id='email'
                                name='email'
                                type='email'
                                required
                                placeholder='example@mail.com'
                                dir='ltr'
                                className='text-left'
                            />
                        </div>

                        <div className='flex flex-col gap-1.5'>
                            <Label htmlFor='title'>נושא</Label>
                            <Input id='title' name='title' required placeholder='נושא המשוב' />
                        </div>

                        <div className='flex flex-col gap-1.5'>
                            <Label htmlFor='description'>תיאור</Label>
                            <Textarea
                                id='description'
                                name='description'
                                required
                                placeholder='ספרו לנו בפירוט...'
                                rows={5}
                            />
                        </div>

                        <Button type='submit' disabled={isSubmitting} className='mt-2'>
                            {isSubmitting ? 'שולח...' : 'שליחת משוב'}
                            <Send className='size-4 mr-2' />
                        </Button>

                        <Button variant='ghost' size='sm' asChild className='mx-auto'>
                            <Link href='/'>
                                <ArrowRight className='size-4 ml-1' />
                                חזרה לדף הבית
                            </Link>
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
