import { Router } from 'express';

export function createHealthRoutes(diagnosticEngine) {
  const router = Router();

  router.get('/', (req, res) => {
    return res.json({
      app: 'FrontFix AI Backend (Node.js/Express)',
      team: 'Team B (Frontend Support)',
      status: 'online',
      version: '3.0.0',
      runtime: `Node.js ${process.version}`,
      knowledge_base_size: diagnosticEngine.knowledgeBase.length,
      llm_grounding_available: diagnosticEngine.llmService.isAvailable(),
      supported_domains: [
        'JavaScript & TypeScript Errors',
        'React & Hooks Lifecycle',
        'CSS Layout & Centering',
        'HTML & Form Accessibility',
        'API Integration & CORS',
        'Browser Console & Web Security'
      ]
    });
  });

  return router;
}

export default createHealthRoutes;
