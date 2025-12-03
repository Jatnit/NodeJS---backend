-- ========================================================
-- PHẦN 1: KHỞI TẠO DATABASE (LÀM SẠCH VÀ TẠO MỚI)
-- ========================================================

DROP DATABASE IF EXISTS jwt;
CREATE DATABASE jwt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE jwt;

-- Tắt kiểm tra khóa ngoại để nạp dữ liệu nhanh và tránh lỗi thứ tự
SET FOREIGN_KEY_CHECKS = 0;

-- ========================================================
-- PHẦN 2: TẠO CẤU TRÚC BẢNG (SCHEMA)
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

-- 5. Bảng Sản phẩm
CREATE TABLE Products (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Slug VARCHAR(255) UNIQUE,
    Description TEXT,
    BasePrice DECIMAL(18, 2) NOT NULL,
    ThumbnailUrl VARCHAR(255), -- Hình đại diện mặc định
    IsActive BOOLEAN DEFAULT TRUE,
    TotalSold INT DEFAULT 0,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bảng Liên kết Sản phẩm - Danh mục
CREATE TABLE ProductCategories (
    ProductId INT NOT NULL,
    CategoryId INT NOT NULL,
    PRIMARY KEY (ProductId, CategoryId),
    CONSTRAINT FK_PC_Product FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE,
    CONSTRAINT FK_PC_Category FOREIGN KEY (CategoryId) REFERENCES Categories(Id) ON DELETE CASCADE
);

-- 7. Bảng Bộ sưu tập ảnh Demo (3 hình/sp)
CREATE TABLE ProductGalleries (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    ProductId INT NOT NULL,
    ImageUrl VARCHAR(255) NOT NULL,
    DisplayOrder INT DEFAULT 0,
    CONSTRAINT FK_Gallery_Product FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE
);

-- 8. Bảng Thuộc tính
CREATE TABLE Attributes (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(50) NOT NULL
);

-- 9. Bảng Giá trị thuộc tính (Màu, Size)
CREATE TABLE AttributeValues (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    AttributeId INT NOT NULL,
    Value VARCHAR(50) NOT NULL,
    Code VARCHAR(50), -- Mã màu Hex
    CONSTRAINT FK_AttributeValues_Attributes FOREIGN KEY (AttributeId) REFERENCES Attributes(Id) ON DELETE CASCADE
);

-- 10. Bảng Hình ảnh theo Màu sắc
CREATE TABLE ProductColorImages (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    ProductId INT NOT NULL,
    ColorValueId INT NOT NULL,
    ImageUrl VARCHAR(255) NOT NULL,
    CONSTRAINT FK_PCI_Product FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE,
    CONSTRAINT FK_PCI_Color FOREIGN KEY (ColorValueId) REFERENCES AttributeValues(Id) ON DELETE CASCADE
);

-- 11. Bảng Biến thể Kho (SKU)
CREATE TABLE ProductSKUs (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    ProductId INT NOT NULL,
    SkuCode VARCHAR(50) UNIQUE,
    ColorValueId INT NOT NULL, 
    SizeValueId INT NOT NULL,
    Price DECIMAL(18, 2) NOT NULL,
    StockQuantity INT DEFAULT 0,
    CONSTRAINT FK_SKU_Product FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE,
    CONSTRAINT FK_SKU_Color FOREIGN KEY (ColorValueId) REFERENCES AttributeValues(Id) ON DELETE CASCADE,
    CONSTRAINT FK_SKU_Size FOREIGN KEY (SizeValueId) REFERENCES AttributeValues(Id) ON DELETE CASCADE
);

-- 12. Bảng Đơn hàng
CREATE TABLE Orders (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NULL,
    OrderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    TotalAmount DECIMAL(18, 2) NOT NULL,
    Status ENUM('Mới', 'Đang xử lý', 'Đang giao', 'Hoàn thành', 'Đã hủy') DEFAULT 'Mới',
    PaymentMethod ENUM('COD', 'Banking', 'VNPAY', 'MOMO') DEFAULT 'COD',
    IsPaid BOOLEAN DEFAULT FALSE,
    ShippingName VARCHAR(100),
    ShippingPhone VARCHAR(20),
    ShippingAddress TEXT,
    Note TEXT,
    CONSTRAINT FK_Orders_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE SET NULL
);

-- 13. Bảng Chi tiết đơn hàng
CREATE TABLE OrderDetails (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    OrderId INT NOT NULL,
    ProductSkuId INT NULL,
    ProductName VARCHAR(255),
    Color VARCHAR(50),
    Size VARCHAR(50),
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18, 2) NOT NULL,
    TotalPrice DECIMAL(18, 2) GENERATED ALWAYS AS (Quantity * UnitPrice) STORED,
    CONSTRAINT FK_OD_Order FOREIGN KEY (OrderId) REFERENCES Orders(Id) ON DELETE CASCADE,
    CONSTRAINT FK_OD_SKU FOREIGN KEY (ProductSkuId) REFERENCES ProductSKUs(Id) ON DELETE SET NULL
);

