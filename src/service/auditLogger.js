/**
 * Audit Logger Service
 * Helper functions để ghi log hoạt động hệ thống
 */

import AuditLog from "../models/AuditLog";

/**
 * Lấy IP address từ request
 */
const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    "unknown"
  );
};

/**
 * Lấy User Agent từ request
 */
const getUserAgent = (req) => {
  return req.headers["user-agent"] || "unknown";
};

/**
 * So sánh 2 object và trả về danh sách các field đã thay đổi
 * @param {Object} oldData - Dữ liệu cũ
 * @param {Object} newData - Dữ liệu mới
 * @returns {Object} { changedFields, oldValues, newValues }
 */
const compareValues = (oldData, newData) => {
  if (!oldData || !newData) {
    return {
      changedFields: [],
      oldValues: oldData || null,
      newValues: newData || null,
    };
  }

  const changedFields = [];
  const oldValues = {};
  const newValues = {};

  // Lấy tất cả các keys từ cả 2 object
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  allKeys.forEach((key) => {
    // Bỏ qua các trường không cần track
    const ignoreFields = ["updatedAt", "createdAt", "password", "passwordHash"];
    if (ignoreFields.includes(key.toLowerCase())) return;

    const oldVal = oldData[key];
    const newVal = newData[key];

    // So sánh giá trị (xử lý null, undefined, objects)
    const oldValStr = JSON.stringify(oldVal ?? null);
    const newValStr = JSON.stringify(newVal ?? null);

    if (oldValStr !== newValStr) {
      changedFields.push(key);
      oldValues[key] = oldVal;
      newValues[key] = newVal;
    }
  });

  return { changedFields, oldValues, newValues };
};

/**
 * Tạo mô tả chi tiết về thay đổi
 */
const generateDescription = (
  actionType,
  entityTable,
  changedFields,
  oldValues,
  newValues
) => {
  const entityName = entityTable || "record";

  switch (actionType) {
    case "LOGIN":
      return "Đăng nhập hệ thống";
    case "LOGOUT":
      return "Đăng xuất hệ thống";
    case "CREATE":
      return `Tạo mới ${entityName}`;
    case "DELETE":
      return `Xóa ${entityName}`;
    case "UPDATE":
      if (!changedFields || changedFields.length === 0) {
        return `Cập nhật ${entityName} (không có thay đổi)`;
      }
      // Tạo mô tả chi tiết cho từng field thay đổi
      const changes = changedFields.map((field) => {
        const oldVal = oldValues?.[field];
        const newVal = newValues?.[field];
        // Format giá trị cho dễ đọc
        const formatVal = (val) => {
          if (val === null || val === undefined) return "trống";
          if (typeof val === "object") return JSON.stringify(val);
          return String(val);
        };
        return `${field}: "${formatVal(oldVal)}" → "${formatVal(newVal)}"`;
      });
      return `Cập nhật ${entityName}: ${changes.join(", ")}`;
    case "VIEW":
      return `Xem ${entityName}`;
    case "EXPORT":
      return `Xuất dữ liệu ${entityName}`;
    default:
      return `Thao tác trên ${entityName}`;
  }
};

/**
 * Ghi log hoạt động
 * @param {Object} options
 * @param {Object} options.req - Express request object
 * @param {string} options.actionType - LOGIN, LOGOUT, CREATE, UPDATE, DELETE, VIEW, EXPORT
 * @param {string} options.entityTable - Tên bảng (products, orders, users...)
 * @param {number} options.entityId - ID của record
 * @param {Object} options.oldData - Dữ liệu cũ (cho UPDATE, DELETE)
 * @param {Object} options.newData - Dữ liệu mới (cho CREATE, UPDATE)
 * @param {string} options.description - Mô tả tùy chỉnh (optional)
 * @param {Object} options.metadata - Dữ liệu bổ sung (optional)
 * @param {number} options.userId - Override user ID (optional, dùng cho LOGIN)
 */
const logActivity = async (options) => {
  try {
    const {
      req,
      actionType,
      entityTable = null,
      entityId = null,
      oldData = null,
      newData = null,
      description = null,
      metadata = null,
      userId = null,
    } = options;

    // Lấy user từ session hoặc request
    const user = req?.user || req?.session?.user;
    const logUserId = userId || user?.id || null;

    // So sánh dữ liệu nếu là UPDATE
    let changedFields = null;
    let oldValues = oldData;
    let newValues = newData;

    if (actionType === "UPDATE" && oldData && newData) {
      const diff = compareValues(oldData, newData);
      changedFields = diff.changedFields;
      oldValues = diff.oldValues;
      newValues = diff.newValues;

      // Không log nếu không có thay đổi thực sự
      if (changedFields.length === 0) {
        console.log("[AuditLog] Skipped - no actual changes detected");
        return null;
      }
    }

    // Tạo mô tả nếu không được cung cấp
    const finalDescription =
      description ||
      generateDescription(
        actionType,
        entityTable,
        changedFields,
        oldValues,
        newValues
      );

    // Tạo log entry
    console.log("[AuditLog Debug] oldValues:", oldValues);
    console.log("[AuditLog Debug] newValues:", newValues);
    console.log("[AuditLog Debug] changedFields:", changedFields);

    const logEntry = await AuditLog.create({
      userId: logUserId,
      actionType,
      entityTable,
      entityId,
      oldValues: oldValues || null,
      newValues: newValues || null,
      changedFields: changedFields || null,
      ipAddress: req ? getClientIp(req) : null,
      userAgent: req ? getUserAgent(req) : null,
      requestMethod: req?.method || null,
      requestUrl: req?.originalUrl || null,
      description: finalDescription,
      metadata: metadata || null,
    });

    console.log(
      `[AuditLog] ${actionType} on ${
        entityTable || "system"
      } by user ${logUserId}`
    );
    return logEntry;
  } catch (error) {
    // Không throw error để không ảnh hưởng luồng chính
    console.error("[AuditLog Error]", error.message);
    return null;
  }
};

/**
 * Shorthand functions cho các action phổ biến
 */
const logLogin = (req, userId) =>
  logActivity({
    req,
    actionType: "LOGIN",
    userId,
    description: "Đăng nhập hệ thống thành công",
  });

const logLogout = (req) =>
  logActivity({
    req,
    actionType: "LOGOUT",
    description: "Đăng xuất hệ thống",
  });

const logCreate = (
  req,
  entityTable,
  entityId,
  newData,
  customDescription = null
) =>
  logActivity({
    req,
    actionType: "CREATE",
    entityTable,
    entityId,
    newData,
    description: customDescription,
  });

const logUpdate = (
  req,
  entityTable,
  entityId,
  oldData,
  newData,
  customDescription = null
) =>
  logActivity({
    req,
    actionType: "UPDATE",
    entityTable,
    entityId,
    oldData,
    newData,
    description: customDescription,
  });

const logDelete = (
  req,
  entityTable,
  entityId,
  oldData,
  customDescription = null
) =>
  logActivity({
    req,
    actionType: "DELETE",
    entityTable,
    entityId,
    oldData,
    description: customDescription,
  });

export {
  logActivity,
  logLogin,
  logLogout,
  logCreate,
  logUpdate,
  logDelete,
  compareValues,
  getClientIp,
  getUserAgent,
};
