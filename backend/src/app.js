import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import config from './config/env.js';
import DiagnosticEngine from './services/diagnostic-engine.js';
import ChatController from './controllers/chat.controller.js';
import DiagnosticsController from './controllers/diagnostics.controller.js';
import FeedbackController from './controllers/feedback.controller.js';
import createHealthRoutes from './routes/health.routes.js';
import createChatRoutes from './routes/chat.routes.js';
import createDiagnosticsRoutes from './routes/diagnostics.routes.js';
import createFeedbackRoutes from './routes/feedback.routes.js';
import errorHandler from './middleware/error-handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(customOptions = {}) {
  const app = express();

  const diagnosticEngine = customOptions.engine || new DiagnosticEngine(customOptions);
  const chatController = new ChatController(diagnosticEngine);
  const diagnosticsController = new DiagnosticsController(diagnosticEngine);
  const feedbackController = customOptions.feedbackController || new FeedbackController();

  // 1. Helmet security headers (with crossOriginResourcePolicy set for frontend static loading)
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));

  // 2. CORS configuration: supports configured frontend origins and browser extension origins
  const allowedOriginsSet = new Set(config.allowedOrigins);
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Check configured origins
      if (allowedOriginsSet.has(origin)) return callback(null, true);

      // Allow Chrome/Edge extensions
      if (/^chrome-extension:\/\/[a-z0-9]+$/i.test(origin) || /^moz-extension:\/\/[a-z0-9\-]+$/i.test(origin)) {
        return callback(null, true);
      }

      // In development mode, allow localhost with any port
      if (config.env === 'development' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked: Origin ${origin} not permitted.`));
    },
    credentials: false,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // 3. Request body parsers with bounded memory limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 4. Mount Health route
  app.use('/', createHealthRoutes(diagnosticEngine));

  // 5. Mount API routes
  app.use('/api', createChatRoutes(chatController));
  app.use('/api', createDiagnosticsRoutes(diagnosticsController));
  app.use('/api/feedback', createFeedbackRoutes(feedbackController));

  // 6. Optional static file mount for frontend UI (single-process deployment)
  const frontendDir = path.resolve(__dirname, '../../../frontend');
  const localFrontendDir = path.resolve(__dirname, '../../frontend');
  const resolvedFrontend = fs.existsSync(frontendDir) ? frontendDir : (fs.existsSync(localFrontendDir) ? localFrontendDir : null);

  if (resolvedFrontend) {
    app.use('/ui', express.static(resolvedFrontend));
  }

  // 7. Global centralized error handler
  app.use(errorHandler);

  return { app, diagnosticEngine, feedbackController };
}

export const { app, diagnosticEngine, feedbackController } = createApp();
export default app;
