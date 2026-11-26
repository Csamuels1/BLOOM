import { act, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Animated, Platform } from 'react-native';

import {
  SAVED_CONFIRMATION_VISIBLE_MS,
  SavedConfirmation,
} from '@/components/SavedConfirmation';
import { cycleCopy } from '@/content/cycle';
import { weightCopy } from '@/content/weight';
import { MAX_MOTION_DURATION_MS, motion } from '@/design/motion';

// Toggle reduce-motion per test through a `mock`-prefixed variable.
let mockReduceMotion = false;
jest.mock('@/design/useReducedMotion', () => ({
  useReducedMotion: () => mockReduceMotion,
}));

jest.setTimeout(20000);

let timingSpy: jest.SpyInstance;

beforeEach(() => {
  jest.useFakeTimers();
  mockReduceMotion = false;
  timingSpy = jest.spyOn(Animated, 'timing');
});

afterEach(() => {
  timingSpy.mockRestore();
  jest.useRealTimers();
});

function flatStyle(node: { props: { style?: unknown } }) {
  const style = node.props.style;
  const list = Array.isArray(style) ? style.flat(Infinity) : [style];
  return Object.assign({}, ...list.filter(Boolean));
}

describe('SavedConfirmation', () => {
  it('shows nothing until the first save', () => {
    render(<SavedConfirmation trigger={0} label="Saved" testID="saved" />);
    expect(screen.queryByTestId('saved')).toBeNull();
    expect(screen.queryByText('Saved')).toBeNull();
  });

  it('appears as a polite status announcement with a gentle fade', () => {
    render(<SavedConfirmation trigger={1} label="Saved" testID="saved" />);
    const node = screen.getByTestId('saved');
    expect(screen.getByText('Saved')).toBeOnTheScreen();
    expect(node.props.accessibilityLiveRegion).toBe('polite');
    expect(node.props.role).toBe('status');
    expect(timingSpy).toHaveBeenCalledTimes(1);
    const config = timingSpy.mock.calls[0]?.[1] as { duration: number };
    expect(config.duration).toBeLessThanOrEqual(MAX_MOTION_DURATION_MS);
  });

  it('hides by itself after about two seconds', () => {
    render(<SavedConfirmation trigger={1} label="Saved" testID="saved" />);
    expect(SAVED_CONFIRMATION_VISIBLE_MS).toBe(2000);
    act(() => {
      jest.advanceTimersByTime(SAVED_CONFIRMATION_VISIBLE_MS - 1);
    });
    expect(screen.getByTestId('saved')).toBeOnTheScreen();
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.queryByTestId('saved')).toBeNull();
  });

  it('shows again for the next save', () => {
    const { rerender } = render(
      <SavedConfirmation trigger={1} label="Saved" testID="saved" />,
    );
    act(() => {
      jest.advanceTimersByTime(SAVED_CONFIRMATION_VISIBLE_MS);
    });
    expect(screen.queryByTestId('saved')).toBeNull();
    rerender(<SavedConfirmation trigger={2} label="Saved" testID="saved" />);
    expect(screen.getByTestId('saved')).toBeOnTheScreen();
  });

  it('appears and disappears with no animation under reduce-motion', () => {
    mockReduceMotion = true;
    render(<SavedConfirmation trigger={1} label="Saved" testID="saved" />);
    expect(timingSpy).not.toHaveBeenCalled();
    expect(flatStyle(screen.getByTestId('saved')).opacity).toBeUndefined();
    act(() => {
      jest.advanceTimersByTime(SAVED_CONFIRMATION_VISIBLE_MS);
    });
    expect(screen.queryByTestId('saved')).toBeNull();
    expect(timingSpy).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    'clears its timers when unmounted (reduce-motion: %s)',
    (reduce) => {
      mockReduceMotion = reduce;
      const setSpy = jest.spyOn(globalThis, 'setTimeout');
      const clearSpy = jest.spyOn(globalThis, 'clearTimeout');
      try {
        const { unmount } = render(
          <SavedConfirmation trigger={1} label="Saved" />,
        );
        // Our timers: the hide (always) and the fade-out (motion only).
        const ours = setSpy.mock.results
          .filter((_, index) => {
            const delay = setSpy.mock.calls[index]?.[1];
            return (
              delay === SAVED_CONFIRMATION_VISIBLE_MS ||
              delay === SAVED_CONFIRMATION_VISIBLE_MS - motion.duration.gentle
            );
          })
          .map((result) => result.value as unknown);
        expect(ours).toHaveLength(reduce ? 1 : 2);
        unmount();
        const cleared = clearSpy.mock.calls.map((call) => call[0] as unknown);
        for (const id of ours) expect(cleared).toContain(id);
      } finally {
        setSpy.mockRestore();
        clearSpy.mockRestore();
      }
    },
  );

  it('announces once on iOS, which has no live regions', () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => undefined);
    try {
      render(<SavedConfirmation trigger={1} label="Saved" />);
      expect(announce).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenCalledWith('Saved');
    } finally {
      announce.mockRestore();
      Object.defineProperty(Platform, 'OS', {
        value: originalOS,
        configurable: true,
      });
    }
  });

  it('uses one short, neutral word for every save', () => {
    expect(weightCopy.savedConfirmation).toBe('Saved');
    expect(cycleCopy.savedConfirmation).toBe(weightCopy.savedConfirmation);
  });
});
