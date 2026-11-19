import { render, screen, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Text } from 'react-native';

import {
  resetReducedMotionSnapshot,
  useReducedMotion,
} from '@/design/useReducedMotion';

function Probe({ id }: { id: string }) {
  const reduce = useReducedMotion();
  return <Text testID={id}>{reduce ? 'reduced' : 'full'}</Text>;
}

// The first jest-expo render in a suite pays a one-time warm-up.
jest.setTimeout(20000);

let readSpy: jest.SpyInstance;

beforeEach(() => {
  resetReducedMotionSnapshot();
  readSpy = jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
});

afterEach(() => {
  readSpy.mockRestore();
  resetReducedMotionSnapshot();
});

describe('useReducedMotion', () => {
  it('follows the OS setting once read', async () => {
    render(<Probe id="a" />);
    await waitFor(() =>
      expect(screen.getByTestId('a')).toHaveTextContent('reduced'),
    );
  });

  it('starts later views from the last known value (no first-frame motion)', async () => {
    const first = render(<Probe id="a" />);
    await waitFor(() =>
      expect(screen.getByTestId('a')).toHaveTextContent('reduced'),
    );
    first.unmount();

    // Hold the next read open so we observe the very first render.
    readSpy.mockReturnValue(new Promise<boolean>(() => undefined));
    render(<Probe id="b" />);
    expect(screen.getByTestId('b')).toHaveTextContent('reduced');
  });

  it('treats an unavailable API as motion allowed without crashing', async () => {
    readSpy.mockRejectedValue(new Error('unavailable'));
    render(<Probe id="a" />);
    await waitFor(() => expect(readSpy).toHaveBeenCalled());
    expect(screen.getByTestId('a')).toHaveTextContent('full');
  });
});
