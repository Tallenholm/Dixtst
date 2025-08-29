import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  roles: string[];
  householdId?: string;
}

let secret: string | undefined;
function getSecret(): string {
  if (!secret) {
    secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is required');
  }
  return secret;
}

const revoked = new Set<string>();

export function signToken(payload: TokenPayload, expiresIn = '15m'): string {
  return jwt.sign(payload, getSecret(), { expiresIn });
}

export function verifyToken(token: string): TokenPayload {
  if (revoked.has(token)) {
    throw new Error('revoked_token');
  }
  return jwt.verify(token, getSecret()) as TokenPayload;
}

export function revokeToken(token: string): void {
  revoked.add(token);
}
