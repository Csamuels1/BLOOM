import {
  MAX_MEDIA_BYTES,
  extensionOf,
  validateMediaAsset,
  validateMediaType,
} from '@/features/communityMedia';

const base = { uri: 'file:///tmp/pic.jpg', fileName: 'pic.jpg' };

describe('validateMediaAsset', () => {
  it.each([
    ['image/jpeg', 'pic.jpg', 'jpg'],
    ['image/jpeg', 'pic.JPEG', 'jpg'],
    ['image/png', 'pic.png', 'png'],
    ['image/webp', 'pic.webp', 'webp'],
  ])('accepts a valid %s (%s)', (mimeType, fileName, extension) => {
    const result = validateMediaAsset({
      uri: `file:///tmp/${fileName}`,
      fileName,
      mimeType,
      fileSize: 1024,
    });
    expect(result).toEqual({
      ok: true,
      media: {
        uri: `file:///tmp/${fileName}`,
        mimeType,
        sizeBytes: 1024,
        extension,
      },
    });
  });

  it('accepts exactly 5 MB', () => {
    const result = validateMediaAsset({
      ...base,
      mimeType: 'image/jpeg',
      fileSize: MAX_MEDIA_BYTES,
    });
    expect(result.ok).toBe(true);
  });

  it.each(['image/gif', 'image/heic', 'video/mp4', 'application/pdf'])(
    'rejects a wrong MIME type (%s)',
    (mimeType) => {
      const result = validateMediaAsset({
        uri: 'file:///tmp/x',
        fileName: null,
        mimeType,
        fileSize: 1024,
      });
      expect(result).toEqual({ ok: false, reason: 'type' });
    },
  );

  it('rejects a 0-byte image', () => {
    expect(
      validateMediaAsset({ ...base, mimeType: 'image/jpeg', fileSize: 0 }),
    ).toEqual({ ok: false, reason: 'empty' });
  });

  it('rejects an unknown size', () => {
    expect(
      validateMediaAsset({ ...base, mimeType: 'image/jpeg', fileSize: null }),
    ).toEqual({ ok: false, reason: 'empty' });
  });

  it('rejects anything over 5 MB', () => {
    expect(
      validateMediaAsset({
        ...base,
        mimeType: 'image/jpeg',
        fileSize: MAX_MEDIA_BYTES + 1,
      }),
    ).toEqual({ ok: false, reason: 'tooLarge' });
  });

  it('rejects an extension that disagrees with the MIME type', () => {
    expect(
      validateMediaAsset({
        uri: 'file:///tmp/pic.exe',
        fileName: 'pic.exe',
        mimeType: 'image/jpeg',
        fileSize: 10,
      }),
    ).toEqual({ ok: false, reason: 'extension' });
    expect(
      validateMediaAsset({
        uri: 'file:///tmp/pic.png',
        fileName: 'pic.png',
        mimeType: 'image/jpeg',
        fileSize: 10,
      }),
    ).toEqual({ ok: false, reason: 'extension' });
  });

  it('infers the MIME type from the extension when the picker gives none', () => {
    const result = validateMediaAsset({
      uri: 'file:///tmp/pic.webp',
      mimeType: null,
      fileSize: 10,
    });
    expect(result.ok && result.media.mimeType).toBe('image/webp');
  });

  it('rejects when neither MIME type nor extension identify an image', () => {
    expect(
      validateMediaAsset({ uri: 'file:///tmp/blob', fileSize: 10 }),
    ).toEqual({ ok: false, reason: 'type' });
  });
});

describe('validateMediaType', () => {
  it('checks the kind without needing a size', () => {
    expect(validateMediaType({ ...base, mimeType: 'image/jpeg' })).toEqual({
      ok: true,
      mimeType: 'image/jpeg',
    });
  });
});

describe('extensionOf', () => {
  it('reads the last extension and ignores query strings', () => {
    expect(extensionOf('a/b/pic.PNG?x=1')).toBe('png');
    expect(extensionOf('noext')).toBeNull();
    expect(extensionOf('.hidden')).toBeNull();
    expect(extensionOf(null)).toBeNull();
  });
});
