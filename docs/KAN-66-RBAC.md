# KAN-66 — Phân quyền giao diện

Phần web đồng bộ 8 role và permission với `Cruise-api` trong
`src/services/accessControl.ts`. Route guard, sidebar và command palette dùng
chung ma trận này. Backend vẫn là nơi quyết định quyền đối với từng API.

- Người dùng không đủ quyền vào URL trực tiếp được chuyển tới trang 403.
- Nhân viên POS vào `/` được chuyển tới `/pos`; các role khác có trang làm việc
  tương ứng, tránh điều hướng lặp ở dashboard vận hành.
- Các thao tác đăng ký, đổi trạng thái và check-in hành khách bị khóa đối với
  nhân viên chỉ có quyền đọc danh sách.
- Login gửi `usernameOrEmail`, lấy `accessToken`; request interceptor gửi Bearer
  token. Response 401 xóa phiên và về login, 403 chuyển sang trang báo thiếu quyền,
  kể cả khi service nghiệp vụ có fallback dữ liệu demo.
- `/api` là mặc định. Vite proxy tới đúng microservice ở localhost:8081–8084;
  system health/info tới 8080. Production cần reverse proxy tương ứng hoặc cấu
  hình `VITE_API_BASE_URL`. Gateway hiện tại chỉ có các endpoint giám sát hệ thống.
- Tài khoản demo chỉ bật ở development khi có
  `VITE_ENABLE_DEMO_ACCOUNTS=true` hoặc trong test. Token demo không được API chấp nhận.

Kiểm tra local ngày 02/11/2026: 736 Vitest test (107 file) pass, bộ test script
Jules pass, lint exit 0 (còn warning của repo), TypeScript và production build pass.
Lệnh chạy: `npm ci`, `npx vitest run --maxWorkers=2`, `npm run test:jules`,
`npm run lint`, `npm run build`.

Chi tiết quyền API, bảng audit và giới hạn revocation nằm trong
`Cruise-api/docs/KAN-66-RBAC.md`. Chưa nghiệm thu staging hoặc chạy GitHub CI.
