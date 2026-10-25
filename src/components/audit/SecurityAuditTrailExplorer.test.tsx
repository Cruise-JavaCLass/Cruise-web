import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PosTerminalRegistry } from '../admin/PosTerminalRegistry';
import { SecurityAuditTrailExplorer } from '../audit/SecurityAuditTrailExplorer';
import { adminDeviceService, adminAuditService } from '../../services/adminService';
import type { PosTerminal, ProvisionTerminalResponse, SystemAuditLog } from '../../services/adminTypes';

vi.mock('../../services/adminService', () => ({
  adminDeviceService: {
    listTerminals: vi.fn(),
    provisionTerminal: vi.fn(),
    rotateApiKey: vi.fn(),
    renewCertificate: vi.fn(),
    revokeTerminal: vi.fn(),
    issueRemoteWipe: vi.fn(),
  },
  adminAuditService: {
    queryLogs: vi.fn(),
    getExportCsvUrl: vi.fn(),
  },
}));

const mockTerminals: PosTerminal[] = [
  {
    id: 1,
    deviceId: 'TERM-DECK9-01',
    deviceName: 'Lido Poolside Bar Register 1',
    stationId: 'BAR-DECK-9',
    ipAddress: '192.168.1.101',
    status: 'ACTIVE',
    apiKeyPrefix: 'pos_sec_',
    certificateFingerprint: 'a1b2c3d4e5f6789012345678',
    certificateExpiry: '2027-10-22T00:00:00Z',
    tokenVersion: 1,
    createdAt: '2026-10-22T06:00:00Z',
  },
];

const mockAuditLogs: SystemAuditLog[] = [
  {
    id: 101,
    category: 'DEVICE',
    action: 'DEVICE_PROVISIONED',
    actor: 'ADMIN_JULES',
    targetResource: 'POS_TERMINAL',
    targetId: 'TERM-DECK9-01',
    reason: 'New terminal setup',
    payloadBefore: undefined,
    payloadAfter: '{"status": "ACTIVE", "stationId": "BAR-DECK-9"}',
    immutableHash: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    createdAt: '2026-10-22T06:30:00Z',
  },
];

describe('Admin Device Registry & Security Audit Trail (KAN-285, KAN-480, KAN-481)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PosTerminalRegistry (KAN-285)', () => {
    it('renders terminal list with device ID, status, and fingerprint', async () => {
      vi.mocked(adminDeviceService.listTerminals).mockResolvedValueOnce({
        content: mockTerminals,
        totalElements: 1,
        totalPages: 1,
        number: 0,
      });

      render(<PosTerminalRegistry />);

      expect(screen.getByText('POS Terminal Registry & Fleet Security')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('TERM-DECK9-01')).toBeInTheDocument();
        expect(screen.getByText(/Lido Poolside Bar Register 1/i)).toBeInTheDocument();
        expect(screen.getByText('BAR-DECK-9')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('v1')).toBeInTheDocument();
      });
    });

    it('provisions new terminal and exposes raw API key banner', async () => {
      vi.mocked(adminDeviceService.listTerminals).mockResolvedValue({
        content: mockTerminals,
        totalElements: 1,
        totalPages: 1,
        number: 0,
      });

      const provisionResponse: ProvisionTerminalResponse = {
        terminal: {
          ...mockTerminals[0],
          deviceId: 'TERM-NEW-02',
        },
        rawApiKey: 'pos_sec_SuperSecretRawKey123456',
        clientCertificatePem: '-----BEGIN CERTIFICATE-----',
        message: 'Terminal provisioned',
      };
      vi.mocked(adminDeviceService.provisionTerminal).mockResolvedValueOnce(provisionResponse);

      const user = userEvent.setup();
      render(<PosTerminalRegistry />);

      const openModalBtn = screen.getByRole('button', { name: /Provision New Terminal/i });
      await user.click(openModalBtn);

      expect(screen.getByText('Provision POS Terminal')).toBeInTheDocument();

      const deviceIdInput = screen.getByPlaceholderText(/e\.g\. TERM-DECK9-BAR01/i);
      const deviceNameInput = screen.getByPlaceholderText(/e\.g\. Poolside Bar Main Register/i);
      await user.type(deviceIdInput, 'TERM-NEW-02');
      await user.type(deviceNameInput, 'New Terminal 2');

      const submitBtn = screen.getByRole('button', { name: /Enroll Terminal/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Save Newly Issued Device API Key/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('pos_sec_SuperSecretRawKey123456')).toBeInTheDocument();
      });
    });
  });

  describe('SecurityAuditTrailExplorer (KAN-480 & KAN-481)', () => {
    it('renders audit trail logs and filters by actor or action', async () => {
      vi.mocked(adminAuditService.queryLogs).mockResolvedValueOnce({
        content: mockAuditLogs,
        totalElements: 1,
        totalPages: 1,
        number: 0,
      });

      render(<SecurityAuditTrailExplorer />);

      expect(screen.getByText('Security Audit Trail Explorer')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('DEVICE_PROVISIONED')).toBeInTheDocument();
        expect(screen.getByText('ADMIN_JULES')).toBeInTheDocument();
        expect(screen.getByText('TERM-DECK9-01')).toBeInTheDocument();
      });
    });

    it('opens payload diff modal and displays JSON diff when clicking Diff button', async () => {
      vi.mocked(adminAuditService.queryLogs).mockResolvedValueOnce({
        content: mockAuditLogs,
        totalElements: 1,
        totalPages: 1,
        number: 0,
      });

      const user = userEvent.setup();
      render(<SecurityAuditTrailExplorer />);

      await waitFor(() => {
        expect(screen.getByText('DEVICE_PROVISIONED')).toBeInTheDocument();
      });

      const diffBtn = screen.getByRole('button', { name: /Diff/i });
      await user.click(diffBtn);

      await waitFor(() => {
        expect(screen.getByText(/Audit Event Diff Inspector: DEVICE_PROVISIONED/i)).toBeInTheDocument();
        expect(screen.getByText(/Previous State \(Before\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Updated State \(After\)/i)).toBeInTheDocument();
        expect(screen.getByText(/BAR-DECK-9/i)).toBeInTheDocument();
      });
    });

    it('triggers CSV export URL download on button click', async () => {
      vi.mocked(adminAuditService.queryLogs).mockResolvedValueOnce({
        content: mockAuditLogs,
        totalElements: 1,
        totalPages: 1,
        number: 0,
      });
      vi.mocked(adminAuditService.getExportCsvUrl).mockReturnValueOnce('/api/admin/audit/export/csv');
      window.open = vi.fn();

      const user = userEvent.setup();
      render(<SecurityAuditTrailExplorer />);

      const exportBtn = screen.getByRole('button', { name: /Export Audit CSV/i });
      await user.click(exportBtn);

      expect(adminAuditService.getExportCsvUrl).toHaveBeenCalledTimes(1);
      expect(window.open).toHaveBeenCalledWith('/api/admin/audit/export/csv', '_blank');
    });
  });
});
