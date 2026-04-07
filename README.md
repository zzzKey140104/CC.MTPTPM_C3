# ReaCom - Website Đọc Truyện Tranh

ReaCom là website đọc truyện tranh online được xây dựng với React (Frontend) và Node.js Express (Backend), sử dụng MySQL làm cơ sở dữ liệu.

## 📋 Mục lục

- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Tính năng ReaCom](#tính-năng-reacom)
- [Cài đặt](#cài-đặt)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Đóng góp](#đóng-góp)
- [License](#license)

## 🛠️ Công nghệ sử dụng

### Frontend
- **React 18** - UI Framework
- **React Router** - Routing
- **Axios** - HTTP Client
- **Context API** - State Management (Auth, Theme)
- **CSS3** - Styling với responsive design

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database (XAMPP)
- **JWT** - Authentication
- **Multer** - File upload handling
- **bcryptjs** - Password hashing

## Cài đặt

### Yêu cầu hệ thống

- Node.js (v14 trở lên)
- npm hoặc yarn
- XAMPP (để chạy MySQL)
- MySQL Server

### Bước 1: Clone và cài đặt dependencies

```bash
# Cài đặt dependencies cho root, backend và frontend
npm run install-all
```

Hoặc cài đặt từng phần:

```bash
# Root
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Bước 2: Cấu hình Database

1. Khởi động XAMPP và bật MySQL
2. Mở phpMyAdmin (http://localhost/phpmyadmin)
3. Import file `backend/database/schema.sql` để tạo database và bảng

### Bước 3: Cấu hình Backend

**⚠️ QUAN TRỌNG:** File `.env` là **bắt buộc** để ứng dụng chạy được. Ứng dụng sẽ không khởi động nếu thiếu các biến môi trường cần thiết.

1. Copy file `.env.example` thành `.env` trong thư mục `backend`:

**Windows:**
```bash
cd backend
copy .env.example .env
```

**Linux/Mac:**
```bash
cd backend
cp .env.example .env
```

2. Chỉnh sửa file `.env` với thông tin database của bạn:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=truyen_gg_db
JWT_SECRET=your_secret_key_here_change_in_production
FRONTEND_URL=http://localhost:3000
```

**Các biến môi trường bắt buộc:**
- `DB_HOST` - Địa chỉ MySQL server
- `DB_USER` - Tên người dùng MySQL
- `DB_NAME` - Tên database
- `JWT_SECRET` - Secret key để mã hóa JWT token

**Các biến môi trường tùy chọn:**
- `PORT` - Port của server (mặc định: 5000)
- `DB_PASSWORD` - Mật khẩu MySQL (để trống nếu không có)
- `FRONTEND_URL` - URL của frontend (dùng cho CORS)

**Lưu ý:** 
- ⚠️ **JWT_SECRET là gì?** Đây là secret key dùng để mã hóa và xác thực JWT token khi user đăng nhập. Nó giống như "chìa khóa" để tạo và kiểm tra token.
- ⚠️ **Tại sao cần thay đổi?** Giá trị mặc định `your_secret_key_here_change_in_production` là placeholder không an toàn. Bất kỳ ai biết giá trị này đều có thể tạo token giả mạo.
- ⚠️ **Cách tạo JWT_SECRET mạnh:** Bạn có thể tạo một chuỗi ngẫu nhiên mạnh bằng cách sử dụng online tool hoặc chạy lệnh: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` rồi copy giá trị và thay thế trong file `.env`
- ⚠️ Không commit file `.env` lên git (đã được thêm vào `.gitignore`)

### Bước 4: Chạy ứng dụng

#### Chạy cả Frontend và Backend cùng lúc:
```bash
npm run dev
```

#### Hoặc chạy riêng biệt:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm start
```

- Backend chạy tại: http://localhost:5000
- Frontend chạy tại: http://localhost:3000

## Cấu trúc dự án

```
DACN/
├── backend/
│   ├── config/
│   │   └── database.js          # Cấu hình kết nối MySQL
│   ├── controllers/             # Business logic (REST API)
│   │   ├── authController.js
│   │   ├── comicController.js
│   │   ├── chapterController.js
│   │   ├── userController.js
│   │   ├── favoriteController.js
│   │   ├── likeController.js
│   │   ├── historyController.js
│   │   ├── notificationController.js
│   │   ├── commentController.js
│   │   ├── categoryController.js
│   │   ├── countryController.js
│   │   ├── adminController.js
│   │   └── aiController.js
│   ├── models/                   # Database models/queries
│   │   ├── Comic.js
│   │   ├── Chapter.js
│   │   ├── User.js
│   │   ├── Favorite.js
│   │   ├── Like.js
│   │   ├── ReadingHistory.js
│   │   ├── Notification.js
│   │   ├── Comment.js
│   │   ├── Category.js
│   │   └── Country.js
│   ├── routes/                   # API routes
│   │   ├── auth.js
│   │   ├── comics.js
│   │   ├── chapters.js
│   │   ├── users.js
│   │   ├── favorites.js
│   │   ├── likes.js
│   │   ├── history.js
│   │   ├── notifications.js
│   │   ├── comments.js
│   │   ├── categories.js
│   │   ├── countries.js
│   │   ├── admin.js
│   │   └── ai.js
│   ├── middleware/               # Middleware functions
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── utils/                    # Utility functions
│   │   └── response.js
│   ├── database/
│   │   └── schema.sql            # Database schema
│   ├── server.js                 # Entry point
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Common components (Header, Footer, Loading)
│   │   │   └── features/         # Feature-specific components (ComicCard)
│   │   ├── pages/                # Page components
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useComics.js
│   │   │   ├── useComic.js
│   │   │   └── useChapter.js
│   │   ├── contexts/             # React contexts
│   │   │   └── AuthContext.js
│   │   ├── services/            # API services
│   │   │   └── api.js
│   │   ├── utils/                # Utility functions
│   │   │   └── helpers.js
│   │   ├── constants/            # Constants
│   │   │   └── index.js
│   │   ├── styles/               # Global styles
│   │   │   └── global.css
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── package.json
```

## 📡 API Endpoints

### Comics
- `GET /api/comics` - Lấy danh sách truyện (có phân trang, tìm kiếm, lọc theo status, country)
- `GET /api/comics/:id` - Lấy chi tiết truyện
- `GET /api/comics/latest/updates` - Lấy truyện mới cập nhật
- `GET /api/comics/popular/list` - Lấy truyện phổ biến
- `GET /api/comics/category/:categoryId` - Lấy truyện theo thể loại
- `POST /api/comics/:id/views` - Tăng lượt xem truyện

### Chapters
- `GET /api/chapters/:id` - Lấy chi tiết chương
- `GET /api/chapters/comic/:comicId` - Lấy danh sách chương của truyện
- `POST /api/chapters/:id/views` - Tăng lượt xem chương

### Auth
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập

### Users
- `GET /api/users/:id` - Lấy thông tin user theo id
- `GET /api/users/profile/me` - Lấy thông tin profile của user hiện tại
- `PUT /api/users/profile/me` - Cập nhật profile + avatar

### Categories
- `GET /api/categories` - Lấy danh sách thể loại
- `GET /api/categories/:id` - Lấy chi tiết thể loại

### Countries
- `GET /api/countries` - Lấy danh sách quốc gia

### Favorites (Yêu cầu authentication)
- `GET /api/favorites` - Lấy danh sách truyện đã theo dõi
- `POST /api/favorites/toggle` - Bật/tắt theo dõi truyện
- `GET /api/favorites/check/:comicId` - Kiểm tra đã theo dõi chưa
- `GET /api/favorites/count` - Lấy tổng số truyện đã theo dõi

### Likes (Yêu cầu authentication)
- `POST /api/likes/toggle` - Bật/tắt thích truyện
- `GET /api/likes/check/:comicId` - Kiểm tra đã thích chưa

### Reading History (Yêu cầu authentication)
- `GET /api/history` - Lấy lịch sử đọc
- `GET /api/history/comic/:comicId` - Lấy lịch sử đọc của một truyện
- `POST /api/history` - Thêm/cập nhật lịch sử đọc
- `DELETE /api/history/comic/:comicId` - Xóa lịch sử đọc của một truyện
- `DELETE /api/history` - Xóa toàn bộ lịch sử đọc

### Notifications (Yêu cầu authentication)
- `GET /api/notifications` - Lấy danh sách thông báo mới nhất
- `GET /api/notifications/count` - Lấy số lượng thông báo chưa đọc
- `PUT /api/notifications/:id/read` - Đánh dấu một thông báo là đã đọc
- `PUT /api/notifications/read-all` - Đánh dấu tất cả thông báo là đã đọc

### Comments (Yêu cầu authentication cho các hành động ghi)
- `GET /api/comments/comic/:comicId` - Lấy comment theo truyện
- `GET /api/comments/chapter/:chapterId` - Lấy comment theo chương
- `GET /api/comments/:id/like/check` - Kiểm tra đã like comment chưa
- `POST /api/comments` - Tạo comment mới
- `POST /api/comments/:id/like` - Bật/tắt like comment
- `DELETE /api/comments/:id` - Xóa comment

### AI (Yêu cầu authentication tùy endpoint)
- `POST /api/ai/comics/:comicId/summarize` - Tóm tắt nội dung truyện bằng AI
- `POST /api/ai/chapters/:chapterId/summarize` - Tóm tắt nội dung chương bằng AI
- `POST /api/ai/chat` - Chat với AI về truyện/chương đang đọc

### Admin (Yêu cầu admin role)
- `GET /api/admin/comics` - Lấy danh sách truyện (admin)
- `POST /api/admin/comics` - Tạo truyện mới
- `PUT /api/admin/comics/:id` - Cập nhật truyện
- `DELETE /api/admin/comics/:id` - Xóa truyện
- `POST /api/admin/chapters` - Tạo chương mới
- `PUT /api/admin/chapters/:id` - Cập nhật chương
- `PATCH /api/admin/chapters/:id/status` - Đổi trạng thái chương (mở/đóng/VIP)
- `DELETE /api/admin/chapters/:id` - Xóa chương
- `GET /api/admin/chapters/comic/:comic_id/closed-vip` - Lấy danh sách chương closed/VIP của 1 truyện
- `GET /api/admin/users` - Lấy danh sách người dùng
- `PUT /api/admin/users/:id` - Cập nhật thông tin / role người dùng
- `DELETE /api/admin/users/:id` - Xóa người dùng
- `GET /api/admin/comics/closed-vip` - Lấy danh sách truyện closed/VIP
- `GET /api/admin/chapters/vip-all` - Lấy toàn bộ chương VIP

## ✨ Tính năng ReaCom

### Người dùng
- ✅ Xem danh sách truyện với phân trang, lọc theo trạng thái, quốc gia, thể loại
- ✅ Tìm kiếm truyện theo tên, tác giả (search cơ bản + **Tìm kiếm nâng cao**)
- ✅ Xem chi tiết truyện với đầy đủ thông tin, thống kê lượt xem, lượt theo dõi, lượt thích
- ✅ Đọc chương truyện với nhiều ảnh, giao diện đọc tối ưu (sticky navbar, nút lên đầu trang, lưu vị trí đọc)
- ✅ Lưu vị trí đọc và tự động tiếp tục đọc từ vị trí đã dừng
- ✅ Đăng ký/Đăng nhập với JWT authentication, cập nhật avatar/profile
- ✅ Theo dõi truyện yêu thích, xem danh sách truyện đã theo dõi
- ✅ Thích truyện, xem trạng thái đã thích hay chưa
- ✅ Lịch sử đọc truyện chi tiết, xóa từng truyện hoặc toàn bộ lịch sử
- ✅ Bình luận truyện & chương, like/unlike comment
- ✅ Nhận thông báo khi truyện theo dõi có chương mới (notification bell + badge)
- ✅ Xem truyện theo thể loại, quốc gia
- ✅ Trang **Xếp hạng**: top ngày/tuần/tháng, truyện mới, truyện full, yêu thích, mới cập nhật
- ✅ Dark mode / Light mode
- ✅ Responsive design (mobile, tablet, desktop)

### Tính năng VIP & AI
- ⭐ Hỗ trợ chương và truyện **VIP**, chỉ đọc được khi tài khoản là VIP/Admin
- ⭐ Ẩn chương đã đóng với user thường, chỉ Admin thấy và quản lý
- 🤖 **Tóm tắt chương bằng AI** trực tiếp trong trang đọc chương
- 🤖 **AI Chat**: chat với AI về truyện/chương đang xem (ngữ cảnh theo comicId/chapterId)

### Admin
- ✅ Quản lý truyện (thêm, sửa, xóa, thay đổi trạng thái thường/VIP/đóng)
- ✅ Quản lý chương (thêm, sửa, xóa, đổi trạng thái, xem danh sách chương closed/VIP)
- ✅ Upload ảnh bìa truyện
- ✅ Upload nhiều ảnh cho một chương
- ✅ Quản lý thể loại và quốc gia
- ✅ Quản lý người dùng (danh sách, cập nhật role Reader/VIP/Admin, xóa tài khoản)

### Hệ thống
- ✅ Tự động tăng lượt xem khi đọc chương
- ✅ Tổng lượt xem truyện = tổng lượt xem các chương
- ✅ Phân quyền người dùng (Reader, VIP, Admin)
- ✅ Thông báo định kỳ theo polling (đếm số thông báo chưa đọc trên header)

## 🚀 Deployment

### Chuẩn bị
1. Đảm bảo MySQL đang chạy
2. Cập nhật file `.env` với thông tin production
3. Build frontend: `cd frontend && npm run build`

### Backend
- Sử dụng PM2 hoặc process manager để chạy Node.js
- Cấu hình reverse proxy (Nginx) nếu cần

### Frontend
- Deploy thư mục `build` lên hosting (Vercel, Netlify, hoặc server tĩnh)
- Cấu hình API URL trong `frontend/src/constants/index.js`

## 📝 Ghi chú

- ⚠️ Đảm bảo MySQL đang chạy trên XAMPP trước khi khởi động backend
- ⚠️ Thay đổi `JWT_SECRET` trong file `.env` bằng một chuỗi ngẫu nhiên mạnh khi deploy production
- 📦 File `schema.sql` đã bao gồm dữ liệu mẫu để test
- 📁 Thư mục `backend/uploads/` chứa các file ảnh đã upload (không commit lên git)
- 🔒 Tất cả API endpoints yêu cầu authentication đều cần JWT token trong header: `Authorization: Bearer <token>`

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

MIT License - Xem file [LICENSE](LICENSE) để biết thêm chi tiết

## 👤 Tác giả

Dự án được phát triển bởi Nguyễn Khánh Hưng

## 🙏 Lời cảm ơn

- React team
- Express.js community
- MySQL/XAMPP
- Tất cả các thư viện open source được sử dụng trong dự án

