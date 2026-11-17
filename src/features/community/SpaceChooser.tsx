import { View } from 'react-native';

import { Body, ChoiceCard, SectionTitle } from '@/components';
import { communityCopy as copy } from '@/content/community';
import { spacing } from '@/design/tokens';

import { type CommunitySpace } from './communityService';

export interface SpaceChooserProps {
  selected: CommunitySpace | null;
  onSelect: (space: CommunitySpace) => void;
}

const OPTIONS: readonly {
  space: CommunitySpace;
  title: string;
  body: string;
}[] = [
  {
    space: 'recovery',
    title: copy.spaceRecoveryTitle,
    body: copy.spaceRecoveryBody,
  },
  {
    space: 'gentle_loss',
    title: copy.spaceGentleLossTitle,
    body: copy.spaceGentleLossBody,
  },
];

/**
 * Choose between the two distinct community spaces (issue #38). A single-select
 * radio group: each option exposes its radio role and checked state, and is
 * explained in a sentence so the choice never feels like a test.
 */
export function SpaceChooser({ selected, onSelect }: SpaceChooserProps) {
  return (
    <View style={{ gap: spacing.md }}>
      <SectionTitle>{copy.chooserTitle}</SectionTitle>
      <Body>{copy.chooserIntro}</Body>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={copy.chooserGroupLabel}
        style={{ gap: spacing.sm }}
      >
        {OPTIONS.map((option) => (
          <ChoiceCard
            key={option.space}
            role="radio"
            title={option.title}
            body={option.body}
            selected={selected === option.space}
            onSelect={() => onSelect(option.space)}
          />
        ))}
      </View>
    </View>
  );
}

export default SpaceChooser;
