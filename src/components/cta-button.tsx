'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CTAButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

const CTAButton = React.forwardRef<HTMLButtonElement, CTAButtonProps>(({ children, onClick, className }, ref) => {
    return (
        <>
            <style jsx global>{`
                @property --gradient-angle {
                    syntax: '<angle>';
                    initial-value: 0deg;
                    inherits: false;
                }

                @keyframes rotate-gradient {
                    0% {
                        --gradient-angle: 0deg;
                    }
                    100% {
                        --gradient-angle: 360deg;
                    }
                }

                .cta-button {
                    position: relative;
                    isolation: isolate;
                    padding: 0.625rem 1.5rem;
                    border-radius: 999px;
                    font-size: 0.875rem;
                    font-weight: 700;
                    color: var(--action-tint);
                    border: 2px solid transparent;
                    background:
                        linear-gradient(var(--action), var(--action)) padding-box,
                        //conic-gradient(
                        //        from var(--gradient-angle),
                        //        transparent 0%,
                        //        var(--action) 5%,
                        //        transparent 10%,
                        //        transparent 100%
                        //    )
                        border-box;
                    animation: rotate-gradient 3s linear infinite;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    overflow: hidden;
                }

                .cta-button::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 999px;
                    background: radial-gradient(ellipse 80% 100% at 50% 100%, var(--action-tint) 0%, transparent 60%);
                    opacity: 0.2;
                    transform: translateX(30%);
                    transition:
                        opacity 600ms cubic-bezier(0.4, 0, 0.2, 1),
                        transform 800ms cubic-bezier(0.25, 1, 0.5, 1);
                    pointer-events: none;
                    z-index: 0;
                }

                .cta-button:hover {
                    transform: scale(1.05);
                }

                .cta-button:hover::after {
                    opacity: 0.4;
                    transform: translateX(0);
                }

                .cta-button:active {
                    transform: scale(1.02) translateY(1px);
                }

                @media (min-width: 768px) {
                    .cta-button {
                        padding: 0.625rem 1.5rem;
                        font-size: 1rem;
                    }
                }

                .cta-button-content {
                    position: relative;
                    z-index: 1;
                }
            `}</style>
            <button ref={ref} onClick={onClick} className={cn('cta-button', className)}>
                <span className='cta-button-content'>{children}</span>
            </button>
        </>
    );
});

CTAButton.displayName = 'CTAButton';

export { CTAButton };
