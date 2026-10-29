import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProviderFormModal } from './ProviderFormModal';
import * as tourService from '../../services/tourService';
import type { TourProvider } from '../../services/tourService';

const provider: TourProvider = {
  id: 'provider-1',
  code: 'PRV-001',
  name: 'Đối tác du lịch',
  taxCode: '0101234567',
  licenseNumber: 'LIC-001',
  contactPerson: 'Nguyễn An',
  email: 'contact@example.com',
  phone: '0900000000',
  emergencyHotline: '0912345678',
  portId: 'VN-HAN',
  status: 'ACTIVE',
};

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Tên đối tác/), 'Đối tác mới');
  await user.type(screen.getByLabelText(/Hotline khẩn cấp/), '0912345678');
  await user.type(screen.getByLabelText(/Địa chỉ cảng/), 'VN-HAN');
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ProviderFormModal', () => {
  it('shows errors when required fields are submitted empty', async () => {
    const user = userEvent.setup();
    render(<ProviderFormModal isOpen onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Vui lòng nhập tên đối tác.')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng nhập hotline khẩn cấp.')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng nhập mã cảng.')).toBeInTheDocument();
  });

  it('shows format errors for invalid email and hotline values', async () => {
    const user = userEvent.setup();
    render(<ProviderFormModal isOpen onClose={vi.fn()} />);
    await user.type(screen.getByLabelText(/Tên đối tác/), 'Đối tác mới');
    await user.type(screen.getByLabelText('Email'), 'invalid-email');
    await user.type(screen.getByLabelText(/Hotline khẩn cấp/), 'invalid-hotline');
    await user.type(screen.getByLabelText(/Địa chỉ cảng/), 'VN-HAN');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Vui lòng nhập địa chỉ email hợp lệ.')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng nhập số hotline hợp lệ.')).toBeInTheDocument();
  });

  it('shows the backend message when API responds with 409 duplicate tax code', async () => {
    const user = userEvent.setup();
    const createSpy = vi.spyOn(tourService, 'createTourProvider').mockRejectedValue({
      response: {
        status: 409,
        data: { message: 'Mã số thuế đã được đăng ký.' },
      },
    });
    render(<ProviderFormModal isOpen onClose={vi.fn()} />);
    await fillRequiredFields(user);
    await user.type(screen.getByLabelText('Mã số thuế'), '0101234567');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Mã số thuế đã được đăng ký.'
    );
    expect(createSpy).toHaveBeenCalledOnce();
  });

  it('creates a provider and notifies the parent on success', async () => {
    const user = userEvent.setup();
    const savedProvider = { ...provider, name: 'Đối tác mới' };
    const createSpy = vi
      .spyOn(tourService, 'createTourProvider')
      .mockResolvedValue(savedProvider);
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(
      <ProviderFormModal
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        name: 'Đối tác mới',
        taxCode: '',
        licenseNumber: '',
        email: '',
        emergencyHotline: '0912345678',
        portId: 'VN-HAN',
      });
      expect(onSuccess).toHaveBeenCalledWith(savedProvider);
      expect(onClose).toHaveBeenCalled();
    });
    expect(await screen.findByText('Thêm nhà cung cấp thành công.')).toBeInTheDocument();
  });

  it('prefills an existing provider and updates it', async () => {
    const user = userEvent.setup();
    const updateSpy = vi
      .spyOn(tourService, 'updateTourProvider')
      .mockResolvedValue(provider);

    render(<ProviderFormModal isOpen provider={provider} onClose={vi.fn()} />);

    expect(screen.getByLabelText(/Tên đối tác/)).toHaveValue(provider.name);
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(provider.id, {
        name: provider.name,
        taxCode: provider.taxCode,
        licenseNumber: provider.licenseNumber,
        email: provider.email,
        emergencyHotline: provider.emergencyHotline,
        portId: provider.portId,
      });
    });
  });
});
