'use client';

import { motion } from 'framer-motion';
import { Github, Linkedin, Mail } from 'lucide-react';

const LINKS = [
    {
        href: 'mailto:liorvainer@gmail.com',
        icon: <Mail className='w-5 h-5' />,
        label: 'שלחו מייל',
    },
    {
        href: 'https://github.com/LiorVainer/data-israel',
        icon: <Github className='w-5 h-5' />,
        label: 'GitHub',
    },
    {
        href: 'https://www.linkedin.com/in/lior-vainer/',
        icon: <Linkedin className='w-5 h-5' />,
        label: 'LinkedIn',
    },
] as const;

export function ContactSection() {
    return (
        <section className='w-full max-w-4xl mx-auto px-4'>
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5 }}
                className='flex flex-col items-center gap-6 text-center'
            >
                <h2 className='text-2xl md:text-3xl font-bold text-foreground'>צרו קשר</h2>
                <p className='text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl'>
                    שאלות, הצעות לשיפור או סתם רוצים לדבר בקשר למערכת? נשמח לשמוע מכם.
                </p>

                <div className='flex flex-wrap items-center justify-center gap-3'>
                    {LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                            rel={link.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                            className='inline-flex items-center gap-2 rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-card/80'
                        >
                            {link.icon}
                            {link.label}
                        </a>
                    ))}
                </div>
            </motion.div>
        </section>
    );
}
