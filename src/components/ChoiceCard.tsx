import { Pressable } from 'react-native';

import { useReducedMotion } from '@/design/useReducedMotion';
import { colors, minTouchTarget, radii, spacing } from '@/design/tokens';

import { Body, SectionTitle } from './Typography';

export interface ChoiceCardProps {
  /** Visible title; also the control's accessibility label. */
  title: string;
  /** Optional supporting line. */
  body?: string;
  selected: boolean;
  onSelect: () => void;
  /**
   * Semantics of the choice. `radio` for a single-select group (wrap the group
   * in a View with accessibilityRole="radiogroup"); `checkbox` for multi-select.
   */
  role?: 'radio' | 'checkbox';
}

/**
 * Accessible selectable card for onboarding choices (issue #13). Exposes its
 * role and selected state to screen readers and is a single large touch target.
 * Selection is shown with a terracotta border and sage tint — never red.
 */
export function ChoiceCard({
  title,
  body,
  selected,
  onSelect,
  role = 'radio',
}: ChoiceCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={title}
      accessibilityHint={body}
      accessibilityState={{ selected, checked: selected }}
      onPress={onSelect}
      style={({ pressed }) => ({
        minHeight: minTouchTarget,
        gap: spacing.xs,
        padding: spacing.lg,
        borderRadius: radii.card,
        borderWidth: 2,
        borderColor: selected ? colors.terracotta : colors.mutedSage,
        backgroundColor: selected ? colors.mutedSage : colors.ivory,
        opacity: pressed && !reduceMotion ? 0.9 : 1,
      })}
    >
      <SectionTitle>{title}</SectionTitle>
      {body ? <Body>{body}</Body> : null}
    </Pressable>
  );
}

export default ChoiceCard;
