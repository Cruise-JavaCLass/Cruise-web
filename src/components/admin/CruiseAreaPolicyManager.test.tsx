import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CruiseAreaPolicyManager } from './CruiseAreaPolicyManager';
import { cruiseAreaPolicyService } from '../../services/cruiseAreaPolicyService';

vi.mock('../../services/cruiseAreaPolicyService', () => ({
  cruiseAreaPolicyService: {
    getDeckZones: vi.fn(),
    createDeckZone: vi.fn(),
    getCancellationPolicies: vi.fn(),
    createCancellationPolicy: vi.fn(),
  },
}));

describe('CruiseAreaPolicyManager UI Tests (KAN-281, KAN-477 & KAN-478)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders deck zones list by default', async () => {
    (cruiseAreaPolicyService.getDeckZones as any).mockResolvedValue([
      {
        id: 1,
        shipId: 1,
        deckNumber: 9,
        zoneName: 'Pool Deck East',
        zoneCode: 'DECK9-POOL-EAST',
        maxSafetyCapacity: 350,
        zoneType: 'POOL_DECK',
        hasLifeboatAccess: true,
      },
    ]);
    (cruiseAreaPolicyService.getCancellationPolicies as any).mockResolvedValue([]);

    render(<CruiseAreaPolicyManager shipId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Quản Lý Sơ Đồ Boong Tàu & Chính Sách Vận Hành')).toBeInTheDocument();
      expect(screen.getByText('Pool Deck East')).toBeInTheDocument();
      expect(screen.getByText('350 khách')).toBeInTheDocument();
    });
  });

  it('switches to policies tab and displays policies', async () => {
    (cruiseAreaPolicyService.getDeckZones as any).mockResolvedValue([]);
    (cruiseAreaPolicyService.getCancellationPolicies as any).mockResolvedValue([
      {
        id: 10,
        policyName: 'Tour Standard 24h',
        serviceType: 'EXCURSION',
        hoursBeforeCutoff: 24,
        refundPercentage: 100,
        cancellationFee: 0,
      },
    ]);

    render(<CruiseAreaPolicyManager shipId={1} />);

    const policyTabBtn = screen.getByRole('button', { name: /Chính Sách Hoàn Hủy/i });
    fireEvent.click(policyTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Tour Standard 24h')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  it('submits new deck zone correctly', async () => {
    (cruiseAreaPolicyService.getDeckZones as any).mockResolvedValue([]);
    (cruiseAreaPolicyService.getCancellationPolicies as any).mockResolvedValue([]);
    (cruiseAreaPolicyService.createDeckZone as any).mockResolvedValue({
      id: 2,
      zoneName: 'Lido Bar',
    });

    render(<CruiseAreaPolicyManager shipId={1} />);

    fireEvent.change(screen.getByPlaceholderText(/Quầy Bar Hồ Bơi Phía Đông/i), {
      target: { value: 'Lido Bar' },
    });
    fireEvent.change(screen.getByPlaceholderText(/DECK9-POOL-EAST/i), {
      target: { value: 'DECK9-LIDO' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Lưu Khu Vực Boong/i }));

    await waitFor(() => {
      expect(cruiseAreaPolicyService.createDeckZone).toHaveBeenCalledWith(
        expect.objectContaining({
          zoneName: 'Lido Bar',
          zoneCode: 'DECK9-LIDO',
        })
      );
    });
  });
});
