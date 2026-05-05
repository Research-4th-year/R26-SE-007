import { Role } from '@prisma/client';
 
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  warehouseId?: string;
  iat?: number;
  exp?: number;
}
 
export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}
 
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
 
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}
 
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
