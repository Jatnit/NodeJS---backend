-- ========================================================
-- PHẦN 1: KHỞI TẠO DATABASE 
-- ========================================================

CREATE DATABASE jwt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE jwt;

-- Tắt kiểm tra khóa ngoại để tạo bảng thuận tiện
SET FOREIGN_KEY_CHECKS = 0;

-- ========================================================
-- PHẦN 2: TẠO BẢNG (SCHEMA)
-- ========================================================

-- 1. Bảng Phân quyền
CREATE TABLE Roles (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL UNIQUE,
    Description VARCHAR(255)
);

-- 2. Bảng Người dùng
CREATE TABLE Users (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    FullName VARCHAR(100),
    PhoneNumber VARCHAR(20),
    AvatarUrl VARCHAR(255),
    RoleId INT NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) REFERENCES Roles(Id)
);

-- 3. Bảng Địa chỉ
CREATE TABLE UserAddresses (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    RecipientName VARCHAR(100),
    PhoneNumber VARCHAR(20),
    AddressLine VARCHAR(255),
    Ward VARCHAR(50),
    District VARCHAR(50),
    City VARCHAR(50),
    IsDefault BOOLEAN DEFAULT FALSE,
    CONSTRAINT FK_UserAddresses_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- 4. Bảng Danh mục
CREATE TABLE Categories (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Slug VARCHAR(100) UNIQUE,
    ParentId INT NULL,
    ImageUrl VARCHAR(255),
    CONSTRAINT FK_Categories_Parent FOREIGN KEY (ParentId) REFERENCES Categories(Id) ON DELETE SET NULL
);

-- 5. Bảng Sản phẩm (Đã xóa cột CategoryId để dùng bảng trung gian)
CREATE TABLE Products (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Slug VARCHAR(255) UNIQUE,
    Description TEXT,
    BasePrice DECIMAL(18, 2) NOT NULL,
    ThumbnailUrl VARCHAR(255),
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bảng Liên kết Sản phẩm - Danh mục (QUAN TRỌNG: Xử lý 1 SP thuộc nhiều DM)
CREATE TABLE ProductCategories (
    ProductId INT NOT NULL,
    CategoryId INT NOT NULL,
    PRIMARY KEY (ProductId, CategoryId),
    CONSTRAINT FK_PC_Product FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE,
    CONSTRAINT FK_PC_Category FOREIGN KEY (CategoryId) REFERENCES Categories(Id) ON DELETE CASCADE
);

-- 7. Bảng Thuộc tính
CREATE TABLE Attributes (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(50) NOT NULL
);

-- 8. Bảng Giá trị thuộc tính
CREATE TABLE AttributeValues (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    AttributeId INT NOT NULL,
    Value VARCHAR(50) NOT NULL,
    CONSTRAINT FK_AttributeValues_Attributes FOREIGN KEY (AttributeId) REFERENCES Attributes(Id) ON DELETE CASCADE
);

-- 9. Bảng Biến thể (ProductSKUs)
CREATE TABLE ProductSKUs (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    ProductId INT NOT NULL,
    SkuCode VARCHAR(50) UNIQUE,
    Price DECIMAL(18, 2) NOT NULL,
    StockQuantity INT DEFAULT 0,
    ImageUrl VARCHAR(255),
    CONSTRAINT FK_ProductSKUs_Products FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE
);

-- 10. Bảng Map SKU - Giá trị
CREATE TABLE SKU_AttributeValues (
    ProductSkuId INT NOT NULL,
    AttributeValueId INT NOT NULL,
    PRIMARY KEY (ProductSkuId, AttributeValueId),
    CONSTRAINT FK_SA_SKU FOREIGN KEY (ProductSkuId) REFERENCES ProductSKUs(Id) ON DELETE CASCADE,
    CONSTRAINT FK_SA_Value FOREIGN KEY (AttributeValueId) REFERENCES AttributeValues(Id) ON DELETE CASCADE
);

-- 11. Bảng Đơn hàng
CREATE TABLE Orders (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NULL,
    OrderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    TotalAmount DECIMAL(18, 2) NOT NULL,
    Status ENUM('Chờ xác nhận', 'Đang xử lý', 'Đang giao', 'Hoàn thành', 'Đã hủy') DEFAULT 'Chờ xác nhận',
    PaymentMethod ENUM('COD', 'Banking', 'VNPAY', 'MOMO') DEFAULT 'COD',
    IsPaid BOOLEAN DEFAULT FALSE,
    ShippingName VARCHAR(100),
    ShippingPhone VARCHAR(20),
    ShippingAddress TEXT,
    Note TEXT,
    CONSTRAINT FK_Orders_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE SET NULL
);

-- 12. Bảng Chi tiết đơn hàng
CREATE TABLE OrderDetails (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    OrderId INT NOT NULL,
    ProductSkuId INT NULL,
    ProductName VARCHAR(255),
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18, 2) NOT NULL,
    TotalPrice DECIMAL(18, 2) GENERATED ALWAYS AS (Quantity * UnitPrice) STORED,
    CONSTRAINT FK_OrderDetails_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id) ON DELETE CASCADE,
    CONSTRAINT FK_OrderDetails_SKU FOREIGN KEY (ProductSkuId) REFERENCES ProductSKUs(Id) ON DELETE SET NULL
);

