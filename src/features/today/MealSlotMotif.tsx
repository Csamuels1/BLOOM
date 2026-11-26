import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import type { MealMotifName, MealSlotStyle } from './mealSlotStyle';

/**
 * Small in-house line motifs for meal cards (issue #152). Simple strokes in the
 * slot's brand colour over a soft tinted disc. Food- and nature-themed only:
 * no bodies, scales, or numbers. Purely decorative and hidden from assistive
 * tech; the card's own label and text carry the meaning.
 */

const VIEWBOX = '0 0 40 40';

const STROKE = {
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
} as const;

function Sunrise({ ink }: { ink: string }) {
  return (
    <>
      <Path d="M12 25 A8 8 0 0 1 28 25" stroke={ink} {...STROKE} />
      <Path d="M9 29 H31" stroke={ink} {...STROKE} />
      <Path
        d="M20 11 V14 M11.5 15.5 L13.5 17.5 M28.5 15.5 L26.5 17.5"
        stroke={ink}
        {...STROKE}
      />
    </>
  );
}

function Leaf({ ink }: { ink: string }) {
  return (
    <>
      <Path
        d="M12 28 C12 18 18 12 29 11 C28 22 22 28 12 28 Z"
        stroke={ink}
        {...STROKE}
      />
      <Path d="M12 28 L22 18" stroke={ink} {...STROKE} />
    </>
  );
}

function Bowl({ ink }: { ink: string }) {
  return (
    <>
      <Path
        d="M9 21 H31 C31 27 26 30 20 30 C14 30 9 27 9 21 Z"
        stroke={ink}
        {...STROKE}
      />
      <Path
        d="M16 17 C14.5 15.5 17.5 13.5 16 11 M23 17 C21.5 15.5 24.5 13.5 23 11"
        stroke={ink}
        {...STROKE}
      />
    </>
  );
}

function Berries({ ink }: { ink: string }) {
  return (
    <>
      <Circle cx={15} cy={25} r={4} stroke={ink} {...STROKE} />
      <Circle cx={25} cy={25} r={4} stroke={ink} {...STROKE} />
      <Circle cx={20} cy={18} r={4} stroke={ink} {...STROKE} />
      <Path d="M20 14 C20 12 21.5 10.5 24 10" stroke={ink} {...STROKE} />
    </>
  );
}

function Sprig({ ink }: { ink: string }) {
  return (
    <>
      <Path d="M20 30 V12" stroke={ink} {...STROKE} />
      <Path
        d="M20 24 C16 24 13 21 13 18 M20 19 C24 19 27 16 27 13"
        stroke={ink}
        {...STROKE}
      />
    </>
  );
}

const MOTIFS: Record<
  MealMotifName,
  (props: { ink: string }) => React.JSX.Element
> = {
  sunrise: Sunrise,
  leaf: Leaf,
  bowl: Bowl,
  berries: Berries,
  sprig: Sprig,
};

export function MealSlotMotif({
  slotStyle,
  size = 40,
}: {
  slotStyle: MealSlotStyle;
  size?: number;
}) {
  const Motif = MOTIFS[slotStyle.motif];
  return (
    <View
      testID={`meal-motif-${slotStyle.motif}`}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox={VIEWBOX}>
        <Circle cx={20} cy={20} r={20} fill={slotStyle.accent} opacity={0.22} />
        <Motif ink={slotStyle.ink} />
      </Svg>
    </View>
  );
}

export default MealSlotMotif;
