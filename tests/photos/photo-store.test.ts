import type { AppSupabaseClient } from '@/lib/supabase';
import { usePhotoStore } from '@/features/photos';
import type { PhotoAsset } from '@/features/photos';

const USER = 'u1';
const asset: PhotoAsset = {
  uri: 'file:///pic.jpg',
  fileName: 'pic.jpg',
  mimeType: 'image/jpeg',
};
const readBytes = async () => new ArrayBuffer(4);

interface StorageStub {
  list?: jest.Mock;
  upload?: jest.Mock;
  remove?: jest.Mock;
  createSignedUrl?: jest.Mock;
}

function clientWith(storage: StorageStub): AppSupabaseClient {
  return { storage: { from: () => storage } } as unknown as AppSupabaseClient;
}

const okSign = () =>
  jest
    .fn()
    .mockResolvedValue({ data: { signedUrl: 'https://s/x' }, error: null });

afterEach(() => {
  usePhotoStore.getState().clear();
});

describe('photo store load', () => {
  it('lists and signs the caller photos, then marks loaded', async () => {
    const client = clientWith({
      list: jest
        .fn()
        .mockResolvedValue({ data: [{ name: 'a.jpg' }], error: null }),
      createSignedUrl: okSign(),
    });

    await usePhotoStore.getState().load(client, USER);

    const state = usePhotoStore.getState();
    expect(state.status).toBe('loaded');
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.path).toBe('u1/a.jpg');
    expect(state.items[0]?.url).toBe('https://s/x');
  });

  it('surfaces a retryable error state when the list fails', async () => {
    const client = clientWith({
      list: jest
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'offline' } }),
    });

    await usePhotoStore.getState().load(client, USER);
    expect(usePhotoStore.getState().status).toBe('error');
  });
});

describe('photo store add', () => {
  it('uploads, signs, and prepends the new photo', async () => {
    const client = clientWith({
      upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
      createSignedUrl: okSign(),
    });

    const ok = await usePhotoStore
      .getState()
      .add(client, USER, asset, readBytes);

    expect(ok).toBe(true);
    const state = usePhotoStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.path.startsWith(`${USER}/`)).toBe(true);
    expect(state.pending).toBeNull();
    expect(state.status).toBe('loaded');
  });

  it('sets a gentle error and keeps items on upload failure', async () => {
    const client = clientWith({
      upload: jest
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'boom' } }),
    });

    const ok = await usePhotoStore
      .getState()
      .add(client, USER, asset, readBytes);

    expect(ok).toBe(false);
    const state = usePhotoStore.getState();
    expect(state.error).toBe('boom');
    expect(state.pending).toBeNull();
    expect(state.items).toHaveLength(0);
  });
});

describe('photo store remove', () => {
  it('deletes and drops the photo from the list', async () => {
    usePhotoStore.setState({
      items: [{ name: 'a.jpg', path: 'u1/a.jpg', url: 'https://s/x' }],
      status: 'loaded',
    });
    const remove = jest.fn().mockResolvedValue({ data: [], error: null });
    const client = clientWith({ remove });

    const ok = await usePhotoStore.getState().remove(client, USER, 'a.jpg');

    expect(ok).toBe(true);
    expect(remove).toHaveBeenCalledWith(['u1/a.jpg']);
    expect(usePhotoStore.getState().items).toHaveLength(0);
  });
});

describe('photo store replace', () => {
  it('swaps the old photo for the newly uploaded one', async () => {
    usePhotoStore.setState({
      items: [{ name: 'old.jpg', path: 'u1/old.jpg', url: 'https://s/old' }],
      status: 'loaded',
    });
    const client = clientWith({
      upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
      remove: jest.fn().mockResolvedValue({ data: [], error: null }),
      createSignedUrl: okSign(),
    });

    const ok = await usePhotoStore
      .getState()
      .replace(client, USER, 'old.jpg', asset, readBytes);

    expect(ok).toBe(true);
    const state = usePhotoStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.name).not.toBe('old.jpg');
  });
});
