# MASTER EXECUTION PLAN FOR GEMINI FLASH — Cruise-web Dual-Theme Redesign & Maritime Lottie Integration

> **Target Workspace:** `c:/Users/huy/Desktop/JavaLesson/Cruise-web`
> **Branch:** `bugfix/KAN-521-isolate-passenger-portal-layout` (or feature branch as instructed by user)
> **Windows Shell Rule:** Always run `npx` / `npm` commands using `cmd /c npx ...` or `cmd /c npm ...` to avoid PowerShell `.ps1` execution policy blocks.

---

## 0. GOLDEN RULES FOR GEMINI FLASH (READ FIRST — DO NOT VIOLATE)

1. **100% Functional & Test Preservation:**
   - DO NOT modify any backend code, service files (`src/services/*.ts`), API contracts, route paths in `src/App.tsx`, or authentication logic (`AdminAuthGuard.tsx`, `authService.ts`).
   - DO NOT remove or rename any existing Vietnamese headings, button labels, `aria-label`, `title`, `role="alert"`, or `data-testid` attributes that existing `.test.tsx` files assert against.
2. **Two Strictly Separated Design Systems:**
   - **Area A — Admin Dashboard (`MainLayout.tsx`, `LoginPage.tsx` + 21 Admin Pages):** **Soft Editorial / Modern SaaS** (Light, calm, warm off-white `#F6F7F9`, crisp white `#FFFFFF` surfaces, subtle `#E5E7EB` borders, muted blue `#5277D9` accent, moderate `8px–16px` radii, tabular numerals).
   - **Area B — Passenger Portal (`PassengerLayout.tsx` + 6 Guest Pages):** **Retro-Futurism / Futuristic Maritime Terminal** (Deep ocean `#070B16`, secondary `#10182A`, surface `#151F33`, primary text `#F4F4F0`, secondary `#A7B4C9`, electric cyan `#42E8F5`, navigation blue `#4169FF`, retro amber `#FFBD59`, Space Grotesk + JetBrains Mono HUD coordinates & nautical chart grids).
3. **Minimal File Reads & Targeted Testing:**
   - Read each file ONCE before editing.
   - Run targeted Vitest checks after each wave instead of running the full suite repeatedly.

---

## 1. DESIGN SYSTEM TOKENS & CSS ARCHITECTURE (WAVE 0)

### Step 0.1 — Update `src/index.css`
Add Google Fonts (`Space Grotesk`, `Plus Jakarta Sans`, `JetBrains Mono`) and define scoped CSS variables for both themes so they never bleed into each other:

```css
/* Scope A: Soft Editorial / Modern SaaS (Admin Dashboard) */
[data-theme="admin-editorial"] {
  --bg-app: #F6F7F9;
  --bg-surface: #FFFFFF;
  --bg-surface-muted: #F1F3F7;
  --text-primary: #20242C;
  --text-secondary: #687080;
  --border-subtle: #E5E7EB;
  --accent-primary: #5277D9;
  --accent-surface: #EEF2FF;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;
  background-color: var(--bg-app);
  color: var(--text-primary);
}

/* Scope B: Retro-Futurism / Futuristic Maritime Terminal (Passenger Portal) */
[data-theme="passenger-retro"] {
  --bg-app: #070B16;
  --bg-secondary: #10182A;
  --bg-surface: #151F33;
  --text-primary: #F4F4F0;
  --text-secondary: #A7B4C9;
  --accent-cyan: #42E8F5;
  --accent-blue: #4169FF;
  --accent-amber: #FFBD59;
  --border-hud: rgba(66, 232, 245, 0.22);
  background-color: var(--bg-app);
  color: var(--text-primary);
}
```

### Step 0.2 — Install/Configure Maritime Lottie Component (`src/components/common/MaritimeLottie.tsx`)
1. Check `package.json`: if `lottie-react` is not installed, run `cmd /c npm install lottie-react`.
2. Create authorized maritime Lottie JSON files in `public/animations/maritime/`:
   - `cruise-ship.json` (clean vector keyframe Lottie animation of a cruise vessel on ocean waves)
   - `radar-beacon.json` (nautical navigation radar/compass sweep for diagnostic/error & empty states)
   - `ocean-waves.json` (calm maritime wave transition)
   - `ATTRIBUTION.md` documenting source, license, and usage.
