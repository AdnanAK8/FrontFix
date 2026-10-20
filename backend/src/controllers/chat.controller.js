import { formatDiagnosticResponse } from '../utils/response-formatter.js';

export class ChatController {
  constructor(diagnosticEngine) {
    this.engine = diagnosticEngine;
  }

  diagnose = async (req, res, next) => {
    try {
      const {
        query,
        enable_privacy = true,
        conversation_history = null,
        stack = '',
        framework = null,
        source = 'user_pasted'
      } = req.body;

      const context = {
        stack,
        detectedFramework: framework,
        source
      };

      const diagnosis = await this.engine.diagnose(query, enable_privacy, conversation_history, context);
      const formatted = formatDiagnosticResponse(diagnosis);

      return res.json({
        success: true,
        data: formatted
      });
    } catch (error) {
      next(error);
    }
  };

  getPresets = (req, res) => {
    const presets = this.engine.listPresets();
    return res.json({ presets });
  };

  getKnowledge = (req, res) => {
    const issues = this.engine.knowledgeBase.map(k => ({
      id: k.id,
      category: k.category,
      title: k.title,
      problem: k.problem
    }));

    return res.json({
      total_issues: issues.length,
      issues
    });
  };
}

export default ChatController;
