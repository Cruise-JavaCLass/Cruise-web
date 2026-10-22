import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import React from 'react';
import { GuestIdentificationPreviewModal } from './GuestIdentificationPreviewModal';
import { usePosScanner, parseScannerInput } from '../../hooks/usePosScanner';
import { posAuthService } from '../../services/posAuthService';
import type { PassengerIdentificationResponse } from '../../services/posAuthTypes';

describe('usePosScanner & parseScannerInput (KAN-405)', () => {
  it('correctly parses prefixes and raw barcode inputs', () => {
    expect(parseScannerInput('QR:MY-TOKEN-123')).toEqual({ type: 'QR', value: 'QR:MY-TOKEN-123' });
    expect(parseScannerInput('CARD:1234567890123456')).toEqual({
      type: 'CARD',
      value: 'CARD:1234567890123456',
    });
    expect(parseScannerInput('RFID:E0040100')).toEqual({ type: 'RFID', value: 'RFID:E0040100' });
    expect(parseScannerInput('1234567890123456')).toEqual({
      type: 'CARD',
      value: 'CARD:1234567890123456',
    });
    expect(parseScannerInput('A1B2C3D4')).toEqual({ type: 'RFID', value: 'RFID:A1B2C3D4' });
    expect(parseScannerInput('RANDOM-STRING')).toEqual({
      type: 'QR',
      value: 'QR:RANDOM-STRING',
    });
  });

  it('triggers onScan callback when simulateScan is called', () => {
    const onScan = vi.fn();
    const { result } = renderHook(() => usePosScanner({ onScan }));

    act(() => {
      result.current.simulateScan('RFID:AABBCCDD');
    });

    expect(onScan).toHaveBeenCalledWith(
      expect.objectContaining({
        rawCredential: 'RFID:AABBCCDD',
        type: 'RFID',
      })
    );
    expect(result.current.lastScan?.rawCredential).toBe('RFID:AABBCCDD');
  });

  it('captures rapid keyboard inputs and dispatches on Enter', () => {
    const onScan = vi.fn();
    renderHook(() => usePosScanner({ onScan, debounceMs: 500 }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Q' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'R' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ':' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '2' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(onScan).toHaveBeenCalledWith(
      expect.objectContaining({
        rawCredential: 'QR:12',
        type: 'QR',
      })
    );
  });
});

describe('posAuthService (Offline Manifest Cache)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('lookups offline cache correctly when stored in localStorage', () => {
    const mockManifest = {
      generatedAt: new Date().toISOString(),
      totalActiveCount: 1,
      credentials: [
        {
          identifier: 'E0040100AA',
          credentialType: 'RFID' as const,
          passengerId: 88,
          fullName: 'Jane Smith',
          cabinNumber: 'CABIN-303',
          photoUrl: 'https://img.com/jane.jpg',
          status: 'ACTIVE' as const,
          spendingAllowed: true,
          alcoholRestricted: false,
          isMinor: false,
        },
      ],
    };

    localStorage.setItem('pos_credential_manifest_cache', JSON.stringify(mockManifest));

    const result = posAuthService.lookupOfflineCache('RFID:E0040100AA');
    expect(result).not.toBeNull();
    expect(result?.fullName).toBe('Jane Smith');
    expect(result?.cabinNumber).toBe('CABIN-303');
    expect(result?.spendingAllowed).toBe(true);
  });
});

describe('GuestIdentificationPreviewModal (KAN-298)', () => {
  const mockGuest: PassengerIdentificationResponse = {
    passengerId: 101,
    fullName: 'Robert Paulson',
    cabinNumber: 'CABIN-7012',
    photoUrl: 'https://example.com/avatar.jpg',
    credentialType: 'CARD',
    maskedIdentifier: '************3456',
    credentialStatus: 'ACTIVE',
    folioStatus: 'ACTIVE',
    creditLimit: 1500,
    currentBalance: 300,
    availableLimit: 1200,
    individualSpendingLimit: 500,
    spendingAllowed: true,
    alcoholRestricted: false,
    isMinor: false,
  };

  it('renders guest modal with portrait, cabin and balance breakdown', () => {
    const onClose = vi.fn();
    const onConfirmAssign = vi.fn();

    render(
      <GuestIdentificationPreviewModal
        isOpen={true}
        onClose={onClose}
        guest={mockGuest}
        onConfirmAssign={onConfirmAssign}
      />
    );

    expect(screen.getByText('Đối Chiếu Nhận Diện Hành Khách')).toBeInTheDocument();
    expect(screen.getByText('Robert Paulson')).toBeInTheDocument();
    expect(screen.getByText('CABIN-7012')).toBeInTheDocument();
    expect(screen.getByText('$1200.00')).toBeInTheDocument();
    expect(screen.getByText('$500.00')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Xác Nhận Gán Vào Giỏ Hàng' });
    expect(confirmBtn).not.toBeDisabled();
    fireEvent.click(confirmBtn);
    expect(onConfirmAssign).toHaveBeenCalledWith(mockGuest);
  });

  it('disables confirmation button and shows warning if card is reported lost or blocked', () => {
    const blockedGuest: PassengerIdentificationResponse = {
      ...mockGuest,
      credentialStatus: 'REPORTED_LOST',
      spendingAllowed: false,
    };

    render(
      <GuestIdentificationPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        guest={blockedGuest}
        onConfirmAssign={vi.fn()}
      />
    );

    expect(screen.getByText(/Thẻ hoặc tài khoản này không được phép chi tiêu/)).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: 'Xác Nhận Gán Vào Giỏ Hàng' });
    expect(confirmBtn).toBeDisabled();
  });

  it('displays alcohol restriction badge when guest is a minor or alcoholRestricted', () => {
    const minorGuest: PassengerIdentificationResponse = {
      ...mockGuest,
      isMinor: true,
      alcoholRestricted: true,
    };

    render(
      <GuestIdentificationPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        guest={minorGuest}
        onConfirmAssign={vi.fn()}
      />
    );

    expect(screen.getByText('Trẻ em')).toBeInTheDocument();
    expect(screen.getByText('Cấm đồ cồn')).toBeInTheDocument();
  });
});
