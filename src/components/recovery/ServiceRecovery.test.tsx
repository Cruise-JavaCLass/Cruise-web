import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceRecoveryConsole } from './ServiceRecoveryConsole';
import { GuestRelationsCaseDrawer } from './GuestRelationsCaseDrawer';
import { ApologyVoucherCard } from '../passenger/ApologyVoucherCard';
import { serviceRecoveryService } from '../../services/serviceRecoveryService';
import type {
  ServiceRecoveryCase,
  ServiceRecoveryObcVoucher,
  ClaimObcVoucherResponse,
} from '../../services/serviceRecoveryTypes';

vi.mock('../../services/serviceRecoveryService', () => ({
  serviceRecoveryService: {
    searchCases: vi.fn(),
    getCase: vi.fn(),
    createCase: vi.fn(),
    escalateCase: vi.fn(),
    resolveCase: vi.fn(),
    issueVoucher: vi.fn(),
    claimVoucher: vi.fn(),
    getVouchersForCase: vi.fn(),
    getPassengerVouchers: vi.fn(),
  },
}));

const mockCase: ServiceRecoveryCase = {
  id: 1,
  caseNumber: 'SRC-20261022-001',
  passengerId: 101,
  passengerName: 'Alexander Wright',
  cabinNumber: 'CABIN-7012',
  rootCause: 'STATEROOM_CABIN_NOISE',
  severity: 'HIGH',
  status: 'OPEN',
  complaintSummary: 'Excessive engine vibration noise at night',
  complaintDetails: 'Guest unable to sleep due to low frequency vibration',
  assignedHandler: 'GUEST_RELATIONS_OFFICER',
  slaDueAt: '2026-10-22T14:00:00Z',
  createdAt: '2026-10-22T08:00:00Z',
};

const mockVoucher: ServiceRecoveryObcVoucher = {
  id: 10,
  voucherCode: 'OBC-REC-89211',
  caseId: 1,
  caseNumber: 'SRC-20261022-001',
  passengerId: 101,
  passengerName: 'Alexander Wright',
  cabinNumber: 'CABIN-7012',
  creditAmount: 150.0,
  status: 'ISSUED',
  apologyTitle: 'Sincere Apologies from Guest Relations Director',
  apologyLetterBody: 'We regret the disruption experienced during your sea voyage.',
  authorizedBy: 'DIRECTOR_MARCUS',
  issuedAt: '2026-10-22T08:30:00Z',
  expiresAt: '2026-10-25T08:30:00Z',
  createdAt: '2026-10-22T08:30:00Z',
};

