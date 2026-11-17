import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import type { AppSupabaseClient } from '@/lib/supabase';
import { reportingCopy as copy } from '@/content/reporting';
import {
  BlockedMembersScreen,
  MyReportsScreen,
  PostSafetyActions,
  RemovedPostNotice,
  ReportSheet,
  useReportingStore,
  type MyReport,
} from '@/features/reporting';

jest.mock('@/design/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

jest.setTimeout(20000);

function asClient(value: unknown) {
  return value as AppSupabaseClient;
}

const auth = {
  getUser: async () => ({ data: { user: { id: 'me' } }, error: null }),
};

beforeEach(() => {
  useReportingStore.getState().clear();
});

describe('PostSafetyActions', () => {
  it('renders nothing on your own post', () => {
    render(
      <PostSafetyActions
        postId="p1"
        authorId="me"
        currentUserId="me"
        client={asClient({ auth })}
      />,
    );
    expect(screen.queryByLabelText(copy.reportActionLabel)).toBeNull();
    expect(screen.queryByLabelText(copy.blockActionLabel)).toBeNull();
  });

  it('renders nothing while the viewer is unknown', () => {
    render(
      <PostSafetyActions postId="p1" authorId="them" currentUserId={null} />,
    );
    expect(screen.queryByLabelText(copy.reportActionLabel)).toBeNull();
  });

  it('shows Report and Block on someone else’s post and blocks calmly', async () => {
    const insert = jest.fn(async () => ({ error: null }));
    const onBlocked = jest.fn();
    render(
      <PostSafetyActions
        postId="p1"
        authorId="them"
        currentUserId="me"
        onBlocked={onBlocked}
        client={asClient({ auth, from: () => ({ insert }) })}
      />,
    );
    expect(screen.getByLabelText(copy.reportActionLabel)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(copy.blockActionLabel));
    expect(screen.getByText(copy.blockConfirmBody)).toBeTruthy();
    fireEvent.press(screen.getByText(copy.blockConfirm));
    await waitFor(() =>
      expect(screen.getByText(copy.blockedDone)).toBeTruthy(),
    );
    expect(insert).toHaveBeenCalledWith({
      blocker_id: 'me',
      blocked_id: 'them',
    });
    expect(onBlocked).toHaveBeenCalledWith('them');
  });
});

describe('ReportSheet', () => {
  it('requires a reason, then confirms privately', async () => {
    const insert = jest.fn(async () => ({ error: null }));
    const onClose = jest.fn();
    render(
      <ReportSheet
        postId="p1"
        onClose={onClose}
        client={asClient({ auth, from: () => ({ insert }) })}
      />,
    );
    fireEvent.press(screen.getByText(copy.submitReport));
    expect(screen.getByText(copy.reasonRequired)).toBeTruthy();
    expect(insert).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText(copy.reasonSpam));
    fireEvent.press(screen.getByText(copy.submitReport));
    await waitFor(() =>
      expect(screen.getByText(copy.reportSentBody)).toBeTruthy(),
    );
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ reporter_id: 'me', reason: 'spam' }),
    );
    fireEvent.press(screen.getByText(copy.reportDone));
    expect(onClose).toHaveBeenCalled();
  });

  it('acknowledges a duplicate report gently', async () => {
    const insert = jest.fn(async () => ({ error: { code: '23505' } }));
    render(
      <ReportSheet
        postId="p1"
        onClose={() => undefined}
        client={asClient({ auth, from: () => ({ insert }) })}
      />,
    );
    fireEvent.press(screen.getByLabelText(copy.reasonOther));
    fireEvent.press(screen.getByText(copy.submitReport));
    await waitFor(() =>
      expect(screen.getByText(copy.alreadyReportedTitle)).toBeTruthy(),
    );
    expect(screen.queryByText(copy.reportErrorTitle)).toBeNull();
  });
});

describe('MyReportsScreen', () => {
  it('renders only the caller’s reports with plain-language status and no reporter info', async () => {
    const rows: MyReport[] = [
      {
        id: 'r1',
        post_id: 'p1',
        reason: 'harassment',
        details: 'private detail',
        status: 'reviewing',
        created_at: '2026-11-10T08:00:00Z',
      },
      {
        id: 'r2',
        post_id: 'p2',
        reason: 'spam',
        details: null,
        status: 'dismissed',
        created_at: '2026-11-09T08:00:00Z',
      },
    ];
    const order = jest.fn(async () => ({ data: rows, error: null }));
    const eq = jest.fn(() => ({ order }));
    const select = jest.fn(() => ({ eq }));
    const { toJSON } = render(
      <MyReportsScreen client={asClient({ auth, from: () => ({ select }) })} />,
    );
    await waitFor(() =>
      expect(screen.getByText(copy.statusReviewing)).toBeTruthy(),
    );
    expect(screen.getByText(copy.statusDismissed)).toBeTruthy();
    expect(eq).toHaveBeenCalledWith('reporter_id', 'me');

    const rendered = JSON.stringify(toJSON());
    expect(rendered).not.toMatch(/reporter/i);
    expect(rendered).not.toContain('"me"');
    // No control to change status exists.
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows an empty state', async () => {
    const select = () => ({
      eq: () => ({ order: async () => ({ data: [], error: null }) }),
    });
    render(
      <MyReportsScreen client={asClient({ auth, from: () => ({ select }) })} />,
    );
    await waitFor(() =>
      expect(screen.getByText(copy.myReportsEmptyTitle)).toBeTruthy(),
    );
  });
});

describe('BlockedMembersScreen', () => {
  it('lists blocks and unblocks after a calm confirmation', async () => {
    const rows = [{ blocked_id: 'them', created_at: '2026-11-01T00:00:00Z' }];
    const eq2 = jest.fn(async () => ({ error: null }));
    const client = asClient({
      auth,
      from: () => ({
        select: () => ({
          eq: () => ({ order: async () => ({ data: rows, error: null }) }),
        }),
        delete: () => ({ eq: () => ({ eq: eq2 }) }),
      }),
    });
    render(
      <BlockedMembersScreen
        client={client}
        getMemberLabel={(id) => (id === 'them' ? 'Sam' : null)}
      />,
    );
    await waitFor(() => expect(screen.getByText('Sam')).toBeTruthy());
    fireEvent.press(screen.getByText(copy.unblockAction));
    expect(screen.getByText(copy.unblockConfirmBody)).toBeTruthy();
    fireEvent.press(screen.getByText(copy.unblockConfirm));
    await waitFor(() =>
      expect(screen.getByText(copy.blockedEmptyTitle)).toBeTruthy(),
    );
    expect(eq2).toHaveBeenCalledWith('blocked_id', 'them');
  });
});

describe('RemovedPostNotice', () => {
  it('is honest and offers no restore, edit or approve control', () => {
    render(<RemovedPostNotice excerpt="my words" />);
    expect(screen.getByText(copy.removedTitle)).toBeTruthy();
    expect(screen.getByText('my words')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText(/restore|edit|approve|undo/i)).toBeNull();
  });
});
