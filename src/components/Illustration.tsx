import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { colors } from '@/design/tokens';

import { FadeIn } from './FadeIn';

/**
 * Original BLOOM spot illustrations (issue #51) — PENDING OWNER APPROVAL at the
 * Phase 12 gate (#54); see assets/brand/README.md.
 *
 * Simple botanical motifs drawn from the brand palette only. They are
 * deliberately non-body-focused: no figures, bodies, scales, numbers, or
 * before/after framing. Each is purely decorative and hidden from assistive
 * tech — the surrounding text carries the meaning.
 */
export const ILLUSTRATION_NAMES = [
  'blossom',
  'sprout',
  'leaves',
  'sunrise',
  'moon',
] as const;

export type IllustrationName = (typeof ILLUSTRATION_NAMES)[number];

export interface IllustrationProps {
  name: IllustrationName;
  /** Rendered width/height in dp. */
  size?: number;
  /** Soft entrance (skipped automatically under reduce-motion). */
  animated?: boolean;
}

const VIEWBOX = '0 0 120 120';

/** Five soft petals around a gold centre — echoes the brand mark. */
function Blossom() {
  return (
    <>
      <Circle cx={60} cy={60} r={54} fill={colors.blush} opacity={0.25} />
      <Path
        d="M60 72 C60 88 58 98 54 108"
        stroke={colors.sage}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      <Ellipse
        cx={46}
        cy={94}
        rx={10}
        ry={5}
        fill={colors.sage}
        transform="rotate(-30 46 94)"
      />
      <G>
        {[0, 72, 144, 216, 288].map((angle) => (
          <Ellipse
            key={angle}
            cx={60}
            cy={38}
            rx={11}
            ry={18}
            fill={angle % 144 === 0 ? colors.terracotta : colors.blush}
            transform={`rotate(${angle} 60 54)`}
          />
        ))}
      </G>
      <Circle cx={60} cy={54} r={8} fill={colors.gold} />
    </>
  );
}

/** A small sprout lifting from a soft mound — "nothing yet, and that's fine". */
function Sprout() {
  return (
    <>
      <Circle cx={60} cy={60} r={54} fill={colors.mutedSage} opacity={0.35} />
      <Ellipse cx={60} cy={94} rx={34} ry={9} fill={colors.mutedSage} />
      <Path
        d="M60 92 C60 78 60 66 61 56"
        stroke={colors.sage}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M61 62 C48 62 38 54 36 42 C50 42 59 50 61 62 Z"
        fill={colors.sage}
      />
      <Path
        d="M61 56 C66 44 77 36 90 36 C88 50 76 58 61 56 Z"
        fill={colors.sage}
        opacity={0.8}
      />
      <Circle cx={88} cy={74} r={3} fill={colors.gold} />
    </>
  );
}

/** Two leaves leaning together — quiet company. */
function Leaves() {
  return (
    <>
      <Circle cx={60} cy={60} r={54} fill={colors.blush} opacity={0.2} />
      <Path
        d="M44 102 C40 80 42 58 56 36 C66 58 60 82 44 102 Z"
        fill={colors.sage}
      />
      <Path
        d="M44 102 C48 80 52 60 56 40"
        stroke={colors.ivory}
        strokeWidth={1.5}
        fill="none"
      />
      <Path
        d="M76 102 C80 82 78 62 66 42 C56 62 60 84 76 102 Z"
        fill={colors.terracotta}
        opacity={0.85}
      />
      <Path
        d="M76 102 C72 82 69 62 66 46"
        stroke={colors.ivory}
        strokeWidth={1.5}
        fill="none"
      />
      <Circle cx={61} cy={28} r={4} fill={colors.gold} />
    </>
  );
}

/** A gentle sun resting over soft hills — a calm start. */
function Sunrise() {
  return (
    <>
      <Circle cx={60} cy={60} r={54} fill={colors.blush} opacity={0.22} />
      <Circle cx={60} cy={70} r={22} fill={colors.gold} />
      <Path
        d="M8 84 C30 70 48 74 64 82 C80 90 96 82 112 76 L112 98 C100 108 82 114 60 114 C38 114 20 108 8 98 Z"
        fill={colors.mutedSage}
      />
      <Path
        d="M16 98 C34 88 52 90 70 96 C86 101 100 96 108 92 C98 106 80 114 60 114 C42 114 26 108 16 98 Z"
        fill={colors.sage}
      />
    </>
  );
}

/** A soft crescent with small petals — a gentle rhythm, no countdown. */
function Moon() {
  return (
    <>
      <Circle cx={60} cy={60} r={54} fill={colors.mutedSage} opacity={0.3} />
      <Path
        d="M70 26 C52 30 40 46 40 62 C40 80 54 94 72 96 C58 88 52 76 52 62 C52 46 60 32 70 26 Z"
        fill={colors.gold}
      />
      <Ellipse
        cx={84}
        cy={48}
        rx={4}
        ry={7}
        fill={colors.blush}
        transform="rotate(25 84 48)"
      />
      <Ellipse
        cx={90}
        cy={70}
        rx={4}
        ry={7}
        fill={colors.terracotta}
        opacity={0.8}
        transform="rotate(70 90 70)"
      />
      <Circle cx={78} cy={86} r={3} fill={colors.sage} />
    </>
  );
}

const ART: Record<IllustrationName, () => React.JSX.Element> = {
  blossom: Blossom,
  sprout: Sprout,
  leaves: Leaves,
  sunrise: Sunrise,
  moon: Moon,
};

export function Illustration({
  name,
  size = 96,
  animated = true,
}: IllustrationProps) {
  const Art = ART[name];
  const art = (
    <View
      testID={`illustration-${name}`}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox={VIEWBOX}>
        <Art />
      </Svg>
    </View>
  );

  return animated ? <FadeIn variant="settle">{art}</FadeIn> : art;
}

export default Illustration;
