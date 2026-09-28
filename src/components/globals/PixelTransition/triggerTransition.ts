// src/components/globals/PixelTransition/triggerTransition.ts

export const triggerPageTransition = (navigateCallback: () => void) => {
    window.dispatchEvent(new CustomEvent('pixel-transition-start', { detail: navigateCallback }));
};