-- 13. Bảng Đánh giá
CREATE TABLE Reviews (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    ProductId INT NOT NULL,
    Rating TINYINT CHECK (Rating BETWEEN 1 AND 5),
    Comment TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Reviews_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Reviews_Products FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE
);

-- ========================================================
-- PHẦN 3: NẠP DỮ LIỆU MẪU (SEEDING) THEO TIÊU CHÍ
-- ========================================================

-- 1. Roles & Users
INSERT INTO Roles (RoleName) VALUES ('Admin'), ('Customer');
INSERT INTO Users (Username, PasswordHash, Email, RoleId, FullName) VALUES 
('jatnit', 'hash_pass_here', 'jatn.itt@gmail.com', 1, 'Jatnit Admin'),
('phung', 'hash_pass_here', 'phung@gmail.com', 2, 'Kim Phụng');

-- 2. Danh mục (Tạo nhiều danh mục để mix)
INSERT INTO Categories (Id, Name, Slug) VALUES
(1, 'Nam', 'nam'),
(2, 'Nữ', 'nu'),
(3, 'Áo Thun', 'ao-thun'), -- Danh mục chung
(4, 'Cotton', 'cotton'), -- Danh mục chất liệu
(5, 'Tay Ngắn', 'tay-ngan'),
(6, 'Tay Dài', 'tay-dai'),
(7, 'Basic', 'basic');

-- 3. Thuộc tính & Giá trị (ĐÚNG YÊU CẦU: 3 Màu, 5 Size)
INSERT INTO Attributes (Id, Name) VALUES (1, 'Màu sắc'), (2, 'Size');

INSERT INTO AttributeValues (Id, AttributeId, Value) VALUES
-- Màu (ID 1-3)
(1, 1, 'Trắng'), (2, 1, 'Đen'), (3, 1, 'Vàng'),
-- Size (ID 4-8)
(4, 2, 'XS'), (5, 2, 'S'), (6, 2, 'M'), (7, 2, 'L'), (8, 2, 'XL');

