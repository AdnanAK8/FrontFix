import { app, diagnosticEngine } from './app.js';
import config from './config/env.js';

const PORT = config.port;
const HOST = config.host;

const server = app.listen(PORT, HOST, () => {
  console.log('========================================================');
  console.log('  ⚡ FrontFix AI — Node.js/Express Diagnostic Engine');
  console.log('  Team B: Frontend Support');
  console.log('========================================================');
  console.log(`- Status: Online & listening on http://${HOST}:${PORT}`);
  console.log(`- Knowledge Base Issues: ${diagnosticEngine.knowledgeBase.length}`);
  console.log(`- LLM Grounding: ${diagnosticEngine.llmService.isAvailable() ? 'Active' : 'Canonical Knowledge Mode (No genuine API key detected)'}`);
  console.log(`- Environment: ${config.env}`);
  console.log(`- Allowed Origins: ${config.allowedOrigins.join(', ')}`);
  console.log('========================================================');
});

function gracefulShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Closing HTTP server gracefully...`);
  server.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });

  // Force exit after 5 seconds if open connections hang
  setTimeout(() => {
    console.error('[Server] Forced exit after timeout.');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