-- 14. Bảng Đánh giá
CREATE TABLE Reviews (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    ProductId INT NOT NULL,
    OrderId INT NOT NULL,
    Rating TINYINT CHECK (Rating BETWEEN 1 AND 5),
    Comment TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_Rev_User FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Rev_Prod FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Rev_Order FOREIGN KEY (OrderId) REFERENCES Orders(Id) ON DELETE CASCADE,
    UNIQUE KEY Unique_Review (UserId, OrderId, ProductId)
);

-- 15. Bảng Hình ảnh Review
CREATE TABLE ReviewImages (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    ReviewId INT NOT NULL,
    ImageUrl VARCHAR(255) NOT NULL,
    CONSTRAINT FK_RI_Review FOREIGN KEY (ReviewId) REFERENCES Reviews(Id) ON DELETE CASCADE
);

-- ========================================================
-- PHẦN 3: NẠP DỮ LIỆU MẪU (SEEDING DATA)
-- ========================================================

-- 1. Roles
INSERT INTO Roles (RoleName, Description) VALUES 
('Admin', 'Quản trị viên'), ('Manager', 'Quản lý kho'), ('Customer', 'Khách hàng');

-- 2. Users (Khôi phục các tài khoản cũ)
INSERT INTO Users (Id, Username, PasswordHash, Email, FullName, RoleId) VALUES 
(1, 'jatnit', '$2b$10$demo_hash', 'jatn.itt@gmail.com', 'Jatnit Admin', 1),
(2, 'phung', '$2b$10$demo_hash', 'phung@gmail.com', 'Kim Phụng', 3),
(3, 'tulam', '$2b$10$demo_hash', 'latu20030409@gmail.com', 'Tú Lâm', 3),
(4, 'admin_demo', '$2b$10$demo_hash', 'admin@demo.com', 'Admin Demo', 1),
(5, 'manager_kho', '$2b$10$demo_hash', 'kho@shop.com', 'Trưởng Kho', 2);

-- 3. Categories
INSERT INTO Categories (Id, Name, Slug) VALUES 
(1, 'Nam', 'nam'), (2, 'Nữ', 'nu'), 
(3, 'Áo Thun', 'ao-thun'), (4, 'Polo', 'ao-polo'), 
(5, 'Sơ Mi', 'so-mi'), (6, 'Áo Khoác', 'ao-khoac');

-- 4. Attributes & Values
INSERT INTO Attributes (Id, Name) VALUES (1, 'Màu sắc'), (2, 'Size');

-- Màu (5 màu - ID 1 đến 5)
INSERT INTO AttributeValues (Id, AttributeId, Value, Code) VALUES 
(1, 1, 'Trắng', '#FFFFFF'), (2, 1, 'Đen', '#000000'), 
(3, 1, 'Xanh Navy', '#000080'), (4, 1, 'Xám', '#808080'), (5, 1, 'Đỏ', '#FF0000');

