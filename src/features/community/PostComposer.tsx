import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import {
  Button,
  Caption,
  Card,
  ErrorState,
  SectionTitle,
  TextField,
} from '@/components';
import { communityCopy as copy } from '@/content/community';
import { spacing } from '@/design/tokens';

import { MAX_POST_LENGTH } from './communityService';

export interface PostComposerProps {
  /** Share the body; resolves true when the post was saved (pending review). */
  onSubmit: (body: string) => Promise<boolean>;
  /** Optional attachment UI (e.g. an image picker) shown above the submit button. */
  attachment?: ReactNode;
}

/**
 * Compose a post (issue #38, Pro only — the screen decides whether to render
 * it; the server enforces Pro regardless). Body is 1–5000 characters. On a
 * failed save the typed words are NEVER discarded; on success the box clears
 * and a warm note explains the post will appear once reviewed.
 */
export function PostComposer({ onSubmit, attachment }: PostComposerProps) {
  const [body, setBody] = useState('');
  const [validation, setValidation] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [posted, setPosted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmed = body.trim();
    if (trimmed.length === 0) {
      setValidation(copy.composerEmpty);
      return;
    }
    if (trimmed.length > MAX_POST_LENGTH) {
      setValidation(copy.composerTooLong);
      return;
    }
    setValidation(null);
    setFailed(false);
    setPosted(false);
    setSubmitting(true);
    const ok = await onSubmit(trimmed);
    setSubmitting(false);
    if (ok) {
      setBody('');
      setPosted(true);
    } else {
      // Keep the words exactly as typed; offer a calm retry.
      setFailed(true);
    }
  }

  return (
    <Card>
      <View style={{ gap: spacing.md }}>
        <SectionTitle>{copy.composerTitle}</SectionTitle>
        <TextField
          label={copy.composerLabel}
          hint={copy.composerHint}
          value={body}
          onChangeText={(text) => {
            setBody(text);
            setValidation(null);
            setPosted(false);
          }}
          error={validation ?? undefined}
          multiline
          maxLength={MAX_POST_LENGTH}
          textAlignVertical="top"
        />
        {attachment}
        <Button
          label={copy.composerSubmit}
          loading={submitting}
          onPress={() => void handleSubmit()}
        />
        {posted ? (
          <Caption color="sage" accessibilityLiveRegion="polite" role="status">
            {copy.composerPosted}
          </Caption>
        ) : null}
        {failed ? (
          <ErrorState
            title={copy.composerErrorTitle}
            message={copy.composerErrorBody}
            retryLabel={copy.retry}
            onRetry={() => void handleSubmit()}
          />
        ) : null}
      </View>
    </Card>
  );
}

export default PostComposer;
