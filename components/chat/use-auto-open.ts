import { useState } from 'react';

/**
 * Manages ChainOfThought open/close state with auto-open behavior.
 *
 * - Auto-opens when `shouldAutoOpen` is true (e.g. while processing)
 * - Once the user manually toggles, their choice is respected
 */
export function useAutoOpen(shouldAutoOpen: boolean) {
    const [userToggled, setUserToggled] = useState(false);
    const [userWantsOpen, setUserWantsOpen] = useState(false);

    const handleOpenChange = (open: boolean) => {
        setUserToggled(true);
        setUserWantsOpen(open);
    };

    const isOpen = userToggled ? userWantsOpen : shouldAutoOpen;

    return { isOpen, handleOpenChange } as const;
}
