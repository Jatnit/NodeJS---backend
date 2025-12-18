# 🛍️ MODA CLOTHING (Moda Studio)

> **Phiên bản:** 1.0.0  
> **Tác giả:** Jatnit  
> **Lĩnh vực:** Thương mại điện tử (E-Commerce) - Thời trang

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/Node.js-v18%2B-green)
![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-blue)

---

## 📖 Giới thiệu (Overview)

**Moda Clothing** là một nền tảng thương mại điện tử chuyên kinh doanh quần áo thời trang. Dự án được xây dựng theo kiến trúc **MVC (Model - View - Controller)** với mô hình **Fullstack Monolithic**, đảm bảo tính đồng bộ và dễ dàng quản lý.

### ✨ Tính năng nổi bật

**🛒 Khách hàng:**

- Xem danh sách sản phẩm với bộ lọc và tìm kiếm
- Xem chi tiết sản phẩm với ma trận tồn kho (màu sắc × size)
- Thêm sản phẩm vào giỏ hàng
- Đặt hàng với nhiều phương thức thanh toán (COD, Banking, VNPay)
- Quản lý địa chỉ giao hàng
- Theo dõi trạng thái đơn hàng
- Viết đánh giá sản phẩm
- Danh sách yêu thích (Wishlist)

**👨‍💼 Quản trị viên:**

- Dashboard thống kê doanh thu, đơn hàng theo thời gian thực
- Quản lý sản phẩm với biến thể (SKU, màu sắc, size)
- Quản lý danh mục sản phẩm (hỗ trợ danh mục cha - con)
- Quản lý đơn hàng với cập nhật trạng thái
- Quản lý kho hàng và tồn kho
- Quản lý người dùng và phân quyền
- Hệ thống Audit Logs theo dõi mọi thao tác
- Thông báo đơn hàng mới real-time (polling 3 giây)

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

### ⚙️ Backend

| Công nghệ      | Phiên bản            | Mô tả              |
| :------------- | :------------------- | :----------------- |
| **Node.js**    | v18+                 | Runtime JavaScript |
| **Express.js** | 5.1.0                | Web Framework      |
| **MySQL**      | 8.0+ / MariaDB 10.4+ | Database           |
| **Sequelize**  | 6.37.7               | ORM                |
| **Babel**      | 7.28.x               | ES6+ Transpiler    |
| **Nodemon**    | 3.1.10               | Hot Reload         |

### 🎨 Frontend

| Công nghệ      | Phiên bản | Mô tả                 |
| :------------- | :-------- | :-------------------- |
| **EJS**        | 3.1.10    | Template Engine (SSR) |
| **Bootstrap**  | 5.3.3     | CSS Framework         |
| **React**      | 18        | UI Components (Admin) |
| **Recharts**   | 3.5.0     | Charts & Graphs       |
| **JavaScript** | ES6+      | Client Scripts        |

### 🔐 Bảo mật & Xác thực

| Công nghệ           | Mô tả                         |
| :------------------ | :---------------------------- |
| **JWT**             | JSON Web Token Authentication |
| **express-session** | Session Management            |
| **bcryptjs**        | Password Hashing              |

### ☁️ Lưu trữ & Media

| Công nghệ      | Mô tả                  |
| :------------- | :--------------------- |
| **Multer**     | File Upload Middleware |
| **Cloudinary** | Cloud Image Storage    |

---

## 📂 Cấu trúc dự án (Project Structure)

```bash
Moda-Clothing/
├── 📄 database_schema.sql    # Schema + Sample Data
├── 📄 package.json           # Dependencies
├── 📄 nodemon.json           # Nodemon config
├── 📄 .babelrc               # Babel config
├── 📄 env                    # Environment variables template
│
└── src/
    ├── � server.js          # Entry Point
    │
    ├── �📁 configs/           # Cấu hình (Database, ViewEngine)
    │   ├── connectDB.js
    │   └── viewEngine.js
    │
    ├── 📁 controllers/       # Xử lý logic nghiệp vụ
    │   ├── admin/            # 6 controllers
    │   │   ├── categoryController.js
    │   │   ├── productController.js
    │   │   ├── orderController.js
    │   │   ├── inventoryController.js
    │   │   ├── dashboardController.js
    │   │   └── auditLogController.js
    │   ├── api/
    │   │   └── productController.js
    │   └── client/
    │       └── homeController.js
    │
    ├── 📁 middleware/        # Middleware
    │   ├── authMiddleware.js # JWT + Session Auth
    │   └── upload.js         # Multer config
    │
    ├── 📁 models/            # Sequelize Models (17 models)
    │   ├── User.js
    │   ├── Role.js
    │   ├── Product.js
    │   ├── ProductSKU.js
    │   ├── ProductGallery.js
    │   ├── ProductColorImage.js
    │   ├── Category.js
    │   ├── ProductCategory.js
    │   ├── Attribute.js
    │   ├── AttributeValue.js
    │   ├── Order.js
    │   ├── OrderDetail.js
    │   ├── UserAddress.js
    │   ├── Review.js
    │   ├── ReviewImage.js
    │   ├── AuditLog.js
    │   └── index.js          # Relations setup
    │
    ├── 📁 routes/
    │   ├── web.js            # Web routes (EJS pages)
    │   └── api.js            # RESTful API routes
    │
    ├── 📁 service/           # Business Logic Layer
    │   ├── userService.js
    │   ├── adminService.js
    │   ├── orderService.js
    │   ├── cloudinaryService.js
    │   └── auditLogger.js
    │
    ├── 📁 views/             # EJS Templates
    │   ├── client/           # 10 client pages
    │   ├── admin/            # 7 admin pages
    │   ├── partials/         # Header, Footer, Sidebar
    │   └── errors/           # Error pages
    │
    └── 📁 public/            # Static files
        ├── css/
        │   └── main.css
        └── js/
            ├── client/
            └── admin/        # React Components (JSX)
                ├── Dashboard.jsx
                ├── Sidebar.jsx
                ├── Orders.jsx
                ├── Inventory.jsx
                ├── AuditLogs.jsx
                ├── StockMatrix.jsx
                └── order-notification.js
```

