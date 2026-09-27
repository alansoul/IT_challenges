export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'ACCESS FORBIDDEN: This breach attempt has been logged.',
    });
  }
  next();
};