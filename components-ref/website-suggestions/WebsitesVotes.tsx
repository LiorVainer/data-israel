import { Triangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Doc } from '@convex/dataModel';
import { useConvexAuth, useMutation } from 'convex/react';
import { api } from '@convex/api';
import { cn } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';
import { AuthSensitiveWrapper } from '@/components/wrappers/AuthSensitiveWrapper';
import { cva } from 'class-variance-authority';

export const websiteVotesWrapper = cva(
    'inline-flex -space-x-px rounded-xl shadow-sm shadow-black/5 rtl:space-x-reverse',
    {
        variants: {
            size: {
                sm: '',
                md: 'scale-100',
                lg: 'scale-125',
            },
        },
        defaultVariants: {
            size: 'md',
        },
    },
);

export const websiteVotesButton = cva(
    'rounded-none first:rounded-s-lg last:rounded-e-lg shadow-none focus-visible:z-10 ',
    {
        variants: {
            intent: {
                up: 'hover:bg-blue-50 hover:text-blue-500',
                down: 'hover:bg-red-50 hover:text-red-500',
            },
            state: {
                activeUp: 'bg-blue-100 border-blue-200',
                activeDown: 'bg-red-100 border-red-200',
                disabled: 'cursor-not-allowed',
            },
        },
    },
);

export const voteCount = cva(
    'flex items-center border border-input px-3 text-sm font-medium min-w-[40px] justify-center',
    {
        variants: {
            size: {
                sm: 'text-sm',
                md: 'text-base px-4',
                lg: 'text-lg px-5',
            },
        },
        defaultVariants: {
            size: 'md',
        },
    },
);

export type WebsiteVotesProps = {
    website: Doc<'websites'>;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
};

export const WebsitesVotes = ({ website, className, size = 'sm' }: WebsiteVotesProps) => {
    const { user } = useUser();
    const { isAuthenticated } = useConvexAuth();
    const userId = user?.id;

    const vote = useMutation(api.websites.voteOnWebsite);

    const hasUpvoted = website?.upvotes.includes(userId ?? '');
    const hasDownvoted = website?.downvotes.includes(userId ?? '');

    const totalVotes = website?.upvotes.length - website?.downvotes.length;

    const handleUpvote = async () => {
        if (!userId) return;
        await vote({ websiteId: website._id, vote: 'up' });
    };

    const handleDownvote = async () => {
        if (!userId) return;
        await vote({ websiteId: website._id, vote: 'down' });
    };

    return (
        <AuthSensitiveWrapper className={cn(websiteVotesWrapper({ size }), className)}>
            <Button
                onClick={handleUpvote}
                className={cn(
                    websiteVotesButton({ intent: 'up' }),
                    hasUpvoted && websiteVotesButton({ state: 'activeUp' }),
                    !isAuthenticated && websiteVotesButton({ state: 'disabled' }),
                )}
                variant='outline'
                size={size}
                aria-label='Upvote'
                disabled={!isAuthenticated}
            >
                <Triangle
                    className={cn('size-3.5', hasUpvoted && 'text-blue-700')}
                    strokeWidth={2}
                    aria-hidden='true'
                />
            </Button>

            <span className={voteCount({ size })}>{totalVotes}</span>

            <Button
                onClick={handleDownvote}
                className={cn(
                    websiteVotesButton({ intent: 'down' }),
                    hasDownvoted && websiteVotesButton({ state: 'activeDown' }),
                    !isAuthenticated && websiteVotesButton({ state: 'disabled' }),
                )}
                variant='outline'
                size={size}
                aria-label='Downvote'
                disabled={!isAuthenticated}
            >
                <Triangle
                    className={cn('size-3.5 rotate-180', hasDownvoted && 'text-red-700')}
                    strokeWidth={2}
                    aria-hidden='true'
                />
            </Button>
        </AuthSensitiveWrapper>
    );
};
