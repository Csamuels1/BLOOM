import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Text } from 'react-native';

import { communityCopy as copy } from '@/content/community';
import {
  CommunityFeedScreen,
  PostCard,
  spaceStorageKey,
  useCommunityStore,
  type CommunityPost,
} from '@/features/community';

import { filterValue, makeFakeClient, type FakeCall } from './fakeClient';

jest.mock('@/design/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

// The first jest-expo render in a suite pays a one-time warm-up.
jest.setTimeout(20000);

function post(partial: Partial<CommunityPost>): CommunityPost {
  return {
    id: 'p1',
    author_id: 'other',
    body: 'Slept three hours in a row last night.',
    status: 'approved',
    space: 'recovery',
    created_at: '2026-11-10T08:00:00Z',
    updated_at: '2026-11-10T08:00:00Z',
    ...partial,
  };
}

function isFeedQuery(call: FakeCall) {
  return call.table === 'community_posts' && call.op === 'select';
}

/** Answer feed / support queries from fixed data. */
function responder(options: {
  posts?: CommunityPost[];
  mySupport?: string[];
  received?: string[];
  insertError?: boolean;
}) {
  return (call: FakeCall) => {
    if (isFeedQuery(call)) {
      const space = filterValue(call, 'eq', 'space');
      return {
        data: (options.posts ?? []).filter((p) => p.space === space),
      };
    }
    if (call.table === 'community_posts' && call.op === 'insert') {
      if (options.insertError) {
        return { error: { message: 'offline' } };
      }
      const payload = call.payload as Partial<CommunityPost>;
      return { data: post({ ...payload, id: 'new1' }) };
    }
    if (call.table === 'post_reactions' && call.op === 'select') {
      const isMine = filterValue(call, 'eq', 'user_id') !== undefined;
      const ids = isMine ? options.mySupport : options.received;
      return { data: (ids ?? []).map((id) => ({ post_id: id })) };
    }
    return { data: null, error: null };
  };
}

async function chooseRecovery() {
  fireEvent.press(
    await screen.findByRole('radio', { name: copy.spaceRecoveryTitle }),
  );
}

beforeEach(async () => {
  useCommunityStore.getState().clear();
  await AsyncStorage.clear();
});

afterEach(() => {
  useCommunityStore.getState().clear();
});

describe('choosing a space', () => {
  it('asks the viewer to choose, then switches the feed query per space', async () => {
    const { client, calls } = makeFakeClient({
      respond: responder({
        posts: [
          post({ id: 'r1', space: 'recovery', body: 'Recovery post' }),
          post({ id: 'g1', space: 'gentle_loss', body: 'Gentle post' }),
        ],
      }),
    });
    render(<CommunityFeedScreen client={client} />);

    expect(await screen.findByText(copy.chooserPrompt)).toBeOnTheScreen();
    expect(calls.filter(isFeedQuery)).toHaveLength(0);

    await chooseRecovery();
    expect(await screen.findByText('Recovery post')).toBeOnTheScreen();
    expect(filterValue(calls.filter(isFeedQuery).at(-1), 'eq', 'space')).toBe(
      'recovery',
    );

    fireEvent.press(
      screen.getByRole('radio', { name: copy.spaceGentleLossTitle }),
    );
    expect(await screen.findByText('Gentle post')).toBeOnTheScreen();
    expect(screen.queryByText('Recovery post')).toBeNull();
    expect(filterValue(calls.filter(isFeedQuery).at(-1), 'eq', 'space')).toBe(
      'gentle_loss',
    );
  });

  it('remembers the choice for this viewer', async () => {
    const { client } = makeFakeClient({ userId: 'u1', respond: responder({}) });
    render(<CommunityFeedScreen client={client} />);
    await chooseRecovery();
    await waitFor(async () =>
      expect(await AsyncStorage.getItem(spaceStorageKey('u1'))).toBe(
        'recovery',
      ),
    );
  });

  it('restores a stored choice on open', async () => {
    await AsyncStorage.setItem(spaceStorageKey('u1'), 'gentle_loss');
    const { client, calls } = makeFakeClient({
      userId: 'u1',
      respond: responder({}),
    });
    render(<CommunityFeedScreen client={client} />);
    expect(await screen.findByText(copy.emptyTitle)).toBeOnTheScreen();
    expect(filterValue(calls.find(isFeedQuery), 'eq', 'space')).toBe(
      'gentle_loss',
    );
  });

  it('shows a retryable error when the feed fails to load', async () => {
    const { client } = makeFakeClient({
      respond: () => ({ error: { message: 'offline' } }),
    });
    render(<CommunityFeedScreen client={client} />);
    await chooseRecovery();
    expect(await screen.findByText(copy.loadErrorTitle)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: copy.retry })).toBeOnTheScreen();
  });
});

