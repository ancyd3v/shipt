import { createHmac } from 'crypto';

const SECRET = process.env.GITHUB_OAUTH_SIGNING_SECRET as string;

export function signGithubToken(username: string): string {
  const payload = Buffer.from(username).toString('base64url');
  const signature = createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

export function verifyGithubToken(token: string): string | null {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = createHmac('sha256', SECRET).update(payload).digest('hex');
  if (signature !== expected) return null;
  return Buffer.from(payload, 'base64url').toString('utf-8');
}
