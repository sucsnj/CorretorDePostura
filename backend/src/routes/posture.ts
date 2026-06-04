import { Router, Response } from 'express';
import { Posture } from '../models/Posture';
import { authenticateToken, AuthRequest } from './auth';

const router = Router();

// GET /api/posture/history - Get the latest 500 records
router.get('/history', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 200;
    const history = await Posture.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
    
    return res.json(history);
  } catch (error) {
    console.error('Error fetching posture history:', error);
    return res.status(500).json({ error: 'Erro ao buscar histórico de dados.' });
  }
});

// DELETE /api/posture/clear - Delete all records from MongoDB
router.delete('/clear', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await Posture.deleteMany({});
    console.log('Database history cleared by user request.');
    return res.json({ message: 'Histórico local limpo com sucesso.' });
  } catch (error) {
    console.error('Error clearing posture history:', error);
    return res.status(500).json({ error: 'Erro ao limpar histórico de dados.' });
  }
});

export default router;
