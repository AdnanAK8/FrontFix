import multer from 'multer';

export function errorHandler(err, req, res, next) {
  // 1. Handle Multer file size limit
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        detail: 'File exceeds maximum allowed size of 2MB.'
      });
    }
    return res.status(400).json({
      detail: `Upload error: ${err.message}`
    });
  }

  // 2. Custom status code attached to error
  const statusCode = err.status || err.statusCode || 500;

  // 3. Keep secrets and internal stack traces out of production/client responses
  const message = statusCode === 500
    ? 'Internal server error. Please try again later.'
    : (err.message || 'An error occurred.');

  console.error(`[ErrorHandler] ${req.method} ${req.path} - ${err.message}`);

  return res.status(statusCode).json({
    detail: message
  });
}

export default errorHandler;
