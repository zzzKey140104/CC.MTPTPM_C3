# TEST API - ReaCom Backend

Tai lieu nay dung de test nhanh toan bo API trong du an.

## 1) Chuan bi

- Base URL local: `http://localhost:5000`
- Prefix API: `/api`
- Header JSON:
  - `Content-Type: application/json`
  - `Authorization: Bearer <TOKEN>` (voi API yeu cau dang nhap)
- Upload file: dung `form-data` (khong gui JSON)

## 2) Bien de test (goi y cho Postman)

- `{{baseUrl}} = http://localhost:5000`
- `{{tokenUser}} = <jwt_user>`
- `{{tokenAdmin}} = <jwt_admin>`
- `{{userId}}`
- `{{comicId}}`
- `{{chapterId}}`
- `{{commentId}}`
- `{{sessionId}}`
- `{{orderId}}`
- `{{notificationId}}`
- `{{categoryId}}`

## 3) Luong test tong quan nen chay truoc

1. Dang ky tai khoan moi -> xac thuc email -> dang nhap.
2. Lay danh sach comic/chapter/category/country (public APIs).
3. Test comment/like/favorite/history/notification voi user token.
4. Test AI summarize/chat (co va khong co token).
5. Test payment create -> status -> history.
6. Test toan bo admin APIs voi admin token.

---

## 4) AUTH APIs - `/api/auth`

### 4.1 Dang ky
- **POST** `/register`
- Auth: Khong
- Body (`form-data`):
  - `username` (text)
  - `email` (text)
  - `password` (text)
  - `avatar` (file, optional)

### 4.2 Dang nhap
- **POST** `/login`
- Auth: Khong
- Body (JSON):
```json
{
  "email": "user@example.com",
  "password": "12345678",
  "device_info": "Windows Chrome (optional)"
}
```

### 4.3 Xac thuc email
- **GET** `/verify-email?token=<verify_token>`
- Auth: Khong

### 4.4 Gui lai email xac thuc
- **POST** `/resend-verification`
- Auth: Khong
- Body:
```json
{
  "email": "user@example.com"
}
```

### 4.5 Quen mat khau
- **POST** `/forgot-password`
- Auth: Khong
- Body:
```json
{
  "email": "user@example.com"
}
```

### 4.6 Dat lai mat khau
- **POST** `/reset-password`
- Auth: Khong
- Body: gui theo link reset (thuong co `token`, `password`)

### 4.7 Tao mat khau cho tai khoan Google
- **POST** `/setup-password`
- Auth: Khong
- Body: gui theo flow frontend (thuong co thong tin user Google + password moi)

### 4.8 Google OAuth
- **GET** `/google`
- **GET** `/google/callback`
- Auth: Khong (flow OAuth)

### 4.9 Dang xuat
- **POST** `/logout`
- Auth: Co (`{{tokenUser}}`)

### 4.10 Quan ly sessions
- **GET** `/sessions` (lay danh sach phien dang nhap)
- **DELETE** `/sessions/:id` (thu hoi 1 phien)
- **DELETE** `/sessions` (thu hoi tat ca phien)
- Auth: Co (`{{tokenUser}}`)

---

## 5) USERS APIs - `/api/users`

### 5.1 Lay user theo ID
- **GET** `/:id`
- Auth: Co (`{{tokenUser}}`)

### 5.2 Lay profile cua minh
- **GET** `/profile/me`
- Auth: Co (`{{tokenUser}}`)

### 5.3 Cap nhat profile
- **PUT** `/profile/me`
- Auth: Co (`{{tokenUser}}`)
- Body (`form-data`):
  - `username` (optional)
  - `password` (mat khau cu, optional)
  - `newPassword` (optional)
  - `avatar` (file, optional)

> Luu y: Neu gap 404 khi goi `/profile/me`, kiem tra thu tu route trong `users.js` (route `/:id` dang dat truoc).

---

## 6) COMICS APIs - `/api/comics`

### 6.1 Lay danh sach truyen co filter
- **GET** `/`
- Auth: Khong bat buoc
- Query thuong dung:
  - `page`, `limit`, `keyword`, `sort`, `category_id`, ...

