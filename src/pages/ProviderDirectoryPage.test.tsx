import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getTourProviders } from '../services/tourService';
import { ProviderDirectoryPage } from './ProviderDirectoryPage';

vi.mock('../services/tourService', () => ({
  createTourProvider: vi.fn(),
  getTourProviders: vi.fn(),
  updateTourProvider: vi.fn(),
}));

const providers = [
  {
    id: 'provider-1',
    code: 'PR-001',
    name: 'Đối tác Hạ Long',
    taxCode: 'TAX-001',
    licenseNumber: 'LICENSE-001',
    contactPerson: 'Nguyễn An',
    email: 'halong@example.com',
    phone: '0900000001',
    emergencyHotline: '1900000001',
    portId: 'port-1',
    status: 'ACTIVE' as const,
  },
  {
    id: 'provider-2',
    code: 'PR-002',
    name: 'Đối tác Đà Nẵng',
    taxCode: 'TAX-002',
    licenseNumber: 'LICENSE-002',
    contactPerson: 'Trần Bình',
    email: 'danang@example.com',
    phone: '0900000002',
    emergencyHotline: '1900000002',
    portId: 'port-2',
    status: 'SUSPENDED' as const,
  },
  {
    id: 'provider-3',
    code: 'PR-003',
    name: 'Đối tác Phú Quốc',
    taxCode: 'TAX-003',
    licenseNumber: 'LICENSE-003',
    contactPerson: 'Lê Chi',
    email: 'phuquoc@example.com',
    phone: '0900000003',
    emergencyHotline: '1900000003',
    portId: 'port-3',
    status: 'TERMINATED' as const,
  },
];

afterEach(() => {
  cleanup();
});

describe('ProviderDirectoryPage', () => {
  beforeEach(() => {
    vi.mocked(getTourProviders).mockResolvedValue(providers);
  });

  it('renders provider names and tax codes from the API', async () => {
    render(<ProviderDirectoryPage />);

    const table = await screen.findByRole('table');
    for (const provider of providers) {
      expect(within(table).getByText(provider.name)).toBeInTheDocument();
      expect(within(table).getByText(provider.taxCode)).toBeInTheDocument();
    }
  });

  it('opens ProviderFormModal when Add Provider is clicked', async () => {
    const user = userEvent.setup();
    render(<ProviderDirectoryPage />);

    await screen.findByRole('table');
    await user.click(screen.getByRole('button', { name: 'Add Provider' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Thêm nhà cung cấp' })).toBeInTheDocument();
  });

  it('searches and filters providers by port and status', async () => {
    const user = userEvent.setup();
    render(<ProviderDirectoryPage />);

    expect(await screen.findByText('Đối tác Hạ Long')).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox', { name: 'Tìm kiếm nhà cung cấp' }), 'Đà Nẵng');
    expect(screen.getByText('Đối tác Đà Nẵng')).toBeInTheDocument();
    expect(screen.queryByText('Đối tác Hạ Long')).not.toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox', { name: 'Tìm kiếm nhà cung cấp' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Lọc theo portId' }), 'port-2');
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Lọc theo trạng thái' }),
      'SUSPENDED'
    );

    expect(screen.getByText('Đối tác Đà Nẵng')).toBeInTheDocument();
    expect(screen.queryByText('Đối tác Hạ Long')).not.toBeInTheDocument();
    expect(screen.getByText('1–1 / 1 nhà cung cấp')).toBeInTheDocument();
  });

  it('paginates through the provider directory', async () => {
    const user = userEvent.setup();
    const manyProviders = Array.from({ length: 12 }, (_, index) => ({
      ...providers[index % providers.length],
      id: `provider-${index + 1}`,
      name: `Tour Provider ${index + 1}`,
      code: `PR-${index + 1}`,
      taxCode: `TAX-${index + 1}`,
    }));
    vi.mocked(getTourProviders).mockResolvedValue(manyProviders);

    render(<ProviderDirectoryPage />);

    expect(await screen.findByText('Tour Provider 1')).toBeInTheDocument();
    expect(screen.queryByText('Tour Provider 11')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Trang sau' }));

    expect(await screen.findByText('Tour Provider 11')).toBeInTheDocument();
    expect(screen.queryByText('Tour Provider 1')).not.toBeInTheDocument();
    expect(screen.getByText('11–12 / 12 nhà cung cấp')).toBeInTheDocument();
  });
});
