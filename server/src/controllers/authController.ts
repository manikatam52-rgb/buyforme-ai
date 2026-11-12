import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { HttpError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { NextFunction } from 'express';

const sign = (id: string) => jwt.sign({ sub: id }, env.jwtSecret, { expiresIn: '7d' });

// Express 4 does not catch async throws
const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

export const register = wrap(async (req, res) => {
  const { email, password, name } = req.body ?? {};
  if (!email || !password || !name) throw new HttpError(400, 'email, password and name are required');
  if (String(password).length < 8) throw new HttpError(400, 'Password must be at least 8 characters');

  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) throw new HttpError(409, 'An account with this email already exists');

  const user = await User.create({
    email: String(email).toLowerCase(),
    passwordHash: await bcrypt.hash(password, 10),
    name,
  });
  res.status(201).json({ token: sign(String(user._id)), user: { id: user._id, email: user.email, name: user.name } });
});

export const login = wrap(async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) throw new HttpError(400, 'email and password are required');
  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password');
  }
  res.json({ token: sign(String(user._id)), user: { id: user._id, email: user.email, name: user.name } });
});

export const me = wrap(async (req, res) => {
  const user = await User.findById((req as any).userId).select('-passwordHash');
  if (!user) throw new HttpError(404, 'User not found');
  res.json(user);
});

export const updatePreferences = wrap(async (req, res) => {
  const user = await User.findById((req as any).userId);
  if (!user) throw new HttpError(404, 'User not found');
  const { monthlyBudget, preferences } = req.body ?? {};
  if (monthlyBudget != null) user.monthlyBudget = Number(monthlyBudget);
  if (preferences?.categories) user.preferences.categories = preferences.categories;
  if (preferences?.brands) user.preferences.brands = preferences.brands;
  await user.save();
  res.json(user);
});
