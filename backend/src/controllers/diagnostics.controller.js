import SanitizerService from '../services/sanitizer.service.js';
import { formatDiagnosticResponse } from '../utils/response-formatter.js';

export class DiagnosticsController {
  constructor(diagnosticEngine) {
    this.engine = diagnosticEngine;
  }

  uploadLog = async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ detail: 'No file uploaded.' });
      }

      const buffer = req.file.buffer;

      // 1. Check empty file
      if (!buffer || buffer.length === 0) {
        return res.status(400).json({ detail: 'Uploaded file is empty.' });
      }

      // 2. Reject binary files (check for null bytes in initial 1024 bytes)
      const preview = buffer.subarray(0, Math.min(buffer.length, 1024));
      if (preview.includes(0)) {
        return res.status(400).json({
          detail: 'Binary or executable file detected. Please upload a plain text (.log, .txt, .json) file.'
        });
      }

      const contentText = buffer.toString('utf-8');
      const analysis = await this.engine.analyzeLogFile(contentText);

      return res.json({
        success: true,
        filename: req.file.originalname,
        analysis
      });
    } catch (error) {
      next(error);
    }
  };

  diagnoseExtension = async (req, res, next) => {
    try {
      const {
        url = '',
        errorMessage = '',
        stack = '',
        promiseRejection = '',
        failedResourceUrl = '',
        browserInfo = '',
        userDescription = '',
        selectedText = ''
      } = req.body;

      // Sanitize URL query parameters and secrets
      const cleanUrl = SanitizerService.sanitizeUrl(url);
      const cleanFailedUrl = SanitizerService.sanitizeUrl(failedResourceUrl);

      // Synthesize diagnostic query
      const queryParts = [];
      if (errorMessage) queryParts.push(errorMessage);
      if (promiseRejection) queryParts.push(`Unhandled Rejection: ${promiseRejection}`);
      if (selectedText) queryParts.push(`Selected Code: ${selectedText}`);
      if (userDescription) queryParts.push(`User Note: ${userDescription}`);
      if (stack) queryParts.push(`Stack: ${stack}`);
      if (cleanFailedUrl) queryParts.push(`Failed Resource: ${cleanFailedUrl}`);

      const fullQuery = queryParts.join('\n\n').trim();

      const diagnosis = await this.engine.diagnose(fullQuery, true);
      const formatted = formatDiagnosticResponse(diagnosis);

      return res.json({
        success: true,
        data: formatted,
        browser_context: {
          url: cleanUrl,
          browserInfo: browserInfo.slice(0, 200)
        }
      });
    } catch (error) {
      next(error);
    }
  };
}

export default DiagnosticsController;
