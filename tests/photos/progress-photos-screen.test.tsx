import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

import type { AppSupabaseClient } from '@/lib/supabase';
import { photosCopy as copy } from '@/content/photos';
import { ProgressPhotosScreen, usePhotoStore } from '@/features/photos';

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

const USER = 'u1';

interface StorageStub {
  list?: jest.Mock;
  upload?: jest.Mock;
  remove?: jest.Mock;
  createSignedUrl?: jest.Mock;
}

function clientWith(storage: StorageStub): AppSupabaseClient {
  return { storage: { from: () => storage } } as unknown as AppSupabaseClient;
}

const signOk = () =>
  jest
    .fn()
    .mockResolvedValue({ data: { signedUrl: 'https://s/x' }, error: null });

beforeEach(() => {
  requestPerm.mockResolvedValue({ granted: true });
  launch.mockResolvedValue({
    canceled: false,
    assets: [
      { uri: 'file:///pic.jpg', fileName: 'pic.jpg', mimeType: 'image/jpeg' },
    ],
  });
  // uploadPhoto reads asset bytes via fetch by default.
  globalThis.fetch = jest.fn().mockResolvedValue({
    arrayBuffer: async () => new ArrayBuffer(8),
  }) as unknown as typeof fetch;
});

afterEach(() => {
  usePhotoStore.getState().clear();
  jest.clearAllMocks();
});

describe('ProgressPhotosScreen — optional / empty', () => {
  it('invites without pressure when nothing is saved', async () => {
    const client = clientWith({
      list: jest.fn().mockResolvedValue({ data: [], error: null }),
    });
    render(<ProgressPhotosScreen client={client} userId={USER} />);

    expect(await screen.findByText(copy.emptyTitle)).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: copy.addLabel }),
    ).toBeOnTheScreen();
  });
});

describe('ProgressPhotosScreen — add', () => {
  it('picks a photo and uploads it under the caller id', async () => {
    const upload = jest.fn().mockResolvedValue({ data: {}, error: null });
    const client = clientWith({
      list: jest.fn().mockResolvedValue({ data: [], error: null }),
      upload,
      createSignedUrl: signOk(),
    });
    render(<ProgressPhotosScreen client={client} userId={USER} />);

    await screen.findByText(copy.emptyTitle);
    fireEvent.press(screen.getByRole('button', { name: copy.addLabel }));

    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1));
    const uploadPath = (upload.mock.calls[0] as [string])[0];
    expect(uploadPath.startsWith(`${USER}/`)).toBe(true);
    expect(await screen.findByLabelText(copy.photoAlt)).toBeOnTheScreen();
  });
});

describe('ProgressPhotosScreen — delete', () => {
  it('asks for a gentle confirm, then removes the photo on confirm', async () => {
    usePhotoStore.setState({
      items: [{ name: 'a.jpg', path: 'u1/a.jpg', url: 'https://s/x' }],
      status: 'loaded',
    });
    const remove = jest.fn().mockResolvedValue({ data: [], error: null });
    const client = clientWith({ remove });
    render(<ProgressPhotosScreen client={client} userId={USER} />);

    expect(screen.getByLabelText(copy.photoAlt)).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: copy.deleteLabel }));
    expect(screen.getByText(copy.deleteConfirmTitle)).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: copy.deleteConfirm }));

    await waitFor(() => expect(remove).toHaveBeenCalledWith(['u1/a.jpg']));
    await waitFor(() =>
      expect(screen.queryByLabelText(copy.photoAlt)).toBeNull(),
    );
  });
});
