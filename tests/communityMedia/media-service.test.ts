import type { AppSupabaseClient } from '@/lib/supabase';
import {
  MEDIA_SIGNED_URL_TTL_SECONDS,
  deletePostMedia,
  listPostMedia,
  signedMediaUrl,
  uploadPostMedia,
  type MediaAsset,
} from '@/features/communityMedia';

const USER = 'user-123';
const POST = 'post-1';

const asset: MediaAsset = {
  uri: 'file:///tmp/pic.jpg',
  fileName: 'pic.jpg',
  mimeType: 'image/jpeg',
  fileSize: 8,
};
const readBytes = async () => new ArrayBuffer(8);

interface Stubs {
  upload?: jest.Mock;
  remove?: jest.Mock;
  createSignedUrl?: jest.Mock;
  getPublicUrl?: jest.Mock;
  insert?: jest.Mock;
  select?: jest.Mock;
  delete?: jest.Mock;
}

function makeClient(stubs: Stubs) {
  const storageFrom = jest.fn(() => ({
    upload: stubs.upload,
    remove: stubs.remove,
    createSignedUrl: stubs.createSignedUrl,
    getPublicUrl: stubs.getPublicUrl,
  }));
  const tableFrom = jest.fn(() => ({
    insert: stubs.insert,
    select: stubs.select,
    delete: stubs.delete,
  }));
  const client = {
    storage: { from: storageFrom },
    from: tableFrom,
  } as unknown as AppSupabaseClient;
  return { client, storageFrom, tableFrom };
}

/** `insert(row).select().single()` resolving to `result`. */
function insertChain(result: { data: unknown; error: unknown }) {
  const single = jest.fn().mockResolvedValue(result);
  const select = jest.fn(() => ({ single }));
  return jest.fn(() => ({ select }));
}

const row = {
  id: 'm1',
  post_id: POST,
  author_id: USER,
  storage_path: `${USER}/x.jpg`,
  mime_type: 'image/jpeg',
  size_bytes: 8,
  status: 'pending',
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2026-11-17T00:00:00Z',
};

