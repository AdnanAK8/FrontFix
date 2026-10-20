export class FeedbackController {
  constructor() {
    // In-memory feedback store (ponytail: native array avoids DB setup overhead)
    this.feedbackLog = [];
  }

  submitFeedback = (req, res) => {
    const { issue_title = 'General', is_helpful, query_text = '', comment = '' } = req.body;

    const record = {
      issue_title,
      is_helpful,
      query_text,
      comment,
      timestamp: new Date().toISOString()
    };

    this.feedbackLog.push(record);

    return res.json({
      success: true,
      message: 'Thank you for your feedback! It helps improve FrontFix AI.',
      total_feedback_count: this.feedbackLog.length
    });
  };

  getStats = (req, res) => {
    const total = this.feedbackLog.length;
    const positive = this.feedbackLog.filter(f => f.is_helpful).length;
    const negative = total - positive;
    const ratio = total > 0 ? parseFloat(((positive / total) * 100).toFixed(1)) : 0.0;

    return res.json({
      total_feedback: total,
      helpful_count: positive,
      unhelpful_count: negative,
      satisfaction_rate_percent: ratio,
      recent_feedback: this.feedbackLog.slice(-10)
    });
  };
}

export default FeedbackController;
