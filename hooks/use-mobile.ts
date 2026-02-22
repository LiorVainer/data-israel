import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
    const [isMobile, setIsMobile] = React.useState<boolean>(false);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        const onChange = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };
        mql.addEventListener('change', onChange);
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        return () => mql.removeEventListener('change', onChange);
    }, []);

    // Return false during SSR to prevent hydration mismatch
    return mounted ? isMobile : false;
}

const TABLET_BREAKPOINT = 1360;

export function useIsTablet() {
    const [isTablet, setIsTablet] = React.useState<boolean>(false);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        const mql = window.matchMedia(`(max-width: ${TABLET_BREAKPOINT - 1}px)`);
        const onChange = () => {
            setIsTablet(window.innerWidth < TABLET_BREAKPOINT);
        };
        mql.addEventListener('change', onChange);
        setIsTablet(window.innerWidth < TABLET_BREAKPOINT);
        return () => mql.removeEventListener('change', onChange);
    }, []);

    // Return false during SSR to prevent hydration mismatch
    return mounted ? isTablet : false;
}