### 6.2 Truyen moi cap nhat
- **GET** `/latest/updates?limit=10`
- Auth: Khong

### 6.3 Truyen pho bien
- **GET** `/popular/list?limit=10`
- Auth: Khong

### 6.4 Truyen theo the loai
- **GET** `/category/:categoryId`
- Auth: Khong

### 6.5 Tang luot xem truyen
- **POST** `/:id/views`
- Auth: Khong

### 6.6 Chi tiet truyen
- **GET** `/:id`
- Auth: Khong bat buoc (co token de lay them thong tin user lien quan)

---

## 7) CHAPTERS APIs - `/api/chapters`

### 7.1 Danh sach chuong theo truyen
- **GET** `/comic/:comicId`
- Auth: Khong bat buoc

### 7.2 Tang luot xem chuong
- **POST** `/:id/views`
- Auth: Khong

### 7.3 Chi tiet chuong
- **GET** `/:id`
- Auth: Khong bat buoc

---

## 8) CATEGORY/COUNTRY APIs

### 8.1 Categories - `/api/categories`
- **GET** `/`
- **GET** `/:id`
- Auth: Khong

### 8.2 Countries - `/api/countries`
- **GET** `/`
- Auth: Khong

---

## 9) COMMENTS APIs - `/api/comments`

### 9.1 Lay comment theo truyen
- **GET** `/comic/:comicId?page=1&limit=5&sort=popular`
- Auth: Khong

### 9.2 Lay comment theo chuong
- **GET** `/chapter/:chapterId?page=1&limit=5&sort=popular`
- Auth: Khong

### 9.3 Kiem tra da like comment chua
- **GET** `/:id/like/check`
- Auth: Co (`{{tokenUser}}`)

### 9.4 Tao comment
- **POST** `/`
- Auth: Co (`{{tokenUser}}`)
- Body (JSON): gui theo schema comment service (thuong gom noi dung + target comic/chapter)

### 9.5 Like/Unlike comment
- **POST** `/:id/like`
- Auth: Co (`{{tokenUser}}`)

### 9.6 Xoa comment
- **DELETE** `/:id`
- Auth: Co (`{{tokenUser}}`)

---

## 10) FAVORITES APIs - `/api/favorites`

- **GET** `/` - Lay danh sach yeu thich
- **POST** `/toggle` - Them/bo yeu thich
  - Body:
```json
{
  "comicId": 1
}
```
- **GET** `/check/:comicId` - Kiem tra da yeu thich chua
- **GET** `/count` - Dem tong yeu thich
- Auth: Tat ca deu can `{{tokenUser}}`

---

## 11) LIKES APIs - `/api/likes`

- **POST** `/toggle`
  - Body:
```json
{
  "comicId": 1
}
```
- **GET** `/check/:comicId`
- Auth: Tat ca deu can `{{tokenUser}}`

---

## 12) HISTORY APIs - `/api/history`

- **GET** `/?limit=50` - Lay lich su doc
- **GET** `/comic/:comicId` - Lay lich su doc theo truyen
- **POST** `/`
  - Body:
```json
{
  "comicId": 1,
  "chapterId": 10
}
```
- **DELETE** `/comic/:comicId` - Xoa lich su cua 1 truyen
- **DELETE** `/` - Xoa toan bo lich su
- Auth: Tat ca deu can `{{tokenUser}}`

---

## 13) NOTIFICATIONS APIs - `/api/notifications`

- **GET** `/?unreadOnly=false&limit=50` - Lay thong bao
- **GET** `/count` - So thong bao chua doc
- **PUT** `/:id/read` - Danh dau da doc
- **PUT** `/read-all` - Danh dau tat ca da doc
- Auth: Tat ca deu can `{{tokenUser}}`

---

## 14) AI APIs - `/api/ai`

### 14.1 Tom tat truyen
- **POST** `/comics/:comicId/summarize`
- Auth: Khong bat buoc

### 14.2 Tom tat chuong
- **POST** `/chapters/:chapterId/summarize`
- Auth: Khong bat buoc

