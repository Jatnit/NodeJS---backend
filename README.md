DỰ ÁN MODA CLOTHING
1. Thông tin chung
Mục	Thông tin
Tên dự án	Moda Clothing / Moda Studio
Lĩnh vực	Thương mại điện tử (E-Commerce) - Website bán quần áo thời trang
Tác giả	Jatnit
Phiên bản	1.0.0

2. Kiến trúc tổng thể
Dự án sử dụng kiến trúc MVC (Model - View - Controller) với mô hình Fullstack Monolithic:

📁 src/
├── 📁 configs/       → Cấu hình database, view engine
├── 📁 controller/    → Xử lý logic nghiệp vụ (8 controllers)
├── 📁 middleware/    → Xác thực, upload file
├── 📁 models/        → Định nghĩa ORM (17 models)
├── 📁 routes/        → Định tuyến web & API
├── 📁 service/       → Business logic, services
├── 📁 views/         → Giao diện EJS templates
├── 📁 public/        → CSS, JS client-side
└── 📄 server.js      → Entry point - Khởi động server

3. Công nghệ sử dụng
A. Backend
Công nghệ	Mô tả
Ngôn ngữ	JavaScript (ES6+)
Runtime	Node.js
Framework	Express.js v5.1.0 - Web framework
ORM	Sequelize v6.37.7 - Object-Relational Mapping
Database	MySQL (sử dụng mysql2 driver)
Babel	Transpiler cho ES6 modules (@babel/core, @babel/node)
B. Frontend
Công nghệ	Mô tả
Template Engine	EJS (Embedded JavaScript) - Server-side rendering
CSS	Vanilla CSS
JavaScript	Client-side JS (/public/js/)
Icons	Lucide React, Ant Design Icons
Charts	Recharts v3.5.0 (biểu đồ Dashboard)
C. Xác thực & Bảo mật
Công nghệ	Mô tả
JWT	jsonwebtoken v9.0.2 - Token-based authentication
Password Hashing	bcryptjs v3.0.2 - Mã hóa mật khẩu
Session Management	express-session
D. Upload & Media
Công nghệ	Mô tả
File Upload	Multer v1.4.5 - Xử lý upload file
Cloud Storage	Cloudinary v2.8.0 - Lưu trữ ảnh sản phẩm trên cloud
E. Công cụ phát triển
Công nghệ	Mô tả
Nodemon	Auto-restart server khi dev
dotenv	Quản lý biến môi trường
Axios	HTTP client cho API calls
date-fns	Xử lý thời gian

4. Cơ sở dữ liệu - Database Schema
Sử dụng MySQL với 15+ bảng chính, bao gồm:

Nhóm	Bảng
Người dùng	Users, 
Roles
, UserAddresses
Sản phẩm	Products, Categories, ProductCategories, ProductGalleries, ProductColorImages
Biến thể	Attributes, AttributeValues, ProductSKUs
Đơn hàng	Orders, OrderDetails
Đánh giá	Reviews, ReviewImages
Hệ thống	AuditLogs (nhật ký hoạt động)

5. Tính năng chính
Phía khách hàng (Customer):
✅ Đăng ký / Đăng nhập / Đăng xuất
✅ Xem danh sách sản phẩm với bộ lọc
✅ Xem chi tiết sản phẩm (màu sắc, size, giá)
✅ Thêm sản phẩm vào giỏ hàng
✅ Thanh toán đơn hàng (COD, Banking, VNPAY, MOMO)
✅ Xem lịch sử đơn hàng
✅ Quản lý thông tin cá nhân (Profile)
✅ Chế độ Dark/Light theme
Phía quản trị (Admin):
✅ Dashboard thống kê doanh thu, đơn hàng
✅ Quản lý danh mục sản phẩm (CRUD)
✅ Quản lý sản phẩm (CRUD với upload ảnh Cloudinary)
✅ Quản lý đơn hàng (cập nhật trạng thái)
✅ Quản lý tồn kho (Inventory)
✅ Quản lý người dùng (CRUD, phân quyền)
✅ Audit Logs - Nhật ký hoạt động hệ thống

6. API RESTful
Dự án cung cấp RESTful API tại endpoint /api:

Endpoint	Chức năng
GET /api/products	Lấy danh sách sản phẩm
GET /api/products/:id	Chi tiết sản phẩm
POST /api/orders	Đặt hàng
GET /api/orders	Danh sách đơn hàng (Admin)
PUT /api/orders/:id/status	Cập nhật trạng thái đơn
GET /api/dashboard/summary	Thống kê Dashboard
GET /api/inventory	Quản lý kho
GET /api/audit-logs	Nhật ký hệ thống

7. Phân quyền hệ thống
Role	RoleId	Quyền hạn
Admin	1	Toàn quyền quản trị
Manager	2	Quản lý kho, đơn hàng
Customer	3	Mua hàng, đánh giá

8. Tóm tắt kỹ thuật (Technical Stack Summary)
┌─────────────────────────────────────────────────────────┐
│                    MODA CLOTHING                        │
├──────────────────┬──────────────────────────────────────┤
│ Backend          │ Node.js + Express.js v5              │
│ Frontend         │ EJS Template Engine (SSR)            │
│ Database         │ MySQL + Sequelize ORM                │
│ Authentication   │ JWT + bcryptjs + express-session     │
│ File Storage     │ Cloudinary (Cloud) + Multer          │
│ Architecture     │ MVC Monolithic                       │
│ Language         │ JavaScript ES6+                      │
│ Build Tool       │ Babel                                │
└──────────────────┴──────────────────────────────────────┘
