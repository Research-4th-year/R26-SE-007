import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { authenticate, adminOnly } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { loginSchema, registerSchema, refreshTokenSchema, changePasswordSchema } from '../utils/validators';
import { sendSuccess, sendCreated } from '../utils/errors';
 
const router = Router();
 
// POST /api/auth/login  — public
router.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await authService.login(req.body), 'Login successful'); }
  catch (err) { next(err); }
});
 
// POST /api/auth/register  — admin only
router.post('/register', authenticate, adminOnly, validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { sendCreated(res, await authService.register(req.body), 'User registered successfully'); }
  catch (err) { next(err); }
});
 
// POST /api/auth/refresh  — public
router.post('/refresh', validate(refreshTokenSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await authService.refreshTokens(req.body.refreshToken), 'Tokens refreshed'); }
  catch (err) { next(err); }
});
 
// POST /api/auth/logout  — authenticated
router.post('/logout', authenticate, validate(refreshTokenSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { await authService.logout(req.body.refreshToken); sendSuccess(res, null, 'Logged out successfully'); }
  catch (err) { next(err); }
});
 
// POST /api/auth/logout-all  — authenticated
router.post('/logout-all', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try { await authService.logoutAll(req.user!.sub); sendSuccess(res, null, 'Logged out from all devices'); }
  catch (err) { next(err); }
});
 
// GET /api/auth/me  — authenticated
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try { sendSuccess(res, await authService.getProfile(req.user!.sub)); }
  catch (err) { next(err); }
});
 
// PATCH /api/auth/change-password  — authenticated
router.patch('/change-password', authenticate, validate(changePasswordSchema), async (req: Request, res: Response, next: NextFunction) => {
  try { await authService.changePassword(req.user!.sub, req.body); sendSuccess(res, null, 'Password changed. Please log in again.'); }
  catch (err) { next(err); }
});
 
export default router;
