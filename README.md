# Cruise Activity and Service Management System - Frontend Web

> **Jira Story:** [KAN-37](https://huytran20052022.atlassian.net/browse/KAN-37)  
> **Jira Tasks:**  
> - [KAN-35](https://huytran20052022.atlassian.net/browse/KAN-35) - *Initialize Frontend Project — Khởi tạo dự án frontend*  
> - [KAN-36](https://huytran20052022.atlassian.net/browse/KAN-36) - *Add Basic Application Entry Point — Tạo điểm khởi chạy ứng dụng*  

---

## 1. Công nghệ sử dụng (Modern Tech Stack)
* **Framework:** React 19 + TypeScript (Chuẩn type-safety cao nhất)
* **Build Tool:** Vite 6 / 8 (Tốc độ khởi động siêu tốc, Hot Module Replacement tức thì)
* **Styling:** Tailwind CSS v4 (Thiết kế hiện đại, responsive, tông màu sang trọng chuyên cho Luxury Cruise)
* **Icons:** Lucide React
* **API Client:** Axios (Tích hợp sẵn cấu hình kết nối trực tiếp với Backend Gateway tại `http://localhost:8080/api`)

---

## 2. Cài đặt và Khởi chạy

### Cài đặt thư viện:
```bash
npm install
```

### Chạy môi trường phát triển (Development):
```bash
npm run dev
```
Giao diện sẽ chạy tại: **http://localhost:3000**

### Đóng gói ứng dụng (Production Build):
```bash
npm run build
```

---

## 3. Cấu trúc thư mục (Application Entry Point Architecture)
```
Cruise-web/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   └── common/
│   │       └── ErrorBoundary.tsx   # Xử lý lỗi UI toàn cục
│   ├── layouts/
│   │   └── MainLayout.tsx          # Khung giao diện chuẩn (Sidebar, Header, Outlet)
│   ├── pages/
│   │   ├── DashboardPage.tsx       # Bảng điều khiển vận hành tổng quan
│   │   ├── ItineraryPage.tsx       # Lịch trình & Cảng dừng
│   │   ├── ActivitiesPage.tsx      # Hoạt động trên tàu & Tour trên bờ
│   │   ├── PosPage.tsx             # Chi tiêu phi tiền mặt & Offline Sync
│   │   ├── PassengersPage.tsx      # Hành khách & Check-in QR/RFID
│   │   └── NotFoundPage.tsx        # Trang 404
│   ├── services/
│   │   └── api.ts                  # Axios API client & backend health check
│   ├── App.tsx                     # Định tuyến trung tâm (React Router)
│   ├── index.css                   # Tailwind CSS styling
│   └── main.tsx                    # React Root Entry Point & Bootstrap Logger
├── .env                            # Cấu hình biến môi trường
├── .env.example
├── index.html
├── package.json
└── vite.config.ts
```

---

## 4. Danh sách các Tuyến đường (Application Routes)
* **`/`**: Dashboard Tổng quan (Chỉ số vận hành, doanh thu, thời tiết, an toàn).
* **`/itinerary`**: Quản lý lịch trình, cảng dừng (Ports of call), giờ tàu đến/rời bến.
* **`/activities`**: Quản lý hoạt động giải trí và các tour du lịch trên bờ (Shore Excursions).
* **`/pos`**: Quản lý tài khoản chi tiêu phi tiền mặt (Cashless), đồng bộ giao dịch ngoại tuyến (Offline Sync).
* **`/passengers`**: Danh sách hành khách, gán thẻ QR/RFID và theo dõi vùng định vị BLE.
* **`*`**: Trang 404 (Not Found).

