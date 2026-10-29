import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { getTourProviders } from '../services/tourService';
import { ProviderDirectoryPage } from './ProviderDirectoryPage';

vi.mock('../services/tourService', () => ({
  createTourProvider: vi.fn(),
  getTourProviders: vi.fn(),
  updateTourProvider: vi.fn(),
}));

const providers = Array.from({ length: 12 }, (_, index) => ({
  id: `provider-${index + 1}`,
  code: `PR-${index + 1}`,
  name: `Tour Provider ${index + 1}`,
  taxCode: `TAX-${index + 1}`,
  licenseNumber: `LICENSE-${index + 1}`,
  contactPerson: `Contact ${index + 1}`,
  email: `provider${index + 1}@example.com`,
  phone: `090000000${index}`,
  emergencyHotline: `190000000${index}`,
  portId: index % 2 === 0 ? 'port-1' : 'port-2',
  status: index % 2 === 0 ? 'ACTIVE' as const : 'SUSPENDED' as const,
}));

describe('ProviderDirectoryPage', () => {
  beforeEach(() => {
    vi.mocked(getTourProviders).mockResolvedValue(providers);
  });

  it('searches and filters providers by port and status', async () => {
    render(<ProviderDirectoryPage />);

    expect(await screen.findByText('Tour Provider 1')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Tìm kiếm nhà cung cấp' }), {
      target: { value: 'Provider 2' },
    });
    expect(screen.getByText('Tour Provider 2')).toBeInTheDocument();
    expect(screen.queryByText('Tour Provider 1')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Tìm kiếm nhà cung cấp' }), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Lọc theo portId' }), {
      target: { value: 'port-2' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Lọc theo trạng thái' }), {
      target: { value: 'SUSPENDED' },
    });

    expect(screen.getByText('Tour Provider 2')).toBeInTheDocument();
    expect(screen.queryByText('Tour Provider 1')).not.toBeInTheDocument();
    expect(screen.getByText('1–6 / 6 nhà cung cấp')).toBeInTheDocument();
  });

  it('paginates through the provider directory', async () => {
    render(<ProviderDirectoryPage />);

    expect(await screen.findByText('Tour Provider 1')).toBeInTheDocument();
    expect(screen.queryByText('Tour Provider 11')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }));

    await waitFor(() => {
      expect(screen.getByText('Tour Provider 11')).toBeInTheDocument();
      expect(screen.queryByText('Tour Provider 1')).not.toBeInTheDocument();
    });
    expect(screen.getByText('11–12 / 12 nhà cung cấp')).toBeInTheDocument();
  });

  it('opens the provider form when Add Provider is clicked', async () => {
    render(<ProviderDirectoryPage />);

    await screen.findByText('Tour Provider 1');
    fireEvent.click(screen.getByRole('button', { name: 'Add Provider' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Thêm nhà cung cấp' })).toBeInTheDocument();
  });
});
