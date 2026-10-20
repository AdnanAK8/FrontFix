import { Router } from 'express';
import { validateFeedbackRequest } from '../middleware/validate-request.js';

export function createFeedbackRoutes(feedbackController) {
  const router = Router();

  router.post('/', validateFeedbackRequest, feedbackController.submitFeedback);
  router.get('/stats', feedbackController.getStats);

  return router;
}

export default createFeedbackRoutes;
