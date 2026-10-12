# Cruise Activity and Service Management System - Frontend Web

> **Jira Story:** [KAN-37](https://huytran20052022.atlassian.net/browse/KAN-37)  
> **Jira Tasks:**  
> - [KAN-35](https://huytran20052022.atlassian.net/browse/KAN-35) - *Initialize Frontend Project — Khởi tạo dự án frontend*  
> - [KAN-36](https://huytran20052022.atlassian.net/browse/KAN-36) - *Add Basic Application Entry Point — Tạo điểm khởi chạy ứng dụng*  
> - [KAN-50](https://huytran20052022.atlassian.net/browse/KAN-50) - *Configure Frontend Testing Tools — Thiết lập công cụ kiểm thử frontend*  
> - [KAN-52](https://huytran20052022.atlassian.net/browse/KAN-52) - *Add Sample Frontend Test — Tạo một test mẫu cho frontend*  
> - [KAN-54](https://huytran20052022.atlassian.net/browse/KAN-54) - *Configure Test Execution Commands — Thiết lập lệnh chạy test*  
> - [KAN-57](https://huytran20052022.atlassian.net/browse/KAN-57) - *Configure Git Workflow and CI — Thiết lập quy trình Git và luồng CI*  
> - [KAN-91](https://huytran20052022.atlassian.net/browse/KAN-91) - *Build Cruise Ship List and Detail Pages — Trang danh sách và chi tiết tàu du lịch*  
> - [KAN-92](https://huytran20052022.atlassian.net/browse/KAN-92) - *Build Create and Edit Ship Forms — Form tạo và sửa thông tin tàu*  
> - [KAN-93](https://huytran20052022.atlassian.net/browse/KAN-93) - *Write Component Tests for Ship Management — Viết component test cho quản lý tàu*  
> - [KAN-94](https://huytran20052022.atlassian.net/browse/KAN-94) - *Test Form Validation and API Error Handling — Test validation và xử lý lỗi form*  
> - [KAN-100](https://huytran20052022.atlassian.net/browse/KAN-100) - *Build Cruise Tour Management Interface — Giao diện quản lý tour du lịch*  
> - [KAN-101](https://huytran20052022.atlassian.net/browse/KAN-101) - *Build Tour Create and Edit Forms — Form tạo và sửa tour du thuyền*  
> - [KAN-102](https://huytran20052022.atlassian.net/browse/KAN-102) - *Write Component Tests for Tour Management — Test các thành phần quản lý tour*  
> - [KAN-103](https://huytran20052022.atlassian.net/browse/KAN-103) - *Test Tour Status Changes and Validation — Test thay đổi trạng thái tour và validation*  
> - [KAN-110](https://huytran20052022.atlassian.net/browse/KAN-110) - *Build Port and Stop Management Interface — Giao diện quản lý cảng và điểm dừng*  
> - [KAN-111](https://huytran20052022.atlassian.net/browse/KAN-111) - *Test Arrival and Departure Time Validation — Test kiểm tra giờ cập cảng và rời bến*  
> - [KAN-112](https://huytran20052022.atlassian.net/browse/KAN-112) - *Write Component Tests for Port and Stop Forms — Test form cảng và điểm dừng*  
> - [KAN-119](https://huytran20052022.atlassian.net/browse/KAN-119) - *Build Daily Itinerary Interface — Giao diện lịch trình hàng ngày*  
> - [KAN-120](https://huytran20052022.atlassian.net/browse/KAN-120) - *Implement Itinerary Update and Reordering UI — Giao diện cập nhật và sắp xếp lịch trình*  
> - [KAN-121](https://huytran20052022.atlassian.net/browse/KAN-121) - *Write Component Tests for Itinerary Management — Test các thành phần giao diện lịch trình*  
> - [KAN-122](https://huytran20052022.atlassian.net/browse/KAN-122) - *Test Itinerary Validation and Error States — Test kiểm tra dữ liệu và trạng thái lỗi lịch trình*  
> - [KAN-129](https://huytran20052022.atlassian.net/browse/KAN-129) - *Display Updated Itinerary Information — Hiển thị thông tin lịch trình đã cập nhật*  
> - [KAN-130](https://huytran20052022.atlassian.net/browse/KAN-130) - *Display Itinerary Change History — Hiển thị lịch sử thay đổi lịch trình*  
> - [KAN-131](https://huytran20052022.atlassian.net/browse/KAN-131) - *Test Itinerary Update Display — Test hiển thị cập nhật lịch trình và lịch sử thay đổi*  

---

## 1. Công nghệ sử dụng (Modern Tech Stack)
* **Framework:** React 19 + TypeScript (Chuẩn type-safety cao nhất)
* **Build Tool:** Vite 6 / 8 (Tốc độ khởi động siêu tốc, Hot Module Replacement tức thì)
* **Styling:** Tailwind CSS v4 (Thiết kế hiện đại, responsive, tông màu sang trọng chuyên cho Luxury Cruise)
* **Icons:** Lucide React
* **API Client:** Axios (Tích hợp sẵn cấu hình kết nối trực tiếp với Backend Gateway tại `http://localhost:8080/api`)
* **Testing Stack:** Vitest, React Testing Library (`@testing-library/react`), `@testing-library/jest-dom`, `@testing-library/user-event`, jsdom, `@vitest/coverage-v8`

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

### 2.1. Thiết lập lệnh chạy test (Test Execution Commands):
Hệ thống cung cấp đầy đủ bộ lệnh thực thi kiểm thử chuẩn hóa qua npm:

| Lệnh npm | Chức năng thực thi | Mô tả chi tiết |
| :--- | :--- | :--- |
| `npm test` | `vitest run` | Chạy toàn bộ test suites một lần duy nhất và thoát với exit code chuẩn |
| `npm run test:watch` | `vitest` | Chế độ Interactive Watch, tự động chạy lại test khi file mã nguồn thay đổi |
| `npm run test:coverage` | `vitest run --coverage` | Tính toán tỷ lệ bao phủ mã nguồn (V8 coverage) và xuất báo cáo HTML tại `./coverage/index.html` |
| `npm run test:ui` | `vitest --ui` | Mở giao diện Dashboard trực quan Vitest trên trình duyệt web |
| `npm run test:run` | `vitest run` | Lệnh headless tương đương `npm test`, tiện lợi cho scripts |
| `npm run test:ci` | `vitest run --coverage --reporter=verbose` | Lệnh chuẩn cho CI/CD pipeline, hiển thị log chi tiết và tính coverage |

```bash
# Ví dụ chạy test với báo cáo coverage
npm run test:coverage

# Chạy riêng 1 file test cụ thể
npx vitest run src/pages/PassengersPage.test.tsx
```

Các bộ test mẫu chuẩn hóa bao gồm:
* `src/App.test.tsx`: Kiểm thử tích hợp định tuyến (Routing integration) qua các trang Dashboard, Ships, Itinerary, Activities, POS, Passengers và trang 404.
* `src/pages/PassengersPage.test.tsx`: Kiểm thử tương tác người dùng (`user-event`), tìm kiếm thời gian thực theo tên, cabin, mã RFID và hiển thị trạng thái rỗng (empty state).
* `src/layouts/MainLayout.test.tsx`: Kiểm thử khung giao diện, link điều hướng, và cơ chế polling kiểm tra kết nối Backend Gateway trực tuyến / ngoại tuyến.
* `src/pages/DashboardPage.test.tsx`: Kiểm thử render các chỉ số KPI vận hành, hero banner và cảng dừng.
* `src/components/common/ErrorBoundary.test.tsx`: Kiểm thử cơ chế bắt lỗi an toàn (Fallback UI).
* `src/components/ships/ShipFormModal.test.tsx`: Kiểm thử Form tạo và sửa thông tin tàu, kiểm tra dữ liệu bắt buộc và các quy tắc nghiệp vụ hàng hải (cabin <= capacity, crew ratio, length > beam, draft < beam, code regex).
* `src/pages/ShipsPage.test.tsx`: Kiểm thử trang quản lý đội tàu, tìm kiếm theo từ khóa và mở Modal tạo/sửa thông tin tàu.
* `src/pages/ItineraryPage.test.tsx`: Kiểm thử trang quản lý tour du thuyền, tìm kiếm, lọc theo trạng thái, mở modal tạo/sửa và điều hướng sang Daily Itinerary.
* `src/components/tours/TourFormModal.test.tsx`: Kiểm thử Modal tạo/sửa tour du thuyền, validation ngày khởi hành, cảng xuất phát, cảng đích và sức chứa.
* `src/components/tours/StatusTransitionModal.test.tsx`: Kiểm thử chuyển đổi trạng thái tour (DRAFT -> PUBLISHED -> IN_PROGRESS -> COMPLETED / CANCELLED) kèm lý do hủy.
* `src/components/tours/StopFormModal.test.tsx` & `StopTimeValidation.test.tsx`: Kiểm thử form cảng dừng và validation thời gian cập cảng, rời bến, giờ lên tàu (`all-aboard`).
* `src/components/itinerary/DailyItineraryTimeline.test.tsx`: Kiểm thử trục thời gian lịch trình hàng ngày, chuyển đổi ngày, thêm, cập nhật (`KAN-120`), đổi thứ tự hoạt động, hiển thị thông tin cập nhật (`KAN-129`) và modal lịch sử thay đổi (`KAN-130`).
* `src/components/itinerary/ItineraryChangeHistoryModal.test.tsx`: Kiểm thử hiển thị danh sách lịch sử thay đổi lịch trình, trạng thái rỗng (empty state), chi tiết người thực hiện, thời gian, sự kiện thay đổi và so sánh giá trị cũ/mới (`KAN-131`).
* `src/components/itinerary/ActivityFormModal.test.tsx`: Kiểm thử form thêm/sửa hoạt động hàng ngày, phân loại danh mục, tính phụ thu và sức chứa.
* `src/components/itinerary/ItineraryValidationErrors.test.tsx`: Kiểm thử toàn diện các trường hợp lỗi dữ liệu, empty state và fallback skeleton.
* `src/services/api.test.ts`, `shipService.test.ts`, `tourService.test.ts`: Kiểm thử tầng API client và logic dịch vụ dữ liệu.

---

## 3. Cấu trúc thư mục (Application Entry Point Architecture)
```
Cruise-web/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   └── ErrorBoundary.tsx             # Xử lý lỗi UI toàn cục
│   │   ├── itinerary/
│   │   │   ├── ActivityFormModal.tsx         # Modal thêm & cập nhật hoạt động lịch trình
│   │   │   ├── DailyItineraryTimeline.tsx    # Trục thời gian lịch trình hàng ngày & banner cập nhật
│   │   │   └── ItineraryChangeHistoryModal.tsx # Modal hiển thị lịch sử thay đổi lịch trình (Audit Log - KAN-130)
│   │   ├── ships/
│   │   │   └── ShipFormModal.tsx             # Form tạo và cập nhật tàu kèm validation nghiệp vụ
│   │   └── tours/
│   │       ├── StatusTransitionModal.tsx     # Modal chuyển đổi trạng thái tour
│   │       ├── StopFormModal.tsx             # Modal thêm & cập nhật cảng dừng
│   │       └── TourFormModal.tsx             # Modal tạo và cập nhật tour du thuyền
│   ├── layouts/
│   │   └── MainLayout.tsx                 # Khung giao diện chuẩn (Sidebar, Header, Outlet)
│   ├── pages/
│   │   ├── DashboardPage.tsx              # Bảng điều khiển vận hành tổng quan
│   │   ├── ItineraryPage.tsx              # Quản lý tour, cảng dừng & lịch trình chi tiết
│   │   ├── PassengersPage.tsx             # Hành khách & Check-in QR/RFID
│   │   ├── ShipsPage.tsx                  # Quản lý danh mục đội tàu
│   │   ├── ActivitiesPage.tsx             # Hoạt động trên tàu & Tour trên bờ
│   │   ├── PosPage.tsx                    # Chi tiêu phi tiền mặt & Offline Sync
│   │   └── NotFoundPage.tsx               # Trang 404
│   ├── services/
│   │   ├── api.ts                         # Axios API client & backend health check
│   │   ├── dailyItineraryService.ts       # Dịch vụ quản lý hoạt động lịch trình chi tiết
│   │   ├── shipService.ts                 # Dịch vụ quản lý danh mục và thông số tàu
│   │   └── tourService.ts                 # Dịch vụ quản lý tour du thuyền & cảng dừng
│   ├── App.tsx                            # Định tuyến trung tâm (React Router)
│   ├── index.css                          # Tailwind CSS styling
│   └── main.tsx                           # React Root Entry Point & Bootstrap Logger
├── .env                                   # Cấu hình biến môi trường
├── .env.example
├── index.html
├── package.json
└── vite.config.ts
```

---

## 4. Danh sách các Tuyến đường (Application Routes)
* **`/`**: Dashboard Tổng quan (Chỉ số vận hành, doanh thu, thời tiết, an toàn).
* **`/ships`**: Quản lý Đội tàu du lịch (Danh mục tàu, Form tạo mới và chỉnh sửa thông tin tàu kèm kiểm tra tính hợp lệ nghiệp vụ — KAN-92).
* **`/itinerary`**: Quản lý lịch trình, cảng dừng (Ports of call), giờ tàu đến/rời bến.
* **`/activities`**: Quản lý hoạt động giải trí và các tour du lịch trên bờ (Shore Excursions).
* **`/pos`**: Quản lý tài khoản chi tiêu phi tiền mặt (Cashless), đồng bộ giao dịch ngoại tuyến (Offline Sync).
* **`/passengers`**: Danh sách hành khách, gán thẻ QR/RFID và theo dõi vùng định vị BLE.
* **`*`**: Trang 404 (Not Found).

---

## 5. Quy trình Git Workflow & CI/CD Pipeline

Dự án áp dụng mô hình **GitHub Flow** và kiểm thử tự động qua **GitHub Actions**:
* **Chi tiết quy chuẩn:** Xem hướng dẫn đầy đủ tại [GIT_WORKFLOW.md](GIT_WORKFLOW.md).
* **Quy ước nhánh:** `feature/<JIRA-KEY>-<ten-tinh-nang>`, `bugfix/...`, `hotfix/...`.
* **Quy ước Commit:** `[<JIRA-KEY>] <type>: <description>` (theo chuẩn Conventional Commits).
* **Bảo vệ nhánh `main`:** Cấm push trực tiếp, bắt buộc tạo Pull Request và pass 100% CI checks trước khi merge.
* **GitHub Actions Pipeline (`.github/workflows/ci.yml`):** Tự động kích hoạt khi có Push hoặc PR vào `main`, khởi tạo Node.js 22, chạy `npm ci`, `npm run lint`, `npm run test:ci` (Vitest coverage report), và `npm run build`.