---

## 🗄️ Database Schema

### Danh sách Tables (17 bảng)

| #   | Table                | Mô tả                                              |
| --- | -------------------- | -------------------------------------------------- |
| 1   | `Users`              | Thông tin người dùng                               |
| 2   | `Roles`              | Phân quyền (Super Admin, Admin, Manager, Customer) |
| 3   | `UserAddresses`      | Địa chỉ giao hàng                                  |
| 4   | `Products`           | Thông tin sản phẩm                                 |
| 5   | `ProductSKUs`        | Biến thể sản phẩm (màu + size)                     |
| 6   | `ProductGalleries`   | Gallery hình ảnh sản phẩm                          |
| 7   | `ProductColorImages` | Hình ảnh theo màu sắc                              |
| 8   | `Categories`         | Danh mục sản phẩm (hỗ trợ nested)                  |
| 9   | `ProductCategories`  | Quan hệ N-N Product ↔ Category                     |
| 10  | `Attributes`         | Thuộc tính (Màu sắc, Size)                         |
| 11  | `AttributeValues`    | Giá trị thuộc tính                                 |
| 12  | `Orders`             | Đơn hàng                                           |
| 13  | `OrderDetails`       | Chi tiết đơn hàng                                  |
| 14  | `Reviews`            | Đánh giá sản phẩm                                  |
| 15  | `ReviewImages`       | Hình ảnh đánh giá                                  |
| 16  | `AuditLogs`          | Nhật ký hệ thống                                   |
| 17  | `Cart`               | Giỏ hàng                                           |
| 18  | `Wishlist`           | Danh sách yêu thích                                |

### Entity Relationship Diagram (Tóm tắt)

```
Users ──┬── UserAddresses
        ├── Orders ── OrderDetails ── ProductSKUs
        ├── Reviews ── ReviewImages
        ├── Cart ── ProductSKUs
        └── Wishlist ── Products

Products ──┬── ProductSKUs
           ├── ProductGalleries
           ├── ProductColorImages
           └── ProductCategories ── Categories (nested)

Attributes ── AttributeValues ── ProductSKUs
```

---

## � Hướng dẫn cài đặt (Installation)

### Yêu cầu hệ thống

- **Node.js** v18.0.0 trở lên
- **MySQL** 8.0+ hoặc **MariaDB** 10.4+
- **npm** hoặc **yarn**
- **Git**

### Bước 1: Clone Repository

```bash
git clone https://github.com/Jatnit/Moda-Clothing.git
cd Moda-Clothing
```

### Bước 2: Cài đặt Dependencies

```bash
npm install
```

### Bước 3: Tạo Database

**Cách 1: Sử dụng phpMyAdmin**