describe('free reads, Pro posts and reacts', () => {
  const posts = [post({ id: 'p1', author_id: 'other', body: 'Hello all' })];

  it('hides the composer and support for non-Pro, with a gentle Pro note', async () => {
    const { client } = makeFakeClient({
      isPro: false,
      respond: responder({ posts }),
    });
    render(<CommunityFeedScreen client={client} />);
    await chooseRecovery();

    expect(await screen.findByText('Hello all')).toBeOnTheScreen();
    expect(screen.getByText(copy.proNoteTitle)).toBeOnTheScreen();
    expect(screen.queryByText(copy.composerTitle)).toBeNull();
    expect(
      screen.queryByRole('button', { name: copy.supportAction }),
    ).toBeNull();
  });

  it('shows the composer and support toggle for Pro', async () => {
    const { client, calls } = makeFakeClient({
      isPro: true,
      respond: responder({ posts }),
    });
    render(<CommunityFeedScreen client={client} />);
    await chooseRecovery();

    expect(await screen.findByText('Hello all')).toBeOnTheScreen();
    expect(screen.getByText(copy.composerTitle)).toBeOnTheScreen();
    expect(screen.queryByText(copy.proNoteTitle)).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: copy.supportAction }));
    expect(
      await screen.findByRole('button', { name: copy.supportActive }),
    ).toBeOnTheScreen();
    const insert = calls.find(
      (c) => c.table === 'post_reactions' && c.op === 'insert',
    );
    expect(insert?.payload).toEqual({
      post_id: 'p1',
      user_id: 'u1',
      reaction: 'support',
    });
  });

  it('never offers support on your own post', async () => {
    const { client } = makeFakeClient({
      isPro: true,
      respond: responder({ posts: [post({ id: 'mine', author_id: 'u1' })] }),
    });
    render(<CommunityFeedScreen client={client} />);
    await chooseRecovery();
    expect(await screen.findByText(copy.yourPost)).toBeOnTheScreen();
    expect(
      screen.queryByRole('button', { name: copy.supportAction }),
    ).toBeNull();
  });
});

describe('no numeric pressure', () => {
  /** All rendered text that contains a digit. */
  function digitTexts(): string[] {
    return screen
      .queryAllByText(/\d/)
      .map((node) => {
        const children: unknown = node.props.children;
        return Array.isArray(children) ? children.join('') : String(children);
      })
      .sort();
  }

  it('adds no digits when a post is supported', () => {
    const target = post({ id: 'p1', body: 'Feeling wobbly today' });
    const props = {
      viewerId: 'u1',
      canSupport: true,
      onToggleSupport: () => undefined,
    };

    const { unmount } = render(
      <PostCard {...props} post={target} supported={false} />,
    );
    const before = digitTexts();
    unmount();

    render(<PostCard {...props} post={target} supported />);
    expect(screen.getByText(copy.supportActive)).toBeOnTheScreen();
    expect(digitTexts()).toEqual(before);
    expect(screen.queryAllByText(/^\s*\d+\s*$/)).toHaveLength(0);
  });

  it('shows the author a gentle acknowledgment, never a tally', async () => {
    const { client } = makeFakeClient({
      isPro: true,
      respond: responder({
        posts: [
          post({ id: 'own', author_id: 'u1', body: 'My post' }),
          post({ id: 'p2', author_id: 'other', body: 'Their post' }),
        ],
        mySupport: ['p2'],
        received: ['own', 'own', 'own'],
      }),
    });
    render(<CommunityFeedScreen client={client} />);
    await chooseRecovery();

    expect(await screen.findByText(copy.supportReceived)).toBeOnTheScreen();
    expect(screen.getByText(copy.supportActive)).toBeOnTheScreen();
    expect(screen.queryAllByText(/^\s*\d+\s*$/)).toHaveLength(0);
    expect(
      screen.queryAllByText(
        /\d+\s*(supports?|people|persons?|others|likes?|reactions?|hearts?)/i,
      ),
    ).toHaveLength(0);
  });
});

