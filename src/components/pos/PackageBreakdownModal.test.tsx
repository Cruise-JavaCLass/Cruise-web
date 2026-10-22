import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { PackageBreakdownModal } from './PackageBreakdownModal';
import { posEntitlementService } from '../../services/posEntitlementService';
import type {
  EntitlementEvaluateResponse,
  GuestPackageEntitlement,
  EntitlementEvaluateRequest,
} from '../../services/posEntitlementTypes';

describe('PackageEntitlementService (Offline Evaluation & Cache)', () => {
  const samplePackages: GuestPackageEntitlement[] = [
    {
      id: 1,
      passengerId: 101,
      cabinNumber: 'CABIN-101',
      packageName: 'Beverage Deluxe',
      packageType: 'BEVERAGE_DELUXE',
      eligibleCategory: 'BEVERAGE',
      totalQuota: 5,
      usedQuota: 1,
      maxItemPriceCap: 15,
      priorityLevel: 10,
      status: 'ACTIVE',
    },
  ];

  it('evaluates offline cart correctly with quota and price cap', () => {
    const request: EntitlementEvaluateRequest = {
      passengerId: 101,
      cabinNumber: 'CABIN-101',
      items: [
        {
          productId: 'DRINK-1',
          productName: 'Signature Cocktail',
          category: 'BEVERAGE',
          quantity: 2,
          unitPrice: 18,
        },
        {
          productId: 'FOOD-1',
          productName: 'Club Sandwich',
          category: 'FOOD',
          quantity: 1,
          unitPrice: 12,
        },
      ],
    };

    const result = posEntitlementService.evaluateOffline(request, samplePackages);

    expect(result.originalTotal).toBe(48); // (18 * 2) + 12 = 48
    // Cap is 15 -> covered per drink = 15 -> covered for 2 drinks = 30
    expect(result.packageDiscountTotal).toBe(30);
    expect(result.netPayableTotal).toBe(18); // 48 - 30 = 18

    expect(result.items[0].appliedPackageName).toBe('Beverage Deluxe');
    expect(result.items[0].coveredAmount).toBe(30);
    expect(result.items[0].outOfPocketAmount).toBe(6); // 36 - 30 = 6
    expect(result.items[1].coveredAmount).toBe(0);
    expect(result.items[1].outOfPocketAmount).toBe(12);
  });
});

describe('PackageBreakdownModal (KAN-302 & KAN-517)', () => {
  const mockEvaluation: EntitlementEvaluateResponse = {
    passengerId: 101,
    cabinNumber: 'CABIN-101',
    originalTotal: 50,
    packageDiscountTotal: 30,
    netPayableTotal: 20,
    items: [
      {
        productId: 'WINE-1',
        productName: 'Cabernet Sauvignon',
        quantity: 2,
        unitPrice: 15,
        grossAmount: 30,
        coveredAmount: 30,
        outOfPocketAmount: 0,
        fullyCovered: true,
        appliedPackageName: 'Premium Beverage Package',
        appliedEntitlementId: 1,
        quotaDeducted: 2,
      },
      {
        productId: 'DESSERT-1',
        productName: 'Tiramisu',
        quantity: 1,
        unitPrice: 20,
        grossAmount: 20,
        coveredAmount: 0,
        outOfPocketAmount: 20,
        fullyCovered: false,
        quotaDeducted: 0,
      },
    ],
  };

  const mockPackages: GuestPackageEntitlement[] = [
    {
      id: 1,
      passengerId: 101,
      cabinNumber: 'CABIN-101',
      packageName: 'Premium Beverage Package',
      packageType: 'BEVERAGE_DELUXE',
      totalQuota: 10,
      usedQuota: 4,
      priorityLevel: 5,
      status: 'ACTIVE',
    },
  ];

  it('renders package badges, item table and split bill amounts', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <PackageBreakdownModal
        isOpen={true}
        onClose={onClose}
        evaluation={mockEvaluation}
        activePackages={mockPackages}
        onConfirmSplitPayment={onConfirm}
      />
    );

    expect(screen.getByText('Chi Tiết Khấu Trừ Gói Dịch Vụ & Tách Bill')).toBeInTheDocument();
    expect(screen.getByText('Còn 6/10 suất')).toBeInTheDocument();
    expect(screen.getByText('Cabernet Sauvignon')).toBeInTheDocument();
    expect(screen.getAllByText('-$30.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$20.00').length).toBeGreaterThan(0);

    const applyBtn = screen.getByRole('button', { name: 'Áp Dụng Tách Bill Vào Giỏ Hàng' });
    fireEvent.click(applyBtn);
    expect(onConfirm).toHaveBeenCalled();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <PackageBreakdownModal
        isOpen={false}
        onClose={vi.fn()}
        evaluation={mockEvaluation}
        activePackages={mockPackages}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
