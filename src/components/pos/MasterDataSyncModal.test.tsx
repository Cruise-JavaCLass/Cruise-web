import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MasterDataSyncModal } from './MasterDataSyncModal';
import { masterDataDb } from '../../services/masterDataIndexedDb';
import { masterDataIngestionEngine } from '../../services/masterDataIngestionService';

vi.mock('../../services/masterDataIndexedDb', () => ({
  masterDataDb: {
    getSyncMeta: vi.fn(),
  },
}));

vi.mock('../../services/masterDataIngestionService', () => ({
  masterDataIngestionEngine: {
    getCurrentProgress: vi.fn().mockReturnValue({
      stage: 'IDLE',
      percentage: 0,
      message: 'Chờ đồng bộ dữ liệu',
      itemCount: 0,
    }),
    subscribe: vi.fn().mockImplementation((cb) => {
      cb({
        stage: 'IDLE',
        percentage: 0,
        message: 'Chờ đồng bộ dữ liệu',
        itemCount: 0,
      });
      return () => {};
    }),
    syncMasterData: vi.fn().mockResolvedValue({ success: true, itemCount: 42 }),
  },
}));

describe('MasterDataSyncModal Tests (KAN-422 & KAN-423)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (masterDataDb.getSyncMeta as any).mockResolvedValue({
      outletId: 1,
      etag: '"hash-abc-123"',
      version: '1.0.0',
      lastSyncedAt: '2026-10-22T08:00:00.000Z',
      productCount: 150,
    });
  });

  it('renders modal with metadata when open', async () => {
    render(<MasterDataSyncModal isOpen={true} onClose={() => {}} outletId={1} />);

    expect(screen.getByText('Đồng Bộ Dữ Liệu Ngoại Tuyến (Master Data)')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('150 sản phẩm')).toBeInTheDocument();
      expect(screen.getByText('"hash-abc-123"')).toBeInTheDocument();
    });
  });

  it('triggers delta sync when clicking "Đồng Bộ Delta"', async () => {
    const handleSuccess = vi.fn();
    render(<MasterDataSyncModal isOpen={true} onClose={() => {}} outletId={1} onSyncSuccess={handleSuccess} />);

    const deltaBtn = screen.getByRole('button', { name: /Đồng Bộ Delta/i });
    fireEvent.click(deltaBtn);

    await waitFor(() => {
      expect(masterDataIngestionEngine.syncMasterData).toHaveBeenCalledWith(1, false);
      expect(handleSuccess).toHaveBeenCalled();
    });
  });

  it('triggers full package sync when clicking "Tải Lại Toàn Bộ"', async () => {
    render(<MasterDataSyncModal isOpen={true} onClose={() => {}} outletId={1} />);

    const fullBtn = screen.getByRole('button', { name: /Tải Lại Toàn Bộ/i });
    fireEvent.click(fullBtn);

    await waitFor(() => {
      expect(masterDataIngestionEngine.syncMasterData).toHaveBeenCalledWith(1, true);
    });
  });
});
