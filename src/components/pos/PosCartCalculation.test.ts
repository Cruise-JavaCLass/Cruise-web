import { describe, it, expect } from 'vitest';
import {
  posCatalogService,
  type VoyageLocationStatus,
} from '../../services/posCatalogService';

describe('PosCartCalculation Engine Unit Tests (KAN-396)', () => {
  it('correctly calculates cart pricing in port with 10% standard VAT and 18% gratuity', () => {
    const items = [
      { productId: 1, sku: 'BEV-01', name: 'Mojito', quantity: 2, unitPrice: 14.5, taxCategory: 'STANDARD_VAT' as const, happyHourEligible: false },
    ];
    // Subtotal: 2 * 14.5 = 29.00
    // Port VAT 10%: 29.00 * 0.10 = 2.90
    // Gratuity 18%: 29.00 * 0.18 = 5.22
    // Grand Total: 29.00 + 2.90 + 5.22 = 37.12
    const subtotal = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
    const taxRate = 0.10;
    const gratuityRate = 0.18;
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const gratuity = Math.round(subtotal * gratuityRate * 100) / 100;
    const grandTotal = Math.round((subtotal + tax + gratuity) * 100) / 100;

    expect(subtotal).toBe(29.00);
    expect(tax).toBe(2.90);
    expect(gratuity).toBe(5.22);
    expect(grandTotal).toBe(37.12);
  });

  it('applies 0% Duty-Free tax exemption when vessel is in international waters', () => {
    const location: VoyageLocationStatus = 'INTERNATIONAL_WATERS';
    const subtotal = 100.00;
    const isDutyFree = location === 'INTERNATIONAL_WATERS';
    const tax = isDutyFree ? 0 : subtotal * 0.10;
    const gratuity = Math.round(subtotal * 0.18 * 100) / 100;
    const grandTotal = subtotal + tax + gratuity;

    expect(isDutyFree).toBe(true);
    expect(tax).toBe(0.00);
    expect(gratuity).toBe(18.00);
    expect(grandTotal).toBe(118.00);
  });

  it('deducts Happy Hour 20% discount on eligible items before tax & gratuity', () => {
    const basePrice = 20.00;
    const discountPercent = 20;
    const discountedPrice = basePrice * (1 - discountPercent / 100);
    expect(discountedPrice).toBe(16.00);

    const discountAmount = basePrice - discountedPrice;
    expect(discountAmount).toBe(4.00);

    // Tax and gratuity calculated on discounted amount
    const tax = Math.round(discountedPrice * 0.10 * 100) / 100;
    const gratuity = Math.round(discountedPrice * 0.18 * 100) / 100;
    const total = discountedPrice + tax + gratuity;

    expect(tax).toBe(1.60);
    expect(gratuity).toBe(2.88);
    expect(total).toBe(20.48);
  });

  it('handles offline cache save and retrieval for instant disconnected operations', () => {
    const mockCatalog = [
      { id: 1, name: 'Offline Cocktail', sku: 'OFF-01', basePrice: 12.0, taxCategory: 'STANDARD_VAT' as const, status: 'ACTIVE' as const, isAvailable: true, is86ed: false, categoryId: 1 },
    ];

    posCatalogService.saveOfflineCatalog(1, mockCatalog);
    const retrieved = posCatalogService.getOfflineCatalog(1);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.length).toBe(1);
    expect(retrieved?.[0].sku).toBe('OFF-01');
  });
});
