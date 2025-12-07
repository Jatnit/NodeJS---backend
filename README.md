# 🛍️ MODA CLOTHING (Moda Studio)

> **Phiên bản:** 1.0.0  
> **Tác giả:** Jatnit  
> **Lĩnh vực:** Thương mại điện tử (E-Commerce) - Thời trang

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/Node.js-v18%2B-green)

## 📖 Giới thiệu (Overview)

**Moda Clothing** là một nền tảng thương mại điện tử chuyên kinh doanh quần áo thời trang. Dự án được xây dựng theo kiến trúc **MVC (Model - View - Controller)** với mô hình **Fullstack Monolithic**, đảm bảo tính đồng bộ và dễ dàng quản lý. Hệ thống cung cấp đầy đủ các tính năng cho khách hàng mua sắm và trang quản trị mạnh mẽ cho Admin/Manager.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

### ⚙️ Backend
| Công nghệ | Chi tiết |
| :--- | :--- |
| **Runtime** | Node.js |
| **Framework** | Express.js v5.1.0 |
| **Database** | MySQL (Driver: mysql2) |
| **ORM** | Sequelize v6.37.7 |
| **Transpiler** | Babel (ES6 Modules) |

### 🎨 Frontend
| Công nghệ | Chi tiết |
| :--- | :--- |
| **Template Engine** | EJS (Server-side Rendering) |
| **Styling** | Vanilla CSS, Ant Design Icons, Lucide React |
| **Charts** | Recharts v3.5.0 (Dashboard) |
| **Client Script** | JavaScript (ES6+) |

### 🔐 Bảo mật & Xác thực
* **Authentication:** JWT (JsonWebToken) v9.0.2
* **Session:** express-session
* **Password Hashing:** bcryptjs v3.0.2

### ☁️ Lưu trữ & Media
* **Upload:** Multer v1.4.5
* **Cloud Storage:** Cloudinary v2.8.0 (Lưu trữ ảnh sản phẩm)

---

## 📂 Cấu trúc dự án (Project Structure)

Dự án tuân theo mô hình MVC tiêu chuẩn:

```bash
src/
├── 📁 configs/       # Cấu hình Database, View Engine, Environment
├── 📁 controller/    # Xử lý logic nghiệp vụ (8 controllers)
├── 📁 middleware/    # Middleware xác thực, upload, logging
├── 📁 models/        # Định nghĩa Schema Database (Sequelize - 17 models)
├── 📁 routes/        # Định tuyến (Web & API routes)
├── 📁 service/       # Business Logic Layer
├── 📁 views/         # Giao diện người dùng (EJS Templates)
├── 📁 public/        # Static files (CSS, JS, Images)
└── 📄 server.js      # Entry point - Khởi động Server
