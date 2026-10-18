import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PassengerHomePage } from './PassengerHomePage';
import * as passengerService from '../services/passengerService';
import { passengerCatalogService } from '../services/passengerCatalogService';
import * as dailyItineraryService from '../services/dailyItineraryService';
import { UpcomingActivitiesAndNotifications } from '../components/passenger/UpcomingActivitiesAndNotifications';

describe('PassengerHomePage Component (KAN-201)', () => {
  const mockBookingSummary: passengerService.PassengerBookingSummary = {
    passengerId: 1,
    tourId: 10,
    tourName: 'Hải Trình Kỳ Quan Vịnh Hạ Long',
    tourCode: 'TOUR-HL-001',
    fullName: 'Trần Thị Thu Thảo',
    cabinNumber: '718 (Suite)',
    cabinCategory: 'Royal Suite',
    rfidTag: 'RFID-99413',
    qrCode: 'QR-99413',
    tourPackage: 'All-Inclusive VIP',
    bleZone: 'Zone C - Pool Deck',
    registrationStatus: 'CONFIRMED',
    checkInStatus: 'BOARDED',
    boardedAt: '2026-10-18T08:45:00Z',
    totalRegisteredExcursions: 1,
    totalExcursionSpent: 120,
    registeredExcursions: [
      {
        excursionId: 5,
        excursionTitle: 'Khám phá Hang Sửng Sốt & Đảo Ti Tốp',
        ticketCode: 'TCK-HL-9921',
        groupName: 'Đoàn Hải Âu (Xe 01)',
        busNumber: 'BUS-16-A',
        status: 'CONFIRMED',
        gatheringTime: '08:00',
        returnToShipTime: '15:30',
        portName: 'Cảng Tuần Châu (Hạ Long)',
        price: 120,
      },
    ],
  };

  const mockCatalogItems = [
    {
      id: 1,
      tourId: 10,
      itemType: 'ONBOARD_ACTIVITY' as const,
      title: 'Sunrise Deck Yoga & Meditation',
      category: 'WELLNESS',
      locationOrPort: 'Deck 11 Sun Deck',
      dayNumber: 1,
      activityDate: '2026-10-18',
      startTime: '06:30',
      endTime: '07:30',
      maxCapacity: 25,
      currentParticipants: 12,
      remainingCapacity: 13,
      isIncluded: true,
      price: 0,
      currency: 'USD',
      status: 'SCHEDULED',
      isSoldOut: false,
    },
  ];

  const mockNotifications: dailyItineraryService.TourNotification[] = [
    {
      id: 1,
      tourId: 10,
      tourCode: 'TOUR-HL-001',
      dayNumber: 2,
      changeType: 'PORT_CHANGE',
      subject: 'Thông báo: Điều chỉnh giờ cập bến',
      message: 'Giờ cập bến Tuần Châu lùi lại 30 phút.',
      urgency: 'HIGH',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders passenger booking summary header and digital boarding pass', async () => {
    vi.spyOn(passengerService, 'getPassengerBookingSummary').mockResolvedValue(mockBookingSummary);
    vi.spyOn(passengerCatalogService, 'getCatalogItems').mockResolvedValue({
      content: mockCatalogItems,
      totalElements: 1,
      totalPages: 1,
      size: 6,
      number: 0,
    });
    vi.spyOn(dailyItineraryService, 'getTourNotifications').mockResolvedValue(mockNotifications);

    render(
      <MemoryRouter>
        <PassengerHomePage />
      </MemoryRouter>
    );

    // Welcome title
    expect(await screen.findByText(/Chào mừng lên tàu,/i)).toBeInTheDocument();
    expect(await screen.findByText('Trần Thị Thu Thảo')).toBeInTheDocument();

    // Boarding pass details
    expect(screen.getByText(/MÃ ĐẶT CHỖ: TOUR-HL-001/i)).toBeInTheDocument();
    expect(screen.getByText('718 (Suite)')).toBeInTheDocument();
    expect(screen.getByText('Royal Suite')).toBeInTheDocument();
    expect(screen.getByText('RFID-99413')).toBeInTheDocument();
    expect(screen.getByText('QR-99413')).toBeInTheDocument();
    expect(screen.getByText(/Đã Check-in Lên Tàu/i)).toBeInTheDocument();

    // Registered excursions
    expect(screen.getByText('Khám phá Hang Sửng Sốt & Đảo Ti Tốp')).toBeInTheDocument();
    expect(screen.getByText('Đoàn Hải Âu (Xe 01)')).toBeInTheDocument();
    expect(screen.getByText('BUS-16-A')).toBeInTheDocument();
    expect(screen.getByText('1 tour')).toBeInTheDocument();
    expect(screen.getByText('$120 USD')).toBeInTheDocument();
  });

  it('renders upcoming activities and notifications block inside PassengerHomePage', async () => {
    vi.spyOn(passengerService, 'getPassengerBookingSummary').mockResolvedValue(mockBookingSummary);
    vi.spyOn(passengerCatalogService, 'getCatalogItems').mockResolvedValue({
      content: mockCatalogItems,
      totalElements: 1,
      totalPages: 1,
      size: 6,
      number: 0,
    });
    vi.spyOn(dailyItineraryService, 'getTourNotifications').mockResolvedValue(mockNotifications);

    render(
      <MemoryRouter>
        <PassengerHomePage />
      </MemoryRouter>
    );

    // Upcoming activity item
    expect(await screen.findByText('Sunrise Deck Yoga & Meditation')).toBeInTheDocument();
    expect(screen.getByText('Deck 11 Sun Deck')).toBeInTheDocument();
    expect(screen.getByText(/06:30 - 07:30/i)).toBeInTheDocument();

    // Urgent notification
    expect(screen.getByText('Thông báo: Điều chỉnh giờ cập bến')).toBeInTheDocument();
    expect(screen.getByText('Giờ cập bến Tuần Châu lùi lại 30 phút.')).toBeInTheDocument();
    expect(screen.getByText('Khẩn cấp')).toBeInTheDocument();
  });

  it('renders UpcomingActivitiesAndNotifications unit component directly', () => {
    render(
      <MemoryRouter>
        <UpcomingActivitiesAndNotifications
          activities={mockCatalogItems}
          notifications={mockNotifications}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Hoạt Động Sắp Tới Hôm Nay')).toBeInTheDocument();
    expect(screen.getByText('Sunrise Deck Yoga & Meditation')).toBeInTheDocument();
    expect(screen.getByText('Thông Báo & Lịch Trình Phát Sóng')).toBeInTheDocument();
    expect(screen.getByText('Thông báo: Điều chỉnh giờ cập bến')).toBeInTheDocument();
  });

  describe('Empty and Error States (KAN-202)', () => {
    it('renders empty state when passenger has no registered excursions', async () => {
      const emptyExcursionSummary: passengerService.PassengerBookingSummary = {
        ...mockBookingSummary,
        totalRegisteredExcursions: 0,
        totalExcursionSpent: 0,
        registeredExcursions: [],
      };

      vi.spyOn(passengerService, 'getPassengerBookingSummary').mockResolvedValue(emptyExcursionSummary);
      vi.spyOn(passengerCatalogService, 'getCatalogItems').mockResolvedValue({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 6,
        number: 0,
      });
      vi.spyOn(dailyItineraryService, 'getTourNotifications').mockResolvedValue([]);

      render(
        <MemoryRouter>
          <PassengerHomePage />
        </MemoryRouter>
      );

      // Empty excursion banner
      expect(await screen.findByText('Quý khách chưa đăng ký tour tham quan trên bờ nào.')).toBeInTheDocument();
      expect(screen.getByText(/Khám phá các tour trên bờ ngay/i)).toBeInTheDocument();

      // Empty upcoming activities banner
      expect(screen.getByText('Chưa có hoạt động nào được lên lịch trong hôm nay.')).toBeInTheDocument();

      // Empty notifications banner
      expect(screen.getByText('Hiện không có thông báo hay cảnh báo mới từ trung tâm điều hành.')).toBeInTheDocument();
    });

    it('renders error banner and retry button when booking summary API fails', async () => {
      vi.spyOn(passengerService, 'getPassengerBookingSummary').mockRejectedValue(
        new Error('Network connection timeout')
      );
      vi.spyOn(passengerCatalogService, 'getCatalogItems').mockResolvedValue({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 6,
        number: 0,
      });
      vi.spyOn(dailyItineraryService, 'getTourNotifications').mockResolvedValue([]);

      render(
        <MemoryRouter>
          <PassengerHomePage />
        </MemoryRouter>
      );

      expect(await screen.findByTestId('passenger-error-banner')).toBeInTheDocument();
      expect(screen.getByText('Đã xảy ra sự cố tải dữ liệu!')).toBeInTheDocument();
      expect(screen.getByText('Network connection timeout')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Thử lại/i })).toBeInTheDocument();
    });
  });
});