1. Mở phpMyAdmin (http://localhost/phpmyadmin)
2. Tạo database mới tên `jwt` với charset `utf8mb4_unicode_ci`
3. Import file `database_schema.sql`

**Cách 2: Sử dụng MySQL CLI**

```bash
# Đăng nhập MySQL
mysql -u root -p

# Tạo database
CREATE DATABASE jwt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Thoát MySQL
exit

# Import schema và data
mysql -u root -p jwt < database_schema.sql
```

**Cách 3: Sử dụng MySQL Workbench**

1. Mở MySQL Workbench
2. Kết nối đến MySQL Server
3. Chọn **File > Open SQL Script** → Chọn `database_schema.sql`
4. Thực thi script (⚡ hoặc Ctrl+Shift+Enter)

### Bước 4: Cấu hình Environment

```bash
# Copy file env mẫu
cp env .env
```

Chỉnh sửa file `.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=jwt
DB_PORT=3306

# Server Configuration
PORT=8000

# Cloudinary (Optional - for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Attribute IDs
COLOR_ATTRIBUTE_ID=1
SIZE_ATTRIBUTE_ID=2
```

### Bước 5: Khởi chạy Server

```bash
# Development mode (với hot reload)
npm start

# Hoặc
npm run start
```

### Bước 6: Truy cập ứng dụng

| URL                                   | Mô tả              |
| ------------------------------------- | ------------------ |
| http://localhost:8000                 | Trang chủ          |
| http://localhost:8000/signin          | Đăng nhập          |
| http://localhost:8000/signup          | Đăng ký            |
| http://localhost:8000/products        | Danh sách sản phẩm |
| http://localhost:8000/admin/dashboard | Admin Dashboard    |

---

## 👤 Tài khoản Demo

| Role            | Email          | Password |
| --------------- | -------------- | -------- |
| **Super Admin** | admin@moda.com | 123456   |
| **Customer**    | user@moda.com  | 123456   |

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint  | Mô tả     |
| ------ | --------- | --------- |
| POST   | `/signin` | Đăng nhập |
| POST   | `/signup` | Đăng ký   |
| POST   | `/logout` | Đăng xuất |

### Products

| Method | Endpoint                         | Mô tả              |
| ------ | -------------------------------- | ------------------ |
| GET    | `/api/products`                  | Danh sách sản phẩm |
| GET    | `/api/products/:id`              | Chi tiết sản phẩm  |
| GET    | `/api/products/:id/stock-matrix` | Ma trận tồn kho    |
| PUT    | `/api/products/:id/stock-matrix` | Cập nhật tồn kho   |

### Orders

| Method | Endpoint                 | Mô tả                      |
| ------ | ------------------------ | -------------------------- |
| POST   | `/api/orders`            | Tạo đơn hàng               |
| GET    | `/api/orders`            | Danh sách đơn hàng (Admin) |
| GET    | `/api/orders/recent`     | Đơn hàng gần đây           |
| GET    | `/api/orders/:id`        | Chi tiết đơn hàng          |
| PUT    | `/api/orders/:id/status` | Cập nhật trạng thái        |

### Dashboard

| Method | Endpoint                 | Mô tả              |
| ------ | ------------------------ | ------------------ |
| GET    | `/api/dashboard/summary` | Thống kê tổng quan |

### Audit Logs (Super Admin)

| Method | Endpoint                | Mô tả          |
| ------ | ----------------------- | -------------- |
| GET    | `/api/audit-logs`       | Danh sách logs |
| GET    | `/api/audit-logs/stats` | Thống kê logs  |
| GET    | `/api/audit-logs/:id`   | Chi tiết log   |

---

## 🔒 Phân quyền (Role-based Access Control)

| Role ID | Tên Role    | Quyền hạn                              |
| ------- | ----------- | -------------------------------------- |
| 0       | Super Admin | Toàn quyền + Audit Logs                |
| 1       | Admin       | Quản lý sản phẩm, đơn hàng, người dùng |
| 2       | Manager     | Quản lý đơn hàng, kho hàng             |
| 3       | Customer    | Mua hàng, xem đơn hàng cá nhân         |

---

## � Screenshots

### Trang chủ

- Hero section với animation
- Sản phẩm nổi bật
- Danh mục sản phẩm

### Admin Dashboard

- Thống kê doanh thu
- Biểu đồ 7 ngày
- Đơn hàng gần đây (auto-refresh 3s)
- Thông báo đơn hàng mới

### Quản lý sản phẩm

- CRUD sản phẩm
- Upload nhiều hình ảnh
- Ma trận tồn kho (màu × size)

---

## 🐛 Troubleshooting

### Lỗi kết nối Database

```
Error: Access denied for user 'root'@'localhost'
```

**Giải pháp:** Kiểm tra lại `DB_PASSWORD` trong file `.env`

### Lỗi Port đã được sử dụng

```
Error: listen EADDRINUSE :::8000
```

**Giải pháp:** Đổi PORT trong `.env` hoặc tắt process đang dùng port 8000

### Lỗi import database

```
ERROR 1049 (42000): Unknown database 'jwt'
```

**Giải pháp:** Tạo database `jwt` trước khi import:

```sql
CREATE DATABASE jwt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---


## 👨‍💻 Tác giả

**Jatnit**

- GitHub: [@Jatnit](https://github.com/Jatnit)

---

## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/)
- [Sequelize](https://sequelize.org/)
- [Bootstrap](https://getbootstrap.com/)
- [React](https://reactjs.org/)
- [Cloudinary](https://cloudinary.com/)

---

<p align="center">Made with ❤️ by Jatnit</p>
