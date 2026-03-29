import jwt, { type SignOptions } from "jsonwebtoken";

interface TokenPayload {
  userId: string;
  role: string;
}

export function signAccessToken(payload: TokenPayload, secret: string, expiresIn: string): string {
  const options: SignOptions = { expiresIn: expiresIn as any };
  return jwt.sign(payload, secret, options);
}

export function signRefreshToken(payload: TokenPayload, secret: string, expiresIn: string): string {
  const options: SignOptions = { expiresIn: expiresIn as any };
  return jwt.sign(payload, secret, options);
}

export function verifyToken(token: string, secret: string): TokenPayload {
  return jwt.verify(token, secret) as TokenPayload;
}
