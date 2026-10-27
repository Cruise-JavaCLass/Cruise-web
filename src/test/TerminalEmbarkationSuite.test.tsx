import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MobileBoardingPass } from '../components/passenger/MobileBoardingPass';
import { TerminalEmbarkationPage } from '../pages/TerminalEmbarkationPage';
import { embarkationService, type PassengerEmbarkationProfile } from '../services/embarkationService';

const mockProfile: PassengerEmbarkationProfile = {
  id: 101,
  tourId: 1,
  bookingCode: 'BK-TEST99',
  fullName: 'Nguyen Van Test',
  passportNumber: 'B12345678',
  nationality: 'Việt Nam',
  cabinNumber: 'Suite-801',
  cabinCategory: 'Royal Suite',
  isVip: true,
  healthDeclarationCompleted: false,
  rfidTag: 'RFID-101',
  qrCode: 'QR-TEST99',
  folioStatus: 'INACTIVE',
  checkInStatus: 'NOT_CHECKED_IN',
};

describe('MobileBoardingPass Component Tests (KAN-386 / KAN-388)', () => {
  it('renders passenger details, cabin and VIP badge correctly', () => {
    render(<MobileBoardingPass profile={mockProfile} />);

    expect(screen.getByText('Nguyen Van Test')).toBeInTheDocument();
    expect(screen.getByText('Suite-801')).toBeInTheDocument();
    expect(screen.getByText('★ VIP SUITE')).toBeInTheDocument();
    expect(screen.getByText('B12345678')).toBeInTheDocument();
  });

  it('allows completing pre-cruise health declaration', async () => {
    vi.spyOn(embarkationService, 'submitHealthDeclaration').mockResolvedValue({
      ...mockProfile,
      healthDeclarationCompleted: true,
    });
    const onHealthDeclared = vi.fn();
    render(<MobileBoardingPass profile={mockProfile} onHealthDeclared={onHealthDeclared} />);

    // safetyBriefingRead starts as false, verify button is disabled before checking box
    const safetyCheckbox = screen.getByLabelText(/Tôi đã đọc và cam kết tuân thủ quy định an toàn SOLAS quốc tế/i);
    expect(safetyCheckbox).not.toBeChecked();

    const submitBtn = screen.getByRole('button', { name: /Xác Nhận Khai Báo Sức Khỏe/i });
    expect(submitBtn).toBeDisabled();

    // Check safety briefing box
    fireEvent.click(safetyCheckbox);
    expect(safetyCheckbox).toBeChecked();
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onHealthDeclared).toHaveBeenCalledWith(
        expect.objectContaining({
          healthDeclarationCompleted: true,
        })
      );
    });
  });
});

describe('TerminalEmbarkationPage Integration Tests (KAN-387 / KAN-388)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders port operations monitor and executes passenger lookup', async () => {
    vi.spyOn(embarkationService, 'lookupPassenger').mockResolvedValue({
      ...mockProfile,
      healthDeclarationCompleted: true,
    });
    vi.spyOn(embarkationService, 'getEmbarkationSummary').mockResolvedValue({
      tourId: 1,
      expectedTotal: 100,
      boardedCount: 80,
      remainingCount: 20,
      boardingProgressPercent: 80.0,
      categoryBreakdown: { 'Royal Suite': 20 },
      vipTotal: 10,
      vipBoarded: 8,
    });

    render(<TerminalEmbarkationPage />);

    expect(
      screen.getByText(/Quầy Làm Thủ Tục Lên Tàu & Cấp Phát Thẻ RFID/i)
    ).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/VD: B9827361 hoặc BK-202688/i);
    fireEvent.change(input, { target: { value: 'B12345678' } });

    const searchBtn = screen.getByRole('button', { name: 'Tìm' });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText('Nguyen Van Test')).toBeInTheDocument();
      expect(screen.getByText('Suite-801')).toBeInTheDocument();
    });
  });

  it('binds RFID tag and confirms passenger boarding state', async () => {
    vi.spyOn(embarkationService, 'lookupPassenger').mockResolvedValue({
      ...mockProfile,
      healthDeclarationCompleted: true,
    });
    vi.spyOn(embarkationService, 'bindRfid').mockResolvedValue({
      passengerId: 101,
      rfidTag: 'RFID-NEW-TAG',
      cabinNumber: 'Suite-801',
      folioStatus: 'ACTIVE',
      message: 'Gán thẻ RFID thành công',
    });
    vi.spyOn(embarkationService, 'processCheckIn').mockResolvedValue({
      passengerId: 101,
      checkInStatus: 'BOARDED',
      boardedAt: '2026-10-21T10:00:00Z',
      rfidTag: 'RFID-NEW-TAG',
      cabinNumber: 'Suite-801',
      folioStatus: 'ACTIVE',
      message: 'Làm thủ tục lên tàu thành công',
    });

    render(<TerminalEmbarkationPage />);

    const searchInput = screen.getByPlaceholderText(/VD: B9827361 hoặc BK-202688/i);
    fireEvent.change(searchInput, { target: { value: 'B12345678' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tìm' }));

    await waitFor(() => {
      expect(screen.getByText('Nguyen Van Test')).toBeInTheDocument();
    });

    // Test RFID binding
    const rfidInput = screen.getByPlaceholderText(/Chạm thẻ trắng vào đầu đọc RFID.../i);
    fireEvent.change(rfidInput, { target: { value: 'RFID-NEW-TAG' } });
    fireEvent.click(screen.getByRole('button', { name: /Gán Mã Thẻ/i }));

    await waitFor(() => {
      expect(screen.getByText('Gán thẻ RFID thành công')).toBeInTheDocument();
    });

    // Test Boarding confirmation
    const boardingBtn = screen.getByRole('button', {
      name: /XÁC NHẬN BOARDING & KÍCH HOẠT HỒ SƠ/i,
    });
    fireEvent.click(boardingBtn);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /HÀNH KHÁCH ĐÃ LÀM THỦ TỤC LÊN TÀU/i })
      ).toBeInTheDocument();
    });
  });
});
