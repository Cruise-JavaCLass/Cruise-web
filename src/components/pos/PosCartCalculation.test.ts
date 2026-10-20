import { describe, it, expect } from 'vitest';
import {
  posCatalogService,
  type PosOfflineCatalogPackageDto,
} from '../../services/posCatalogService';
import { calculateCartFallback } from './PosRegister';

describe('PosCartCalculation Engine Unit Tests (KAN-396)', () => {
  it('correctly calculates cart pricing in port with 10% standard VAT and 18% gratuity', () => {
    const items = [
      {
        product: {
          id: 1,
          sku: 'BEV-01',
          name: 'Mojito',
          happyHourEligible: false,
        },
        unitPrice: 14.5,
        quantity: 2,
      },
    ];
    // Subtotal: 2 * 14.5 = 29.00
    // Port VAT 10%: 29.00 * 0.10 = 2.90
    // Gratuity 18%: 29.00 * 0.18 = 5.22
    // Grand Total: 29.00 + 2.90 + 5.22 = 37.12
    const result = calculateCartFallback(items, 'IN_PORT', false);

    expect(result.subtotal).toBe(29.00);
    expect(result.maritimeTax).toBe(2.90);
    expect(result.serviceCharge).toBe(5.22);
    expect(result.grandTotal).toBe(37.12);
    expect(result.isDutyFree).toBe(false);
  });

  it('applies 0% Duty-Free tax exemption when vessel is in international waters', () => {
    const items = [
      {
        product: {
          id: 2,
          sku: 'DUTY-01',
          name: 'Perfume',
          happyHourEligible: false,
        },
        unitPrice: 100.0,
        quantity: 1,
      },
    ];
    const result = calculateCartFallback(items, 'INTERNATIONAL_WATERS', false);

    expect(result.isDutyFree).toBe(true);
    expect(result.subtotal).toBe(100.00);
    expect(result.maritimeTax).toBe(0.00);
    expect(result.serviceCharge).toBe(18.00);
    expect(result.grandTotal).toBe(118.00);
  });

  it('deducts Happy Hour 20% discount on eligible items before tax & gratuity', () => {
    const items = [
      {
        product: {
          id: 3,
          sku: 'COCK-01',
          name: 'Cocktail',
          happyHourEligible: true,
          happyHourDiscountPercent: 20,
        },
        unitPrice: 20.0,
        quantity: 1,
      },
    ];
    const result = calculateCartFallback(items, 'IN_PORT', true);

    expect(result.subtotal).toBe(20.00);
    expect(result.happyHourDiscount).toBe(4.00);
    expect(result.taxableSubtotal).toBe(16.00);
    expect(result.maritimeTax).toBe(1.60);
    expect(result.serviceCharge).toBe(2.88);
    expect(result.grandTotal).toBe(20.48);
  });

  it('handles offline cache save and retrieval for instant disconnected operations', () => {
    const mockPackage: PosOfflineCatalogPackageDto = {
      version: '1.0.0',
      etag: 'W/"cache-123"',
      exportedAt: new Date().toISOString(),
      outletId: 1,
      outlets: [],
      categories: [],
      products: [
        {
          id: 1,
          name: 'Offline Cocktail',
          sku: 'OFF-01',
          basePrice: 12.0,
          costPrice: 3.0,
          taxCategory: 'STANDARD_VAT',
          status: 'ACTIVE',
          isAvailable: true,
          is86ed: false,
          categoryId: 1,
          stockQuantity: 100,
          happyHourEligible: false,
          modifiers: [],
        },
      ],
      happyHourRules: [],
      defaultServiceChargeRate: 18,
      standardPortVatRate: 10,
    };

    posCatalogService.saveOfflineCatalog(1, mockPackage);
    const retrieved = posCatalogService.getOfflineCatalog(1);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.products.length).toBe(1);
    expect(retrieved?.products[0].sku).toBe('OFF-01');
  });
});
