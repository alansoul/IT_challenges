import { asyncHandler } from '../utils/asyncHandler.js';

export const login = asyncHandler(async (req, res) => {
  // no more try/catch needed
  // errors auto-forward to errorHandler middleware
});