-- 4. Sản phẩm (Tạo 10 SP để đảm bảo mỗi danh mục > 5 SP khi mix)
INSERT INTO Products (Id, Name, Slug, BasePrice, ThumbnailUrl, Description) VALUES
(1, 'Áo Thun Basic 01', 'at-01', 150000, 'https://cl.com/p1.jpg', 'Áo thun cơ bản'),
(2, 'Áo Thun Basic 02', 'at-02', 150000, 'https://cl.com/p2.jpg', 'Áo thun cơ bản'),
(3, 'Áo Thun Basic 03', 'at-03', 150000, 'https://cl.com/p3.jpg', 'Áo thun cơ bản'),
(4, 'Áo Thun Basic 04', 'at-04', 150000, 'https://cl.com/p4.jpg', 'Áo thun cơ bản'),
(5, 'Áo Thun Basic 05', 'at-05', 150000, 'https://cl.com/p5.jpg', 'Áo thun cơ bản'),
(6, 'Áo Thun Basic 06', 'at-06', 150000, 'https://cl.com/p6.jpg', 'Áo thun cơ bản'),
(7, 'Áo Thun Polo 01', 'pl-01', 250000, 'https://cl.com/p7.jpg', 'Áo Polo'),
(8, 'Áo Thun Polo 02', 'pl-02', 250000, 'https://cl.com/p8.jpg', 'Áo Polo'),
(9, 'Áo Thun Dài Tay 01', 'dt-01', 200000, 'https://cl.com/p9.jpg', 'Áo dài tay'),
(10, 'Áo Thun Dài Tay 02', 'dt-02', 200000, 'https://cl.com/p10.jpg', 'Áo dài tay');

-- 5. Liên kết Sản phẩm - Danh mục (Đảm bảo danh mục 'Áo Thun' và 'Nam' có > 5 SP)
INSERT INTO ProductCategories (ProductId, CategoryId) VALUES
-- SP 1-6 thuộc Nam, Áo Thun, Cotton, Tay Ngắn, Basic
(1,1),(1,3),(1,4),(1,5),(1,7),
(2,1),(2,3),(2,4),(2,5),(2,7),
(3,1),(3,3),(3,4),(3,5),(3,7),
(4,1),(4,3),(4,4),(4,5),(4,7),
(5,1),(5,3),(5,4),(5,5),(5,7),
(6,1),(6,3),(6,4),(6,5),(6,7),
-- SP 7-8 thuộc Nam, Áo Thun, Cotton
(7,1),(7,3),(7,4),
(8,1),(8,3),(8,4),
-- SP 9-10 thuộc Nam, Áo Thun, Tay Dài
(9,1),(9,3),(9,6),
(10,1),(10,3),(10,6);

-- 6. Tự động sinh SKU (3 Màu x 5 Size = 15 Biến thể/SP)
-- Sử dụng thuật toán CROSS JOIN để nhân bản
INSERT INTO ProductSKUs (ProductId, SkuCode, Price, StockQuantity, ImageUrl)
SELECT 
    p.Id, 
    CONCAT(UPPER(p.Slug), '-', UPPER(c.Value), '-', s.Value), -- VD: AT-01-TRANG-XS
    p.BasePrice, 
    FLOOR(10 + (RAND() * 90)), -- Random tồn kho từ 10-100
    CONCAT('https://cl.com/img-', p.Slug, '-', c.Value, '.jpg')
FROM Products p
CROSS JOIN (SELECT Id, Value FROM AttributeValues WHERE AttributeId = 1) c -- 3 Màu
CROSS JOIN (SELECT Id, Value FROM AttributeValues WHERE AttributeId = 2) s -- 5 Size
ORDER BY p.Id, c.Id, s.Id;

-- 7. Map SKU vào Thuộc tính (Để lọc được Màu Trắng thì ra những SKU nào)
-- Map Màu
INSERT INTO SKU_AttributeValues (ProductSkuId, AttributeValueId)
SELECT s.Id, v.Id
FROM ProductSKUs s
JOIN AttributeValues v ON s.SkuCode LIKE CONCAT('%-', UPPER(v.Value), '-%')
WHERE v.AttributeId = 1;

-- Map Size
INSERT INTO SKU_AttributeValues (ProductSkuId, AttributeValueId)
SELECT s.Id, v.Id
FROM ProductSKUs s
JOIN AttributeValues v ON s.SkuCode LIKE CONCAT('%-', v.Value)
WHERE v.AttributeId = 2;


