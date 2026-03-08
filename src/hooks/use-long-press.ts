import { useCallback, useRef } from 'react';

/**
 * Custom hook for mobile long-press gesture detection.
 * Returns touch event handlers and a ref to check if a long press occurred.
 *
 * @param callback - Function to call when long-press is detected
 * @param threshold - Duration in ms before triggering (default: 500)
 */
export function useLongPress(callback: () => void, threshold = 500) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPressRef = useRef(false);

    const start = useCallback(() => {
        isLongPressRef.current = false;
        timerRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            callback();
        }, threshold);
    }, [callback, threshold]);

    const cancel = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    return {
        onTouchStart: start,
        onTouchEnd: cancel,
        onTouchCancel: cancel,
        isLongPressRef,
    };
}
