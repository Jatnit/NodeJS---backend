import jwt from "jsonwebtoken";

const ROLE_MAP = {
  admin: 1,
  manager: 2,
  customer: 3,
};

const normalizeRole = (role) => {
  if (typeof role === "number") {
    return role;
  }
  const key = String(role || "").toLowerCase();
  return ROLE_MAP[key] || Number(role) || null;
};

const extractTokenFromHeader = (req) => {
  const authHeader = req.headers?.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
};

const getJwtSecret = () => process.env.JWT_SECRET || "moda_studio_secret";

const verifyToken = (req, res, next) => {
  if (req.session?.user) {
    req.user = req.session.user;
    return next();
  }

  const token = extractTokenFromHeader(req) || req.cookies?.token;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Vui lòng đăng nhập để tiếp tục.",
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = {
      id: decoded.id,
      roleId: decoded.roleId,
      email: decoded.email,
      username: decoded.username,
    };
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ hoặc đã hết hạn.",
    });
  }
};

const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Bạn chưa đăng nhập.",
      });
    }

    const roleId = Number(user.roleId);
    if (roleId === ROLE_MAP.admin) {
      return next();
    }

    const normalizedRoles = allowedRoles
      .map((role) => normalizeRole(role))
      .filter((role) => role !== null);

    if (normalizedRoles.includes(roleId)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền truy cập tài nguyên này.",
    });
  };

const attachUserIfAvailable = (req, _res, next) => {
  if (req.session?.user) {
    req.user = req.session.user;
    return next();
  }
  const token = extractTokenFromHeader(req);
  if (!token) {
    return next();
  }
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
  } catch (error) {
    // không gán user nếu token lỗi
  }
  return next();
};

export { verifyToken, authorize, attachUserIfAvailable, ROLE_MAP };


