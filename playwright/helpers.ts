import type { Page } from '@playwright/test';

export async function loginAsCrew(
  page: Page,
  username: string = 'admin',
  password: string = 'admin123'
): Promise<void> {
  await page.goto('/login');
  await page.locator('#username-input').fill(username);
  await page.locator('#password-input').fill(password);
  await page.getByRole('button', { name: 'Đăng nhập Vận Hành' }).click();
}

export async function loginAsPassenger(
  page: Page,
  cabinNumber: string = '402',
  verification: string = 'Nguyễn Văn Minh'
): Promise<void> {
  await page.goto('/login?tab=passenger');
  await page.locator('#cabin-input').fill(cabinNumber);
  await page.locator('#guest-verify-input').fill(verification);
  await page.getByRole('button', { name: 'Mở Khóa Ví Chi Tiêu & Dịch Vụ' }).click();
  await page.waitForURL(/\/passenger-home/);
}
