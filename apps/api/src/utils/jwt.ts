import jwt, { type SignOptions, type VerifyOptions } from "jsonwebtoken";

interface TokenPayload {
  userId: string;
  role: string;
}

export function signAccessToken(payload: TokenPayload, secret: string, expiresIn: string): string {
  const options: SignOptions = { expiresIn: expiresIn as any, algorithm: "HS256" };
  return jwt.sign(payload, secret, options);
}

export function signRefreshToken(payload: TokenPayload, secret: string, expiresIn: string): string {
  const options: SignOptions = { expiresIn: expiresIn as any, algorithm: "HS256" };
  return jwt.sign(payload, secret, options);
}

export function verifyToken(token: string, secret: string): TokenPayload {
  const options: VerifyOptions = { algorithms: ["HS256"] };
  return jwt.verify(token, secret, options) as TokenPayload;
}