3. Create `src/components/common/MaritimeLottie.tsx`:
   - Props: `variant: 'ship' | 'radar' | 'waves'`, `className?: string`, `loop?: boolean`, `title?: string`.
   - Respects `window.matchMedia?.('(prefers-reduced-motion: reduce)')` (renders a clean static maritime vector/SVG fallback when reduced motion is active or in JSDOM test environments where Canvas/Lottie may not render).
   - Fixed aspect-ratio wrapper so loading never causes layout shift (CLS).
   - Graceful fallback if JSON fetch fails.

---

## 2. WAVE 1 — PASSENGER PORTAL SHELL, HOME & BOARDING PASS (RETRO-FUTURISM)

**Theme:** `data-theme="passenger-retro"` (`#070B16` background, `#10182A` secondary, `#151F33` surface, `#F4F4F0` text, `#A7B4C9` secondary text, `#42E8F5` electric cyan, `#4169FF` navigation blue, `#FFBD59` retro amber).

### Files to Edit in Wave 1:
1. **`src/layouts/PassengerLayout.tsx`**
   - Apply `data-theme="passenger-retro"` and background `bg-[#070B16] text-[#F4F4F0]`.
   - Nautical chart subtle grid background (`bg-[linear-gradient(to_right,rgba(66,232,245,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(66,232,245,0.03)_1px,transparent_1px)] bg-[size:32px_32px]`).
   - Header styled as a Futuristic Maritime Navigation Console (`bg-[#10182A]/90 border-b border-[#42E8F5]/20`), with HUD coordinate metadata (`LAT 20°57'N • LON 107°04'E`), ship status pill, and geometric active link indicators (`border-[#42E8F5]/40 text-[#42E8F5] bg-[#151F33]`).
   - **MUST PRESERVE FOR TESTS (`PassengerLayout.test.tsx`):**
     - Exact text `'GRAND PEARL'`, `'VOYAGER'`, `'Guest Experience Portal'`
     - Guest profile name & `'Phòng {cabin} • {category}'`
     - Nav labels: `'Trang Chủ'`, `'Thẻ Lên Tàu'`, `'Lịch Trình'`, `'Ví Chi Tiêu'`, `'Tour Của Tôi'`, `'Khám Phá Dịch Vụ'`
     - Mobile menu toggle `aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu khách'}` and text `'Giờ du thuyền: 19:35'`
     - Footer link `'Đăng nhập Thủy Thủ Đoàn'` pointing to `/login`
2. **`src/pages/passenger/BoardingPassPage.tsx` & `src/components/passenger/MobileBoardingPass.tsx`**
   - **Specific Requirement — Boarding Pass Error State Upgrade:**
     - Replace the bare `min-h-screen bg-black` wrapper with a balanced Retro-Futuristic Maritime Terminal container (`bg-[#070B16] text-[#F4F4F0]`).
     - When `error` is present, render a structured **Maritime Telemetry Diagnostic Panel** (`bg-[#151F33] border border-[#FFBD59]/40 rounded-2xl p-6 sm:p-8 shadow-xl`) containing:
       - `<MaritimeLottie variant="radar" className="w-28 h-28 mx-auto mb-4" />`
       - Technical HUD status header (`[ERR_PASS_SYNC_04 // BOARDING_TERMINAL_OFFLINE]`)
       - Prominent, accessible error message (`{error}`)
       - Working retry button (`Thử lại` calling `fetchProfile()`) and return navigation link (`Về Trang Chủ Khách` to `/passenger-home`).
   - Redesign `MobileBoardingPass.tsx` into a futuristic interstellar/ocean-liner digital pass with `#151F33` surface, `#42E8F5` cyan security frame, `#FFBD59` amber boarding zone badge, and crisp QR code presentation.
