import { render, screen } from '@testing-library/react-native';
import { Animated, Text, type ViewStyle } from 'react-native';

import { Button } from '@/components/Button';
import { FadeIn } from '@/components/FadeIn';
import { Skeleton } from '@/components/Skeleton';
import { MAX_MOTION_DURATION_MS, motion } from '@/design/motion';
import { FadeInView } from '@/features/today/FadeInView';

// Toggle reduce-motion per test through a `mock`-prefixed variable.
let mockReduceMotion = false;
jest.mock('@/design/useReducedMotion', () => ({
  useReducedMotion: () => mockReduceMotion,
}));

// The first jest-expo render in a suite pays a one-time warm-up.
jest.setTimeout(20000);

let timingSpy: jest.SpyInstance;
let loopSpy: jest.SpyInstance;

beforeEach(() => {
  mockReduceMotion = false;
  timingSpy = jest.spyOn(Animated, 'timing');
  loopSpy = jest.spyOn(Animated, 'loop');
});

afterEach(() => {
  timingSpy.mockRestore();
  loopSpy.mockRestore();
});

function flatStyle(node: { props: { style?: unknown } }) {
  const style = node.props.style;
  const list = Array.isArray(style) ? style.flat(Infinity) : [style];
  return Object.assign({}, ...list.filter(Boolean));
}

describe('motion tokens', () => {
  it('keeps every duration short and calm', () => {
    for (const duration of Object.values(motion.duration)) {
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThanOrEqual(MAX_MOTION_DURATION_MS);
    }
    expect(motion.pressScale).toBeGreaterThanOrEqual(0.95);
    expect(motion.riseDistance).toBeLessThanOrEqual(12);
  });
});

describe('FadeIn', () => {
  it('animates gently with a short duration when motion is allowed', () => {
    render(
      <FadeIn testID="fade">
        <Text>Hello</Text>
      </FadeIn>,
    );
    expect(timingSpy).toHaveBeenCalledTimes(1);
    const config = timingSpy.mock.calls[0]?.[1] as { duration: number };
    expect(config.duration).toBeLessThanOrEqual(MAX_MOTION_DURATION_MS);
  });

  it('renders the final state instantly under reduce-motion', () => {
    mockReduceMotion = true;
    render(
      <FadeIn testID="fade" variant="settle">
        <Text>Hello</Text>
      </FadeIn>,
    );
    expect(timingSpy).not.toHaveBeenCalled();
    const style = flatStyle(screen.getByTestId('fade'));
    expect(style.opacity).toBeUndefined();
    expect(style.transform).toBeUndefined();
    expect(screen.getByText('Hello')).toBeOnTheScreen();
  });

  it('is what Today uses (the legacy FadeInView alias)', () => {
    expect(FadeInView).toBe(FadeIn);
  });
});

describe('Skeleton', () => {
  it('pulses calmly when motion is allowed', () => {
    render(<Skeleton />);
    expect(loopSpy).toHaveBeenCalledTimes(1);
  });

  it('holds still under reduce-motion', () => {
    mockReduceMotion = true;
    render(<Skeleton />);
    expect(loopSpy).not.toHaveBeenCalled();
  });
});

describe('Button press feedback', () => {
  /** Render the Button face for its pressed state and return its transform. */
  function pressedTransform() {
    // The visual lives on a plain View returned by Pressable's children
    // function, not a style function (#146: css-interop on Android dropped it).
    const [pressable] = screen.UNSAFE_root.findAll(
      (node) => typeof node.props.children === 'function',
    );
    if (!pressable)
      throw new Error('expected a Pressable with a children function');
    const renderFace = pressable.props.children as (state: {
      pressed: boolean;
    }) => { props: { style: ViewStyle } };
    return renderFace({ pressed: true }).props.style.transform;
  }

  it('scales subtly on press when motion is allowed', () => {
    render(<Button label="Save" onPress={() => undefined} />);
    expect(pressedTransform()).toEqual([{ scale: motion.pressScale }]);
  });

  it('does not scale under reduce-motion (and never sends transform: undefined)', () => {
    mockReduceMotion = true;
    render(<Button label="Save" onPress={() => undefined} />);
    expect(pressedTransform()).toEqual([{ scale: 1 }]);
  });
});
