import jwt from 'jsonwebtoken';
import {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getAccessTokenExpirySeconds,
  getRefreshTokenExpiryDate,
} from '../jwt';

const RM_PAYLOAD = {
  sub:   'e1a46818-7e93-4c1c-ad3d-ebc05cbab437',
  email: 'rm.ampara@pmb.lk',
  role:  'REGIONAL_MANAGER',
} as any;

describe('access token', () => {
  it('produces a three-part JWT', () => {
    expect(signAccessToken(RM_PAYLOAD).split('.')).toHaveLength(3);
  });

  it('round-trips the payload through sign and verify', () => {
    const decoded = verifyAccessToken(signAccessToken(RM_PAYLOAD));
    expect(decoded.sub).toBe(RM_PAYLOAD.sub);
    expect(decoded.email).toBe(RM_PAYLOAD.email);
    expect(decoded.role).toBe(RM_PAYLOAD.role);
  });

  it('sets issuer and audience claims', () => {
    const decoded = jwt.decode(signAccessToken(RM_PAYLOAD)) as any;
    expect(decoded.iss).toBe('paddy-api');
    expect(decoded.aud).toBe('paddy-client');
  });

  it('carries iat and exp claims', () => {
    const decoded = verifyAccessToken(signAccessToken(RM_PAYLOAD));
    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();
    expect(decoded.exp!).toBeGreaterThan(decoded.iat!);
  });

  it('encodes the payload in readable base64 — callers must not pass secrets', () => {
    // JWTs are signed, not encrypted. The signature prevents tampering,
    // but every claim is publicly readable by anyone holding the token.
    // Confidentiality is enforced at compile time by the JwtPayload type,
    // which permits only sub, email, and role.
    const token   = signAccessToken(RM_PAYLOAD);
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

    expect(decoded.email).toBe(RM_PAYLOAD.email);          // readable, by design
    expect(Object.keys(decoded).sort()).toEqual(
      ['aud', 'email', 'exp', 'iat', 'iss', 'role', 'sub']  // no unexpected claims
    );
  });
});

describe('token tampering', () => {
  it('rejects a token whose payload has been altered', () => {
    const [header, payload, signature] = signAccessToken(RM_PAYLOAD).split('.');
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    decoded.role = 'ADMIN';                                    // privilege escalation attempt
    const forged = Buffer.from(JSON.stringify(decoded)).toString('base64url');
    expect(() => verifyAccessToken(`${header}.${forged}.${signature}`)).toThrow();
  });

  it('rejects a token with a corrupted signature', () => {
    const parts = signAccessToken(RM_PAYLOAD).split('.');
    parts[2] = parts[2].slice(0, -4) + 'AAAA';
    expect(() => verifyAccessToken(parts.join('.'))).toThrow();
  });

  it('rejects a token signed with a different secret', () => {
    const foreign = jwt.sign(RM_PAYLOAD, 'an_entirely_different_secret_value', {
      issuer: 'paddy-api', audience: 'paddy-client', expiresIn: '15m',
    });
    expect(() => verifyAccessToken(foreign)).toThrow();
  });

  it('rejects a token from an unexpected issuer', () => {
    const foreign = jwt.sign(RM_PAYLOAD, process.env.JWT_SECRET!, {
      issuer: 'malicious-api', audience: 'paddy-client', expiresIn: '15m',
    });
    expect(() => verifyAccessToken(foreign)).toThrow();
  });

  it('rejects a malformed string', () => {
    expect(() => verifyAccessToken('this.is.not.a.jwt')).toThrow();
    expect(() => verifyAccessToken('')).toThrow();
  });
});

describe('expiry', () => {
  it('rejects an already-expired token', () => {
    const expired = jwt.sign(RM_PAYLOAD, process.env.JWT_SECRET!, {
      issuer: 'paddy-api', audience: 'paddy-client', expiresIn: '-1s',
    });
    expect(() => verifyAccessToken(expired)).toThrow(/expired/i);
  });

  it('reports a positive access token lifetime', () => {
    expect(getAccessTokenExpirySeconds()).toBeGreaterThan(0);
  });

  it('returns a future refresh token expiry date', () => {
    expect(getRefreshTokenExpiryDate().getTime()).toBeGreaterThan(Date.now());
  });

  it('gives refresh tokens a longer lifetime than access tokens', () => {
    const accessMs  = getAccessTokenExpirySeconds() * 1000;
    const refreshMs = getRefreshTokenExpiryDate().getTime() - Date.now();
    expect(refreshMs).toBeGreaterThan(accessMs);
  });
});

describe('refresh token separation', () => {
  it('round-trips a refresh token', () => {
    const token = signRefreshToken({ sub: RM_PAYLOAD.sub, tokenId: 'abc-123' } as any);
    expect(verifyRefreshToken(token).sub).toBe(RM_PAYLOAD.sub);
  });

  it('does not accept an access token as a refresh token', () => {
    expect(() => verifyRefreshToken(signAccessToken(RM_PAYLOAD))).toThrow();
  });

  it('does not accept a refresh token as an access token', () => {
    const refresh = signRefreshToken({ sub: RM_PAYLOAD.sub, tokenId: 'abc-123' } as any);
    expect(() => verifyAccessToken(refresh)).toThrow();
  });
});