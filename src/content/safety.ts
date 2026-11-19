// Centralized safety-guardrail copy (issue #47, Phase 11). All gentle messages
// for calorie floors and loss-pace boundaries live here so there is one
// reviewed, non-shaming voice for every guardrail. Covered by tests/copy.test.ts
// and, for safety wording, by a dedicated prohibited-output test.
//
// Voice (docs/BRAND_AND_COPY.md, SECURITY_BASELINE): protective, never alarming
// or clinical. A guardrail reassures and gently redirects; it never diagnoses,
// shames, or implies the person did something wrong. No numbers are framed as a
// target to beat — a floor is a minimum to stay above, a pace is a gentle ceiling.
export const safetyCopy = {
  // Calorie floor (a minimum to protect energy, never a goal).
  calorieFloorAdjustment: 'A gentle minimum to keep you nourished',
  calorieFloorNote:
    'We keep every plan at a nourishing minimum. Eating enough is the foundation of feeling well — this is care, not a limit to push against.',

  // Loss-pace boundary (a gentle ceiling, applied only to loss goals).
  lossPaceRedirectTitle: 'Let’s take this at a gentle pace',
  lossPaceRedirectBody:
    'Slow, steady changes tend to feel better and last longer. We’ll aim for a gentle pace rather than a fast one — your body is doing a lot right now, and there is no rush.',
  lossPaceSafeNote:
    'This is a gentle, sustainable pace. There is never a reason to push faster.',

  // Shared reassurance used where a guardrail steps in.
  guardrailReassurance:
    'Nothing here is a test or a target. These gentle limits are here to look after you.',

  // Non-diagnostic messages for concerning-pattern signals (issue #48). These
  // never name a condition or diagnose — they gently notice and offer support.
  signalRapidLossTitle: 'A gentle check-in',
  signalRapidLossBody:
    'We’ve noticed things have been changing quite quickly lately. There’s no judgement here at all — we just want to check you’re feeling okay. If it would help, talking with someone you trust or a professional can be a kind next step.',
} as const;

export default safetyCopy;
