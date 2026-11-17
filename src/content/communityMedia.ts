// Voice-sensitive copy for community post images (issue #39). Covered by the
// prohibited-language test (tests/communityMedia/copy.test.ts here, and
// tests/copy.test.ts once the supervisor wires it in).
//
// Voice rules (docs/BRAND_AND_COPY.md, AGENTS.md): BLOOM serves postpartum women
// first. Images shared to the community are reviewed before anyone else can see
// them, and we say so plainly and kindly. There is no before/after, side-by-side,
// or comparison framing anywhere, and alt text never describes a body, shape, or
// weight. Amber is never used here (no safety notice involved).
export const communityMediaCopy = {
  // Attach (composer).
  attachLabel: 'Add an image',
  attachHint: 'Opens your photo library so you can choose one image to share.',
  attachOptional: 'Adding an image is optional.',
  reviewNote:
    'Images are reviewed by our team before anyone else can see them. Until then, only you can see yours.',
  attachedLabel: 'Image ready to share',
  attachedAlt: 'The image you chose to share',
  removeAttachedLabel: 'Remove image',
  removeAttachedHint: 'Takes this image off your post before you share it.',
  permissionDenied:
    'BLOOM needs access to your photos to add an image. You can change this in your settings whenever you like.',

  // Validation — gentle, specific, never blaming.
  invalidType:
    'That file type is not supported. Please choose a JPEG, PNG, or WebP image.',
  invalidEmpty: 'That image seems to be empty. Please choose a different one.',
  invalidTooLarge:
    'That image is a little too large to share. Please choose one under 5 MB.',
  invalidExtension:
    'That file does not look like an image we can share. Please choose a JPEG, PNG, or WebP image.',

  // Upload / delete.
  uploading: 'Adding your image…',
  uploadError:
    'We could not add that image just now. Your post is safe, and you can try again.',
  deleteError: 'We could not remove that image. It is still attached.',

  // Display (post card).
  imageAlt: 'An image shared with this post',
  loadingLabel: 'Loading image…',
  pendingNote:
    'Awaiting review. Only you can see this image until our team has looked at it.',
  rejectedNote:
    'This image was not approved, so it stays private to you. Your post itself is unaffected.',
} as const;

export default communityMediaCopy;