-- Size (5 size - ID 6 đến 10)
INSERT INTO AttributeValues (Id, AttributeId, Value) VALUES 
(6, 2, 'S'), (7, 2, 'M'), (8, 2, 'L'), (9, 2, 'XL'), (10, 2, 'XXL');

-- 5. Products (30 Sản phẩm)
INSERT INTO Products (Id, Name, Slug, BasePrice, ThumbnailUrl, Description, TotalSold) VALUES
(1, 'Áo Thun Basic Cotton', 'at-basic', 150000, 'https://placehold.co/600x800?text=Basic+Tee', 'Vải cotton 100%', 120),
(2, 'Áo Thun Graphic In Hình', 'at-graphic', 180000, 'https://placehold.co/600x800?text=Graphic+Tee', 'Hình in sắc nét', 50),
(3, 'Áo Thun Oversize', 'at-oversize', 200000, 'https://placehold.co/600x800?text=Oversize', 'Form rộng', 80),
(4, 'Áo Thun Cổ Tim', 'at-vneck', 160000, 'https://placehold.co/600x800?text=V-Neck', 'Cổ tim body', 30),
(5, 'Áo Thun Dài Tay', 'at-long', 220000, 'https://placehold.co/600x800?text=Long+Sleeve', 'Giữ ấm tốt', 45),
(6, 'Áo Thun Raglan', 'at-raglan', 190000, 'https://placehold.co/600x800?text=Raglan', 'Tay phối màu', 60),
(7, 'Áo Thun Tanktop', 'at-tank', 120000, 'https://placehold.co/600x800?text=Tanktop', 'Thoáng mát', 90),
(8, 'Áo Thun Kẻ Sọc', 'at-stripe', 170000, 'https://placehold.co/600x800?text=Stripe', 'Kẻ ngang', 40),
(9, 'Áo Thun Có Túi', 'at-pocket', 160000, 'https://placehold.co/600x800?text=Pocket', 'Túi ngực', 25),
(10, 'Áo Thun Wash', 'at-wash', 250000, 'https://placehold.co/600x800?text=Washed', 'Màu bụi bặm', 15),
(11, 'Polo Pique Classic', 'pl-pique', 250000, 'https://placehold.co/600x800?text=Polo+Pique', 'Vải cá sấu', 200),
(12, 'Polo Bo Dệt', 'pl-knit', 280000, 'https://placehold.co/600x800?text=Polo+Knit', 'Bo cổ dệt', 110),
(13, 'Polo Thể Thao', 'pl-sport', 300000, 'https://placehold.co/600x800?text=Polo+Sport', 'Thoáng khí', 75),
(14, 'Polo Phối Viền', 'pl-border', 260000, 'https://placehold.co/600x800?text=Polo+Border', 'Viền tay', 90),
(15, 'Polo Khóa Kéo', 'pl-zip', 320000, 'https://placehold.co/600x800?text=Polo+Zip', 'Cổ zip', 40),
(16, 'Polo Dài Tay', 'pl-long', 350000, 'https://placehold.co/600x800?text=Polo+Long', 'Công sở', 30),
(17, 'Polo Họa Tiết', 'pl-pattern', 290000, 'https://placehold.co/600x800?text=Polo+Print', 'In toàn thân', 20),
(18, 'Polo Form Rộng', 'pl-loose', 270000, 'https://placehold.co/600x800?text=Polo+Loose', 'Trẻ trung', 55),
(19, 'Polo Cổ Tàu', 'pl-mandarin', 310000, 'https://placehold.co/600x800?text=Polo+Mandarin', 'Cổ trụ', 10),
(20, 'Polo Logo Thêu', 'pl-logo', 350000, 'https://placehold.co/600x800?text=Polo+Logo', 'Logo ngực', 150),
(21, 'Sơ Mi Oxford', 'sm-oxford', 350000, 'https://placehold.co/600x800?text=Oxford', 'Dày dặn', 60),
(22, 'Sơ Mi Bamboo', 'sm-bamboo', 400000, 'https://placehold.co/600x800?text=Bamboo', 'Vải tre', 80),
(23, 'Sơ Mi Flannel', 'sm-flannel', 320000, 'https://placehold.co/600x800?text=Flannel', 'Caro', 45),
(24, 'Sơ Mi Cổ Trụ', 'sm-grandad', 360000, 'https://placehold.co/600x800?text=Grandad', 'Hiện đại', 30),
(25, 'Sơ Mi Ngắn Tay', 'sm-short', 300000, 'https://placehold.co/600x800?text=Short+Shirt', 'Mùa hè', 70),
(26, 'Áo Khoác Gió', 'ak-wind', 450000, 'https://placehold.co/600x800?text=Windbreaker', 'Chống nước', 90),
(27, 'Áo Khoác Jeans', 'ak-jean', 550000, 'https://placehold.co/600x800?text=Denim', 'Bụi bặm', 40),
(28, 'Áo Khoác Bomber', 'ak-bomber', 500000, 'https://placehold.co/600x800?text=Bomber', 'Cá tính', 65),
(29, 'Hoodie Nỉ', 'ak-hoodie', 380000, 'https://placehold.co/600x800?text=Hoodie', 'Ấm áp', 120),
(30, 'Blazer Casual', 'ak-blazer', 750000, 'https://placehold.co/600x800?text=Blazer', 'Lịch lãm', 25);

