import api from './api';

export interface SpendingByCategory {
  [category: string]: number;
}

export interface PassengerFolioSummary {
  passengerId: number;
  cabinNumber: string;
  passengerName: string;
  currentBalance: number;
  creditLimit: number;
  availableLimit: number;
  spendingPercentage: number;
  warningThresholdReached: boolean;
  limitExceeded: boolean;
  status: string;
  spendingByCategory: SpendingByCategory;
}

export interface FolioItem {
  itemCode: string;
  itemName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  complimentary: boolean;
}

export interface FolioTransaction {
  id: number;
  transactionUuid: string;
  time: string;
  locationCounter: string;
  posCode: string;
  swipedBy: string;
  amount: number;
  currency: string;
  category: string;
  complimentary: boolean;
  status: string;
  items: FolioItem[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface DisputePayload {
  reason: 'UNRECOGNIZED_CHARGE' | 'DUPLICATE_BILLING' | 'INCORRECT_AMOUNT' | 'SERVICE_NOT_DELIVERED';
  disputeAmount: number;
  disputeNote: string;
}

export interface DisputeResponse {
  disputeId: number;
  disputeNumber: string;
  transactionId: string;
  passengerId: number;
  cabinNumber: string;
  reason: string;
  disputeAmount: number;
  status: string;
  passengerNote: string;
  createdAt: string;
}

export const passengerFolioService = {
  getFolioSummary: async (passengerId: number): Promise<PassengerFolioSummary> => {
    const response = await api.get<{ data: PassengerFolioSummary }>(`/api/passengers/${passengerId}/folio`);
    return response.data.data;
  },

  getTransactions: async (
    passengerId: number,
    category?: string,
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<FolioTransaction>> => {
    const params = new URLSearchParams();
    if (category && category !== 'ALL') {
      params.append('category', category);
    }
    params.append('page', page.toString());
    params.append('size', size.toString());

    const response = await api.get<{ data: PageResponse<FolioTransaction> }>(
      `/api/passengers/${passengerId}/folio/transactions?${params.toString()}`
    );
    return response.data.data;
  },

  disputeTransaction: async (
    passengerId: number,
    transactionId: number,
    payload: DisputePayload
  ): Promise<DisputeResponse> => {
    const response = await api.post<{ data: DisputeResponse }>(
      `/api/passengers/${passengerId}/folio/transactions/${transactionId}/dispute`,
      payload
    );
    return response.data.data;
  },
};
