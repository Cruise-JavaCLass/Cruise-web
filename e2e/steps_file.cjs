module.exports = function () {
  return actor({
    loginAsCrew(username = 'admin', password = 'admin123') {
      this.amOnPage('/login');
      this.waitForElement('#username-input', 10);
      this.fillField('#username-input', username);
      this.fillField('#password-input', password);
      this.click('Đăng nhập Vận Hành');
    },

    loginAsPassenger(cabinNumber = '402', verification = 'Nguyễn Văn Minh') {
      this.amOnPage('/login?tab=passenger');
      this.waitForElement('#cabin-input', 10);
      this.fillField('#cabin-input', cabinNumber);
      this.fillField('#guest-verify-input', verification);
      this.click('Mở Khóa Ví Chi Tiêu & Dịch Vụ');
      this.waitInUrl('/passenger-home', 10);
    },
  });
};