-- 6. ProductCategories (Gán danh mục)
INSERT INTO ProductCategories (ProductId, CategoryId) SELECT Id, 1 FROM Products; -- Tất cả là Nam
INSERT INTO ProductCategories (ProductId, CategoryId) SELECT Id, 3 FROM Products WHERE Id <= 10;
INSERT INTO ProductCategories (ProductId, CategoryId) SELECT Id, 4 FROM Products WHERE Id BETWEEN 11 AND 20;
INSERT INTO ProductCategories (ProductId, CategoryId) SELECT Id, 5 FROM Products WHERE Id BETWEEN 21 AND 25;
INSERT INTO ProductCategories (ProductId, CategoryId) SELECT Id, 6 FROM Products WHERE Id BETWEEN 26 AND 30;

-- 7. ProductGalleries (Tự động tạo 3 hình demo/sp)
INSERT INTO ProductGalleries (ProductId, ImageUrl, DisplayOrder)
SELECT Id, CONCAT('https://placehold.co/600x800/ccc/000?text=View1-', Slug), 1 FROM Products;
INSERT INTO ProductGalleries (ProductId, ImageUrl, DisplayOrder)
SELECT Id, CONCAT('https://placehold.co/600x800/ccc/000?text=View2-', Slug), 2 FROM Products;
INSERT INTO ProductGalleries (ProductId, ImageUrl, DisplayOrder)
SELECT Id, CONCAT('https://placehold.co/600x800/ccc/000?text=View3-', Slug), 3 FROM Products;

-- 8. ProductColorImages (Tự động tạo hình theo màu cho 30 sp)
INSERT INTO ProductColorImages (ProductId, ColorValueId, ImageUrl)
SELECT p.Id, c.Id, CONCAT('https://placehold.co/600x800/eee/333?text=', p.Slug, '-', c.Value)
FROM Products p
CROSS JOIN (SELECT Id, Value FROM AttributeValues WHERE AttributeId = 1) c;

-- 9. ProductSKUs (Tự động sinh 750 SKU)
-- FIX LỖI 1062: Dùng SP{Id}-{Màu}-{Size} để đảm bảo duy nhất tuyệt đối
INSERT INTO ProductSKUs (ProductId, SkuCode, ColorValueId, SizeValueId, Price, StockQuantity)
SELECT 
    p.Id, 
    CONCAT('SP', p.Id, '-', c.Id, '-', s.Id), 
    c.Id, 
    s.Id, 
    p.BasePrice + ((s.Id - 6) * 10000), -- Size lớn đắt hơn
    FLOOR(10 + RAND() * 90) -- Tồn kho 10-100