describe('Real-time Service Recovery & OBC Compensation UI (KAN-453, KAN-454, KAN-455)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ServiceRecoveryConsole & GuestRelationsCaseDrawer (KAN-453)', () => {
    it('renders case list and opens drawer on row click', async () => {
      vi.mocked(serviceRecoveryService.searchCases).mockResolvedValueOnce({
        content: [mockCase],
        totalElements: 1,
        totalPages: 1,
        number: 0,
      });

      const user = userEvent.setup();
      render(<ServiceRecoveryConsole />);

      expect(screen.getByText('Service Recovery & Guest Escalation Console')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('SRC-20261022-001')).toBeInTheDocument();
        expect(screen.getByText('Alexander Wright')).toBeInTheDocument();
        expect(screen.getByText('CABIN-7012')).toBeInTheDocument();
        expect(screen.getAllByText('HIGH').length).toBeGreaterThan(0);
      });

      // Click to open drawer
      const row = screen.getByText('SRC-20261022-001');
      await user.click(row);

      await waitFor(() => {
        expect(screen.getByText('Overview & SLA')).toBeInTheDocument();
        expect(screen.getByText('Issue OBC Compensation')).toBeInTheDocument();
      });
    });

    it('issues OBC voucher from the resolution drawer', async () => {
      const user = userEvent.setup();
      const onCaseUpdated = vi.fn();

      vi.mocked(serviceRecoveryService.issueVoucher).mockResolvedValueOnce(mockVoucher);
      vi.mocked(serviceRecoveryService.getCase).mockResolvedValueOnce({
        ...mockCase,
        status: 'COMPENSATION_OFFERED',
      });

      render(
        <GuestRelationsCaseDrawer
          isOpen={true}
          onClose={vi.fn()}
          caseItem={mockCase}
          onCaseUpdated={onCaseUpdated}
        />
      );

      const compTab = screen.getByRole('button', { name: /Issue OBC Compensation/i });
      await user.click(compTab);

      expect(screen.getByText(/Compensation OBC Amount \(USD\)/i)).toBeInTheDocument();

      const issueBtn = screen.getByRole('button', { name: /Issue Instant OBC Voucher/i });
      await user.click(issueBtn);

      await waitFor(() => {
        expect(serviceRecoveryService.issueVoucher).toHaveBeenCalledTimes(1);
        expect(screen.getByText(/Active Voucher: OBC-REC-89211/i)).toBeInTheDocument();
      });
    });
  });

  describe('ApologyVoucherCard (KAN-454 & KAN-455)', () => {
    it('renders apology letter and claims OBC to folio', async () => {
      const user = userEvent.setup();
      const onClaimed = vi.fn();

      const claimResponse: ClaimObcVoucherResponse = {
        voucher: { ...mockVoucher, status: 'CLAIMED_TO_FOLIO' },
        folioTransactionId: 'TX-OBC-A1B2C3D4',
        creditedAmount: 150.0,
        cabinNumber: 'CABIN-7012',
        updatedAvailableLimit: 1800.0,
        processedAt: new Date().toISOString(),
        message: 'Onboard credit applied',
      };
      vi.mocked(serviceRecoveryService.claimVoucher).mockResolvedValueOnce(claimResponse);

      render(<ApologyVoucherCard voucher={mockVoucher} onVoucherClaimed={onClaimed} />);

      expect(screen.getByText('Sincere Apologies from Guest Relations Director')).toBeInTheDocument();
      expect(screen.getByText('$150.00')).toBeInTheDocument();
      expect(screen.getByText(/We regret the disruption experienced/i)).toBeInTheDocument();

      const claimBtn = screen.getByRole('button', { name: /Accept Apology & Claim/i });
      await user.click(claimBtn);

      await waitFor(() => {
        expect(serviceRecoveryService.claimVoucher).toHaveBeenCalledWith('OBC-REC-89211');
        expect(screen.getByText(/Applied to Cabin CABIN-7012 Folio/i)).toBeInTheDocument();
        expect(screen.getByText('TX-OBC-A1B2C3D4')).toBeInTheDocument();
        expect(onClaimed).toHaveBeenCalledWith(claimResponse);
      });
    });

    it('does not apply claim result or invoke callback when voucher changes while request is pending', async () => {
      const user = userEvent.setup();
      const onClaimed = vi.fn();

      let resolveClaim = (_val: ClaimObcVoucherResponse) => {};
      const pendingPromise = new Promise<ClaimObcVoucherResponse>((resolve) => {
        resolveClaim = resolve;
      });
      vi.mocked(serviceRecoveryService.claimVoucher).mockReturnValueOnce(pendingPromise);

      const voucherA: ServiceRecoveryObcVoucher = { ...mockVoucher, id: 101, voucherCode: 'VOUCHER-A' };
      const voucherB: ServiceRecoveryObcVoucher = { ...mockVoucher, id: 102, voucherCode: 'VOUCHER-B', apologyTitle: 'Alternative Apology Title' };

      const { rerender } = render(<ApologyVoucherCard voucher={voucherA} onVoucherClaimed={onClaimed} />);

      const claimBtn = screen.getByRole('button', { name: /Accept Apology & Claim/i });
      await user.click(claimBtn);

      // Re-render with voucher B before promise resolves
      rerender(<ApologyVoucherCard voucher={voucherB} onVoucherClaimed={onClaimed} />);

      // Now resolve the promise for voucher A
      const claimResponseA: ClaimObcVoucherResponse = {
        voucher: { ...voucherA, status: 'CLAIMED_TO_FOLIO' },
        folioTransactionId: 'TX-STALE-VOUCHER-A',
        creditedAmount: 100.0,
        cabinNumber: 'CABIN-7012',
        updatedAvailableLimit: 1700.0,
        processedAt: new Date().toISOString(),
        message: 'Onboard credit applied',
      };
      resolveClaim(claimResponseA);

      await new Promise((r) => setTimeout(r, 50));

      // Callback should NOT be called because voucher changed
      expect(onClaimed).not.toHaveBeenCalled();
      expect(screen.queryByText('TX-STALE-VOUCHER-A')).not.toBeInTheDocument();
    });
  });
});
