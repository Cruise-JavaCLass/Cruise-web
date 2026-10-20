import type {
  Settlement,
  SettlementLineItem,
  SettlementPreview,
} from '../../services/settlementService';

const defaultLineItems: SettlementLineItem[] = [
  {
    description: 'Spa treatment refund',
    serviceArea: 'Spa & Wellness',
    postedAt: '2026-10-18T09:15:00Z',
    amount: 40,
    isReversal: true,
  },
  {
    description: 'Dinner at Coral Restaurant',
    serviceArea: 'Dining',
    postedAt: '2026-10-19T18:30:00Z',
    amount: 220,
    isReversal: false,
  },
];

export const makePreview = (overrides: Partial<SettlementPreview> = {}): SettlementPreview => ({
  cabinNumber: 'CABIN-7012',
  primaryGuestName: 'Nguyễn Văn An',
  currency: 'USD',
  subtotal: 300,
  reversalsTotal: 40,
  discountTotal: 20,
  taxTotal: 24,
  gratuityTotal: 45,
  netAmountDue: 309,
  heldDisputeAmount: 0,
  openDisputeCount: 0,
  eligibleForSettlement: true,
  blockingReasons: [],
  lineItems: defaultLineItems,
  ...overrides,
});

export const makeSettlement = (overrides: Partial<Settlement> = {}): Settlement => ({
  settlementUuid: '2f0c9b1e-6a4d-4f1e-9c2a-5b7d8e9f0a1b',
  invoiceNumber: 'INV-2026-000241',
  cabinNumber: 'CABIN-7012',
  netAmount: 309,
  amountTendered: 400,
  changeGiven: 91,
  paymentMethod: 'CASH',
  currency: 'USD',
  settledAt: '2026-10-20T04:30:00Z',
  folioStatus: 'SETTLED',
  ...overrides,
});
