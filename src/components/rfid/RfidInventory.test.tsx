import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { RfidInventoryDashboard } from './RfidInventoryDashboard';
import { BulkBatchScannerModal } from './BulkBatchScannerModal';
import { LostCardQuarantineDrawer } from './LostCardQuarantineDrawer';
import {
  rfidCardService,
  RfidInventoryDashboardDto,
  RfidCardInventoryDto,
} from '../../services/rfidCardService';

vi.mock('../../services/rfidCardService', () => ({
  rfidCardService: {
    getDashboard: vi.fn(),
    ingestBatch: vi.fn(),
    blacklistCard: vi.fn(),
    getActiveBlacklistUids: vi.fn(),
  },
}));

describe('RfidInventoryDashboard', () => {
  const mockDashboard: RfidInventoryDashboardDto = {
    totalCards: 500,
    availableCards: 350,
    issuedCards: 120,
    lostOrBlacklistedCards: 20,
    damagedCards: 10,
    activeBlacklistUids: ['UID-LOST-01'],
    recentCards: [
      {
        id: 1,
        cardUid: '04A1B2C3D4',
        cardType: 'MIFARE_CLASSIC_1K',
        batchNumber: 'BATCH-2026-001',
        status: 'AVAILABLE',
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        cardUid: '04F9E8D7C6',
        cardType: 'MIFARE_CLASSIC_1K',
        batchNumber: 'BATCH-2026-001',
        status: 'ISSUED',
        assignedPassengerName: 'Sherlock Holmes',
        assignedCabinNumber: '221B',
        createdAt: new Date().toISOString(),
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard with KPI cards and inventory table', async () => {
    vi.mocked(rfidCardService.getDashboard).mockResolvedValueOnce(mockDashboard);

    render(
      <RfidInventoryDashboard
        onOpenBulkScanner={vi.fn()}
        onOpenQuarantineDrawer={vi.fn()}
      />
    );

    expect(screen.getByText(/RFID & NFC Card Pool Inventory Management/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('350')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
      expect(screen.getByText('04A1B2C3D4')).toBeInTheDocument();
      expect(screen.getByText('Sherlock Holmes')).toBeInTheDocument();
      expect(screen.getByText('Cabin: 221B')).toBeInTheDocument();
    });
  });

  it('triggers quarantine drawer callback when quarantine button clicked', async () => {
    vi.mocked(rfidCardService.getDashboard).mockResolvedValueOnce(mockDashboard);
    const onOpenQuarantine = vi.fn();

    render(
      <RfidInventoryDashboard
        onOpenBulkScanner={vi.fn()}
        onOpenQuarantineDrawer={onOpenQuarantine}
      />
    );

    await waitFor(() => {
      const quarantineBtns = screen.getAllByRole('button', { name: /Quarantine/i });
      fireEvent.click(quarantineBtns[quarantineBtns.length - 1]);
      expect(onOpenQuarantine).toHaveBeenCalled();
    });
  });
});

describe('BulkBatchScannerModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits batch of scanned RFID UIDs', async () => {
    vi.mocked(rfidCardService.ingestBatch).mockResolvedValueOnce({
      batchNumber: 'BATCH-TEST',
      totalSubmitted: 2,
      successfullyIngested: 2,
      duplicateSkipped: 0,
      skippedUids: [],
    });

    const onSuccess = vi.fn();
    render(
      <BulkBatchScannerModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText(/Bulk RFID \/ NFC Card Ingestion/i)).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/04A1B2C3D4/i);
    fireEvent.change(textarea, { target: { value: '04A1B2C3D4\n04F9E8D7C6' } });

    const submitBtn = screen.getByRole('button', { name: /Register Cards/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(rfidCardService.ingestBatch).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Batch Ingested Successfully!/i)).toBeInTheDocument();
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });
});

describe('LostCardQuarantineDrawer', () => {
  const mockCard: RfidCardInventoryDto = {
    id: 10,
    cardUid: 'UID-STOLEN-99',
    cardType: 'MIFARE_CLASSIC_1K',
    batchNumber: 'BATCH-001',
    status: 'ISSUED',
    assignedPassengerName: 'James Bond',
    assignedCabinNumber: '007',
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('quarantines card and pushes POS blacklist broadcast', async () => {
    vi.mocked(rfidCardService.blacklistCard).mockResolvedValueOnce({
      cardUid: 'UID-STOLEN-99',
      status: 'BLACKLISTED',
      blacklistedAt: new Date().toISOString(),
      reason: 'GUEST_REPORTED_LOST',
      posBlacklistBroadcasted: true,
      replacementCardUid: 'UID-NEW-007',
      message: 'Card quarantined & blacklisted.',
    });

    const onSuccess = vi.fn();
    render(
      <LostCardQuarantineDrawer
        card={mockCard}
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText(/Card Quarantine & Replacement/i)).toBeInTheDocument();
    expect(screen.getByText('UID-STOLEN-99')).toBeInTheDocument();

    const replacementInput = screen.getByPlaceholderText(/Scan blank card UID to pair immediately/i);
    fireEvent.change(replacementInput, { target: { value: 'UID-NEW-007' } });

    const enforceBtn = screen.getByRole('button', { name: /Enforce Quarantine & Blacklist/i });
    fireEvent.click(enforceBtn);

    await waitFor(() => {
      expect(rfidCardService.blacklistCard).toHaveBeenCalledWith(
        expect.objectContaining({
          cardUid: 'UID-STOLEN-99',
          replacementCardUid: 'UID-NEW-007',
        })
      );
      expect(screen.getByText(/Card Quarantined & Broadcasted!/i)).toBeInTheDocument();
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
