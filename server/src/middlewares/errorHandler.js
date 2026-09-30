export const errorHandler = (err, req, res, next) => {
  console.error(`[-] Server Error: ${err.message}`);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'production' ? 'An internal error occurred.' : err.message,
  });
};