describe('uploadPostMedia', () => {
  it('uploads under the caller id and inserts a pending row', async () => {
    const upload = jest.fn().mockResolvedValue({ data: {}, error: null });
    const insert = insertChain({ data: row, error: null });
    const { client, storageFrom, tableFrom } = makeClient({ upload, insert });

    const result = await uploadPostMedia(client, USER, POST, asset, readBytes);

    expect(result.ok).toBe(true);
    expect(storageFrom).toHaveBeenCalledWith('community-images');
    expect(tableFrom).toHaveBeenCalledWith('post_media');
    const [path, bytes, options] = upload.mock.calls[0] as [
      string,
      ArrayBuffer,
      { contentType: string; upsert: boolean },
    ];
    expect(path.startsWith(`${USER}/`)).toBe(true);
    expect(path.split('/')).toHaveLength(2);
    expect(path.endsWith('.jpg')).toBe(true);
    expect(bytes).toBeInstanceOf(ArrayBuffer);
    expect(options).toEqual({ contentType: 'image/jpeg', upsert: false });

    const inserted = (
      insert.mock.calls[0] as unknown as [Record<string, unknown>]
    )[0];
    expect(inserted).toEqual({
      post_id: POST,
      author_id: USER,
      storage_path: path,
      mime_type: 'image/jpeg',
      size_bytes: 8,
      status: 'pending',
    });
    if (result.ok) expect(result.media.status).toBe('pending');
  });

  it('removes the uploaded object when the row insert fails (no orphans)', async () => {
    const upload = jest.fn().mockResolvedValue({ data: {}, error: null });
    const remove = jest.fn().mockResolvedValue({ data: [], error: null });
    const insert = insertChain({ data: null, error: { message: 'denied' } });
    const { client } = makeClient({ upload, remove, insert });

    const result = await uploadPostMedia(client, USER, POST, asset, readBytes);

    expect(result).toEqual({ ok: false, kind: 'error', error: 'denied' });
    const uploadedPath = (upload.mock.calls[0] as [string])[0];
    expect(remove).toHaveBeenCalledWith([uploadedPath]);
    expect(uploadedPath.startsWith(`${USER}/`)).toBe(true);
  });

  it('also removes the object when the insert throws', async () => {
    const upload = jest.fn().mockResolvedValue({ data: {}, error: null });
    const remove = jest.fn().mockResolvedValue({ data: [], error: null });
    const insert = jest.fn(() => {
      throw new Error('network');
    });
    const { client } = makeClient({ upload, remove, insert });

    const result = await uploadPostMedia(client, USER, POST, asset, readBytes);

    expect(result.ok).toBe(false);
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('refuses invalid media before uploading anything', async () => {
    const upload = jest.fn();
    const insert = jest.fn();
    const { client } = makeClient({ upload, insert });

    const result = await uploadPostMedia(
      client,
      USER,
      POST,
      { uri: 'file:///a.gif', fileName: 'a.gif', mimeType: 'image/gif' },
      readBytes,
    );

    expect(result).toEqual({ ok: false, kind: 'invalid', reason: 'type' });
    expect(upload).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it('checks the real byte length, not just the picker size', async () => {
    const upload = jest.fn();
    const { client } = makeClient({ upload });

    const result = await uploadPostMedia(
      client,
      USER,
      POST,
      asset,
      async () => new ArrayBuffer(0),
    );

    expect(result).toEqual({ ok: false, kind: 'invalid', reason: 'empty' });
    expect(upload).not.toHaveBeenCalled();
  });

  it('does not insert a row when the upload fails', async () => {
    const upload = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'too big' } });
    const insert = jest.fn();
    const { client } = makeClient({ upload, insert });

    const result = await uploadPostMedia(client, USER, POST, asset, readBytes);

    expect(result.ok).toBe(false);
    expect(insert).not.toHaveBeenCalled();
  });
});

describe('listPostMedia', () => {
  it('selects rows for the given posts and narrows the status', async () => {
    const order = jest
      .fn()
      .mockResolvedValue({ data: [{ ...row, status: 'odd' }], error: null });
    const inFn = jest.fn(() => ({ order }));
    const select = jest.fn(() => ({ in: inFn }));
    const { client } = makeClient({ select });

    const result = await listPostMedia(client, [POST]);

    expect(inFn).toHaveBeenCalledWith('post_id', [POST]);
    expect(result.ok && result.media[0]?.status).toBe('pending');
  });

  it('skips the query for no posts', async () => {
    const select = jest.fn();
    const { client } = makeClient({ select });
    expect(await listPostMedia(client, [])).toEqual({ ok: true, media: [] });
    expect(select).not.toHaveBeenCalled();
  });
});

describe('signedMediaUrl', () => {
  it('uses a short-lived signed URL, never a public URL', async () => {
    const createSignedUrl = jest
      .fn()
      .mockResolvedValue({ data: { signedUrl: 'https://s/x' }, error: null });
    const getPublicUrl = jest.fn();
    const { client } = makeClient({ createSignedUrl, getPublicUrl });

    const result = await signedMediaUrl(client, `${USER}/x.jpg`);

    expect(createSignedUrl).toHaveBeenCalledWith(
      `${USER}/x.jpg`,
      MEDIA_SIGNED_URL_TTL_SECONDS,
    );
    expect(MEDIA_SIGNED_URL_TTL_SECONDS).toBeLessThanOrEqual(60 * 60);
    expect(getPublicUrl).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, url: 'https://s/x' });
  });

  it('fails gently when the viewer may not read the object', async () => {
    const createSignedUrl = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'not found' } });
    const { client } = makeClient({ createSignedUrl });
    const result = await signedMediaUrl(client, `${USER}/x.jpg`);
    expect(result.ok).toBe(false);
  });
});

describe('deletePostMedia', () => {
  it('deletes the row, then the object', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const del = jest.fn(() => ({ eq }));
    const remove = jest.fn().mockResolvedValue({ data: [], error: null });
    const { client } = makeClient({ delete: del, remove });

    const result = await deletePostMedia(client, {
      id: 'm1',
      storage_path: `${USER}/x.jpg`,
    });

    expect(result).toEqual({ ok: true });
    expect(eq).toHaveBeenCalledWith('id', 'm1');
    expect(remove).toHaveBeenCalledWith([`${USER}/x.jpg`]);
  });

  it('keeps the object when the row cannot be deleted', async () => {
    const eq = jest.fn().mockResolvedValue({ error: { message: 'no' } });
    const del = jest.fn(() => ({ eq }));
    const remove = jest.fn();
    const { client } = makeClient({ delete: del, remove });

    const result = await deletePostMedia(client, {
      id: 'm1',
      storage_path: `${USER}/x.jpg`,
    });

    expect(result.ok).toBe(false);
    expect(remove).not.toHaveBeenCalled();
  });
});
