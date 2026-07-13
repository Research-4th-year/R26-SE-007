import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { config } from '../config/env';
import { AppError } from '../utils/errors';
import {
  signAccessToken, signRefreshToken, verifyRefreshToken,
  getAccessTokenExpirySeconds, getRefreshTokenExpiryDate,
} from '../utils/jwt';
import { AuthTokens } from '../types';
import { LoginInput, RegisterInput, ChangePasswordInput } from '../utils/validators';
 
export type SafeUser = {
  id: string; email: string; fullName: string; role: Role;
  warehouseId: string | null; fabricEnrollmentId: string | null;
  isActive: boolean; createdAt: Date;
};
 
function toSafeUser(user: SafeUser): SafeUser {
  return {
    id: user.id, email: user.email, fullName: user.fullName, role: user.role,
    warehouseId: user.warehouseId, fabricEnrollmentId: user.fabricEnrollmentId,
    isActive: user.isActive, createdAt: user.createdAt,
  };
}
 
export class AuthService {
  async login(dto: LoginInput): Promise<AuthTokens & { user: SafeUser }> {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });
 
    if (!user || !user.isActive) {
      await bcrypt.compare(dto.password, '$2b$12$invalidhashfortimingattackprevention');
      throw AppError.unauthorized('Invalid email or password');
    }
 
    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) throw AppError.unauthorized('Invalid email or password');
 
    const tokens = await this.issueTokens(user.id, user.email, user.role, user.warehouseId ?? undefined);
    return { ...tokens, user: toSafeUser(user) };
  }
  async register(dto: RegisterInput): Promise<SafeUser> {
    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw AppError.conflict('A user with this email already exists');
 
    if (dto.role === Role.WAREHOUSE_SUPERVISOR && !dto.warehouseId) {
      throw AppError.badRequest('warehouseId is required for WAREHOUSE_SUPERVISOR role');
    }
 
    if (dto.warehouseId) {
      const warehouse = await prisma.warehouse.findUnique({ where: { id: dto.warehouseId } });
      if (!warehouse) throw AppError.badRequest('Warehouse not found', { warehouseId: ['Warehouse does not exist'] });
    }
 
    const passwordHash = await bcrypt.hash(dto.password, config.bcrypt.rounds);
    const user = await prisma.user.create({
      data: { email: dto.email, passwordHash, fullName: dto.fullName, role: dto.role, warehouseId: dto.warehouseId },
    });
    return toSafeUser(user);
  }
 
  async refreshTokens(rawRefreshToken: string): Promise<AuthTokens> {
    try { verifyRefreshToken(rawRefreshToken); }
    catch { throw AppError.unauthorized('Invalid or expired refresh token'); }
 
    const stored = await prisma.refreshToken.findUnique({
      where: { token: rawRefreshToken }, include: { user: true },
    });
 
    if (!stored || stored.revokedAt !== null) {
      if (stored?.revokedAt) {
        await prisma.refreshToken.updateMany({ where: { userId: stored.userId }, data: { revokedAt: new Date() } });
      }
      throw AppError.unauthorized('Refresh token has been revoked');
    }
 
    if (stored.expiresAt < new Date()) throw AppError.unauthorized('Refresh token has expired');
    if (!stored.user.isActive) throw AppError.unauthorized('Account is deactivated');
 
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    return this.issueTokens(stored.user.id, stored.user.email, stored.user.role, stored.user.warehouseId ?? undefined);
  }
 
  async logout(rawRefreshToken: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token: rawRefreshToken, revokedAt: null }, data: { revokedAt: new Date() },
    });
  }
 
  async logoutAll(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }
 
  async changePassword(userId: string, dto: ChangePasswordInput): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('User not found');
 
    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) throw AppError.badRequest('Current password is incorrect', { currentPassword: ['Incorrect password'] });
    if (dto.currentPassword === dto.newPassword) throw AppError.badRequest('New password must differ from the current password');
 
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(dto.newPassword, config.bcrypt.rounds) } });
    await this.logoutAll(userId);
  }
 
  async getProfile(userId: string): Promise<SafeUser & { warehouse?: { id: string; name: string; code: string; district: string } }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { warehouse: { select: { id: true, name: true, code: true, district: true } } },
    });
    if (!user) throw AppError.notFound('User not found');
    return { ...toSafeUser(user), warehouse: user.warehouse ?? undefined };
  }
 
  private async issueTokens(userId: string, email: string, role: Role, warehouseId?: string): Promise<AuthTokens> {
    const accessToken = signAccessToken({ sub: userId, email, role, warehouseId });
    const expiresAt = getRefreshTokenExpiryDate();
 
    const tokenRecord = await prisma.refreshToken.create({
      data: { token: 'placeholder', userId, expiresAt },
    });
 
    const refreshToken = signRefreshToken({ sub: userId, tokenId: tokenRecord.id });
    await prisma.refreshToken.update({ where: { id: tokenRecord.id }, data: { token: refreshToken } });
 
    return { accessToken, refreshToken, expiresIn: getAccessTokenExpirySeconds() };
  }
}
 
export const authService = new AuthService();
