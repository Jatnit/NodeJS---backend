-- Migration: Thêm Attribute cho Shoe Size và các Attribute Values
-- Chạy file này để thêm size giày (35-45) vào database

-- 1. Thêm Attribute mới cho Shoe Size (nếu chưa có)
INSERT INTO
    `Attributes` (`Id`, `Name`, `Slug`)
VALUES (3, 'Shoe Size', 'shoe-size')
ON DUPLICATE KEY UPDATE
    `Name` = 'Shoe Size';

-- 2. Thêm các giá trị size giày (35-45)
INSERT INTO
    `AttributeValues` (
        `AttributeId`,
        `Value`,
        `Code`
    )
VALUES (3, '35', NULL),
    (3, '36', NULL),
    (3, '37', NULL),
    (3, '38', NULL),
    (3, '39', NULL),
    (3, '40', NULL),
    (3, '41', NULL),
    (3, '42', NULL),
    (3, '43', NULL),
    (3, '44', NULL),
    (3, '45', NULL);

-- Kiểm tra kết quả
SELECT * FROM `Attributes`;

SELECT * FROM `AttributeValues` WHERE `AttributeId` = 3;