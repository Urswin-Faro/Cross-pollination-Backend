// 1. CRITICAL: Use type-only import for Express request/response interfaces
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 2. CRITICAL: Added '.js' extension to resolve cleanly under NodeNext rules
import { UserModel } from '../models/dataModels.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_crypto_key_2026';

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;
    
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'This email account is already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await UserModel.createAccount(email, passwordHash);
    
    // Generate an instant entry token for onboarding fluidity
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({ message: 'User structural account deployed.', token, userId: newUser.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;
    
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid login email or password parameters.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid login email or password parameters.' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, userId: user.id, message: 'Authentication handshake complete.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const setupProfile = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId, fullName, age, location, church, tagIds } = req.body;

    const profile = await UserModel.createProfile(userId, fullName, parseInt(age), location, church);
    
    if (tagIds && tagIds.length > 0) {
      await UserModel.assignProfileTags(profile.id, tagIds);
    }

    res.status(201).json({ message: 'Profile metadata configured successfully.', profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};