### 14.3 Chat AI
- **POST** `/chat`
- Auth: Khong bat buoc
- Body (JSON): gui theo schema `aiService.chat` (thuong co `message`, context comic/chapter)

### 14.4 Lich su chat AI
- **GET** `/chat/history?comicId=&chapterId=&limit=`
- Auth: Co (`{{tokenUser}}`)

### 14.5 Xoa lich su chat AI
- **DELETE** `/chat/history`
- Auth: Co (`{{tokenUser}}`)
- Body hoac query:
```json
{
  "comicId": 1,
  "chapterId": 10
}
```

### 14.6 Thong ke AI
- **GET** `/usage/daily?from=YYYY-MM-DD&to=YYYY-MM-DD`
- **GET** `/usage/summary`
- Auth: Co (`{{tokenUser}}`)

---

## 15) PAYMENT APIs - `/api/payments`

### 15.1 Tao payment
- **POST** `/create`
- Auth: Co (`{{tokenUser}}`)
- Body:
```json
{
  "amount": 50000
}
```

### 15.2 Simulate payment success (mock mode)
- **POST** `/simulate-success/:orderId`
- Auth: Co (`{{tokenUser}}`)

### 15.3 Lay thong tin payment
- **GET** `/:orderId`
- Auth: Co (`{{tokenUser}}`)

### 15.4 Kiem tra trang thai payment
- **GET** `/status/:orderId?forceQuery=true`
- Auth: Co (`{{tokenUser}}`)

### 15.5 Upgrade thu cong
- **POST** `/manual-upgrade/:orderId`
- Auth: Co (`{{tokenUser}}`)

### 15.6 Lich su thanh toan
- **GET** `/history/list`
- Auth: Co (`{{tokenUser}}`)

### 15.7 Callback tu cong thanh toan
- **POST** `/callback`
- Auth: Khong
- Luu y: endpoint nay danh cho gateway (MoMo), can signature hop le.

---

## 16) ADMIN APIs - `/api/admin` (can role admin)

Tat ca endpoint duoi day can:
- Header `Authorization: Bearer {{tokenAdmin}}`
- User co `role = admin`

### 16.1 Quan ly comics
- **GET** `/comics`
- **POST** `/comics` (`form-data`, file `cover_image`)
- **PUT** `/comics/:id` (`form-data`, file `cover_image`)
- **DELETE** `/comics/:id`
- **GET** `/comics/closed-vip`

### 16.2 Quan ly chapters
- **POST** `/chapters` (`form-data`, files `chapter_images` toi da 100)
- **PUT** `/chapters/:id` (`form-data`, files `chapter_images` toi da 100)
- **PATCH** `/chapters/:id/status`
```json
{
  "status": "free"
}
```
- **DELETE** `/chapters/:id`
- **GET** `/chapters/comic/:comic_id/closed-vip`
- **GET** `/chapters/vip-all`

### 16.3 Quan ly users
- **GET** `/users`
- **PUT** `/users/:id`
- **DELETE** `/users/:id`

---

## 17) Mau cURL nhanh

### Dang nhap
```bash
curl -X POST "{{baseUrl}}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\",\"password\":\"12345678\"}"
```

### Lay comics
```bash
curl "{{baseUrl}}/api/comics?page=1&limit=10"
```

### Toggle favorite
```bash
curl -X POST "{{baseUrl}}/api/favorites/toggle" \
  -H "Authorization: Bearer {{tokenUser}}" \
  -H "Content-Type: application/json" \
  -d "{\"comicId\":1}"
```

---

## 18) Checklist expected khi test

- API tra dung HTTP status (`200/201/4xx/5xx`) theo tung tinh huong.
- Body response nhat quan (`success`, `message`, `data` neu co).
- API protected tu choi khi thieu token (`401`) hoac sai role (`403`).
- Input sai dinh dang tra loi ro rang.
- Khong bi loi 500 voi case hop le.

Neu ban muon, minh co the tao tiep file Postman Collection JSON tu danh sach nay de import va chay auto nhanh hon.
