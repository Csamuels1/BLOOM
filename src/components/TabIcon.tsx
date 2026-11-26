import { type ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

export type TabIconName = 'today' | 'progress' | 'community' | 'settings';

export interface TabIconProps {
  name: TabIconName;
  color: ColorValue;
  /** The selected tab gets a slightly heavier stroke. */
  focused?: boolean;
  size?: number;
}

/**
 * Simple line icons for the bottom tab bar (#149). Drawn in-house with
 * react-native-svg (no icon-font dependency). Decorative: each tab carries its
 * own visible text label and accessibility label.
 */
export function TabIcon({
  name,
  color,
  focused = false,
  size = 24,
}: TabIconProps) {
  const stroke = String(color);
  const strokeWidth = focused ? 2.2 : 1.7;
  const common = {
    stroke,
    strokeWidth,
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessible={false}
      testID={`tab-icon-${name}`}
    >
      {name === 'today' ? (
        // A small blossom: today's gentle focus.
        <>
          <Circle cx={12} cy={12} r={2.6} {...common} />
          <Path
            d="M12 3.5c1.9 2 1.9 4.1 0 5.9-1.9-1.8-1.9-3.9 0-5.9Z"
            {...common}
          />
          <Path
            d="M12 20.5c-1.9-2-1.9-4.1 0-5.9 1.9 1.8 1.9 3.9 0 5.9Z"
            {...common}
          />
          <Path
            d="M3.5 12c2-1.9 4.1-1.9 5.9 0-1.8 1.9-3.9 1.9-5.9 0Z"
            {...common}
          />
          <Path
            d="M20.5 12c-2 1.9-4.1 1.9-5.9 0 1.8-1.9 3.9-1.9 5.9 0Z"
            {...common}
          />
        </>
      ) : null}
      {name === 'progress' ? (
        // A soft trend line over weeks.
        <>
          <Path d="M3.5 19.5h17" {...common} />
          <Path
            d="M4.5 15.5c2.5 0 3-4 5.5-4s3 2.5 5.5 2.5 2.5-5 4-6"
            {...common}
          />
        </>
      ) : null}
      {name === 'community' ? (
        // Two people side by side.
        <>
          <Circle cx={9} cy={8.5} r={3} {...common} />
          <Circle cx={16.5} cy={9.5} r={2.4} {...common} />
          <Path d="M3.5 19.5c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5" {...common} />
          <Path d="M15 14.6c2.6-.4 4.8.9 5.5 4.4" {...common} />
        </>
      ) : null}
      {name === 'settings' ? (
        // Adjustment sliders.
        <>
          <Path d="M4 7h9M17 7h3M4 17h3M11 17h9" {...common} />
          <Circle cx={15} cy={7} r={2} {...common} />
          <Circle cx={9} cy={17} r={2} {...common} />
        </>
      ) : null}
    </Svg>
  );
}

export default TabIcon;
