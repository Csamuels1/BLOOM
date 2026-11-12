import type { AppSupabaseClient } from '@/lib/supabase';
import {
  deletePhoto,
  listPhotos,
  photoPath,
  replacePhoto,
  signedUrl,
  uploadPhoto,
  type PhotoAsset,
} from '@/features/photos';

function asClient(value: unknown) {
  return value as AppSupabaseClient;
}

const USER = 'user-123';
const asset: PhotoAsset = {
  uri: 'file:///tmp/pic.jpg',
  fileName: 'pic.jpg',
  mimeType: 'image/jpeg',
};
const readBytes = async () => new ArrayBuffer(8);

describe('photoPath', () => {
  it('always scopes the object under the caller id', () => {
    expect(photoPath(USER, 'a.jpg')).toBe('user-123/a.jpg');
  });
});

describe('listPhotos', () => {
  it('lists the caller own folder and returns ownership-scoped paths', async () => {
    const list = jest.fn().mockResolvedValue({
      data: [{ name: 'a.jpg' }, { name: 'b.png' }],
      error: null,
    });
    const client = asClient({ storage: { from: () => ({ list }) } });

    const result = await listPhotos(client, USER);

    expect(list).toHaveBeenCalledWith(USER);
    expect(result).toEqual({
      ok: true,
      photos: [
        { name: 'a.jpg', path: 'user-123/a.jpg' },
        { name: 'b.png', path: 'user-123/b.png' },
      ],
    });
    if (result.ok) {
      for (const photo of result.photos) {
        expect(photo.path.startsWith(`${USER}/`)).toBe(true);
      }
    }
  });

  it('surfaces a failure', async () => {
    const list = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'no' } });
    const client = asClient({ storage: { from: () => ({ list }) } });
    const result = await listPhotos(client, USER);
    expect(result.ok).toBe(false);
  });
});

describe('uploadPhoto', () => {
  it('uploads bytes to a path under the caller id', async () => {
    const upload = jest.fn().mockResolvedValue({ data: {}, error: null });
    const client = asClient({ storage: { from: () => ({ upload }) } });

    const result = await uploadPhoto(client, USER, asset, readBytes);

    expect(result.ok).toBe(true);
    const [path, bytes, options] = upload.mock.calls[0] as [
      string,
      ArrayBuffer,
      { contentType: string },
    ];
    expect(path.startsWith(`${USER}/`)).toBe(true);
    expect(bytes).toBeInstanceOf(ArrayBuffer);
    expect(options.contentType).toBe('image/jpeg');
    if (result.ok) {
      expect(result.photo.path).toBe(path);
    }
  });

  it('reports a failure without throwing', async () => {
    const upload = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'boom' } });
    const client = asClient({ storage: { from: () => ({ upload }) } });
    const result = await uploadPhoto(client, USER, asset, readBytes);
    expect(result.ok).toBe(false);
  });
});

describe('signedUrl', () => {
  it('creates a signed URL for the private object', async () => {
    const createSignedUrl = jest.fn().mockResolvedValue({
      data: { signedUrl: 'https://signed/x' },
      error: null,
    });
    const client = asClient({ storage: { from: () => ({ createSignedUrl }) } });

    const result = await signedUrl(client, 'user-123/a.jpg');

    expect(createSignedUrl).toHaveBeenCalledWith('user-123/a.jpg', 60 * 60);
    expect(result).toEqual({ ok: true, url: 'https://signed/x' });
  });

  it('fails gently when no URL comes back', async () => {
    const createSignedUrl = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'nope' } });
    const client = asClient({ storage: { from: () => ({ createSignedUrl }) } });
    const result = await signedUrl(client, 'user-123/a.jpg');
    expect(result.ok).toBe(false);
  });
});

describe('deletePhoto', () => {
  it('removes the ownership-scoped path', async () => {
    const remove = jest.fn().mockResolvedValue({ data: [], error: null });
    const client = asClient({ storage: { from: () => ({ remove }) } });

    const result = await deletePhoto(client, USER, 'a.jpg');

    expect(remove).toHaveBeenCalledWith(['user-123/a.jpg']);
    expect(result).toEqual({ ok: true });
  });
});

describe('replacePhoto', () => {
  it('uploads the new object then removes the old, both under the caller id', async () => {
    const upload = jest.fn().mockResolvedValue({ data: {}, error: null });
    const remove = jest.fn().mockResolvedValue({ data: [], error: null });
    const client = asClient({ storage: { from: () => ({ upload, remove }) } });

    const result = await replacePhoto(
      client,
      USER,
      'old.jpg',
      asset,
      readBytes,
    );

    expect(result.ok).toBe(true);
    const uploadPath = (upload.mock.calls[0] as [string])[0];
    expect(uploadPath.startsWith(`${USER}/`)).toBe(true);
    expect(remove).toHaveBeenCalledWith(['user-123/old.jpg']);
  });

  it('rolls back the new upload when the old object cannot be removed', async () => {
    const upload = jest.fn().mockResolvedValue({ data: {}, error: null });
    const remove = jest
      .fn()
      .mockResolvedValueOnce({ data: null, error: { message: 'locked' } }) // remove old
      .mockResolvedValueOnce({ data: [], error: null }); // rollback new
    const client = asClient({ storage: { from: () => ({ upload, remove }) } });

    const result = await replacePhoto(
      client,
      USER,
      'old.jpg',
      asset,
      readBytes,
    );

    expect(result.ok).toBe(false);
    // Two removes: the failed old-object removal, then the rollback of the new one.
    expect(remove).toHaveBeenCalledTimes(2);
    const rollbackArg = (remove.mock.calls[1] as [string[]])[0][0];
    expect(rollbackArg?.startsWith(`${USER}/`)).toBe(true);
  });
});
