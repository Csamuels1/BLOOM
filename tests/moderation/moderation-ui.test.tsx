import { fireEvent, render, screen } from '@testing-library/react-native';

import { moderationCopy as copy } from '@/content/moderation';
import { useAuthStore } from '@/features/auth';
import { useModerationStore } from '@/features/moderation/moderationStore';
import { ModerationQueueScreen as WebModerationQueueScreen } from '@/features/moderation/ModerationQueueScreen.web';
import { ModerationQueueScreen as NativeModerationQueueScreen } from '@/features/moderation/ModerationQueueScreen';

jest.mock('@/design/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

// Keep the screen off the network: it only needs a client handle to pass along.
jest.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({}),
}));

function setSession(role?: string) {
  useAuthStore.setState({
    session: {
      user: { id: 'me', app_metadata: role ? { role } : {} },
    },
  } as never);
}

beforeEach(() => {
  useModerationStore.getState().clear();
  setSession(undefined);
});

describe('native ModerationQueueScreen (stub)', () => {
  it('points staff to the web dashboard and runs no queries', () => {
    render(<NativeModerationQueueScreen />);
    expect(screen.getByText(copy.webOnlyTitle)).toBeTruthy();
    expect(screen.getByText(copy.webOnlyBody)).toBeTruthy();
  });
});

describe('web ModerationQueueScreen', () => {
  it('shows an access notice to a non-moderator and does not load', () => {
    const loadAll = jest.fn();
    useModerationStore.setState({ loadAll });
    setSession('user');

    render(<WebModerationQueueScreen />);

    expect(screen.getByText(copy.accessTitle)).toBeTruthy();
    expect(loadAll).not.toHaveBeenCalled();
    expect(screen.queryByText(copy.title)).toBeNull();
  });

  it('loads the queue for a moderator and renders a report with actions', () => {
    const loadAll = jest.fn();
    useModerationStore.setState({
      loadAll,
      reportsStatus: 'loaded',
      reports: [
        {
          id: 'r1',
          postId: 'p1',
          reason: 'harassment',
          details: 'unkind replies',
          status: 'open',
          createdAt: '2026-11-17T00:00:00Z',
          postBody: 'the reported post',
          postStatus: 'approved',
          postAuthorId: 'u1',
        },
      ],
    });
    setSession('moderator');

    render(<WebModerationQueueScreen />);

    expect(loadAll).toHaveBeenCalled();
    expect(screen.getByText(copy.title)).toBeTruthy();
    expect(screen.getByText('the reported post')).toBeTruthy();
    expect(screen.getByText('unkind replies')).toBeTruthy();
    expect(screen.getByText(copy.removePost)).toBeTruthy();
    expect(screen.getByText(copy.startReview)).toBeTruthy();
  });

  it('dispatches a remove action through the store', () => {
    const actOnPost = jest.fn(async () => true);
    useModerationStore.setState({
      loadAll: jest.fn(),
      actOnPost,
      reportsStatus: 'loaded',
      reports: [
        {
          id: 'r1',
          postId: 'p1',
          reason: 'spam',
          details: null,
          status: 'reviewing',
          createdAt: '2026-11-17T00:00:00Z',
          postBody: 'spammy post',
          postStatus: 'approved',
          postAuthorId: 'u1',
        },
      ],
    });
    setSession('moderator');

    render(<WebModerationQueueScreen />);
    fireEvent.press(screen.getByText(copy.removePost));

    expect(actOnPost).toHaveBeenCalledWith(
      expect.anything(),
      'p1',
      'remove',
      null,
    );
  });

  it('shows the not-authorized message when the server declines an action', () => {
    useModerationStore.setState({
      loadAll: jest.fn(),
      error: 'ignored because notAuthorized wins',
      notAuthorized: true,
    });
    setSession('admin');

    render(<WebModerationQueueScreen />);
    expect(screen.getByText(copy.notAuthorizedError)).toBeTruthy();
  });
});
