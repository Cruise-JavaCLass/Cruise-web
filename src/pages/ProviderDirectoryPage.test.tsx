import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTourProvider, getTourProviders } from '../services/tourService';
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

  it('resets pagination to the first page when refresh succeeds', async () => {
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
    await user.click(screen.getByRole('button', { name: 'Trang sau' }));
    expect(await screen.findByText('Tour Provider 11')).toBeInTheDocument();
    expect(screen.getByText('11–12 / 12 nhà cung cấp')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Làm mới' }));

    expect(await screen.findByText('Tour Provider 1')).toBeInTheDocument();
    expect(screen.queryByText('Tour Provider 11')).not.toBeInTheDocument();
    expect(screen.getByText('1–10 / 12 nhà cung cấp')).toBeInTheDocument();
  });

  it('safely filters providers with nullish or missing fields without throwing', async () => {
    const user = userEvent.setup();
    const incompleteProviders = [
      {
        id: 'provider-incomplete',
        code: 'PR-INC',
        name: 'Incomplete Provider',
        taxCode: null as unknown as string,
        licenseNumber: undefined as unknown as string,
        contactPerson: null as unknown as string,
        email: undefined as unknown as string,
        phone: null as unknown as string,
        emergencyHotline: '1900000000',
        portId: 'port-inc',
        status: 'ACTIVE' as const,
      },
    ];
    vi.mocked(getTourProviders).mockResolvedValue(incompleteProviders);

    render(<ProviderDirectoryPage />);
    expect(await screen.findByText('Incomplete Provider')).toBeInTheDocument();

    const searchInput = screen.getByRole('searchbox', { name: 'Tìm kiếm nhà cung cấp' });
    await user.type(searchInput, 'INC');

    expect(screen.getByText('Incomplete Provider')).toBeInTheDocument();
  });

  it('discards stale responses when overlapping refresh requests occur', async () => {
    const user = userEvent.setup();
    let resolveFirst!: (value: typeof providers) => void;
    let resolveSecond!: (value: typeof providers) => void;

    const firstPromise = new Promise<typeof providers>((res) => {
      resolveFirst = res;
    });
    const secondPromise = new Promise<typeof providers>((res) => {
      resolveSecond = res;
    });

    vi.mocked(createTourProvider).mockResolvedValue(providers[0]);
    vi.mocked(getTourProviders)
      .mockResolvedValueOnce(providers)
      .mockImplementationOnce(() => firstPromise)
      .mockImplementationOnce(() => secondPromise);

    render(<ProviderDirectoryPage />);
    expect(await screen.findByText('Đối tác Hạ Long')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add Provider' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const refreshButton = screen.getByRole('button', { name: 'Làm mới' });
    fireEvent.click(refreshButton);

    await user.type(screen.getByLabelText(/Tên đối tác/), 'Đối tác mới');
    await user.type(screen.getByLabelText(/Hotline khẩn cấp/), '0912345678');
    await user.type(screen.getByLabelText(/Địa chỉ cảng/), 'VN-HAN');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    const updatedProviders = [
      {
        ...providers[0],
        name: 'Updated Provider Alpha',
      },
    ];
    resolveSecond(updatedProviders);

    expect(await screen.findByText('Updated Provider Alpha')).toBeInTheDocument();

    resolveFirst([
      {
        ...providers[0],
        name: 'Stale Provider Beta',
      },
    ]);

    expect(screen.queryByText('Stale Provider Beta')).not.toBeInTheDocument();
    expect(screen.getByText('Updated Provider Alpha')).toBeInTheDocument();
  });
});
