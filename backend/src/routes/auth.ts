import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

export interface AuthRequest extends Request {
  user?: { username: string };
}

// Authentication middleware
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';
  jwt.verify(token, secret, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
}

// Login route
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';

  if (username === 'admin' && password === adminPassword) {
    const token = jwt.sign({ username: 'admin' }, jwtSecret, { expiresIn: '7d' });
    return res.json({ username: 'admin', token });
  }

  return res.status(401).json({ error: 'Credenciais inválidas.' });
});

export default router;
