import { test, expect } from '@playwright/test';

test.describe('Passenger Portal — Toàn bộ luồng, mọi nút & mọi ô nhập liệu', () => {
  test('Login hành khách -> điền form, bấm hết nút, tab, filter, drawer và modal trên 6 trang', async ({ page }) => {
    test.setTimeout(120_000);

    await test.step('1. Login: thử tất cả nút chọn nhanh + nhập tay số phòng & xác thực', async () => {
      await page.goto('/login?tab=passenger');
      await expect(page.locator('#cabin-input')).toBeVisible();

      // Thử chuyển tab Thủy thủ đoàn <-> Hành khách
      await page.getByRole('button', { name: 'Thủy Thủ Đoàn' }).click();
      await expect(page.locator('#username-input')).toBeVisible();
      await page.getByRole('button', { name: 'Hành Khách' }).click();
      await expect(page.locator('#cabin-input')).toBeVisible();

      // Thử cả 3 nút chọn nhanh khách hàng mẫu
      await page.getByRole('button', { name: /P\. 718/ }).click();
      await expect(page.locator('#cabin-input')).toHaveValue('718');
      await page.getByRole('button', { name: /P\. 505/ }).click();
      await expect(page.locator('#cabin-input')).toHaveValue('505');
      await page.getByRole('button', { name: /P\. 402/ }).click();

      // Xóa và gõ tay đầy đủ vào 2 ô input
      await page.locator('#cabin-input').fill('');
      await page.locator('#cabin-input').fill('402');
      await page.locator('#guest-verify-input').fill('');
      await page.locator('#guest-verify-input').fill('Nguyễn Văn Minh');

      await page.getByRole('button', { name: 'Mở Khóa Ví Chi Tiêu & Dịch Vụ' }).click();
      await page.waitForURL(/\/passenger-home/);
      await expect(page.getByText('Nguyễn Văn Minh').first()).toBeVisible();
    });

    await test.step('2. Trang Chủ (/passenger-home): kiểm tra thông tin & nút làm mới', async () => {
      const refreshBtn = page.getByRole('button', { name: /Làm mới/i }).first();
      if (await refreshBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await refreshBtn.click();
      }
      await expect(page.getByText('Nguyễn Văn Minh').first()).toBeVisible();
    });

    await test.step('3. Thẻ Lên Tàu (/boarding-pass): điền ô tra cứu & bấm các nút gợi ý', async () => {
      await page.getByRole('link', { name: 'Thẻ Lên Tàu' }).click();
      await expect(page).toHaveURL(/\/boarding-pass/);
      await expect(page.getByText('Tra cứu thẻ lên tàu của hành khách hoặc phòng khác')).toBeVisible();

      // Chuyển sang màn hình tra cứu -> gõ tay số phòng 718 -> submit
      await page.getByText('Tra cứu thẻ lên tàu của hành khách hoặc phòng khác').click();
      await page.locator('#lookup-input').fill('718');
      await page.getByRole('button', { name: 'Tra Cứu & Tải Thẻ Lên Tàu' }).click();
      await expect(page.getByText('Trần Thị Thu Thảo').first()).toBeVisible();

      // Quay lại bấm gợi ý nhanh Phòng 402
      await page.getByText('Tra cứu thẻ lên tàu của hành khách hoặc phòng khác').click();
      await page.getByRole('button', { name: /Phòng 402/ }).click();
      await expect(page.getByText('Nguyễn Văn Minh').first()).toBeVisible();
    });

    await test.step('4. Lịch Trình (/my-schedule): bấm đủ 6 tab ngày, 2 scope, drawer thông báo & làm mới', async () => {
      await page.getByRole('link', { name: 'Lịch Trình' }).click();
      await expect(page).toHaveURL(/\/my-schedule/);
      await expect(page.getByRole('heading', { name: /Lịch Trình Cá Nhân/ })).toBeVisible();

      for (const label of ['Ngày 2', 'Ngày 3', 'Ngày 4', 'Ngày 5', 'Toàn bộ hải trình', 'Ngày 1']) {
        await page.getByRole('button', { name: label, exact: true }).click();
      }

      await page.getByRole('button', { name: /Cả cabin/ }).click();
      await page.getByRole('button', { name: /Chỉ lịch của tôi/ }).click();

      // Mở Notification Drawer -> đóng bằng nút đóng (test fix portal)
      await page.getByTestId('notification-bell-btn').click();
      const closeDrawerBtn = page.getByTestId('close-drawer-button');
      await expect(closeDrawerBtn).toBeVisible();
      await closeDrawerBtn.click();
      await expect(closeDrawerBtn).toBeHidden();

      await page.getByRole('button', { name: 'Làm mới' }).click();
    });

    await test.step('5. Ví Chi Tiêu (/passenger/folio): kiểm tra sao kê & nút xuất sao kê', async () => {
      await page.getByRole('link', { name: 'Ví Chi Tiêu' }).click();
      await expect(page).toHaveURL(/\/passenger\/folio/);
      await expect(page.getByRole('heading', { name: /Chi Phí Phòng & Sao Kê Trực Tuyến/ })).toBeVisible();

      const exportBtn = page.getByRole('button', { name: /Xuất Sao Kê Tạm Tính/ });
      if (await exportBtn.isEnabled({ timeout: 2000 }).catch(() => false)) {
        await exportBtn.click();
      }
    });

    await test.step('6. Tour Của Tôi (/excursions/my-passes): làm mới danh sách vé', async () => {
      await page.getByRole('link', { name: 'Tour Của Tôi' }).click();
      await expect(page).toHaveURL(/\/excursions\/my-passes/);
      await expect(page.getByRole('heading', { name: /Vé Tour Bờ & Thẻ Lên Xe/ })).toBeVisible();
      await page.getByRole('button', { name: 'Làm Mới' }).click();
    });

    await test.step('7. Khám Phá Dịch Vụ (/catalog): gõ tìm kiếm, bấm mọi bộ lọc loại/giá/ngày & mở chi tiết', async () => {
      await page.getByRole('link', { name: 'Khám Phá Dịch Vụ' }).click();
      await expect(page).toHaveURL(/\/catalog/);
      await expect(page.getByRole('heading', { name: /Duyệt Hoạt Động & Tour Bờ/ })).toBeVisible();

      const searchInput = page.getByPlaceholder('Tìm kiếm theo tên hoạt động, tour trên bờ, địa điểm, cảng...');
      await searchInput.fill('Gala');

      for (const btnName of [
        'Trên tàu',
        'Tour trên bờ',
        'Tất cả loại hình',
        'Đã bao gồm',
        'Trả phí thêm',
        'Tất cả giá',
        'N1',
        'N2',
        'Mọi ngày',
      ]) {
        await page.getByRole('button', { name: btnName }).click();
      }

      const clearFilterBtn = page.getByRole('button', { name: /Xóa bộ lọc/ });
      if (await clearFilterBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await clearFilterBtn.click();
      } else {
        await searchInput.fill('');
      }

      const detailBtn = page.getByRole('button', { name: /Xem chi tiết|Đặt chỗ|Khám phá|Đăng ký/i }).first();
      if (await detailBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await detailBtn.click();
        const closeModal = page.locator('button[aria-label="Đóng"], button:has-text("Đóng")').first();
        if (await closeModal.isVisible({ timeout: 1500 }).catch(() => false)) {
          await closeModal.click();
        } else {
          await page.keyboard.press('Escape');
        }
      }
    });

    await test.step('8. Đăng xuất hành khách', async () => {
      await page.locator('button[title="Đăng xuất khỏi tài khoản hành khách"]').click();
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('#cabin-input')).toBeVisible();
    });
  });
});
