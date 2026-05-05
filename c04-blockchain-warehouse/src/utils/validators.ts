import { z } from 'zod';
import { Role } from '@prisma/client';
 
export const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Invalid email address').toLowerCase().trim(),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});
 
export const registerSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Invalid email address').toLowerCase().trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  fullName: z.string({ required_error: 'Full name is required' }).min(2).trim(),
  role: z.nativeEnum(Role, { errorMap: () => ({ message: 'Invalid role' }) }),
  warehouseId: z.string().uuid('Invalid warehouse ID').optional(),
});
 
export const refreshTokenSchema = z.object({
  refreshToken: z.string({ required_error: 'Refresh token is required' }).min(1),
});
 
export const changePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'Current password is required' }).min(1),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});
 
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