INSERT INTO Orders (Id, UserId, OrderDate, TotalAmount, Status, PaymentMethod, IsPaid, ShippingName, ShippingPhone, ShippingAddress, Note) VALUES
-- Đơn 1: Đã hoàn thành (Mua 2 món, đã thanh toán Banking) - Của Kim Phụng
(1, 2, DATE_SUB(NOW(), INTERVAL 10 DAY), 550000, 'Hoàn thành', 'Banking', 1, 'Kim Phụng', '0909123456', '123 Đường Lê Lợi, Q.1, TP.HCM', 'Giao giờ hành chính'),

-- Đơn 2: Đang xử lý (Mua 1 món, COD) - Của Kim Phụng
(2, 2, DATE_SUB(NOW(), INTERVAL 2 DAY), 150000, 'Đang xử lý', 'COD', 0, 'Kim Phụng', '0909123456', 'Văn phòng Bitexco, Q.1, TP.HCM', NULL),

-- Đơn 3: Đang giao hàng (Mua số lượng lớn, VNPAY) - Của Kim Phụng
(3, 2, DATE_SUB(NOW(), INTERVAL 1 DAY), 1250000, 'Đang giao', 'VNPAY', 1, 'Kim Phụng', '0909123456', '123 Đường Lê Lợi, Q.1, TP.HCM', 'Gọi trước khi giao'),

-- Đơn 4: Đã hủy (Khách đổi ý) - Của Kim Phụng
(4, 2, DATE_SUB(NOW(), INTERVAL 15 DAY), 300000, 'Đã hủy', 'COD', 0, 'Kim Phụng', '0909123456', '123 Đường Lê Lợi, Q.1, TP.HCM', 'Hủy do đặt nhầm size'),

-- Đơn 5: Chờ xác nhận (Admin test đặt hàng) - Của Jatnit
(5, 1, NOW(), 200000, 'Chờ xác nhận', 'COD', 0, 'Jatnit Admin', '0988888888', 'Kho hàng Quận 7', 'Test đơn hàng');

-- 2. Tạo dữ liệu bảng ORDER DETAILS
-- Lưu ý: Cột TotalPrice là cột tự động tính (Generated Column) nên không cần Insert
INSERT INTO OrderDetails (OrderId, ProductSkuId, ProductName, Quantity, UnitPrice) VALUES
-- Chi tiết Đơn 1 (Tổng 550k = 2 áo thun + 1 áo polo)
(1, 5, 'Áo Thun Basic 01 (Trắng - S)', 2, 150000),    -- SKU ID 5 thuộc Product 1
(1, 95, 'Áo Thun Polo 01 (Đen - M)', 1, 250000),     -- SKU ID 95 thuộc Product 7

-- Chi tiết Đơn 2 (Tổng 150k)
(2, 20, 'Áo Thun Basic 02 (Vàng - XS)', 1, 150000),  -- SKU ID 20 thuộc Product 2

-- Chi tiết Đơn 3 (Tổng 1tr250k = 5 áo Polo)
(3, 110, 'Áo Thun Polo 02 (Trắng - L)', 5, 250000),  -- SKU ID 110 thuộc Product 8

-- Chi tiết Đơn 4 (Đã hủy - Tổng 300k)
(4, 50, 'Áo Thun Basic 04 (Đen - XL)', 2, 150000),   -- SKU ID 50 thuộc Product 4

-- Chi tiết Đơn 5 (Test - Tổng 200k)
(5, 130, 'Áo Thun Dài Tay 01 (Trắng - M)', 1, 200000); -- SKU ID 130 thuộc Product 9

-- 3. Tạo dữ liệu ĐÁNH GIÁ (REVIEWS)
-- Chỉ đánh giá cho các đơn hàng đã "Hoàn thành" (Đơn số 1)
INSERT INTO Reviews (UserId, ProductId, Rating, Comment, CreatedAt) VALUES
(2, 1, 5, 'Áo thun vải rất mát, thấm hút mồ hôi tốt. Sẽ ủng hộ tiếp.', DATE_SUB(NOW(), INTERVAL 9 DAY)),
(2, 7, 4, 'Áo Polo form đẹp nhưng giao hàng hơi chậm một chút.', DATE_SUB(NOW(), INTERVAL 8 DAY));


SET FOREIGN_KEY_CHECKS = 1;