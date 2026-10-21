import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { PassengerBookingModal } from '../components/excursions/PassengerBookingModal';
import { PassengerExcursionPassPage } from '../pages/PassengerExcursionPassPage';
import { ExcursionDispatcherDashboard } from '../pages/ExcursionDispatcherDashboard';
import * as excursionService from '../services/excursionService';
import type { ShoreExcursion, PassengerExcursionBooking } from '../services/excursionService';

describe('Excursion Booking & Cancellation Component Tests (KAN-380)', () => {
  const mockExcursion: ShoreExcursion = {
    id: 101,
    tourId: 1,
    portId: 10,
    portName: 'Hạ Long Bay',
    portCity: 'Quảng Ninh',
    title: 'Vịnh Hạ Long Du Thuyền & Chèo Kayak',
    code: 'EXC-HL-01',
    description: 'Tour chèo thuyền kayak và ngắm cảnh vịnh',
    category: 'SIGHTSEEING',
    difficulty: 'MODERATE',
    operatorName: 'Hạ Long Travel',
    operatorContact: '0123456789',
    guideName: 'Nguyễn Văn Hướng',
    guidePhone: '0988776655',
    busNumber: 'XE-01 (45 Chỗ)',
    excursionDate: '2026-10-25',
    meetingTime: '08:00',
    departureTime: '08:30',
    returnToShipTime: '16:00',
    allAboardTime: '17:00',
    maxCapacity: 45,
    bookedCount: 15,
    price: 120,
    currency: 'USD',
    isIncluded: false,
    status: 'OPEN_FOR_BOOKING' as excursionService.ExcursionStatus,
    active: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PassengerBookingModal', () => {
    it('renders modal with excursion details and pricing', () => {
      render(
        <PassengerBookingModal
          isOpen={true}
          onClose={vi.fn()}
          excursion={mockExcursion}
        />
      );

      expect(screen.getByText('Vịnh Hạ Long Du Thuyền & Chèo Kayak')).toBeInTheDocument();
      expect(screen.getByText('$120.00')).toBeInTheDocument();
      expect(screen.getByText('Xác Nhận Đặt Tour')).toBeInTheDocument();
    });

    it('submits booking and displays ticket code upon success', async () => {
      const bookSpy = vi.spyOn(excursionService, 'bookExcursion').mockResolvedValueOnce({
        bookingId: 888,
        excursionId: 101,
        passengerId: 1,
        passengerName: 'Trần Gia Huy',
        cabinNumber: 'Suite-801',
        ticketCode: 'EXC-101-1792590000',
        busNumber: 'XE-01 (45 Chỗ)',
        groupName: 'Nhóm XE-01 (45 Chỗ)',
        chargedAmount: 120,
        isIncluded: false,
        status: 'REGISTERED',
        bookedAt: new Date().toISOString(),
      });

      render(
        <PassengerBookingModal
          isOpen={true}
          onClose={vi.fn()}
          excursion={mockExcursion}
        />
      );

      fireEvent.click(screen.getByText('Xác Nhận Đặt Tour'));

      await waitFor(() => {
        expect(bookSpy).toHaveBeenCalledWith(101, expect.objectContaining({
          passengerName: 'Trần Gia Huy',
          cabinNumber: 'Suite-801',
        }));
      });

      expect(await screen.findByText('Đặt Chỗ & Xuất Vé Thành Công!')).toBeInTheDocument();
      expect(screen.getByText('EXC-101-1792590000')).toBeInTheDocument();
    });
  });

  describe('PassengerExcursionPassPage', () => {
    it('renders passenger boarding pass list and allows cancellation', async () => {
      const mockPasses: PassengerExcursionBooking[] = [
        {
          bookingId: 777,
          excursionId: 101,
          excursionTitle: 'Vịnh Hạ Long Du Thuyền & Chèo Kayak',
          portName: 'Hạ Long Bay',
          excursionDate: '2026-10-25',
          gatheringTime: '08:00',
          departureTime: '08:30',
          returnToShipTime: '16:00',
          meetingPoint: 'Cầu cảng số 1',
          passengerId: 1,
          passengerName: 'Trần Gia Huy',
          cabinNumber: 'Suite-801',
          ticketCode: 'EXC-101-9999',
          busNumber: 'XE-01 (45 Chỗ)',
          groupName: 'Nhóm 1',
          status: 'REGISTERED',
          chargedAmount: 120,
          isIncluded: false,
        },
      ];

      vi.spyOn(excursionService, 'fetchMyExcursionBookings').mockResolvedValue(mockPasses);
      const cancelSpy = vi.spyOn(excursionService, 'cancelExcursionBooking').mockResolvedValue({
        bookingId: 777,
        excursionId: 101,
        passengerId: 1,
        status: 'CANCELLED',
        refundAmount: 120,
        penaltyFee: 0,
        cancelledAt: new Date().toISOString(),
      });

      render(<PassengerExcursionPassPage />);

      expect(await screen.findByText('EXC-101-9999')).toBeInTheDocument();
      expect(screen.getByText('BOARDING PASS')).toBeInTheDocument();

      // Open cancel modal
      fireEvent.click(screen.getByText('Hủy Vé Tour'));
      expect(screen.getByText('Xác Nhận Hủy Vé Tour Bờ')).toBeInTheDocument();

      // Confirm cancel
      fireEvent.click(screen.getByText('Xác Nhận Hủy'));

      await waitFor(() => {
        expect(cancelSpy).toHaveBeenCalledWith(101, 777, expect.any(String));
      });
    });
  });

  describe('ExcursionDispatcherDashboard', () => {
    it('renders bus dispatcher and allows reassigning bus', async () => {
      const mockWithPassengers: ShoreExcursion = {
        ...mockExcursion,
        passengers: [
          {
            id: 555,
            passengerName: 'Lê Hoàng Nam',
            cabinNumber: 'Balcony-502',
            ticketCode: 'EXC-101-5555',
            busNumber: 'XE-01 (45 Chỗ)',
            groupName: 'Nhóm 1',
            emergencyPhone: '0912345678',
            status: 'REGISTERED',
          },
        ],
      };

      vi.spyOn(excursionService, 'fetchExcursions').mockResolvedValue([mockWithPassengers]);
      const reassignSpy = vi.spyOn(excursionService, 'reassignBusBooking').mockResolvedValue({
        bookingId: 555,
        excursionId: 101,
        ticketCode: 'EXC-101-5555',
        oldBusNumber: 'XE-01 (45 Chỗ)',
        newBusNumber: 'XE-02 (29 Chỗ)',
        groupName: 'Nhóm XE-02 (29 Chỗ)',
        message: 'Chuyển xe thành công',
      });

      render(<ExcursionDispatcherDashboard />);

      expect(await screen.findByText('EXC-101-5555')).toBeInTheDocument();
      expect(screen.getByText('Lê Hoàng Nam')).toBeInTheDocument();

      // Click Đổi Xe
      fireEvent.click(screen.getByText('Đổi Xe'));
      expect(screen.getByText('Điều Phối & Đổi Xe Vận Chuyển')).toBeInTheDocument();

      // Submit reassign
      fireEvent.click(screen.getByText('Xác Nhận Đổi Xe'));

      await waitFor(() => {
        expect(reassignSpy).toHaveBeenCalledWith(101, 555, expect.any(Object));
      });
    });
  });
});
