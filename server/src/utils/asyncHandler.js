/**
 * Wraps an async route handler or controller to automatically forward
 * unhandled rejections to Express's errorHandler middleware.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};