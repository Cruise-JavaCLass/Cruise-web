# Điểm danh tour bờ trên thiết bị cầm tay

Nguồn: https://github.com/Cruise-JavaCLass/Cruise-web

Bản sửa dựa trên `main` tại commit `9738ab651f41d10da0ec34c23a60a4aa95519dce`, lấy ngày 15/11/2026. Đây là chế độ web dành cho điện thoại, không phải ứng dụng Android/iOS native.

## Cách mở

- Trên điện thoại: vào `/excursion-attendance`, tự chuyển đến `/excursion-attendance/mobile`.
- Trên máy tính: vào **Điểm Danh Tour Bờ → Chế độ cầm tay**. Tour đang chọn được chuyển theo đường dẫn.
- Trở về bảng điều phối bằng mũi tên trên đầu trang. `?view=desktop` cho phép mở bảng điều phối trên điện thoại khi cần.
- Đường dẫn cầm tay vẫn nằm sau `AdminAuthGuard` hiện có. Backend tiếp tục chịu trách nhiệm kiểm tra quyền và trạng thái điểm danh.

## Luồng sử dụng

1. Chọn tour, kiểm tra tên tour/cảng và hạn về tàu.
2. Chọn **Tập trung**, **Lên xe** hoặc **Về tàu**.
3. Bấm **Quét QR / Thẻ → Mở camera QR**, cấp quyền camera và đưa mã vé vào khung. Camera ưu tiên camera sau.
4. Mỗi lần nhận mã, bộ quét dừng và chờ API xác nhận. Bấm **Quét khách tiếp** để tiếp tục, tránh gửi trùng từ nhiều khung hình.
5. Với thẻ phù hợp, chọn **Chạm thẻ NFC**. Nếu thiết bị không hỗ trợ, dùng QR, đầu đọc ngoài nhập ký tự rồi Enter, hoặc nhập mã thủ công.
6. Tìm khách theo tên/cabin/mã vé/xe; dùng nút **Chưa về** để lọc. Nút này không tự đánh dấu khách đã về.

## API và dữ liệu

Dùng các endpoint hiện có, không sửa Cruise-api:

- `GET /api/excursions`
- `GET /api/excursions/{id}/attendance/summary`
- `POST /api/excursions/{id}/check-in`

QR gửi nguyên nội dung mã vào `ticketCode`; thẻ NFC gửi `serialNumber` vào `rfidTag`, không tự đổi định dạng UID. Server phải lưu UID đúng định dạng do thiết bị trả về. QR phải chứa mã vé được backend chấp nhận.

Chế độ cầm tay dùng `fetchExcursions(undefined, { allowMockFallback: false })`: API lỗi hoặc danh sách rỗng sẽ không được thay bằng dữ liệu mẫu. Các trang khác giữ hành vi sẵn có. Không có hàng đợi điểm danh offline; khi mất mạng, quét tạm dừng. Không tự gửi lại yêu cầu ghi khi mất phản hồi. Nếu máy chủ đã xác nhận nhưng tải lại thống kê lỗi, giữ kết quả xác nhận và hiển thị lỗi tải dữ liệu riêng.

## Camera và NFC

- Camera trên điện thoại cần HTTPS, quyền camera và trình duyệt hỗ trợ `getUserMedia`. `localhost` dùng được khi chạy trên chính máy phát triển. Truy cập điện thoại bằng IP LAN qua HTTP sẽ không cấp được camera; cần cấu hình HTTPS hợp lệ ở môi trường triển khai.
- Web NFC phụ thuộc thiết bị/trình duyệt hỗ trợ và thẻ NDEF tương thích. Có `NDEFReader` không đảm bảo thiết bị có đầu đọc hoạt động. Từ chối quyền, đầu đọc bận hoặc không có phần cứng sẽ có thông báo và cách nhập mã.
- Không đọc được mọi loại RFID/NFC bằng trình duyệt. Thẻ không tương thích cần đầu đọc ngoài hoặc ứng dụng native; không dùng camera để đọc RFID.
- Camera/NFC dừng khi đóng bộ quét, chuyển chế độ, ẩn trang hoặc mất mạng. Tài nguyên được thu hồi cả khi người dùng cấp quyền sau lúc đã đóng màn hình.

Tài liệu tham chiếu:

- https://github.com/zxing-js/browser
- https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- https://developer.chrome.com/docs/capabilities/nfc

## Chạy trong IntelliJ hoặc máy phát triển

Yêu cầu Node.js tương thích Vite 8 và npm. CI của nhóm dùng Node.js 22; phiên bản ZXing được chọn tương thích với Node.js 22. Node.js 24 cũng đã được dùng để kiểm tra cục bộ.

```text
npm ci
npm run dev
```

Mở thư mục Cruise-web trong IntelliJ. Nếu đã có hỗ trợ Node.js, chọn Node interpreter rồi chạy script `dev` trong `package.json`. Bản IntelliJ trên máy kiểm tra không có loại cấu hình Node.js, nên dự án được mở trong IDE còn Vite được chạy bằng Node cục bộ. Không cài thêm plugin hay đổi cấu hình các dự án cũ.

API đặt bằng `VITE_API_BASE_URL` trong `.env.local` theo `.env.example`. Mặc định là `http://localhost:8080/api`. Backend localhost:8080 chưa hoạt động tại lúc kiểm tra; chưa xác nhận tích hợp với backend thật hay camera/NFC vật lý.

```text
npm run build
npm run lint
npm test
```

Bộ kiểm thử bổ sung bao phủ chuyển tour, chọn tour thật thay vì mặc định ID 1, lỗi dữ liệu, mất mạng, xác nhận từ API, quét trùng, quyền camera, NFC không hỗ trợ và thu hồi tài nguyên. Ảnh và kết quả trình duyệt đi kèm dùng API giả lập riêng và QR sinh tự động qua luồng video canvas, có chạy bộ giải mã ZXing thật.
