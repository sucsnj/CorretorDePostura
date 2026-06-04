import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { isUbidotsHealthy } from '../services/ubidots';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const mongodbConnected = mongoose.connection.readyState === 1;
  const ubidotsConnected = isUbidotsHealthy();

  const isHealthy = mongodbConnected && ubidotsConnected;

  const payload = {
    status: isHealthy ? 'ok' : 'error',
    mongodb: mongodbConnected,
    ubidots: ubidotsConnected
  };

  if (isHealthy) {
    return res.json(payload);
  } else {
    // Return 503 Service Unavailable if any core dependency is down
    return res.status(503).json(payload);
  }
});

export default router;