3. **`src/pages/PassengerHomePage.tsx`**
   - Apply Retro-Futuristic HUD cards (`bg-[#151F33] border border-[#42E8F5]/20`), `<MaritimeLottie variant="ship" />` in the hero voyage banner, coordinate metadata, and `#FFBD59` / `#42E8F5` accents.
   - **MUST PRESERVE FOR TESTS (`PassengerHomePage.test.tsx`):**
     - `data-testid="passenger-home-loading"`
     - `data-testid="passenger-error-banner"`
     - All booking summary bindings (`fullName`, `tourCode`, `tourName`, `cabinNumber`, `rfidTag`, `qrCode`) and action buttons (`Làm mới`, `Thử lại`).

**Wave 1 Verification Command:**
```powershell
cmd /c npx vitest run src/layouts/PassengerLayout.test.tsx src/pages/PassengerHomePage.test.tsx
```

---

## 3. WAVE 2 — PASSENGER PORTAL SECONDARY PAGES (RETRO-FUTURISM)

### Files to Edit in Wave 2:
1. **`src/pages/MySchedulePage.tsx` & `src/pages/passenger/MySchedulePage.tsx`**
   - Restyle timeline, day selector tabs, cabin filter toggle (`Chỉ lịch của tôi` / `Cả cabin`), conflict warning banner, and empty state (integrate `<MaritimeLottie variant="waves" />` in empty state) using `#10182A` / `#151F33` surfaces and `#42E8F5` / `#FFBD59` highlights.
   - **MUST PRESERVE:** All labels, filter buttons, day tabs, and `'Xem vé QR'` modal triggers tested in `src/pages/passenger/MySchedulePage.test.tsx`.
2. **`src/pages/passenger/PassengerFolioPage.tsx` & `src/components/passenger/FolioTransactionList.tsx` & `src/components/passenger/DisputeModal.tsx`**
   - Restyle onboard spending console, credit limit progress bar, category breakdown, and transaction table into the Retro-Futuristic terminal palette (`#151F33` panels, `#FFBD59` warning alerts, `#42E8F5` active filters, `tabular-nums` for amounts).
   - **MUST PRESERVE:** All threshold warning banners and texts tested in `src/pages/passenger/PassengerFolioPage.test.tsx`.
3. **`src/pages/PassengerExcursionPassPage.tsx`**
   - Restyle shore excursion digital passes, bus/group telemetry badges, and cancellation modal into `#151F33` HUD cards with `<MaritimeLottie variant="ship" />` when booking list is empty.
4. **`src/pages/PassengerCatalogPage.tsx`**
   - Restyle activity & excursion discovery cards, filter bar, and registration modals into `#10182A` / `#151F33` Retro-Futuristic panels.
   - **MUST PRESERVE:** All search inputs and category filter buttons tested in `src/pages/PassengerCatalogPage.test.tsx`.

**Wave 2 Verification Command:**
```powershell
cmd /c npx vitest run src/pages/passenger/MySchedulePage.test.tsx src/pages/passenger/PassengerFolioPage.test.tsx src/pages/PassengerCatalogPage.test.tsx
```

---

## 4. WAVE 3 — ADMIN SHELL, AUTH, DASHBOARD, SHIPS & ITINERARY (SOFT EDITORIAL)

**Theme:** `data-theme="admin-editorial"`
- Application Background: `#F6F7F9` (`bg-[#F6F7F9] text-[#20242C]`)
- Primary Surface / Cards: `#FFFFFF` (`bg-white border border-[#E5E7EB] shadow-xs rounded-[14px]`)
- Secondary Surface: `#F1F3F7` (`bg-[#F1F3F7]`)
- Primary Text: `#20242C` | Secondary Text: `#687080`
- Primary Accent (WCAG AA Compliant): Navy/Indigo `#2A52BE` (`bg-[#2A52BE] text-white hover:bg-[#1E3A8A]`) | Subtle Accent Surface: `#EEF2FF` (`bg-[#EEF2FF] text-[#1E40AF]`) (Accent `#5277D9` reserved strictly for non-text indicators or large display text >= 18pt)
- Corner Radii: Badges/Small Controls `rounded-[6px]`, Buttons/Inputs `rounded-[10px]`, Cards/Panels `rounded-[14px]`, Large Sections/Dialogs `rounded-[18px]`.
- Transitions: `transition-all duration-150`
- Numbers: `tabular-nums` on all KPI, capacity, and currency figures.

