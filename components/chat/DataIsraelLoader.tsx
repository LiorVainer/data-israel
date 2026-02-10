import { Logo } from '@/components/ui/logo';

export interface DataIsraelLoaderProps {
    size?: number;
}

export function DataIsraelLoader({ size = 20 }: DataIsraelLoaderProps) {
    return <Logo size={size} className='inline-block animate-spin' aria-label='טוען...' />;
}
