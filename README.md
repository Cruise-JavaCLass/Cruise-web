# Cruise Activity and Service Management System - Frontend Web

> **Jira Story:** [KAN-37](https://huytran20052022.atlassian.net/browse/KAN-37)  
> **Jira Task:** [KAN-35](https://huytran20052022.atlassian.net/browse/KAN-35) - *Initialize Frontend Project — Khởi tạo dự án frontend*

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

## 3. Cấu trúc thư mục
```
Cruise-web/
├── public/                 # Static assets
├── src/
│   ├── services/
│   │   └── api.ts          # Axios API client & backend health check
│   ├── App.tsx             # Giao diện chính Cruise Management Dashboard
│   ├── index.css           # Cấu hình Tailwind CSS
│   └── main.tsx            # React root entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts          # Vite & Tailwind plugin config
```
