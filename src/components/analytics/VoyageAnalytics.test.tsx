import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutivePostVoyageDashboard } from './ExecutivePostVoyageDashboard';
import { ExecutivePdfBookletModal } from './ExecutivePdfBookletModal';
import { voyageAnalyticsService } from '../../services/voyageAnalyticsService';
import type {
  VoyageFinancialClosure,
  ExecutiveVoyageAnalyticsSummary,
} from '../../services/voyageAnalyticsTypes';

vi.mock('../../services/voyageAnalyticsService', () => ({
  voyageAnalyticsService: {
    getExecutiveSummary: vi.fn(),
    initiateClosure: vi.fn(),
    finalizeClosure: vi.fn(),
    getPdfBookletUrl: vi.fn(),
    dispatchEmail: vi.fn(),
  },
}));

const mockVoyage: VoyageFinancialClosure = {
  id: 1,
  voyageNumber: 'VOY-2026-MED-01',
  shipId: 'SHIP-CELEBRATION',
  itineraryName: 'Mediterranean Discovery 7-Day',
  voyageStartDate: '2026-10-15T00:00:00Z',
  voyageEndDate: '2026-10-22T00:00:00Z',
  voyageDurationDays: 7,
  totalPassengerCapacity: 2000,
  actualPassengerAttendance: 1800,
  passengerCruiseDays: 12600,
  budgetedGrossRevenue: 1000000,
  actualGrossRevenue: 1200000,
  actualNetRevenue: 1150000,
  totalDiscountsAndObc: 50000,
  revenueBeverageBars: 450000,
  revenueSpecialtyDining: 320000,
  revenueShoreExcursions: 250000,
  revenueSpaWellness: 110000,
  revenueRetailBoutiques: 70000,
  occupancyPercentage: 90.0,
  revenuePerPassengerCruiseDay: 95.24,
  budgetVariancePercentage: 20.0,
  profitabilityIndex: 1.04,
  status: 'CLOSURE_IN_PROGRESS',
  createdAt: '2026-10-22T00:00:00Z',
};

const mockSummary: ExecutiveVoyageAnalyticsSummary = {
  latestVoyage: mockVoyage,
  fleetAverageRevPCD: 95.24,
  fleetAverageOccupancy: 90.0,
  fleetTotalGrossRevenue: 1200000,
  historicalTrend: [mockVoyage],
};

describe('Post-Voyage Operational Analytics & Executive Reconciliation (KAN-473, KAN-474, KAN-475)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ExecutivePostVoyageDashboard (KAN-473)', () => {
    it('renders corporate KPI cards, RevPCD, occupancy and department breakdown', async () => {
      vi.mocked(voyageAnalyticsService.getExecutiveSummary).mockResolvedValueOnce(mockSummary);

      render(<ExecutivePostVoyageDashboard />);

      expect(screen.getByText('Executive Post-Voyage Operational Analytics')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getAllByText('$95.24').length).toBeGreaterThan(0);
        expect(screen.getAllByText('90.0%').length).toBeGreaterThan(0);
        expect(screen.getAllByText('$1,150,000').length).toBeGreaterThan(0);
        expect(screen.getByText('1.04')).toBeInTheDocument();
        expect(screen.getByText(/\$450,000/i)).toBeInTheDocument(); // Bars
        expect(screen.getByText(/\$320,000/i)).toBeInTheDocument(); // Dining
      });
    });

    it('finalizes voyage closure when user clicks Finalize button', async () => {
      const user = userEvent.setup();
      vi.mocked(voyageAnalyticsService.getExecutiveSummary).mockResolvedValue(mockSummary);
      vi.mocked(voyageAnalyticsService.finalizeClosure).mockResolvedValueOnce({
        ...mockVoyage,
        status: 'FINANCIALLY_CLOSED',
      });
      window.confirm = vi.fn().mockReturnValue(true);

      render(<ExecutivePostVoyageDashboard />);

      await waitFor(() => {
        expect(screen.getByText('VOY-2026-MED-01')).toBeInTheDocument();
      });

      const finalizeBtn = screen.getByRole('button', { name: /Finalize/i });
      await user.click(finalizeBtn);

      expect(voyageAnalyticsService.finalizeClosure).toHaveBeenCalledWith(
        'VOY-2026-MED-01',
        expect.objectContaining({ closureAuditNotes: expect.any(String) })
      );
    });
  });

  describe('ExecutivePdfBookletModal (KAN-474 & KAN-475)', () => {
    it('opens download URL and dispatches executive email', async () => {
      const user = userEvent.setup();
      vi.mocked(voyageAnalyticsService.getPdfBookletUrl).mockReturnValueOnce('/api/admin/voyages/VOY-2026-MED-01/booklet.pdf');
      vi.mocked(voyageAnalyticsService.dispatchEmail).mockResolvedValueOnce('Dispatched');
      window.open = vi.fn();

      render(
        <ExecutivePdfBookletModal
          isOpen={true}
          onClose={vi.fn()}
          voyage={mockVoyage}
        />
      );

      expect(screen.getByText('Executive Audit Booklet & Dispatch')).toBeInTheDocument();

      // Download PDF button
      const downloadBtn = screen.getByRole('button', { name: /Download Post-Voyage Audit Booklet/i });
      await user.click(downloadBtn);

      expect(window.open).toHaveBeenCalledWith(
        '/api/admin/voyages/VOY-2026-MED-01/booklet.pdf',
        '_blank'
      );

      // Email dispatch
      const emailInput = screen.getByPlaceholderText(/cfo@cruiseline\.com/i);
      await user.type(emailInput, 'cfo@cruiseline.com');

      const dispatchBtn = screen.getByRole('button', { name: /Send Executive Briefing Email/i });
      await user.click(dispatchBtn);

      await waitFor(() => {
        expect(voyageAnalyticsService.dispatchEmail).toHaveBeenCalledWith(
          'VOY-2026-MED-01',
          expect.objectContaining({ recipientEmail: 'cfo@cruiseline.com' })
        );
        expect(screen.getByText(/Executive booklet successfully sent to cfo@cruiseline\.com/i)).toBeInTheDocument();
      });
    });
  });
});