FROM Products p
CROSS JOIN (SELECT Id FROM AttributeValues WHERE AttributeId = 1) c
CROSS JOIN (SELECT Id FROM AttributeValues WHERE AttributeId = 2) s;

-- 10. Orders (10 Đơn hàng mẫu)
INSERT INTO Orders (Id, UserId, TotalAmount, Status, PaymentMethod, IsPaid, ShippingName, ShippingPhone) VALUES
(1, 2, 450000, 'Hoàn thành', 'Banking', 1, 'Kim Phụng', '0909123456'),
(2, 3, 300000, 'Đang xử lý', 'COD', 0, 'Tú Lâm', '0988777666'),
(3, 2, 150000, 'Mới', 'COD', 0, 'Kim Phụng', '0909123456'),
(4, 3, 1000000, 'Đã hủy', 'Banking', 0, 'Tú Lâm', '0988777666'),
(5, 2, 500000, 'Đang giao', 'VNPAY', 1, 'Kim Phụng', '0909123456'),
(6, 1, 250000, 'Hoàn thành', 'COD', 1, 'Jatnit Admin', '0123456789'),
(7, NULL, 180000, 'Mới', 'COD', 0, 'Khách Vãng Lai', '0999888777'),
(8, 2, 600000, 'Đang xử lý', 'MOMO', 1, 'Kim Phụng', '0909123456'),
(9, 3, 1200000, 'Hoàn thành', 'Banking', 1, 'Tú Lâm', '0988777666'),
(10, 2, 150000, 'Đã hủy', 'COD', 0, 'Kim Phụng', '0909123456');

-- 11. OrderDetails (Chi tiết đơn hàng)
-- Lưu ý: SkuCode theo format mới SP{ProdId}-{ColorId}-{SizeId}
-- Color ID: 1-5, Size ID: 6-10. 
-- Ví dụ: Product 1, Color 1, Size 6 -> SKU ID sẽ là dòng đầu tiên
-- Để đơn giản, chọn ngẫu nhiên ProductSkuId hợp lệ (1-750)
INSERT INTO OrderDetails (OrderId, ProductSkuId, ProductName, Color, Size, Quantity, UnitPrice) VALUES
(1, 10, 'Áo Thun Basic', 'Trắng', 'XL', 3, 150000),
(2, 55, 'Áo Thun Oversize', 'Đen', 'L', 1, 300000),
(3, 100, 'Áo Thun Cổ Tim', 'Xám', 'S', 1, 150000),
(4, 300, 'Polo Pique', 'Xanh Navy', 'XL', 2, 250000),
(5, 450, 'Sơ Mi Oxford', 'Trắng', 'M', 1, 350000),
(6, 650, 'Áo Khoác Gió', 'Đen', 'L', 1, 250000),
(7, 45, 'Áo Thun Graphic', 'Trắng', 'XXL', 1, 180000),
(8, 700, 'Áo Khoác Jeans', 'Xanh', 'M', 1, 600000),
(9, 350, 'Polo Zip', 'Đen', 'L', 4, 300000),
(10, 5, 'Áo Thun Basic', 'Trắng', 'S', 1, 150000);

-- 12. Reviews
INSERT INTO Reviews (UserId, ProductId, OrderId, Rating, Comment) VALUES
(2, 1, 1, 5, 'Áo đẹp, vải mát'),
(1, 26, 6, 4, 'Áo khoác ổn, hơi mỏng'),
(3, 15, 9, 5, 'Mua tặng chồng rất ưng');

-- Bật lại kiểm tra khóa ngoại
SET FOREIGN_KEY_CHECKS = 1;