### Files to Edit in Wave 3:
1. **`src/layouts/MainLayout.tsx`**
   - Apply `data-theme="admin-editorial"` with `min-h-screen bg-[#F6F7F9] text-[#20242C]`.
   - Sidebar (`aside`): `bg-white border-r border-[#E5E7EB]` with clean typography, subtle active nav state (`bg-[#EEF2FF] text-[#1E40AF] font-semibold rounded-[10px]`), and soft hover (`text-[#687080] hover:text-[#20242C] hover:bg-[#F6F7F9]`).
   - Top Header (`header`): `bg-white/90 backdrop-blur-md border-b border-[#E5E7EB] text-[#20242C]`.
   - **MUST PRESERVE FOR TESTS (`MainLayout.test.tsx`):**
     - `'CRUISE MANAGER'`, `'Grand Pearl Voyager'`, `'Dashboard Tổng quan'`, `'Quản lý Đội tàu'`, `'Hải trình & Cảng dừng'`, `'Tour Trên Bờ (Excursion)'`, `'Hoạt động & Excursion'`, `'POS & Chi tiêu Onboard'`, `'Hành khách & Check-in'`
     - `title="Ping Backend"` button
     - `'Online (Port 8080 - ...)'` and `'Offline (localhost:8080)'` status strings
     - `aria-label="Đăng xuất"` button
2. **`src/pages/LoginPage.tsx` & `src/pages/NotFoundPage.tsx`**
   - Restyle `LoginPage.tsx` and `NotFoundPage.tsx` into Soft Editorial (`bg-[#F6F7F9]`, white card `bg-white border border-[#E5E7EB] rounded-[18px] shadow-sm`, `#20242C` headings, `#5277D9` primary button `rounded-[10px]`).
   - **MUST PRESERVE FOR TESTS (`LoginPage.test.tsx`, `App.test.tsx`):**
     - `'CRUISE MANAGER'`, `'FLEET OPERATIONS & CREW CONSOLE'`, labels `'Tên đăng nhập / Mã định danh'`, `'Mật khẩu xác thực'`, button `'Đăng nhập Vận Hành'`, quick-fill buttons `'Admin Toàn Quyền'`, `'Ops Manager'`, `'Điều Phối Viên'`.
     - In `NotFoundPage.tsx`: heading `'404'`, `'Trang không tồn tại'`, link `'Về Trang Chủ'`.
3. **`src/pages/DashboardPage.tsx`**
   - Restyle the Hero section, 4 KPI blocks, Itinerary Preview, and POS & Offline Sync panel into Soft Editorial (`bg-white border border-[#E5E7EB] rounded-[16px] shadow-xs`, `#20242C` titles, `#687080` metadata, `#5277D9` primary action button, `tabular-nums` on `2,450`, `99.7%`, `$42,850`).
   - **MUST PRESERVE FOR TESTS (`DashboardPage.test.tsx`):**
     - `'Hệ Thống Quản Lý Dịch Vụ & Hoạt Động Du Thuyền'`, `'Frontend Client v1.0.0'`
     - `'Hành khách trên tàu'`, `'Hoạt động hôm nay'`, `'Doanh thu POS hôm nay'`, `'An toàn & Tập trung'`
     - `'Cảng Quốc Tế Tuần Châu (Hạ Long)'`, `'Cảng Tiên Sa (Đà Nẵng & Hội An)'`
