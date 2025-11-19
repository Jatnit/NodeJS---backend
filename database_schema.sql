CREATE DATABASE IF NOT EXISTS jwt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE jwt;



-- =============================================

-- PHẦN 1: QUẢN LÝ NGƯỜI DÙNG (AUTH & ROLES)

-- =============================================



-- Bảng Phân quyền (Role)

CREATE TABLE Roles (

    Id INT AUTO_INCREMENT PRIMARY KEY,

    RoleName VARCHAR(50) NOT NULL UNIQUE,

    Description VARCHAR(255)

);



-- Bảng Người dùng (Users)

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



-- Bảng Địa chỉ nhận hàng (UserAddresses)

CREATE TABLE UserAddresses (

    Id INT AUTO_INCREMENT PRIMARY KEY,

    UserId INT NOT NULL,

    RecipientName VARCHAR(100),

    PhoneNumber VARCHAR(20),

    AddressLine VARCHAR(255),

    Ward VARCHAR(50),

    District VARCHAR(50),

    City VARCHAR(50),

    IsDefault BOOLEAN DEFAULT FALSE, -- MySQL dùng BOOLEAN (TINYINT)

    

    CONSTRAINT FK_UserAddresses_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE

);



-- =============================================

-- PHẦN 2: QUẢN LÝ SẢN PHẨM (PRODUCT & VARIANTS)

-- =============================================



-- Bảng Danh mục (Categories)

CREATE TABLE Categories (

    Id INT AUTO_INCREMENT PRIMARY KEY,

    Name VARCHAR(100) NOT NULL,

    Slug VARCHAR(100) UNIQUE,

    ParentId INT NULL,

    ImageUrl VARCHAR(255),

    

    CONSTRAINT FK_Categories_Parent FOREIGN KEY (ParentId) REFERENCES Categories(Id) ON DELETE SET NULL

);



-- Bảng Sản phẩm chung (Products)

CREATE TABLE Products (

    Id INT AUTO_INCREMENT PRIMARY KEY,

    Name VARCHAR(255) NOT NULL,

    Slug VARCHAR(255) UNIQUE,

    Description TEXT, -- MySQL dùng TEXT thay cho VARCHAR(MAX)

    CategoryId INT,

    BasePrice DECIMAL(18, 2) NOT NULL,

    ThumbnailUrl VARCHAR(255),

    IsActive BOOLEAN DEFAULT TRUE,

    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    

    CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryId) REFERENCES Categories(Id) ON DELETE SET NULL

);



-- Bảng Thuộc tính (Attributes)

CREATE TABLE Attributes (

    Id INT AUTO_INCREMENT PRIMARY KEY,

    Name VARCHAR(50) NOT NULL

);



-- Bảng Giá trị thuộc tính (AttributeValues)

CREATE TABLE AttributeValues (

    Id INT AUTO_INCREMENT PRIMARY KEY,

    AttributeId INT NOT NULL,

    Value VARCHAR(50) NOT NULL,

    

    CONSTRAINT FK_AttributeValues_Attributes FOREIGN KEY (AttributeId) REFERENCES Attributes(Id) ON DELETE CASCADE

);



-- Bảng Biến thể sản phẩm (ProductSKUs)

CREATE TABLE ProductSKUs (

    Id INT AUTO_INCREMENT PRIMARY KEY,

    ProductId INT NOT NULL,

    SkuCode VARCHAR(50) UNIQUE,

    Price DECIMAL(18, 2) NOT NULL,

    StockQuantity INT DEFAULT 0,

    ImageUrl VARCHAR(255),

    

    CONSTRAINT FK_ProductSKUs_Products FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE

);



-- Bảng Liên kết Biến thể & Thuộc tính (SKU_AttributeValues)

CREATE TABLE SKU_AttributeValues (

    ProductSkuId INT NOT NULL,

    AttributeValueId INT NOT NULL,

    

    PRIMARY KEY (ProductSkuId, AttributeValueId),

    CONSTRAINT FK_SA_SKU FOREIGN KEY (ProductSkuId) REFERENCES ProductSKUs(Id) ON DELETE CASCADE,

    CONSTRAINT FK_SA_Value FOREIGN KEY (AttributeValueId) REFERENCES AttributeValues(Id) ON DELETE CASCADE

);



-- =============================================

-- PHẦN 3: ĐƠN HÀNG & THANH TOÁN (ORDER & CART)

-- =============================================



-- Bảng Đơn hàng (Orders)

CREATE TABLE Orders (

    Id INT AUTO_INCREMENT PRIMARY KEY,

    UserId INT NULL,

    OrderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    TotalAmount DECIMAL(18, 2) NOT NULL,

    

    -- MySQL dùng ENUM cho các trạng thái cố định

    Status ENUM('Chờ xác nhận', 'Đang xử lý', 'Đang giao', 'Hoàn thành', 'Đã hủy') DEFAULT 'Chờ xác nhận',

    PaymentMethod ENUM('COD', 'Banking', 'VNPAY', 'MOMO') DEFAULT 'COD',

    IsPaid BOOLEAN DEFAULT FALSE,

    

    ShippingName VARCHAR(100),

    ShippingPhone VARCHAR(20),

    ShippingAddress TEXT, -- MySQL dùng TEXT cho địa chỉ dài

    Note TEXT,

    

    CONSTRAINT FK_Orders_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE SET NULL

);



-- Bảng Chi tiết đơn hàng (OrderDetails)

CREATE TABLE OrderDetails (

    Id INT AUTO_INCREMENT PRIMARY KEY,

    OrderId INT NOT NULL,

    ProductSkuId INT NULL,

    ProductName VARCHAR(255),

    Quantity INT NOT NULL,

    UnitPrice DECIMAL(18, 2) NOT NULL,

    

    -- Cột tính toán tự động trong MySQL (Generated Column)

    TotalPrice DECIMAL(18, 2) GENERATED ALWAYS AS (Quantity * UnitPrice) STORED,

    

    CONSTRAINT FK_OrderDetails_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id) ON DELETE CASCADE,

    CONSTRAINT FK_OrderDetails_SKU FOREIGN KEY (ProductSkuId) REFERENCES ProductSKUs(Id) ON DELETE SET NULL

);



-- Bảng Đánh giá (Reviews)

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