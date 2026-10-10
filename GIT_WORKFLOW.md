# Quy chuẩn Git Workflow & CI/CD — Cruise Frontend Web

> **Dự án:** Cruise Activity and Service Management System - Frontend Web  
> **Jira Story:** [KAN-37](https://huytran20052022.atlassian.net/browse/KAN-37) | **Task:** [KAN-57](https://huytran20052022.atlassian.net/browse/KAN-57)

Tài liệu này định nghĩa quy chuẩn làm việc với Git, chiến lược phân nhánh (Branching Strategy), quy ước commit (Commit Conventions), quy trình Pull Request và hướng dẫn thiết lập bảo vệ nhánh trên GitHub cho ứng dụng Frontend Web.

---

## 1. Chiến lược phân nhánh (Branching Strategy: GitHub Flow)

Hệ thống áp dụng mô hình **GitHub Flow** tinh gọn, đảm bảo nhánh `main` luôn ở trạng thái ổn định và sẵn sàng triển khai:

```
main (Protected) ──────────●────────────────────────● (Merge PR)
                           \                       /
feature/KAN-xx              ●────────●────────────● (Commits & PR)
```

### Các loại nhánh:
* **`main` (Nhánh chính):**
  * Luôn ổn định, phản ánh phiên bản triển khai mới nhất.
  * **Bảo vệ nghiêm ngặt:** Không được phép push trực tiếp (`git push origin main` bị cấm). Mọi thay đổi bắt buộc phải thông qua Pull Request (PR) được duyệt và vượt qua kiểm thử CI.
* **`feature/<JIRA-KEY>-<ten-tinh-nang>`:**
  * Sử dụng khi phát triển tính năng mới, trang mới, hoặc component mới.
  * Ví dụ: `feature/KAN-57-configure-git-workflow-and-ci`, `feature/KAN-35-initialize-frontend-project`.
* **`bugfix/<JIRA-KEY>-<ten-loi>`:**
  * Sử dụng khi sửa lỗi phát hiện trong quá trình kiểm thử hoặc phát triển.
  * Ví dụ: `bugfix/KAN-89-fix-login-form-validation`.
* **`hotfix/<JIRA-KEY>-<ten-loi-khan-cap>`:**
  * Nhánh sửa lỗi khẩn cấp trực tiếp từ `main`.

---

## 2. Quy ước đặt tên Commit (Commit Message Conventions)

Cấu trúc commit tuân thủ chuẩn **Conventional Commits** kết hợp mã định danh Jira Task:

```
[<JIRA-KEY>] <type>: <Mô tả ngắn gọn hành động bằng tiếng Anh hoặc tiếng Việt>
```

### Danh sách các loại commit (`type`):
* `feat`: Thêm tính năng mới, UI mới, trang mới (Feature).
* `fix`: Sửa lỗi giao diện hoặc logic xử lý (Bug fix).
* `test`: Thêm hoặc cập nhật test suite Vitest / RTL.
* `refactor`: Tái cấu trúc code (không đổi giao diện, không sửa lỗi).
* `docs`: Thêm hoặc cập nhật tài liệu (README, SPEC).
* `chore`: Cập nhật cấu hình build Vite, dependency, tailwind, CI/CD.
* `style`: Định dạng code, căn lề, format.

### Ví dụ chuẩn:
```bash
[KAN-57] feat: Configure Git workflow, branch protection rules, and GitHub Actions CI pipeline
[KAN-52] test: Add sample frontend integration and user event tests
[KAN-35] feat: Initialize React Vite frontend project with Tailwind CSS
```

---

## 3. Quy trình làm việc hàng ngày (Daily Developer Workflow)

### Bước 1: Đồng bộ nhánh `main` mới nhất
```bash
git checkout main
git pull origin main
```

### Bước 2: Tạo nhánh feature mới
```bash
git checkout -b feature/KAN-xx-ten-tinh-nang
```

### Bước 3: Phát triển và kiểm thử cục bộ (Local Testing)
Trước khi commit, bắt buộc kiểm thử chạy thành công 100%:
```bash
# Kiểm tra lint
npm run lint

# Chạy toàn bộ test suites kèm coverage
npm run test:coverage

# Kiểm tra build production
npm run build
```

### Bước 4: Commit và Push lên Remote
```bash
git add .
git commit -m "[KAN-xx] feat: Mo ta thay doi"
git push -u origin feature/KAN-xx-ten-tinh-nang
```

### Bước 5: Mở Pull Request (PR) trên GitHub
1. Truy cập link Pull Request do terminal cung cấp hoặc trên giao diện GitHub.
2. Tiêu đề PR: `[KAN-xx] Tiêu đề tính năng`.
3. Gán Reviewer và gắn nhãn (Label).
4. Hệ thống **GitHub Actions CI Pipeline** sẽ tự động kích hoạt kiểm tra (Lint, Vitest, Coverage, Vite Build).
5. Sau khi CI pass (màu xanh ✅) và được duyệt, tiến hành bấm **Squash and merge** hoặc **Rebase and merge** vào `main`.
6. Xóa nhánh feature trên GitHub sau khi merge thành công.

---

## 4. Hướng dẫn thiết lập bảo vệ nhánh trên GitHub (Dành cho Repo Owner)

Để ngăn chặn việc vô tình ghi đè nhánh `main` và bắt buộc luồng CI hoạt động, Repository Owner cần thiết lập trên giao diện GitHub:

1. Truy cập repository: [Cruise-JavaCLass/Cruise-web](https://github.com/Cruise-JavaCLass/Cruise-web).
2. Vào **Settings** (tab trên cùng) ➔ chọn mục **Branches** ở cột bên trái.
3. Trong phần **Branch protection rules**, bấm nút **Add branch protection rule** (hoặc chọn *Rulesets*):
   * **Branch name pattern:** nhập `main`.
4. Tích chọn các mục sau:
   * ✅ **Require a pull request before merging:**
     * Bắt buộc mọi code vào `main` đều phải thông qua PR.
     * *(Tùy chọn)* Bật *Require approvals* (đặt giá trị: 1).
   * ✅ **Require status checks to pass before merging:**
     * Bật *Require branches to be up to date before merging*.
     * Trong ô tìm kiếm status checks, tìm và tích chọn: `Build & Test (Node.js 22 / Vitest)`.
   * ✅ **Do not allow bypassing the above settings:** Áp dụng cho cả Administrators.
5. Bấm **Save changes** để hoàn tất.

---

## 5. Tự động hóa CI/CD với GitHub Actions

File cấu hình CI đặt tại: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

Mỗi khi có code mới được `push` hoặc `pull_request` vào `main`, pipeline tự động:
1. Khởi tạo môi trường Ubuntu với Node.js 22.
2. Cài đặt dependencies sạch sẽ bằng `npm ci`.
3. Kiểm tra mã nguồn với linter `oxlint`.
4. Chạy toàn bộ 24 test suites bằng `npm run test:ci` (Vitest v8 coverage).
5. Lưu trữ artifact:
   * **Báo cáo Vitest Coverage:** lưu 14 ngày.
   * **Bản build Production (`dist/`):** lưu 7 ngày.