4. **`src/pages/ShipsPage.tsx`, `src/pages/ShipDetailPage.tsx`, `src/pages/ItineraryPage.tsx`, `src/components/admin/CruiseAreaPolicyManager.tsx`**
   - Restyle cards, tables, filter bars, and modals into Soft Editorial (`#FFFFFF` cards, `#E5E7EB` borders, `#20242C` text, `#5277D9` buttons).
   - **MUST PRESERVE:** Level 2 headings `'Quản Lý Đội Tàu Du Lịch'` and `'Quản Lý Tour Du Lịch Du Thuyền'` tested in `App.test.tsx`.

**Wave 3 Verification Command:**
```powershell
cmd /c npx vitest run src/layouts/MainLayout.test.tsx src/pages/LoginPage.test.tsx src/pages/DashboardPage.test.tsx src/pages/ShipsPage.test.tsx src/pages/ItineraryPage.test.tsx
```

---

## 5. WAVE 4 — ADMIN EXCURSIONS & ONBOARD ACTIVITIES (SOFT EDITORIAL)

### Files to Edit in Wave 4:
1. **Excursion Management Pages:**
   - `src/pages/ExcursionsPage.tsx` (Preserve h2 `'Quản Lý Tour Trên Bờ'`)
   - `src/pages/ExcursionDetailPage.tsx`
   - `src/pages/ExcursionDispatcherDashboard.tsx`
   - `src/pages/ExcursionRosterPage.tsx`
   - `src/pages/ExcursionAttendancePage.tsx`
   - `src/pages/ExcursionAnalyticsDashboard.tsx`
2. **Activity Management Pages:**
   - `src/pages/ActivitiesPage.tsx` (Preserve h2 `'Quản Lý Hoạt Động & Tour Trên Bờ'`)
   - `src/pages/ActivityDetailPage.tsx`
   - `src/pages/ActivityAttendancePage.tsx`
   - `src/pages/ActivityRosterPage.tsx`

Apply Soft Editorial surfaces (`bg-white border border-[#E5E7EB] rounded-[14px]`), clean table row dividers (`divide-y divide-[#E5E7EB]`), soft hover rows (`hover:bg-[#F6F7F9]`), restrained status badges (`rounded-[6px]`), and `#5277D9` primary buttons while keeping all handlers and modal props untouched.

**Wave 4 Verification Command:**
```powershell
cmd /c npx vitest run src/pages/ActivitiesPage.test.tsx src/pages/ActivityDetailPage.test.tsx src/pages/ActivityAttendancePage.test.tsx src/pages/ActivityRosterPage.test.tsx src/pages/ExcursionsPage.test.tsx
```

---

## 6. WAVE 5 — ADMIN POS, PASSENGERS, EMBARKATION, SETTLEMENT & REPORTS (SOFT EDITORIAL)

### Files to Edit in Wave 5:
1. **`src/pages/PosPage.tsx`** (Preserve h2 `'Hệ Thống POS & Tài Khoản Phi Tiền Mặt'` and `'Đã kết nối máy chủ'`)
2. **`src/pages/PassengersPage.tsx`** (Preserve h2 `'Danh Sách Hành Khách & Định Vị BLE'`)
3. **`src/pages/TerminalEmbarkationPage.tsx`**
4. **`src/pages/SettlementPage.tsx`**
5. **`src/components/reports/OperationalReportDashboard.tsx`**
6. **`src/pages/ProviderSettlementDashboard.tsx`**

Apply Soft Editorial styling (`bg-white border border-[#E5E7EB] rounded-[14px]`, `#20242C` text, `#687080` secondary labels, `tabular-nums` for financial columns, `#5277D9` primary actions).

**Wave 5 Verification Command:**
```powershell
cmd /c npx vitest run src/pages/PassengersPage.test.tsx src/pages/PosPage.test.tsx src/App.test.tsx
```

---

## 7. WAVE 6 — FINAL QUALITY GATE & BUILD VERIFICATION

Run the complete verification gate in `Cruise-web`:

```powershell
cd c:\Users\huy\Desktop\JavaLesson\Cruise-web
cmd /c npx tsc --noEmit
cmd /c npx oxlint
cmd /c npm run build
cmd /c npx vitest run
```

All 4 commands must exit with code `0` before committing.
