import { View } from 'react-native';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';

import { colors, radii, spacing } from '@/design/tokens';

import type { WeeklyPoint } from './weeklyAverages';

const VIEW_W = 100;
const VIEW_H = 48;
const PAD_X = 4;
const PAD_Y = 6;

interface ProgressChartProps {
  points: WeeklyPoint[];
  /** Rendered height in dp. */
  height?: number;
}

/**
 * The weekly-average trend line (issue #26). It plots one point per week — the
 * averages, not daily readings — so day-to-day spikes are never drawn. It is
 * purely visual and hidden from assistive tech; the matching ProgressSummary
 * carries the same information as text.
 */
export function ProgressChart({ points, height = 140 }: ProgressChartProps) {
  const values = points.map((point) => point.averageKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1; // avoid divide-by-zero when all equal

  const coords = points.map((point, index) => {
    const x =
      points.length > 1
        ? PAD_X + (index / (points.length - 1)) * (VIEW_W - 2 * PAD_X)
        : VIEW_W / 2;
    const y =
      PAD_Y + (1 - (point.averageKg - min) / span) * (VIEW_H - 2 * PAD_Y);
    return { x, y };
  });

  const polyline = coords.map(({ x, y }) => `${x},${y}`).join(' ');

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        height,
        backgroundColor: colors.ivory,
        borderRadius: radii.card,
        borderWidth: 1,
        borderColor: colors.mutedSage,
        padding: spacing.md,
      }}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
      >
        {/* A soft baseline so a single point still reads as a chart. */}
        <Path
          d={`M ${PAD_X} ${VIEW_H - PAD_Y} L ${VIEW_W - PAD_X} ${VIEW_H - PAD_Y}`}
          stroke={colors.mutedSage}
          strokeWidth={0.4}
          opacity={0.6}
        />
        {coords.length > 1 ? (
          <Polyline
            points={polyline}
            fill="none"
            stroke={colors.sage}
            strokeWidth={1.4}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {coords.map(({ x, y }, index) => (
          <Circle key={index} cx={x} cy={y} r={1.6} fill={colors.sage} />
        ))}
      </Svg>
    </View>
  );
}

export default ProgressChart;
