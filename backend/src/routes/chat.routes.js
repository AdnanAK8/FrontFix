import { Router } from 'express';
import { validateDiagnoseRequest } from '../middleware/validate-request.js';
import { apiLimiter } from '../middleware/rate-limiter.js';

export function createChatRoutes(chatController) {
  const router = Router();

  router.post('/diagnose', apiLimiter, validateDiagnoseRequest, chatController.diagnose);
  router.get('/presets', chatController.getPresets);
  router.get('/knowledge', chatController.getKnowledge);

  return router;
}

export default createChatRoutes;
