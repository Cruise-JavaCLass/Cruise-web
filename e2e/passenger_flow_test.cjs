Feature('Passenger Portal User Flow');

Scenario('Hành khách đăng nhập và duyệt toàn bộ cổng dịch vụ (Portal)', ({ I }) => {
  // 1. Đăng nhập với hành khách mẫu trên DB (Phòng 402 - Nguyễn Văn Minh)
  I.loginAsPassenger('402', 'Nguyễn Văn Minh');
  I.waitForText('Nguyễn Văn Minh', 10);

  // 2. Mở Thẻ Lên Tàu
  I.click('Thẻ Lên Tàu');
  I.waitInUrl('/boarding-pass', 10);
  I.waitForText('Tra cứu thẻ lên tàu của hành khách hoặc phòng khác', 10);

  // 3. Mở Lịch Trình Cá Nhân
  I.click('Lịch Trình');
  I.waitInUrl('/my-schedule', 10);
  I.waitForText('Lịch Trình Cá Nhân', 10);

  // 4. Mở Ví Chi Tiêu (Folio)
  I.click('Ví Chi Tiêu');
  I.waitInUrl('/passenger/folio', 10);
  I.waitForText('Chi Phí Phòng & Sao Kê Trực Tuyến', 10);

  // 5. Mở Tour Của Tôi
  I.click('Tour Của Tôi');
  I.waitInUrl('/excursions/my-passes', 10);
  I.waitForText('Vé Tour Bờ & Thẻ Lên Xe', 10);

  // 6. Mở Khám Phá Dịch Vụ (Catalog)
  I.click('Khám Phá Dịch Vụ');
  I.waitInUrl('/catalog', 10);
  I.waitForText('Duyệt Hoạt Động & Tour Bờ', 10);

  // 7. Đăng xuất quay lại màn hình đăng nhập hành khách
  I.click('button[title="Đăng xuất khỏi tài khoản hành khách"]');
  I.waitInUrl('/login', 10);
  I.waitForElement('#cabin-input', 10);
});
