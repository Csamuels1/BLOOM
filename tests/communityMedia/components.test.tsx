import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

import type { AppSupabaseClient } from '@/lib/supabase';
import { communityMediaCopy as copy } from '@/content/communityMedia';
import {
  MAX_MEDIA_BYTES,
  PostMediaPicker,
  PostMediaView,
  type PostMedia,
} from '@/features/communityMedia';

// Deterministic motion; no async act warnings from the accessibility read.
jest.mock('@/design/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const requestPerm =
  ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
const launch = ImagePicker.launchImageLibraryAsync as jest.Mock;

const AUTHOR = 'author-1';
const OTHER = 'viewer-2';

function item(overrides: Partial<PostMedia>): PostMedia {
  return {
    id: 'm1',
    post_id: 'p1',
    author_id: AUTHOR,
    storage_path: `${AUTHOR}/a.jpg`,
    mime_type: 'image/jpeg',
    size_bytes: 10,
    status: 'approved',
    reviewed_by: null,
    reviewed_at: null,
    created_at: '2026-11-17T00:00:00Z',
    ...overrides,
  };
}

function clientWith(createSignedUrl: jest.Mock, getPublicUrl = jest.fn()) {
  const client = {
    storage: { from: () => ({ createSignedUrl, getPublicUrl }) },
  } as unknown as AppSupabaseClient;
  return { client, getPublicUrl };
}

const signOk = () =>
  jest
    .fn()
    .mockResolvedValue({ data: { signedUrl: 'https://s/x' }, error: null });
const signDenied = () =>
  jest
    .fn()
    .mockResolvedValue({ data: null, error: { message: 'Object not found' } });

afterEach(() => {
  jest.clearAllMocks();
});

describe('PostMediaView', () => {
  it('shows approved media through a signed URL (never a public URL)', async () => {
    const createSignedUrl = signOk();
    const { client, getPublicUrl } = clientWith(createSignedUrl);

    render(
      <PostMediaView media={[item({})]} viewerId={OTHER} client={client} />,
    );

    const image = await screen.findByLabelText(copy.imageAlt);
    expect(image.props.source).toEqual({ uri: 'https://s/x' });
    expect(createSignedUrl).toHaveBeenCalledWith(`${AUTHOR}/a.jpg`, 3600);
    expect(getPublicUrl).not.toHaveBeenCalled();
  });

  it('shows the author a private "awaiting review" note for pending media', async () => {
    const { client } = clientWith(signOk());

    render(
      <PostMediaView
        media={[item({ status: 'pending' })]}
        viewerId={AUTHOR}
        client={client}
      />,
    );

    expect(screen.getByText(copy.pendingNote)).toBeOnTheScreen();
    expect(await screen.findByLabelText(copy.imageAlt)).toBeOnTheScreen();
  });

  it('shows the author a private "not approved" note for rejected media, with no image', () => {
    const createSignedUrl = signOk();
    const { client } = clientWith(createSignedUrl);

    render(
      <PostMediaView
        media={[item({ status: 'rejected' })]}
        viewerId={AUTHOR}
        client={client}
      />,
    );

    expect(screen.getByText(copy.rejectedNote)).toBeOnTheScreen();
    expect(screen.queryByLabelText(copy.imageAlt)).toBeNull();
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it('renders nothing for others when media is pending or rejected', () => {
    const createSignedUrl = signOk();
    const { client } = clientWith(createSignedUrl);

    const { toJSON } = render(
      <PostMediaView
        media={[
          item({ id: 'a', status: 'pending' }),
          item({ id: 'b', status: 'rejected' }),
        ]}
        viewerId={OTHER}
        client={client}
      />,
    );

    expect(toJSON()).toBeNull();
    expect(screen.queryByText(copy.pendingNote)).toBeNull();
    expect(screen.queryByText(copy.rejectedNote)).toBeNull();
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it('renders nothing for others when a signed URL does not resolve', async () => {
    const createSignedUrl = signDenied();
    const { client } = clientWith(createSignedUrl);

    render(
      <PostMediaView media={[item({})]} viewerId={OTHER} client={client} />,
    );

    await waitFor(() =>
      expect(screen.queryByLabelText(copy.loadingLabel)).toBeNull(),
    );
    expect(createSignedUrl).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText(copy.imageAlt)).toBeNull();
  });
});

describe('PostMediaPicker', () => {
  function pickReturns(asset: Record<string, unknown>) {
    requestPerm.mockResolvedValue({ granted: true });
    launch.mockResolvedValue({ canceled: false, assets: [asset] });
  }

  it('explains that images are reviewed before anyone else sees them', () => {
    render(<PostMediaPicker value={null} onChange={jest.fn()} />);
    expect(screen.getByText(copy.reviewNote)).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: copy.attachLabel }),
    ).toBeOnTheScreen();
  });

  it('attaches a valid image', async () => {
    pickReturns({
      uri: 'file:///pic.png',
      fileName: 'pic.png',
      mimeType: 'image/png',
      fileSize: 2048,
    });
    const onChange = jest.fn();
    render(<PostMediaPicker value={null} onChange={onChange} />);

    fireEvent.press(screen.getByRole('button', { name: copy.attachLabel }));

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    const [attached] = onChange.mock.calls[0] as [{ mimeType: string }];
    expect(attached.mimeType).toBe('image/png');
  });

  it('gently refuses an image over 5 MB', async () => {
    pickReturns({
      uri: 'file:///big.jpg',
      fileName: 'big.jpg',
      mimeType: 'image/jpeg',
      fileSize: MAX_MEDIA_BYTES + 1,
    });
    const onChange = jest.fn();
    render(<PostMediaPicker value={null} onChange={onChange} />);

    fireEvent.press(screen.getByRole('button', { name: copy.attachLabel }));

    expect(await screen.findByText(copy.invalidTooLarge)).toBeOnTheScreen();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('gently refuses an unsupported type', async () => {
    pickReturns({
      uri: 'file:///a.gif',
      fileName: 'a.gif',
      mimeType: 'image/gif',
      fileSize: 10,
    });
    const onChange = jest.fn();
    render(<PostMediaPicker value={null} onChange={onChange} />);

    fireEvent.press(screen.getByRole('button', { name: copy.attachLabel }));

    expect(await screen.findByText(copy.invalidType)).toBeOnTheScreen();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('explains when photo access is not granted', async () => {
    requestPerm.mockResolvedValue({ granted: false });
    render(<PostMediaPicker value={null} onChange={jest.fn()} />);

    fireEvent.press(screen.getByRole('button', { name: copy.attachLabel }));

    expect(await screen.findByText(copy.permissionDenied)).toBeOnTheScreen();
    expect(launch).not.toHaveBeenCalled();
  });

  it('lets the member remove an attached image', () => {
    const onChange = jest.fn();
    render(
      <PostMediaPicker
        value={{ uri: 'file:///pic.jpg', mimeType: 'image/jpeg' }}
        onChange={onChange}
      />,
    );

    expect(screen.getByLabelText(copy.attachedAlt)).toBeOnTheScreen();
    fireEvent.press(
      screen.getByRole('button', { name: copy.removeAttachedLabel }),
    );
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
