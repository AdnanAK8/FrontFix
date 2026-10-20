import { Router } from 'express';
import multer from 'multer';
import { uploadLimiter, apiLimiter } from '../middleware/rate-limiter.js';
import { validateExtensionDiagnoseRequest } from '../middleware/validate-request.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

export function createDiagnosticsRoutes(diagnosticsController) {
  const router = Router();

  router.post('/upload-log', uploadLimiter, upload.single('file'), diagnosticsController.uploadLog);
  router.post('/extension/diagnose', apiLimiter, validateExtensionDiagnoseRequest, diagnosticsController.diagnoseExtension);

  return router;
}

export default createDiagnosticsRoutes;
