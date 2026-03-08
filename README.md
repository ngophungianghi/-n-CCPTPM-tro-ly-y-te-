# Trợ Lý Y Tế AI - Hệ Thống Đặt Lịch (CareAI)

CareAI là một nền tảng y tế thông minh tích hợp Trí tuệ Nhân tạo (AI), giúp bệnh nhân chẩn đoán sơ bộ triệu chứng, tìm kiếm bác sĩ chuyên khoa phù hợp và đặt lịch khám bệnh trực tuyến một cách nhanh chóng. Hệ thống cũng cung cấp các công cụ quản lý toàn diện cho Bác sĩ và Quản trị viên (Admin).

## 🚀 Công nghệ sử dụng (Tech Stack)

*   **Frontend:** React 18, TypeScript, Vite.
*   **Styling:** Tailwind CSS (thiết kế responsive, UI hiện đại), Lucide React (Icons).
*   **Backend & Database:** Firebase (Firestore để lưu trữ dữ liệu NoSQL, Firebase Storage để lưu trữ hình ảnh).
*   **AI Integration:** `@google/genai` (Gemini API) để xử lý ngôn ngữ tự nhiên, phân tích triệu chứng và tư vấn y tế.

## 🌟 Tính năng chính & Phân quyền (Roles)

Hệ thống được chia làm 3 vai trò chính: **Bệnh nhân (Customer)**, **Bác sĩ (Doctor)**, và **Quản trị viên (Admin)**.

### 1. Dành cho Bệnh nhân (Customer)
*   **Tư vấn AI (Chatbot):** Bệnh nhân nhập triệu chứng, AI sẽ phân tích, đưa ra chẩn đoán sơ bộ, tóm tắt tình trạng và tự động đề xuất các bác sĩ có chuyên khoa phù hợp.
*   **Tìm kiếm & Lọc Bác sĩ:** Xem danh sách bác sĩ, lọc theo chuyên khoa (Đa khoa, Da liễu, Tim mạch,...).
*   **Đặt lịch khám:** Chọn bác sĩ, ngày khám và khung giờ trống. Hệ thống tự động kiểm tra trùng lịch (chỉ hiển thị các giờ chưa có người đặt).
*   **Quản lý lịch sử:** Xem lại các lịch hẹn đã đặt, theo dõi trạng thái (Chờ khám, Đã xác nhận, Đã hoàn thành, Đã hủy).
*   **Tóm tắt AI trong lịch hẹn:** Lịch hẹn sẽ lưu lại đoạn tóm tắt triệu chứng từ AI để bác sĩ có thể đọc trước khi khám.

### 2. Dành cho Bác sĩ (Doctor)
*   **Bảng điều khiển (Dashboard):** Xem danh sách các ca trực/lịch hẹn của mình trong ngày hoặc sắp tới.
*   **Quản lý trạng thái:** Cập nhật trạng thái lịch hẹn (Xác nhận lịch, Đánh dấu hoàn thành, Hủy lịch).
*   **Kê đơn thuốc (Prescription):** (Tính năng đang mở rộng) Bác sĩ có thể kê đơn thuốc (Tên thuốc, liều lượng, cách dùng) và ghi chú tái khám sau khi hoàn thành ca khám.

### 3. Dành cho Quản trị viên (Admin)
*   **Quản lý Bác sĩ:** Thêm mới, chỉnh sửa thông tin, xóa bác sĩ.
*   **Upload hình ảnh:** Tải ảnh đại diện cho bác sĩ (Hệ thống tự động nén ảnh bằng Canvas API trước khi upload lên Firebase Storage để tối ưu dung lượng).
*   **Quản lý Người dùng:** Xem danh sách toàn bộ người dùng và cấp quyền (thay đổi role giữa customer, doctor, admin).

## 🧠 Luồng hoạt động & Logic cốt lõi

### Logic Đặt lịch (Booking Flow)
1. Người dùng chọn Bác sĩ và Ngày khám.
2. Hệ thống gọi hàm `checkAvailability` truy vấn Firestore để tìm các khung giờ đã được đặt (`Chờ khám` hoặc `Đã xác nhận`) của bác sĩ đó trong ngày.
3. Giao diện loại bỏ các khung giờ đã bận, chỉ cho phép người dùng chọn khung giờ trống.
4. Khi xác nhận, dữ liệu được lưu vào collection `bookings` kèm theo `aiSummary` (nếu người dùng đặt lịch từ màn hình Chat AI).

### Logic AI (Gemini)
1. Prompt được thiết kế để đóng vai trò là một trợ lý y tế.
2. Khi người dùng nhập triệu chứng, AI trả về phản hồi dưới dạng JSON chứa:
   * `text`: Lời khuyên/chẩn đoán sơ bộ.
   * `recommendedSpecialties`: Mảng các chuyên khoa phù hợp.
   * `summary`: Tóm tắt ngắn gọn triệu chứng (để đính kèm vào lịch hẹn).
3. Giao diện đọc `recommendedSpecialties` và tự động lọc ra danh sách các bác sĩ thuộc chuyên khoa đó để gợi ý ngay dưới tin nhắn của AI.

### Logic Nén ảnh (Image Compression)
* Khi Admin thêm ảnh bác sĩ, hàm `compressImage` (sử dụng `FileReader` và `HTMLCanvasElement`) sẽ resize ảnh về kích thước tối đa 800x800px và giảm chất lượng JPEG xuống 80% trước khi đẩy lên Firebase. Điều này giúp tiết kiệm băng thông và dung lượng lưu trữ.

## 📁 Cấu trúc thư mục chính

```text
/
├── src/
│   ├── components/
│   │   ├── ChatInterface.tsx   # Giao diện Chat với Gemini AI
│   │   └── DoctorList.tsx      # Component hiển thị danh sách bác sĩ
│   ├── services/
│   │   ├── databaseService.ts  # Các hàm tương tác với Firebase (CRUD)
│   │   └── geminiService.ts    # Cấu hình và xử lý logic gọi Gemini API
│   ├── App.tsx                 # Component gốc, chứa Routing (State-based) và Layout chính
│   ├── types.ts                # Định nghĩa các TypeScript Interfaces (User, Doctor, Booking...)
│   ├── constants.ts            # Các hằng số cấu hình
│   └── firebaseConfig.ts       # Khởi tạo kết nối Firebase
├── index.html                  # Entry point HTML
├── vite.config.ts              # Cấu hình Vite
└── package.json                # Quản lý thư viện
```

## ⚙️ Cài đặt và Chạy dự án (Local Development)

1. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

2. **Cấu hình biến môi trường:**
   Tạo file `.env` ở thư mục gốc và thêm các thông tin sau:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Chạy server phát triển:**
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ chạy tại `http://localhost:3000`.

## 🛠 Hướng phát triển tương lai (Roadmap)
* Tích hợp thông báo Push Notification khi lịch hẹn thay đổi trạng thái.
* Hoàn thiện giao diện chi tiết Đơn thuốc (Prescription) cho bệnh nhân xem lại.
* Tích hợp thanh toán trực tuyến (VNPay/MoMo).
* Thêm tính năng Video Call khám bệnh từ xa (Telemedicine).
