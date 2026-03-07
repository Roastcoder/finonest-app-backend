import jwt from 'jsonwebtoken';

export const roleHierarchy = {
  admin: 6,
  ops_team: 5,
  sales_manager: 4,
  dsa: 3,
  team_leader: 2,
  executive: 1
};

export const hasMinimumRole = (userRole, requiredRole) => {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};
