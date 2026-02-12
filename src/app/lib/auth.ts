import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);

export type SessionPayload = {
  sub: string;
  email: string;
  name?: string | null;
  role?: string;
};

export const signSession = async (payload: SessionPayload) => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export const verifySession = async (token: string) => {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as SessionPayload;
}