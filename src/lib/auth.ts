const PBKDF2_ITERATIONS = 120_000;

function bytesToB64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function b64ToBytes(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i += 1) out[i] = s.charCodeAt(i);
  return out;
}

export async function hashPassword(
  password: string,
  existingSaltB64?: string,
): Promise<{ hash: string; salt: string }> {
  const salt = existingSaltB64
    ? b64ToBytes(existingSaltB64)
    : crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const saltBuffer = new Uint8Array(salt);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  );
  return {
    hash: bytesToB64(new Uint8Array(bits)),
    salt: bytesToB64(salt),
  };
}

export async function verifyPassword(
  password: string,
  hash: string,
  salt: string,
): Promise<boolean> {
  const next = await hashPassword(password, salt);
  return next.hash === hash;
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export function validateUsername(username: string): string | null {
  const u = username.trim();
  if (!u) return 'Username is required.';
  if (!USERNAME_RE.test(u)) {
    return 'Username must be 3–20 characters (letters, numbers, underscore).';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.';
  if (password.length < 4) return 'Password must be at least 4 characters.';
  if (password.length > 128) return 'Password is too long.';
  return null;
}

export const MAX_PHOTO_BYTES = 400_000;

export async function readPhotoFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }
  if (file.size > MAX_PHOTO_BYTES * 2) {
    throw new Error('Image is too large. Try a smaller photo (under ~800 KB).');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read image.'));
    reader.readAsDataURL(file);
  });

  const approxBytes = Math.ceil((dataUrl.length * 3) / 4);
  if (approxBytes > MAX_PHOTO_BYTES) {
    throw new Error('Image is too large after encoding. Use a smaller photo.');
  }
  return dataUrl;
}
