import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { JwtPayload, RefreshTokenPayload } from '../types';
 
export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: 'paddy-api',
    audience: 'paddy-client',
  } as jwt.SignOptions);
}
 
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.secret, {
    issuer: 'paddy-api',
    audience: 'paddy-client',
  }) as JwtPayload;
}
 
export function signRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    issuer: 'paddy-api',
  } as jwt.SignOptions);
}
 
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret, {
    issuer: 'paddy-api',
  }) as RefreshTokenPayload;
}
 
export function getAccessTokenExpirySeconds(): number {
  const unit = config.jwt.expiresIn.slice(-1);
  const value = parseInt(config.jwt.expiresIn.slice(0, -1), 10);
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * (multipliers[unit] || 3600);
}
 
export function getRefreshTokenExpiryDate(): Date {
  const unit = config.jwt.refreshExpiresIn.slice(-1);
  const value = parseInt(config.jwt.refreshExpiresIn.slice(0, -1), 10);
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return new Date(Date.now() + value * (multipliers[unit] || 86400000));
}
