Feature('Crew & Admin Operations User Flow');

Scenario('Admin đăng nhập và kiểm tra các phân hệ vận hành chính', ({ I }) => {
  // 1. Đăng nhập SYSTEM_ADMIN
  I.loginAsCrew('admin', 'admin123');
  I.waitForText('Hệ Thống Quản Lý Dịch Vụ & Hoạt Động Du Thuyền', 10);
  I.waitForText('Online (Port 8080', 10);

  // 2. Quản lý Đội tàu
  I.click('Quản lý Đội tàu');
  I.waitInUrl('/ships', 10);
  I.waitForText('Quản Lý Đội Tàu Du Lịch', 10);

  // 3. Hải trình & Cảng dừng
  I.click('Hải trình & Cảng dừng');
  I.waitInUrl('/itinerary', 10);
  I.waitForText('Quản Lý Tour Du Lịch Du Thuyền', 10);

  // 4. Tour Trên Bờ (Shore Excursion)
  I.click('Tour Trên Bờ (Excursion)');
  I.waitInUrl('/excursions', 10);
  I.waitForText('Quản Lý Tour Trên Bờ', 10);

  // 5. POS & Chi tiêu Onboard
  I.click('POS & Chi tiêu Onboard');
  I.waitInUrl('/pos', 10);
  I.waitForText('Hệ Thống POS & Tài Khoản Phi Tiền Mặt', 10);

  // 6. Tất toán & Hoá đơn
  I.click('Tất toán & Hoá đơn');
  I.waitInUrl('/billing/settlement', 10);
  I.waitForText('Tất toán & Hoá đơn', 10);

  // 7. Đăng xuất
  I.click('button[aria-label="Đăng xuất"]');
  I.waitInUrl('/login', 10);
  I.waitForElement('#username-input', 10);
});

Scenario('Phân quyền RBAC: Điều phối viên bị chặn khi vào trang Quản lý Người dùng', ({ I }) => {
  I.loginAsCrew('coordinator', 'admin123');
  I.waitInUrl('/itinerary', 10);
  I.waitForText('Quản Lý Tour Du Lịch Du Thuyền', 10);

  // Truy cập trái phép /users -> điều hướng sang /forbidden
  I.amOnPage('/users');
  I.waitInUrl('/forbidden', 10);
  I.waitForText('Bạn không có quyền truy cập', 10);

  I.click('button[aria-label="Đăng xuất"]');
  I.waitInUrl('/login', 10);
});
