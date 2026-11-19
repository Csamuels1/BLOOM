/**
 * Today's entrance wrapper. The implementation now lives in the shared motion
 * layer (`src/components/FadeIn.tsx`, issue #51) so every screen uses the same
 * gentle, reduce-motion-aware entrance; this alias keeps existing imports.
 */
export { FadeIn as FadeInView, type FadeInProps } from '@/components/FadeIn';
export { FadeIn as default } from '@/components/FadeIn';
