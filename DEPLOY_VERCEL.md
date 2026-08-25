# Hướng Dẫn Triển Khai Website Lên Vercel (Production-Ready)

Tài liệu này hướng dẫn chi tiết từng bước thiết lập và triển khai dự án **Wey Playground** lên **Vercel** kết hợp **Firebase** (`wey-playground`), **Cloudinary** và **Google Gemini AI**.

---

## 1. Cấu Hình Firebase Console (`wey-playground`)

### A. Kích hoạt Authentication & Google Sign-In
1. Truy cập [Firebase Console](https://console.firebase.google.com/) > chọn project **wey-playground**.
2. Vào mục **Build** > **Authentication** > chọn tab **Sign-in method**.
3. Bật nhà cung cấp **Google** (Enable).
4. Điền email hỗ trợ dự án và nhấn **Save**.

### B. Thêm Authorized Domains
1. Trong **Authentication** > tab **Settings** > mục **Authorized domains**.
2. Thêm domain của Vercel sau khi tạo project (ví dụ: `your-project.vercel.app`).
3. Đảm bảo có sẵn:
   - `localhost`
   - `wey-playground.firebaseapp.com`
   - `wey-playground.web.app`
   - Domain Vercel của bạn.

### C. Khởi tạo Firestore Database
1. Vào **Build** > **Firestore Database** > nhấn **Create database**.
2. Chọn vị trí lưu trữ (Location), ví dụ: `asia-southeast1` (Singapore) hoặc `nam5` (us-central).
3. Bắt đầu ở chế độ **Production mode**.

### D. Triển khai Firestore Security Rules
Vào tab **Rules** của Firestore và dán toàn bộ nội dung sau, sau đó nhấn **Publish**:

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuth() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuth() && (
        request.auth.token.email.lower() == 'hoangbang1310@gmail.com' ||
        request.auth.token.email.lower() == 'pthngan1310@gmail.com'
      );
    }

    // Mặc định chặn tất cả truy cập ngoài quy định
    match /{document=**} {
      allow read, write: if false;
    }
    
    // User Profile
    match /users/{userId} {
      allow read: if isAuth();
      allow create: if isAuth() && request.auth.uid == userId;
      allow update: if isAuth() && (
        isAdmin() || 
        (request.auth.uid == userId && 
         !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'isBlocked']))
      );
      allow delete: if isAdmin();
    }

    // Ngân hàng câu hỏi
    match /questionBanks/{bankId} {
      allow read: if isAuth() && (
        resource.data.ownerId == request.auth.uid || 
        resource.data.userId == request.auth.uid || 
        isAdmin()
      );
      allow create: if isAuth() && (
        request.resource.data.ownerId == request.auth.uid || 
        request.resource.data.userId == request.auth.uid
      );
      allow update, delete: if isAuth() && (
        resource.data.ownerId == request.auth.uid || 
        resource.data.userId == request.auth.uid || 
        isAdmin()
      );
    }

    // Nhật ký hoạt động & Phiên chơi
    match /userActivityLogs/{logId} {
      allow read: if isAdmin();
      allow create: if true;
      allow update, delete: if isAdmin();
    }

    match /gameSessions/{sessionId} {
      allow read: if isAuth() && (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if true;
      allow update, delete: if isAdmin();
    }

    // Hạn mức AI: User chỉ đọc của mình; ghi hoàn toàn qua Serverless Firebase Admin
    match /aiUsage/{userId} {
      allow read: if isAuth() && (request.auth.uid == userId || isAdmin());
      allow write: if isAdmin();
    }

    // Nhật ký AI: Chỉ Admin xem được
    match /aiUsageLogs/{logId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }

    // Cấu hình hệ thống
    match /systemConfig/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

### E. Lấy Service Account Key (Cho Serverless API Quota)
1. Vào **Project settings** (biểu tượng bánh răng) > chọn tab **Service accounts**.
2. Chọn **Node.js** > nhấn nút **Generate new private key** > xác nhận tải file JSON về.
3. Chuyển đổi nội dung file JSON này thành chuỗi **Base64**:
   - Trên macOS / Linux: `base64 -i serviceAccountKey.json | tr -d '\n'`
   - Trên Windows (PowerShell): `[Convert]::ToBase64String([IO.File]::ReadAllBytes("serviceAccountKey.json"))`
   - Chuỗi kết quả này sẽ được điền vào biến `FIREBASE_SERVICE_ACCOUNT_BASE64` trên Vercel.

---

## 2. Cấu Hình Cloudinary (Lưu Trữ Hình Ảnh Trực Tiếp)

1. Đăng nhập [Cloudinary Console](https://cloudinary.com/).
2. Kiểm tra **Cloud Name**: `r7hnjozd`.
3. Vào **Settings** > **Upload** > mục **Upload presets**:
   - Nhấn **Add upload preset**.
   - **Upload preset name**: `wey_playground_upload`
   - **Signing Mode**: chọn **Unsigned** *(Bắt buộc để tải ảnh trực tiếp từ trình duyệt)*.
   - Thư mục lưu trữ (Folder): `wey_users` hoặc để trống.
   - Nhấn **Save**.

---

## 3. Biến Môi Trường Trên Vercel (Environment Variables)

Vào Vercel > Project > **Settings** > **Environment Variables**, thêm các biến sau:

| Tên Biến | Giá trị | Phạm vi |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` *(hoặc `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`...)* | Khóa Google AI Studio (Hỗ trợ cả chuẩn `AQ.xxx` mới và `AIzaSyxxx` cũ) | Production, Preview, Development |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | *(Chuỗi Base64 của file JSON Service Account Firebase)* | Production, Preview, Development |
| `VITE_FIREBASE_API_KEY` | `AIzaSyCMnga6xRIxgl3fGB0_50OYczmy7ER6kLA` | Production, Preview, Development |
| `VITE_FIREBASE_AUTH_DOMAIN` | `wey-playground.firebaseapp.com` | Production, Preview, Development |
| `VITE_FIREBASE_PROJECT_ID` | `wey-playground` | Production, Preview, Development |
| `VITE_FIREBASE_STORAGE_BUCKET` | `wey-playground.firebasestorage.app` | Production, Preview, Development |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `333755003429` | Production, Preview, Development |
| `VITE_FIREBASE_APP_ID` | `1:333755003429:web:70ffc80698a14ed50dc5cc` | Production, Preview, Development |
| `VITE_CLOUDINARY_CLOUD_NAME` | `r7hnjozd` | Production, Preview, Development |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | `wey_playground_upload` | Production, Preview, Development |

> 📌 **Lưu ý về Gemini API Key mới**:
> - Google AI Studio hiện cấp key có dạng bắt đầu bằng `AQ.` (ví dụ: `AQ.Ab8RN6KYza...`). Hệ thống tự động nhận diện và làm sạch chuỗi key (kể cả khi bạn lỡ copy nhầm dấu ngoặc kép `""`).
> - Nếu bạn có nhiều key để xoay vòng tránh lỗi giới hạn tốc độ (Rate Limit), hãy đặt tên biến là `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`,... Hệ thống sẽ tự động phân phối tải theo thuật toán Round-Robin.
> - Sau khi thêm/sửa Environment Variables trên Vercel, **bắt buộc phải Redeploy** để Vercel nạp các biến mới vào serverless function.
> - Bạn có thể kiểm tra biến môi trường đã nạp thành công chưa qua URL: `https://<ten-domain-vercel>/api/gemini-keys/debug-env`.

---

## 4. Các Bước Triển Khai (Deploy Steps)

1. Tải toàn bộ mã nguồn về máy tính (hoặc Clone từ Git).
2. Đẩy (Push) mã nguồn lên repository GitHub / GitLab cá nhân:
   ```bash
   git init
   git add .
   git commit -m "feat: production ready release"
   git branch -M main
   git remote add origin <URL_REPO_GITHUB_CỦA_BẠN>
   git push -u origin main
   ```
3. Mở [Vercel Dashboard](https://vercel.com/) > nhấn **Add New Project** > chọn kho GitHub vừa push.
4. **Framework Preset**: Chọn `Vite`.
5. Mở mục **Environment Variables** và nhập đầy đủ các biến ở **Mục 3**.
6. Nhấn **Deploy**. Quá trình build sẽ hoàn tất trong ~1 phút.

---

## 5. Quy Trình Kiểm Thử Sau Khi Deploy (Testing)

### A. Kiểm thử Google Sign-In:
1. Nhấn nút **Đăng nhập** ở góc trên website.
2. Chọn tài khoản Google.
3. Xác nhận popup Google hiện lên, đăng nhập thành công và hiển thị tên/avatar người dùng.

### B. Kiểm thử Tính Năng AI (Gemini):
1. Vào công cụ soạn thảo câu hỏi hoặc game có AI (ví dụ: Chiếc Nón Kỳ Diệu, Tạo câu hỏi bằng AI).
2. Bấm **Sử dụng AI** > Chọn chế độ (⚡ Nhanh / ✨ Cân bằng / 🧠 Thông minh).
3. Nhập chủ đề và bấm **Tạo**.
4. Kiểm tra: AI trả về câu hỏi đúng chuẩn, bảng số lượt sử dụng AI cập nhật trừ lượt (ví dụ: 1/20).

### C. Kiểm thử Upload Ảnh (Cloudinary):
1. Vào mục quản trị hoặc chỉnh sửa câu hỏi > Thêm hình ảnh.
2. Chọn một file ảnh từ máy tính (JPG/PNG/WebP).
3. Kiểm tra ảnh tải lên thành công, URL trả về dạng `https://res.cloudinary.com/...` và hiển thị sắc nét.

---

## 6. Xử Lý Lỗi Thường Gặp (Troubleshooting)

- **Lỗi `auth/unauthorized-domain` khi đăng nhập Google:**
  - *Khắc phục:* Vào Firebase Console > Authentication > Settings > Authorized Domains > Thêm domain Vercel của bạn vào danh sách.
- **Lỗi `GEMINI_API_KEY environment variable is not configured`:**
  - *Khắc phục:* Kiểm tra biến `GEMINI_API_KEY` trong Settings > Environment Variables trên Vercel và tiến hành Redeploy lại.
- **Lỗi `Firebase Admin initialization error` hoặc không trừ được Quota AI:**
  - *Khắc phục:* Đảm bảo chuỗi `FIREBASE_SERVICE_ACCOUNT_BASE64` là chuỗi Base64 nguyên vẹn không chứa khoảng trắng hoặc ký tự xuống dòng.
- **Lỗi Cloudinary `Upload preset not found` hoặc `400 Bad Request`:**
  - *Khắc phục:* Vào Cloudinary > Settings > Upload Presets > Đảm bảo preset `wey_playground_upload` đang ở chế độ **Unsigned**.
