-- ========================================================
-- AUDIT LOGS TABLE - Hệ thống theo dõi hoạt động
-- ========================================================

-- Thêm bảng AuditLogs vào database hiện có
-- Chạy script này để thêm bảng audit_logs vào database jwt

USE jwt;

CREATE TABLE IF NOT EXISTS AuditLogs (
    Id INT AUTO_INCREMENT PRIMARY KEY,

-- Thông tin người thực hiện
UserId INT NULL,

-- Loại hành động
ActionType ENUM(
    'LOGIN',
    'LOGOUT',
    'CREATE',
    'UPDATE',
    'DELETE',
    'VIEW',
    'EXPORT'
) NOT NULL,

-- Thực thể bị ảnh hưởng
EntityTable VARCHAR(100) NULL COMMENT 'Tên bảng bị ảnh hưởng (products, orders, users...)',
EntityId INT NULL COMMENT 'ID của record bị ảnh hưởng',

-- Dữ liệu thay đổi
OldValues JSON NULL COMMENT 'Dữ liệu TRƯỚC khi thay đổi (null cho CREATE)',
NewValues JSON NULL COMMENT 'Dữ liệu SAU khi thay đổi (null cho DELETE)',
ChangedFields JSON NULL COMMENT 'Danh sách các trường đã thay đổi',

-- Thông tin request
IpAddress VARCHAR(45) NULL COMMENT 'IPv4 hoặc IPv6',
UserAgent TEXT NULL COMMENT 'Browser/Device info',
RequestMethod VARCHAR(10) NULL COMMENT 'GET, POST, PUT, DELETE...',
RequestUrl TEXT NULL COMMENT 'URL được gọi',

-- Mô tả và metadata
Description TEXT NULL COMMENT 'Mô tả chi tiết hành động',
Metadata JSON NULL COMMENT 'Dữ liệu bổ sung tùy ngữ cảnh',

-- Timestamp
CreatedAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Chính xác đến millisecond',

-- Foreign key (cho phép null nếu user bị xóa)
CONSTRAINT FK_AuditLogs_Users FOREIGN KEY (UserId) REFERENCES Users (Id) ON DELETE SET NULL,

-- Indexes để tối ưu query
INDEX idx_audit_user (UserId),
    INDEX idx_audit_action (ActionType),
    INDEX idx_audit_entity (EntityTable, EntityId),
    INDEX idx_audit_created (CreatedAt DESC),
    INDEX idx_audit_composite (UserId, ActionType, CreatedAt DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm role Super Admin nếu chưa có
INSERT IGNORE INTO
    Roles (Id, RoleName, Description)
VALUES (
        0,
        'SuperAdmin',
        'Quản trị viên cấp cao nhất, xem được audit logs'
    );

-- Tạo user Super Admin mẫu (password: superadmin123)
-- Hash này nên được generate bằng bcrypt thực tế
INSERT IGNORE INTO
    Users (
        Id,
        Username,
        PasswordHash,
        Email,
        FullName,
        RoleId
    )
VALUES (
        100,
        'superadmin',
        '$2b$10$demo_hash_superadmin',
        'superadmin@moda.com',
        'Super Administrator',
        0
    );