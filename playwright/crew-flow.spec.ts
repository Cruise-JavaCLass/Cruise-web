import { test, expect, type Page } from '@playwright/test';
import { loginAsCrew } from './helpers.ts';

async function closeAnyModal(page: Page): Promise<void> {
  const closeBtn = page
    .locator(
      'button[aria-label="Đóng form"], button[aria-label="Đóng modal đăng ký"], button[aria-label="Đóng"], button[aria-label="Close"], button:has-text("Hủy bỏ"), button:has-text("Hủy"), button:has-text("Cancel"), button:has-text("Đóng"), [role="dialog"] button:has(svg.lucide-x)'
    )
    .first();
  if (await closeBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await closeBtn.click();
    return;
  }
  await page.keyboard.press('Escape');
}

test.describe('Crew & Admin Operations — Toàn bộ 14 phân hệ, mọi nút & mọi field', () => {
  test('Admin đi hết 14 module, bấm hết tab/filter và điền đầy đủ các form modal', async ({ page }) => {
    test.setTimeout(240_000);

    await test.step('00. Login: bấm các nút Testing Guidelines, gõ tay username/password, hiện/ẩn MK & đăng nhập', async () => {
      await page.goto('/login');
      await page.getByText('Hỗ trợ môi trường kiểm thử (Testing Guidelines)').click();
      await page.getByRole('button', { name: 'Ops Manager' }).click();
      await page.getByRole('button', { name: 'Điều Phối Viên' }).click();
      await page.getByRole('button', { name: 'Admin Toàn Quyền' }).click();

      await page.locator('#username-input').fill('');
      await page.locator('#username-input').fill('admin');
      await page.locator('#password-input').fill('');
      await page.locator('#password-input').fill('admin123');
      await page.locator('button[aria-label="Hiển thị mật khẩu"]').click();
      await page.locator('button[aria-label="Ẩn mật khẩu"]').click();
      await page.getByRole('button', { name: 'Đăng nhập Vận Hành' }).click();
    });

    await test.step('01. Dashboard (/): kiểm tra Gateway Online & gõ tìm trong Command Palette', async () => {
      await expect(page.getByText('Hệ Thống Quản Lý Dịch Vụ & Hoạt Động Du Thuyền')).toBeVisible();
      await expect(page.getByText(/Online \(Port 8080/)).toBeVisible();

      await page.getByRole('button', { name: /Tìm nhanh phân hệ/ }).click();
      const cmdInput = page.getByPlaceholder(/Tìm nhanh phân hệ điều hành/);
      await expect(cmdInput).toBeVisible();
      await cmdInput.fill('POS');
      await cmdInput.fill('Hải trình');
      await page.getByRole('button', { name: 'Đóng tìm kiếm nhanh' }).click();
      await expect(cmdInput).toBeHidden();
    });

    await test.step('02. Đội tàu (/ships): lọc, điền đủ tất cả field trong ShipFormModal & xem chi tiết', async () => {
      await page.getByRole('link', { name: /Quản lý Đội tàu/ }).click();
      await expect(page).toHaveURL(/\/ships/);
      await expect(page.getByText('Quản Lý Đội Tàu Du Lịch')).toBeVisible();

      const searchShip = page.getByLabel('Tìm kiếm tàu du lịch');
      await searchShip.fill('Grand');
      await searchShip.fill('');
      await page.getByLabel('Lọc theo trạng thái').selectOption('ACTIVE');
      await page.getByLabel('Lọc theo trạng thái').selectOption('ALL');

      // Mở modal Thêm Tàu -> điền full 13+ fields -> Hủy bỏ
      await page.getByRole('button', { name: /Thêm Tàu|Tạo Tàu/i }).click();
      await page.locator('#name').fill('Grand Pearl Test Explorer');
      await page.locator('#code').fill('SHIP-TEST-99');
      await page.locator('#operator').fill('Grand Pearl Maritime');
      await page.locator('#status').selectOption('ACTIVE');
      await page.locator('#capacity').fill('2500');
      await page.locator('#crewCapacity').fill('800');
      await page.locator('#totalCabins').fill('1150');
      await page.locator('#totalDecks').fill('14');
      await page.locator('#manufacturingYear').fill('2025');
      await page.locator('#lengthMeters').fill('320.5');
      await page.locator('#beamMeters').fill('39.2');
      await page.locator('#draftMeters').fill('8.4');
      await page.locator('#amenities').fill('Sky Pool, Theater, Helipad, 5 Restaurants');
      await page.locator('#description').fill('Du thuyền test tự động bằng Playwright.');
      await page.getByRole('button', { name: 'Hủy bỏ' }).click();

      const detailShipBtn = page.locator('a[aria-label^="Xem chi tiết"], button[aria-label^="Xem chi tiết"]').first();
      if (await detailShipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await detailShipBtn.click();
        await expect(page).toHaveURL(/\/ships\/\d+/);
        await page.getByRole('link', { name: /Quản lý Đội tàu/ }).click();
      }
    });

    await test.step('03. Khu vực & Chính sách (/admin/cruise-area-policies): điền form Boong & form Chính sách hủy', async () => {
      await page.getByRole('link', { name: /Khu vực & Chính sách/ }).click();
      await expect(page).toHaveURL(/\/admin\/cruise-area-policies/);

      // Tab 1: Sơ Đồ Boong -> điền toàn bộ field
      await page.getByRole('button', { name: 'Sơ Đồ Boong (Decks)' }).click();
      await page.getByPlaceholder('VD: Quầy Bar Hồ Bơi Phía Đông').fill('Khu Vực Boong 9 Test');
      await page.getByPlaceholder('VD: DECK9-POOL-EAST').fill('DECK9-TEST-01');
      const deckCapacity = page.locator('form input[type="number"]').last();
      await deckCapacity.fill('150');
      const deckTypeSelect = page.locator('form select').last();
      await deckTypeSelect.selectOption('DINING');
      const checkboxes = page.locator('form input[type="checkbox"]');
      const cbCount = await checkboxes.count();
      for (let i = 0; i < cbCount; i++) {
        await checkboxes.nth(i).click();
        await checkboxes.nth(i).click();
      }
      await page.locator('button[title="Tải lại"]').click();

      // Tab 2: Chính Sách Hoàn Hủy -> điền toàn bộ field
      await page.getByRole('button', { name: 'Chính Sách Hoàn Hủy' }).click();
      await page.getByPlaceholder('VD: Tour Bờ Hoàn Tiền 100% 24h').fill('Chính sách hoàn 100% trước 24h');
      await page.locator('form select').last().selectOption('SPA');
      const policyNumbers = page.locator('form input[type="number"]');
      if ((await policyNumbers.count()) >= 2) {
        await policyNumbers.nth(0).fill('24');
        await policyNumbers.nth(1).fill('100');
      }
    });

    await test.step('04. Hải trình (/itinerary): lọc, mở Tạo Hải Trình Mới & điền đủ 14 field', async () => {
      await page.getByRole('link', { name: /Hải trình & Cảng dừng/ }).click();
      await expect(page).toHaveURL(/\/itinerary/);
      await expect(page.getByText('Quản Lý Tour Du Lịch Du Thuyền')).toBeVisible();

      const searchTour = page.getByPlaceholder('Tìm theo tên tour, mã, cảng, tàu...');
      await searchTour.fill('Hạ Long');
      await searchTour.fill('');
      await page.getByLabel('Lọc theo trạng thái').selectOption('PUBLISHED');
      await page.getByLabel('Lọc theo trạng thái').selectOption('ALL');

      await page.getByRole('button', { name: 'Tạo Hải Trình Mới' }).click();
      await page.locator('#name').fill('Hải Trình Vịnh Bắc Bộ Test 4N3Đ');
      await page.locator('#code').fill('TOUR-TEST-04');
      await page.locator('#durationDays').fill('4');
      await page.locator('#durationNights').fill('3');
      await page.locator('#departurePort').fill('Cảng Quốc Tế Hạ Long');
      await page.locator('#destinationPort').fill('Cảng Tiên Sa Đà Nẵng');
      await page.locator('#startDate').fill('2026-12-01');
      await page.locator('#endDate').fill('2026-12-04');
      await page.locator('#maxCapacity').fill('1800');
      await page.locator('#basePrice').fill('14500000');
      await page.locator('#status').selectOption('PUBLISHED');
      await page.locator('#imageUrl').fill('https://images.unsplash.com/photo-1507525428034-b723cf961d3e');
      await page.locator('#itineraryOverview').fill('Hạ Long -> Huế -> Đà Nẵng');
      await page.locator('#description').fill('Mô tả hành trình test tự động.');
      await closeAnyModal(page);
    });

    await test.step('05. Vận hành Hải trình (/voyage): mở modal tạo mới & điền đủ field', async () => {
      await page.getByRole('link', { name: /Vận hành Hải trình/ }).click();
      await expect(page).toHaveURL(/\/voyage/);
      const initBtn = page.getByRole('button', { name: /Initialize|Khởi tạo|Tạo/i }).first();
      if (await initBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await initBtn.click();
        const voyageNumInput = page.locator('#create-voyage-number');
        if (await voyageNumInput.isVisible({ timeout: 1500 }).catch(() => false)) {
          await voyageNumInput.fill('VOY-TEST-2026');
          await page.locator('#create-ship-id').fill('SHIP-001');
          await page.locator('#create-itinerary-name').fill('Hạ Long - Đà Nẵng Test');
          await closeAnyModal(page);
        }
      }
    });

    await test.step('06. Tour Trên Bờ (/excursions + Providers + Dispatcher + Analytics): điền đủ các modal', async () => {
      await page.getByRole('link', { name: /Tour Trên Bờ/ }).click();
      await expect(page).toHaveURL(/\/excursions/);
      await expect(page.getByText('Quản Lý Tour Trên Bờ')).toBeVisible();

      await page.locator('button[title="Xem dạng bảng"]').click();
      await page.locator('button[title="Xem dạng thẻ"]').click();
      await page.locator('button[title="Làm mới"]').click();

      // Mở Tạo Excursion Mới -> điền tất cả field
      await page.getByRole('button', { name: 'Tạo Excursion Mới' }).click();
      await page.locator('#excursion-title').fill('Tour Khám Phá Hang Luồn Test');
      await page.locator('#excursion-code').fill('EXC-TEST-01');
      await page.locator('#excursion-category').selectOption('SIGHTSEEING');
      await page.locator('#excursion-difficulty').selectOption('MODERATE');
      await page.locator('#excursion-description').fill('Chèo kayak và tham quan hang động.');
      await page.locator('#excursion-date').fill('2026-12-02');
      await page.locator('#excursion-meeting-time').fill('08:00');
      await page.locator('#excursion-departure-time').fill('08:30');
      await page.locator('#excursion-return-time').fill('12:00');
      await page.locator('#excursion-all-aboard-time').fill('12:30');
      await page.locator('#excursion-operator').fill('Halong Heritage Travel');
      await page.locator('#excursion-operator-contact').fill('+84901234567');
      await page.locator('#excursion-guide').fill('Hoàng Hải Đăng');
      await page.locator('#excursion-guide-phone').fill('+84912888999');
      await page.locator('#excursion-bus').fill('XE-VIP-01');
      await page.locator('#excursion-capacity').fill('45');
      const excPrice = page.locator('#excursion-price');
      if (await excPrice.isVisible({ timeout: 1000 }).catch(() => false)) {
        await excPrice.fill('950000');
      }
      await page.locator('#excursion-image-url').fill('https://images.unsplash.com/photo-1528127269322-539801943592');
      await closeAnyModal(page);

      // Providers: tìm kiếm + mở modal thêm nhà cung cấp -> điền full
      await page.goto('/excursions/providers');
      await expect(page).toHaveURL(/\/excursions\/providers/);
      await page.getByLabel('Tìm kiếm nhà cung cấp').fill('Hạ Long');
      await page.getByLabel('Tìm kiếm nhà cung cấp').fill('');
      const addProviderBtn = page.getByRole('button', { name: /Thêm Nhà Cung Cấp|Tạo/i }).first();
      if (await addProviderBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await addProviderBtn.click();
        await page.locator('#provider-name').fill('Đối Tác Test Đà Nẵng');
        await page.locator('#provider-tax-code').fill('0401234567');
        await page.locator('#provider-license-number').fill('GP-DN-2026');
        await page.locator('#provider-email').fill('partner@danangtour.vn');
        await page.locator('#provider-emergency-hotline').fill('+84909111222');
        await page.locator('#provider-port-id').fill('VNDAD');
        await closeAnyModal(page);
      }

      // Dispatcher & Analytics (bấm hết 3 tabs)
      await page.goto('/excursion-dispatcher');
      await expect(page).toHaveURL(/\/excursion-dispatcher/);
      const dispSearch = page.getByPlaceholder(/Tìm theo tên, cabin, mã vé EXC/);
      if (await dispSearch.isVisible({ timeout: 1500 }).catch(() => false)) {
        await dispSearch.fill('EXC');
        await dispSearch.fill('');
      }

      await page.goto('/excursion-analytics');
      await expect(page).toHaveURL(/\/excursion-analytics/);
      const analyticsTabs = page.locator('button').filter({ hasText: /Đội xe|Đánh giá|Scorecard|Fleet|Review/i });
      const tabCount = await analyticsTabs.count();
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        await analyticsTabs.nth(i).click();
      }
    });

    await test.step('07. Điểm Danh Tour Bờ (/excursion-attendance): gõ QR modal & xem Khách Chưa Về', async () => {
      await page.goto('/excursion-attendance');
      await expect(page).toHaveURL(/\/excursion-attendance/);
      await page.locator('button[title="Làm mới dữ liệu"]').click();

      await page.getByRole('button', { name: /Quét QR \/ Thẻ/ }).click();
      const qrInput = page.locator('input[placeholder*="EXC-TKT"], input[placeholder*="mã"], input[placeholder*="cabin"]').first();
      if (await qrInput.isVisible({ timeout: 1500 }).catch(() => false)) {
        await qrInput.fill('EXC-TKT-001');
      }
      await closeAnyModal(page);

      await page.getByRole('button', { name: /Khách Chưa Về/ }).click();
      await closeAnyModal(page);
    });

    await test.step('08. Hoạt động (/activities + Attendance + Roster): điền ActivityModal & Walk-in Modal', async () => {
      await page.getByRole('link', { name: /Hoạt động & Excursion/ }).click();
      await expect(page).toHaveURL(/\/activities/);
      const searchAct = page.getByPlaceholder(/VD: Yoga/);
      await searchAct.fill('Gala');
      await searchAct.fill('');

      await page.getByRole('button', { name: /Tạo Hoạt Động|Thêm Hoạt Động/i }).first().click();
      await page.locator('#activity-form-title').fill('Yoga Bình Minh Boong Thượng Test');
      await page.locator('#activity-form-location').fill('Sundeck - Tầng 12');
      await page.locator('#activity-form-day-number').fill('2');
      await page.locator('#activity-form-date').fill('2026-12-02');
      await page.locator('#activity-form-start-time').fill('06:30');
      await page.locator('#activity-form-end-time').fill('07:30');
      await page.locator('#activity-form-capacity').fill('40');
      if (await page.locator('#activity-form-included').isChecked()) {
        await page.locator('#activity-form-included').click();
      }
      await page.locator('#activity-form-price').fill('250000');
      await page.locator('#activity-form-desc').fill('Lớp yoga thư giãn buổi sáng trên boong tàu.');
      await closeAnyModal(page);

      // Activity Attendance: bấm 3 tab & điền modal Walk-in
      await page.goto('/activity-attendance');
      await expect(page).toHaveURL(/\/activity-attendance/);
      await page.getByRole('button', { name: 'Thẻ RFID', exact: true }).click();
      await page.getByRole('button', { name: 'Số Cabin', exact: true }).click();
      await page.getByRole('button', { name: 'Mã QR', exact: true }).click();
      await page.getByRole('button', { name: 'Bật Camera Quét QR' }).click();
      await closeAnyModal(page);

      await page.getByRole('button', { name: 'Khách Vãng Lai (+ Walk-in)' }).click();
      await page.getByPlaceholder('VD: 101, A-204...').fill('402');
      await page.getByPlaceholder('Nhập họ tên nếu có...').fill('Nguyễn Văn Minh');
      await page.getByPlaceholder('Ghi chú thêm về khách...').fill('Khách đăng ký tại cửa test');
      await closeAnyModal(page);

      // Activity Roster
      await page.goto('/activity-roster');
      await expect(page).toHaveURL(/\/activity-roster/);
      await page.getByPlaceholder('Tìm tên khách, số cabin...').fill('Minh');
      const waitlistTab = page.getByRole('button', { name: /Hàng chờ|Waitlist/i }).first();
      if (await waitlistTab.isVisible({ timeout: 1500 }).catch(() => false)) {
        await waitlistTab.click();
      }
    });

    await test.step('09. POS & Chi tiêu Onboard (/pos): gõ tìm kiếm, barcode, cabin, chọn món & bấm 6 tabs', async () => {
      await page.getByRole('link', { name: /POS & Chi tiêu Onboard/ }).click();
      await expect(page).toHaveURL(/\/pos/);
      await expect(page.getByText('Hệ Thống POS & Tài Khoản Phi Tiền Mặt')).toBeVisible();

      const itemSearch = page.getByPlaceholder('Tìm kiếm theo tên món hoặc mã SKU...');
      await expect(itemSearch).toBeVisible();
      await itemSearch.fill('Mojito');
      await itemSearch.fill('');
      await page.getByPlaceholder('Quét mã vạch...').fill('893850123401');

      // Toggle VAT & Happy Hour + Category tabs
      await page.getByRole('button', { name: /Tại Cảng/ }).click();
      await page.getByRole('button', { name: /Happy Hour/ }).click();
      await page.getByRole('button', { name: 'Tất Cả' }).click();

      // Thêm 1 món vào giỏ -> chờ ModifierSelectorModal -> chọn modifier & điền ghi chú -> Thêm vào giỏ -> nhập Cabin -> chọn 3 payment -> xóa giỏ
      const addItemBtn = page.getByRole('button', { name: /Pacific Sunset Mojito/ }).first();
      await expect(addItemBtn).toBeVisible({ timeout: 5000 });
      await addItemBtn.click();
      const modDialog = page.getByRole('dialog', { name: /Pacific Sunset Mojito/ });
      await expect(modDialog).toBeVisible({ timeout: 10000 });
      await modDialog.getByRole('button', { name: /No Sugar Added/ }).click();
      await page.locator('#modifier-notes-input').fill('Ít đá, không đường');
      await modDialog.getByRole('button', { name: 'Thêm vào giỏ' }).click();
      await expect(modDialog).toBeHidden({ timeout: 5000 });

      await page.getByPlaceholder('Nhập số Cabin (vd: CABIN-7012)').fill('402');
      await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click();
      await page.getByRole('button', { name: 'Thẻ Tín Dụng', exact: true }).click();
      await page.getByRole('button', { name: 'Tiền Mặt', exact: true }).click();
      await page.getByRole('button', { name: 'Tài Khoản Phòng', exact: true }).click();

      const clearCartBtn = page.locator('button[title="Xóa toàn bộ giỏ hàng"]');
      await expect(clearCartBtn).toBeVisible({ timeout: 5000 });
      await clearCartBtn.click();

      for (const tabRegex of [
        /Sổ Cái Giao Dịch/,
        /Quản Lý Danh Mục & Giá/,
        /Trung Tâm Đối Soát/,
        /Hồ Sơ Khiếu Nại Chi Phí/,
        /Bảng Điều Khiển Đồng Bộ/,
        /Quầy Bán Hàng \(POS Register\)/,
      ]) {
        await page.getByRole('button', { name: tabRegex }).click();
      }
      await page.getByRole('button', { name: 'Kiểm Tra Kết Nối' }).click();
    });

    await test.step('10. Hành khách & Check-in (/passengers): lọc, tìm, điền đủ RegisterPassengerModal', async () => {
      await page.getByRole('link', { name: /Hành khách & Check-in/ }).click();
      await expect(page).toHaveURL(/\/passengers/);
      const searchPax = page.getByLabel('Tìm kiếm hành khách');
      await searchPax.fill('Minh');
      await page.getByLabel('Xóa tìm kiếm').click();
      await page.getByLabel('Tải lại danh sách').click();

      const registerBtn = page.getByRole('button', { name: /Đăng Ký Hành Khách|Thêm Hành Khách/i }).first();
      if (await registerBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await registerBtn.click();
        await page.getByLabel('Họ và tên hành khách').fill('Trần Văn Kiểm Thử');
        await page.getByLabel('Email').fill('kiemthu@cruise.vn');
        await page.getByLabel('Số điện thoại').fill('0909888777');
        await page.getByLabel('Số cabin').fill('608 (Ban công)');
        await page.getByLabel('Tạo mã ngẫu nhiên').click();
        await page.getByLabel('Khu vực BLE').fill('Zone A - Sky Lounge');
        await page.getByLabel('Trạng thái đăng ký').selectOption('CONFIRMED');
        await closeAnyModal(page);
      }
    });

    await test.step('11. Cảng Đón Khách (/embarkation): điền mã tra cứu & bấm nút tìm / quét thẻ', async () => {
      await page.getByRole('link', { name: /Cảng Đón Khách/ }).click();
      await expect(page).toHaveURL(/\/embarkation/);
      const lookupInput = page.getByPlaceholder(/B9827361/);
      await lookupInput.fill('RFID-99412');
      await page.getByRole('button', { name: 'Tìm', exact: true }).click();

      const rfidInput = page.getByPlaceholder('Chạm thẻ trắng vào đầu đọc RFID...');
      if (await rfidInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await rfidInput.fill('RFID-UID-0009');
      }
    });

    await test.step('12. Tất toán & Hoá đơn (/billing/settlement & /provider-settlement): tra cứu cabin 402', async () => {
      await page.getByRole('link', { name: /Tất toán & Hoá đơn/ }).click();
      await expect(page).toHaveURL(/\/billing\/settlement/);
      await expect(page.getByRole('heading', { name: 'Tất toán & Hoá đơn' })).toBeVisible();
      await page.getByPlaceholder('CABIN-7012').fill('402');
      await page.locator('form button[type="submit"]').first().click();

      await page.goto('/provider-settlement');
      await expect(page).toHaveURL(/\/provider-settlement/);
    });

    await test.step('13. Báo Cáo Doanh Thu (/reports/operational): chọn đủ 4 filter, ngày, định dạng & mở Khay Tải', async () => {
      await page.getByRole('link', { name: /Báo Cáo Doanh Thu/ }).click();
      await expect(page).toHaveURL(/\/reports\/operational/);
      await page.locator('#report-filter-dimension').selectOption('PAYMENT_METHOD');
      await page.locator('#report-filter-payment').selectOption('CABIN_FOLIO');
      await page.locator('#report-filter-start-date').fill('2026-10-01');
      await page.locator('#report-filter-end-date').fill('2026-11-30');
      await page.getByLabel('Định dạng xuất file').selectOption('EXCEL');
      await page.getByRole('button', { name: 'Áp Dụng Bộ Lọc' }).click();
      await page.getByRole('button', { name: /Khay Tải/ }).click();
      await closeAnyModal(page);
    });

    await test.step('14. Quản lý Người dùng (/users): tìm kiếm, lọc & điền đủ UserFormModal', async () => {
      await page.getByRole('link', { name: 'Quản lý Người dùng' }).click();
      await expect(page).toHaveURL(/\/users/);
      await page.getByLabel('Tìm kiếm người dùng').fill('admin');
      await page.getByLabel('Tìm kiếm người dùng').fill('');
      await page.getByLabel('Lọc theo vai trò').selectOption('SYSTEM_ADMIN');
      await page.getByLabel('Lọc theo vai trò').selectOption('ALL');

      await page.getByRole('button', { name: 'Thêm Người Dùng' }).click();
      await page.locator('#username').fill('test.crew.01');
      await page.locator('#password').fill('Cruise@2026!');
      await page.locator('#fullName').fill('Nguyễn Văn Kiểm Thử');
      await page.locator('#email').fill('test.crew.01@cruise.vn');
      await page.locator('#role').selectOption('POS_STAFF');
      await closeAnyModal(page);
    });

    await test.step('15. Đăng xuất Admin', async () => {
      await page.getByRole('button', { name: 'Đăng xuất' }).click();
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('#username-input')).toBeVisible();
    });
  });

  test('Kiểm tra phân quyền RBAC (coordinator bị chặn /users & /pos)', async ({ page }) => {
    await loginAsCrew(page, 'coordinator', 'admin123');
    await expect(page).toHaveURL(/\/itinerary/);
    await expect(page.getByText('Quản Lý Tour Du Lịch Du Thuyền')).toBeVisible();

    await page.goto('/users');
    await expect(page).toHaveURL(/\/forbidden/);
    await expect(page.getByText('Bạn không có quyền truy cập')).toBeVisible();

    await page.goto('/pos');
    await expect(page).toHaveURL(/\/forbidden/);

    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
