import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText(/Tên đối tác/), {
    target: { value: 'Đối tác mới' },
  });
  fireEvent.change(screen.getByLabelText(/Hotline khẩn cấp/), {
    target: { value: '0912345678' },
  });
  fireEvent.change(screen.getByLabelText(/Địa chỉ cảng/), {
    target: { value: 'VN-HAN' },
  });
}

describe('ProviderFormModal', () => {
  it('shows required-field and email validation errors', async () => {
    render(
      <ProviderFormModal isOpen onClose={vi.fn()} />
    );

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'email-khong-hop-le' },
    });
    await screen.findByText('Vui lòng nhập địa chỉ email hợp lệ.');

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Vui lòng nhập tên đối tác.')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng nhập hotline khẩn cấp.')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng nhập mã cảng.')).toBeInTheDocument();
  });

  it('creates a provider and notifies the parent on success', async () => {
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
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

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

  it('shows the backend message for a conflict response', async () => {
    vi.spyOn(tourService, 'createTourProvider').mockRejectedValue({
      response: {
        status: 409,
        data: { message: 'Mã số thuế đã được đăng ký.' },
      },
    });

    render(<ProviderFormModal isOpen onClose={vi.fn()} />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Mã số thuế đã được đăng ký.')).toBeInTheDocument();
  });

  it('prefills an existing provider and updates it', async () => {
    const updateSpy = vi
      .spyOn(tourService, 'updateTourProvider')
      .mockResolvedValue(provider);

    render(<ProviderFormModal isOpen provider={provider} onClose={vi.fn()} />);

    expect(screen.getByLabelText(/Tên đối tác/)).toHaveValue(provider.name);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

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
