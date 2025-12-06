/**
 * Audit Logs Controller
 * API endpoints để quản lý và xem audit logs
 * CHỈ SUPER ADMIN (roleId = 0) mới được truy cập
 */

import { Op } from "sequelize";
import AuditLog from "../models/AuditLog";
import { User } from "../models";

// Role ID cho Super Admin
const SUPER_ADMIN_ROLE_ID = 0;

/**
 * Kiểm tra quyền Super Admin
 */
const isSuperAdmin = (user) => {
  if (!user) return false;
  return Number(user.roleId) === SUPER_ADMIN_ROLE_ID;
};

/**
 * GET /api/audit-logs
 * Lấy danh sách audit logs với phân trang và filter
 */
const getAuditLogs = async (req, res) => {
  try {
    // Kiểm tra quyền Super Admin
    const user = req.user || req.session?.user;
    if (!isSuperAdmin(user)) {
      return res.status(403).json({
        success: false,
        message:
          "Bạn không có quyền truy cập tài nguyên này. Chỉ Super Admin mới được xem Audit Logs.",
      });
    }

    // Query params
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    // Filters
    const {
      actionType,
      entityTable,
      userId: filterUserId,
      startDate,
      endDate,
      search,
    } = req.query;

    // Build where clause
    const where = {};

    if (actionType) {
      where.actionType = actionType.toUpperCase();
    }

    if (entityTable) {
      where.entityTable = entityTable;
    }

    if (filterUserId) {
      where.userId = parseInt(filterUserId);
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate);
      }
    }

    if (search) {
      where[Op.or] = [
        { description: { [Op.like]: `%${search}%` } },
        { entityTable: { [Op.like]: `%${search}%` } },
        { ipAddress: { [Op.like]: `%${search}%` } },
      ];
    }

    // Query database
    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          attributes: ["id", "username", "email", "fullName"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    // Format response
    const formattedLogs = logs.map((log) => {
      const plainLog = log.get({ plain: true });
      return {
        id: plainLog.id,
        userId: plainLog.userId,
        userName:
          plainLog.User?.username || plainLog.User?.fullName || "Hệ thống",
        userEmail: plainLog.User?.email || null,
        actionType: plainLog.actionType,
        entityTable: plainLog.entityTable,
        entityId: plainLog.entityId,
        oldValues: safeParseJson(plainLog.oldValues),
        newValues: safeParseJson(plainLog.newValues),
        changedFields: safeParseJson(plainLog.changedFields),
        ipAddress: plainLog.ipAddress,
        userAgent: plainLog.userAgent,
        requestMethod: plainLog.requestMethod,
        requestUrl: plainLog.requestUrl,
        description: plainLog.description,
        metadata: safeParseJson(plainLog.metadata),
        createdAt: plainLog.createdAt,
      };
    });

    return res.json({
      success: true,
      data: {
        logs: formattedLogs,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("[AuditLogs Error]", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách audit logs",
      error: error.message,
    });
  }
};

/**
 * GET /api/audit-logs/:id
 * Lấy chi tiết một audit log
 */
const getAuditLogDetail = async (req, res) => {
  try {
    const user = req.user || req.session?.user;
    if (!isSuperAdmin(user)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập tài nguyên này.",
      });
    }

    const { id } = req.params;
    const log = await AuditLog.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ["id", "username", "email", "fullName", "avatarUrl"],
          required: false,
        },
      ],
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy log",
      });
    }

    const plainLog = log.get({ plain: true });

    return res.json({
      success: true,
      data: {
        id: plainLog.id,
        userId: plainLog.userId,
        user: plainLog.User
          ? {
              id: plainLog.User.id,
              username: plainLog.User.username,
              email: plainLog.User.email,
              fullName: plainLog.User.fullName,
              avatarUrl: plainLog.User.avatarUrl,
            }
          : null,
        actionType: plainLog.actionType,
        entityTable: plainLog.entityTable,
        entityId: plainLog.entityId,
        oldValues: safeParseJson(plainLog.oldValues),
        newValues: safeParseJson(plainLog.newValues),
        changedFields: safeParseJson(plainLog.changedFields),
        ipAddress: plainLog.ipAddress,
        userAgent: plainLog.userAgent,
        requestMethod: plainLog.requestMethod,
        requestUrl: plainLog.requestUrl,
        description: plainLog.description,
        metadata: safeParseJson(plainLog.metadata),
        createdAt: plainLog.createdAt,
      },
    });
  } catch (error) {
    console.error("[AuditLogs Error]", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết audit log",
    });
  }
};

/**
 * GET /api/audit-logs/stats
 * Thống kê audit logs
 */
const getAuditStats = async (req, res) => {
  try {
    const user = req.user || req.session?.user;
    if (!isSuperAdmin(user)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập tài nguyên này.",
      });
    }

    // Thống kê theo action type
    const actionStats = await AuditLog.findAll({
      attributes: [
        "actionType",
        [AuditLog.sequelize.fn("COUNT", AuditLog.sequelize.col("Id")), "count"],
      ],
      group: ["actionType"],
      raw: true,
    });

    // Thống kê theo entity table
    const entityStats = await AuditLog.findAll({
      attributes: [
        "entityTable",
        [AuditLog.sequelize.fn("COUNT", AuditLog.sequelize.col("Id")), "count"],
      ],
      where: {
        entityTable: { [Op.ne]: null },
      },
      group: ["entityTable"],
      raw: true,
    });

    // 7 ngày gần nhất
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const recentCount = await AuditLog.count({
      where: {
        createdAt: { [Op.gte]: last7Days },
      },
    });

    const totalCount = await AuditLog.count();

    return res.json({
      success: true,
      data: {
        totalLogs: totalCount,
        logsLast7Days: recentCount,
        byActionType: actionStats,
        byEntityTable: entityStats,
      },
    });
  } catch (error) {
    console.error("[AuditLogs Error]", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê",
    });
  }
};

/**
 * GET /api/audit-logs/users
 * Lấy danh sách users đã có activity (cho filter)
 */
const getActiveUsers = async (req, res) => {
  try {
    const user = req.user || req.session?.user;
    if (!isSuperAdmin(user)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập tài nguyên này.",
      });
    }

    const users = await AuditLog.findAll({
      attributes: [
        [
          AuditLog.sequelize.fn(
            "DISTINCT",
            AuditLog.sequelize.col("AuditLog.UserId")
          ),
          "userId",
        ],
      ],
      include: [
        {
          model: User,
          attributes: ["username", "email", "fullName"],
          required: true,
        },
      ],
      where: {
        userId: { [Op.ne]: null },
      },
      raw: true,
      nest: true,
    });

    const formattedUsers = users.map((u) => ({
      id: u.userId,
      username: u.User?.username,
      email: u.User?.email,
      fullName: u.User?.fullName,
    }));

    return res.json({
      success: true,
      data: formattedUsers,
    });
  } catch (error) {
    console.error("[AuditLogs Error]", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách users",
    });
  }
};

/**
 * Helper: Parse JSON safely
 */
const safeParseJson = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export default {
  getAuditLogs,
  getAuditLogDetail,
  getAuditStats,
  getActiveUsers,
  isSuperAdmin,
  SUPER_ADMIN_ROLE_ID,
};
