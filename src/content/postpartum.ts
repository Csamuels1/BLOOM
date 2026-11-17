// Voice-sensitive copy for postpartum recovery context and feeding adjustments
// (issue #35). Covered by the prohibited-language test (tests/copy.test.ts) once
// the supervisor wires `postpartumCopy` in there.
//
// Voice and SAFETY (AGENTS.md): BLOOM serves postpartum women first and protects
// emotional safety above all. This content NEVER diagnoses, NEVER pressures a pace
// of recovery or weight change, and NEVER implies a "should". Loss, gain, and
// maintenance are equal. Recovery looks different for everyone.
//
// DRAFT-UNTIL-REVIEW (ADR-0010): recovery context and feeding energy adjustments
// are health content. They are UNREVIEWED DRAFTS pending qualified dietitian /
// clinical review, are versioned, and are NOT validated clinical guidance. A
// reviewer activates them later. The draft disclaimer below says so plainly.
export const postpartumCopy = {
  // Card chrome.
  cardHeading: 'Where you are right now',
  cardLabel: 'A gentle note for this season',
  adjustmentsHeading: 'A little extra, if feeding is part of your day',

  // Stage narratives — supportive, optional, non-diagnostic, no pace, no numbers.
  // Keyed by stage; the pure context logic picks one and never invents a target.
  narrativeEarly:
    'These early weeks are tender ones. Your body is doing quiet, enormous work, and rest and nourishment matter more than anything else right now. There is no schedule to keep up with here — only gentle support, whenever you are ready for it.',
  narrativeMid:
    'You are finding a rhythm, and that takes time. However these months are feeling, you are allowed to go gently. BLOOM is here to support you with care, never to rush you or measure how you are doing.',
  narrativeLater:
    'Wherever this stage finds you, it is yours to move through at your own pace. There is no finish line and nothing to catch up on — just gentle, steady support for the body that carried you here.',

  // Safe neutral default — used for missing and prefer-not-to-say. Never guesses
  // a stage, never asks for more, never pressures.
  narrativeNeutral:
    'However you are feeling today, you are welcome here exactly as you are. BLOOM offers gentle, optional support and nothing you have to share. There is no pace to keep and nothing to measure up to.',

  // Shown when the person is not postpartum — simply warm and neutral.
  narrativeNotApplicable:
    'BLOOM is here with gentle, flexible support for wherever you are in your life right now.',

  // Reviewable reasons for each feeding energy adjustment (draft estimates).
  reasonBreastfeeding:
    'Breastfeeding usually calls for some extra energy, so this draft adds a gentle allowance — an estimate to confirm with your own provider, never a requirement.',
  reasonMixed:
    'Mixed feeding usually calls for a little extra energy, so this draft adds a lighter allowance — an estimate to confirm with your own provider, never a requirement.',
  reasonFormula:
    'Formula feeding does not add a feeding energy allowance in this draft. That is simply a note, not a comparison — every way of feeding your baby is welcome here.',
  reasonNotFeeding:
    'With no feeding energy allowance applied here, this is just a neutral note — nothing about how you feed changes how welcome you are.',
  reasonPreferNot:
    'You have kept this private, so no feeding energy allowance is assumed. That is completely okay — nothing here depends on you sharing it.',

  // Draft disclaimer, shown with the context and adjustments.
  draftDisclaimer:
    'This is gentle, general context shown on purpose — something to lean on, never a diagnosis and never medical advice. It is a draft being prepared and reviewed by qualified professionals before launch, and your own provider knows your story best.',
} as const;