describe('own posts', () => {
  it('shows "awaiting review" on your own pending post', async () => {
    const { client } = makeFakeClient({
      respond: responder({
        posts: [post({ id: 'mine', author_id: 'u1', status: 'pending' })],
      }),
    });
    render(<CommunityFeedScreen client={client} />);
    await chooseRecovery();
    expect(await screen.findByText(copy.awaitingReview)).toBeOnTheScreen();
  });

  it('deletes your post only after a gentle confirm', async () => {
    const { client, calls } = makeFakeClient({
      respond: responder({
        posts: [post({ id: 'mine', author_id: 'u1', body: 'Delete me' })],
      }),
    });
    render(<CommunityFeedScreen client={client} />);
    await chooseRecovery();

    fireEvent.press(
      await screen.findByRole('button', { name: copy.deleteAction }),
    );
    expect(calls.some((c) => c.op === 'delete')).toBe(false);
    expect(screen.getByText(copy.deleteConfirmBody)).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: copy.deleteConfirm }));
    await waitFor(() =>
      expect(useCommunityStore.getState().posts).toHaveLength(0),
    );
    await waitFor(() => expect(screen.queryByText('Delete me')).toBeNull());
    const del = calls.find(
      (c) => c.table === 'community_posts' && c.op === 'delete',
    );
    expect(filterValue(del, 'eq', 'id')).toBe('mine');
  });

  it("does not offer delete on someone else's post", async () => {
    const { client } = makeFakeClient({
      respond: responder({ posts: [post({ author_id: 'other' })] }),
    });
    render(<CommunityFeedScreen client={client} />);
    await chooseRecovery();
    await screen.findByText(copy.feedTitle);
    expect(
      screen.queryByRole('button', { name: copy.deleteAction }),
    ).toBeNull();
  });
});

describe('composer', () => {
  it('keeps the typed words when a save fails', async () => {
    const { client } = makeFakeClient({
      isPro: true,
      respond: responder({ insertError: true }),
    });
    render(<CommunityFeedScreen client={client} />);
    await chooseRecovery();

    fireEvent.changeText(
      await screen.findByLabelText(copy.composerLabel),
      'Today was gentle',
    );
    fireEvent.press(screen.getByRole('button', { name: copy.composerSubmit }));

    expect(await screen.findByText(copy.composerErrorTitle)).toBeOnTheScreen();
    expect(screen.getByDisplayValue('Today was gentle')).toBeOnTheScreen();
  });

  it('confirms warmly and shows the new post as awaiting review', async () => {
    const { client, calls } = makeFakeClient({
      isPro: true,
      respond: responder({}),
    });
    render(<CommunityFeedScreen client={client} />);
    await chooseRecovery();

    fireEvent.changeText(
      await screen.findByLabelText(copy.composerLabel),
      'First time sharing',
    );
    fireEvent.press(screen.getByRole('button', { name: copy.composerSubmit }));

    expect(await screen.findByText(copy.composerPosted)).toBeOnTheScreen();
    expect(screen.getByText('First time sharing')).toBeOnTheScreen();
    expect(screen.getByText(copy.awaitingReview)).toBeOnTheScreen();
    const insert = calls.find(
      (c) => c.table === 'community_posts' && c.op === 'insert',
    );
    expect(insert?.payload).toMatchObject({
      status: 'pending',
      space: 'recovery',
      author_id: 'u1',
    });
  });
});

describe('render slots', () => {
  it('renders media and action slots for each post', () => {
    render(
      <PostCard
        post={post({ id: 'p1' })}
        viewerId="u1"
        canSupport={false}
        supported={false}
        renderMedia={(p) => <Text>{`media:${p.id}`}</Text>}
        renderActions={(p) => <Text>{`actions:${p.id}`}</Text>}
      />,
    );
    expect(screen.getByText('media:p1')).toBeOnTheScreen();
    expect(screen.getByText('actions:p1')).toBeOnTheScreen();
  });
});
