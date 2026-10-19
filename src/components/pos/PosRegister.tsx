import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  UserCheck,
  AlertCircle,
  Search,
  Barcode,
  Flame,
  Ship,
  Sparkles,
  Wifi,
  WifiOff,
  Clock,
  PauseCircle,
  Ban
} from 'lucide-react';
import {
  posService,
  type PaymentMethod,
  type FolioAccountResponse,
  type PosTransaction,
} from '../../services/posService';
import {
  posCatalogService,
  type ProductDto,
  type ProductDetailDto,
  type ProductModifierDto,
  type OutletDto,
  type CategoryDto,
  type VoyageLocationStatus,
  type CartPriceCalculationResponse
} from '../../services/posCatalogService';
import { PosReceiptModal } from './PosReceiptModal';
import { ModifierSelectorModal } from './ModifierSelectorModal';

interface CartItemEntry {
  cartId: string;
  product: ProductDto | ProductDetailDto;
  quantity: number;
  selectedModifiers: ProductModifierDto[];
  notes?: string;
  unitPrice: number;
}

const DEFAULT_FALLBACK_PRODUCTS: ProductDto[] = [
  { id: 1, outletId: 1, categoryId: 1, categoryName: 'Signature Cocktails', sku: 'BEV-MOJ-001', barcode: '893850123401', name: 'Pacific Sunset Mojito', basePrice: 14.50, taxCategory: 'STANDARD_VAT', status: 'ACTIVE', isAvailable: true, is86ed: false, stockQuantity: 150, imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300', happyHourEligible: true, happyHourDiscountPercent: 20 },
  { id: 2, outletId: 1, categoryId: 1, categoryName: 'Signature Cocktails', sku: 'BEV-BLU-002', barcode: '893850123402', name: 'Ocean Blue Lagoon', basePrice: 15.00, taxCategory: 'STANDARD_VAT', status: 'ACTIVE', isAvailable: true, is86ed: false, stockQuantity: 120, imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300', happyHourEligible: true, happyHourDiscountPercent: 20 },
  { id: 3, outletId: 1, categoryId: 2, categoryName: 'Craft Beers & Cider', sku: 'BEV-IPA-003', barcode: '893850123403', name: 'Harbor Craft IPA Draft (Pint)', basePrice: 8.50, taxCategory: 'STANDARD_VAT', status: 'ACTIVE', isAvailable: true, is86ed: false, stockQuantity: 200, imageUrl: 'https://images.unsplash.com/photo-1608270191771-464a9fb68393?w=300', happyHourEligible: true, happyHourDiscountPercent: 15 },
  { id: 4, outletId: 2, categoryId: 3, categoryName: 'Gourmet Grill & Burgers', sku: 'FOOD-BGR-101', barcode: '893850123501', name: 'Angus Beef Cheese Burger', basePrice: 18.00, taxCategory: 'STANDARD_VAT', status: 'ACTIVE', isAvailable: true, is86ed: false, stockQuantity: 80, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300', happyHourEligible: false },
  { id: 5, outletId: 2, categoryId: 4, categoryName: 'Desserts & Ice Cream', sku: 'FOOD-CAK-103', barcode: '893850123503', name: 'Warm Belgian Chocolate Lava Cake', basePrice: 11.00, taxCategory: 'STANDARD_VAT', status: 'EIGHTY_SIXED', isAvailable: false, is86ed: true, stockQuantity: 0, imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300', happyHourEligible: false },
  { id: 6, outletId: 3, categoryId: 5, categoryName: 'Massage Therapies', sku: 'SPA-MAS-201', barcode: '893850123601', name: 'Deep Tissue Ocean Massage 60m', basePrice: 120.00, taxCategory: 'STANDARD_VAT', status: 'ACTIVE', isAvailable: true, is86ed: false, stockQuantity: 999, imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300', happyHourEligible: false },
  { id: 7, outletId: 4, categoryId: 6, categoryName: 'Fragrances & Cosmetics', sku: 'DF-PERF-301', barcode: '893850123701', name: 'Chanel No.5 EDP 100ml', basePrice: 135.00, taxCategory: 'STANDARD_VAT', status: 'ACTIVE', isAvailable: true, is86ed: false, stockQuantity: 40, imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=300', happyHourEligible: false },
];

export const PosRegister: React.FC = () => {
  // Outlets & Categories
  const [outlets, setOutlets] = useState<OutletDto[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<number | undefined>(undefined);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Products & Search
  const [products, setProducts] = useState<ProductDto[]>(DEFAULT_FALLBACK_PRODUCTS);
  const [searchItem, setSearchItem] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanNotification, setScanNotification] = useState<string | null>(null);

  // Maritime location & Happy hour
  const [voyageLocation, setVoyageLocation] = useState<VoyageLocationStatus>('IN_PORT');
  const [isHappyHourActive, setIsHappyHourActive] = useState(false);

  // Modifiers Modal
  const [customizingProduct, setCustomizingProduct] = useState<ProductDetailDto | null>(null);
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);

  // Cart state
  const [cart, setCart] = useState<CartItemEntry[]>(() => {
    try {
      const stored = localStorage.getItem('CRUISE_POS_ACTIVE_CART');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Financial calculations
  const [cartCalculations, setCartCalculations] = useState<CartPriceCalculationResponse>({
    subtotal: 0,
    happyHourDiscount: 0,
    taxableSubtotal: 0,
    maritimeTax: 0,
    taxRatePercent: 10,
    serviceCharge: 0,
    serviceChargePercent: 18,
    grandTotal: 0,
    isDutyFree: false,
    isHappyHourActive: false,
    items: [],
  });

  // Guest Folio Lookup state
  const [cabinInput, setCabinInput] = useState('CABIN-7012');
  const [folioAccount, setFolioAccount] = useState<FolioAccountResponse | null>(null);
  const [isLookingUpFolio, setIsLookingUpFolio] = useState(false);
  const [folioError, setFolioError] = useState<string | null>(null);

  // Checkout state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CABIN_FOLIO');
  const [stationId] = useState('BAR-DECK-9');
  const [cashierId] = useState('CASHIER-HUY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedTx, setCompletedTx] = useState<PosTransaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [heldOrders, setHeldOrders] = useState<{ id: string; time: string; count: number; total: number }[]>([]);
  const idempotencyKeyRef = useRef<string | null>(null);

  // Barcode keyboard wedge buffer
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  // Persist cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('CRUISE_POS_ACTIVE_CART', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Load Outlets & Categories on mount
  useEffect(() => {
    const initCatalog = async () => {
      try {
        const outletData = await posCatalogService.getOutlets();
        if (outletData && outletData.length > 0) {
          setOutlets(outletData);
          setSelectedOutletId(outletData[0].id);
        }
      } catch {
        // Fallback outlets
        setOutlets([
          { id: 1, code: 'SKY-BAR', name: 'Sky Bar & Lounge', outletType: 'BAR', isActive: true },
          { id: 2, code: 'LIDO-BUFFET', name: 'Lido Buffet & Grill', outletType: 'RESTAURANT', isActive: true },
          { id: 3, code: 'LOTUS-SPA', name: 'Lotus Spa & Wellness', outletType: 'SPA', isActive: true },
          { id: 4, code: 'ROYAL-DUTYFREE', name: 'Royal Duty-Free Boutique', outletType: 'GIFT_SHOP', isActive: true },
        ]);
        setSelectedOutletId(1);
      }
    };
    void initCatalog();
  }, []);

  // Load Categories & Products when outlet changes
  useEffect(() => {
    const loadProductsAndCategories = async () => {
      try {
        const [cats, prods] = await Promise.all([
          posCatalogService.getCategories(selectedOutletId),
          posCatalogService.getProducts({ outletId: selectedOutletId, size: 100 }),
        ]);
        if (cats && cats.length > 0) setCategories(cats);
        if (prods && prods.content && prods.content.length > 0) setProducts(prods.content);
      } catch {
        // Keep fallback data filtered by outlet if available
        if (selectedOutletId) {
          const filtered = DEFAULT_FALLBACK_PRODUCTS.filter(
            (p) => !p.outletId || p.outletId === selectedOutletId
          );
          setProducts(filtered.length > 0 ? filtered : DEFAULT_FALLBACK_PRODUCTS);
        }
      }
    };
    void loadProductsAndCategories();
  }, [selectedOutletId]);

  // Recalculate Cart Pricing
  const recalculateCart = useCallback(async () => {
    if (cart.length === 0) {
      setCartCalculations({
        subtotal: 0,
        happyHourDiscount: 0,
        taxableSubtotal: 0,
        maritimeTax: 0,
        taxRatePercent: voyageLocation === 'INTERNATIONAL_WATERS' ? 0 : 10,
        serviceCharge: 0,
        serviceChargePercent: 18,
        grandTotal: 0,
        isDutyFree: voyageLocation === 'INTERNATIONAL_WATERS',
        isHappyHourActive,
        items: [],
      });
      return;
    }

    try {
      const calcReq = {
        outletId: selectedOutletId,
        voyageLocation,
        items: cart.map((c) => ({
          productId: c.product.id,
          sku: c.product.sku,
          quantity: c.quantity,
          selectedModifierIds: c.selectedModifiers.map((m) => m.id).filter(Boolean) as number[],
          specialNotes: c.notes,
        })),
      };

      const res = await posCatalogService.calculatePricing(calcReq);
      setCartCalculations(res);
      setIsHappyHourActive(res.isHappyHourActive);
    } catch {
      // Local fallback calculation engine
      const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      let discount = 0;
      if (isHappyHourActive) {
        discount = cart.reduce((sum, item) => {
          if (item.product.happyHourEligible) {
            const pct = item.product.happyHourDiscountPercent || 20;
            return sum + (item.unitPrice * item.quantity * pct) / 100;
          }
          return sum;
        }, 0);
      }
      const taxable = Math.max(0, subtotal - discount);
      const isDutyFree = voyageLocation === 'INTERNATIONAL_WATERS';
      const taxRate = isDutyFree ? 0 : 0.10;
      const maritimeTax = Math.round(taxable * taxRate * 100) / 100;
      const serviceCharge = Math.round(taxable * 0.18 * 100) / 100;
      const grandTotal = Math.round((taxable + maritimeTax + serviceCharge) * 100) / 100;

      setCartCalculations({
        subtotal: Math.round(subtotal * 100) / 100,
        happyHourDiscount: Math.round(discount * 100) / 100,
        taxableSubtotal: Math.round(taxable * 100) / 100,
        maritimeTax,
        taxRatePercent: isDutyFree ? 0 : 10,
        serviceCharge,
        serviceChargePercent: 18,
        grandTotal,
        isDutyFree,
        isHappyHourActive,
        items: [],
      });
    }
  }, [cart, selectedOutletId, voyageLocation, isHappyHourActive]);

  useEffect(() => {
    void recalculateCart();
  }, [recalculateCart]);

  // Add Item to Cart helper
  const addItemWithModifiers = (
    product: ProductDto | ProductDetailDto,
    selectedModifiers: ProductModifierDto[] = [],
    notes = ''
  ) => {
    if (product.is86ed || product.status === 'EIGHTY_SIXED') {
      setScanNotification(`Món "${product.name}" đã hết hàng (86'd)!`);
      setTimeout(() => setScanNotification(null), 3000);
      return;
    }

    idempotencyKeyRef.current = null;
    const extraPrice = selectedModifiers.reduce((acc, m) => acc + (m.priceDelta || 0), 0);
    const unitPrice = product.basePrice + extraPrice;
    const cartId = `${product.sku}-${selectedModifiers.map((m) => m.name).sort().join('_')}-${notes}`;

    setCart((prev) => {
      const existing = prev.find((i) => i.cartId === cartId);
      if (existing) {
        return prev.map((i) =>
          i.cartId === cartId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          cartId,
          product,
          quantity: 1,
          selectedModifiers,
          notes,
          unitPrice,
        },
      ];
    });

    setScanNotification(`Đã thêm: ${product.name}`);
    setTimeout(() => setScanNotification(null), 2000);
  };

  const handleProductTileClick = async (product: ProductDto) => {
    if (product.is86ed || product.status === 'EIGHTY_SIXED') {
      return;
    }

    try {
      const detail = await posCatalogService.getProductById(product.id);
      if (detail && detail.modifiers && detail.modifiers.length > 0) {
        setCustomizingProduct(detail);
        setIsModifierModalOpen(true);
        return;
      }
    } catch {
      // proceed with direct add
    }
    addItemWithModifiers(product);
  };

  // Barcode Lookup Handler (Instant scanner support)
  const handleBarcodeLookup = async (code: string) => {
    if (!code || !code.trim()) return;
    setIsScanning(true);
    const trimmed = code.trim();
    try {
      const product = await posCatalogService.lookupProduct(trimmed, selectedOutletId);
      if (product) {
        if (product.modifiers && product.modifiers.length > 0) {
          setCustomizingProduct(product);
          setIsModifierModalOpen(true);
        } else {
          addItemWithModifiers(product);
        }
        setBarcodeInput('');
      }
    } catch (err) {
      // Local fallback search
      const localMatch = products.find(
        (p) => p.barcode === trimmed || p.sku.toLowerCase() === trimmed.toLowerCase()
      );
      if (localMatch) {
        addItemWithModifiers(localMatch);
        setBarcodeInput('');
      } else {
        setScanNotification(`Không tìm thấy mã: ${trimmed}`);
        setTimeout(() => setScanNotification(null), 3000);
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Barcode Scanner Wedge keyboard listener (detects ultra-fast scanner input ending with Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') {
        // If focus is inside regular input, don't hijack unless it's Enter on barcode field
        return;
      }

      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (barcodeBufferRef.current.length >= 3) {
          const scannedCode = barcodeBufferRef.current;
          barcodeBufferRef.current = '';
          void handleBarcodeLookup(scannedCode);
        } else {
          barcodeBufferRef.current = '';
        }
      } else if (e.key.length === 1) {
        if (diff > 120) {
          // If interval is slow, start fresh
          barcodeBufferRef.current = e.key;
        } else {
          barcodeBufferRef.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, selectedOutletId]);

  // Cart operations
  const updateQuantity = (cartId: string, delta: number) => {
    idempotencyKeyRef.current = null;
    setCart((prev) =>
      prev
        .map((i) => (i.cartId === cartId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (cartId: string) => {
    idempotencyKeyRef.current = null;
    setCart((prev) => prev.filter((i) => i.cartId !== cartId));
  };

  const clearCart = () => {
    idempotencyKeyRef.current = null;
    setCart([]);
  };

  const holdOrder = () => {
    if (cart.length === 0) return;
    const newHold = {
      id: `HOLD-${Date.now().toString().slice(-4)}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      count: cart.reduce((acc, i) => acc + i.quantity, 0),
      total: cartCalculations.grandTotal,
    };
    setHeldOrders((prev) => [newHold, ...prev]);
    clearCart();
    setScanNotification(`Đã lưu tạm đơn #${newHold.id}`);
    setTimeout(() => setScanNotification(null), 3000);
  };

  // Folio lookup
  const handleLookupFolio = async () => {
    if (!cabinInput.trim()) return;
    setIsLookingUpFolio(true);
    setFolioError(null);
    try {
      const data = await posService.getFolioAccount(cabinInput.trim());
      setFolioAccount(data);
    } catch {
      setFolioAccount(null);
      setFolioError('Không tìm thấy tài khoản phòng này hoặc tài khoản đã bị khóa.');
    } finally {
      setIsLookingUpFolio(false);
    }
  };

  // Checkout submit
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setSubmitError('Giỏ hàng đang trống!');
      return;
    }

    if (paymentMethod === 'CABIN_FOLIO' && !folioAccount) {
      setSubmitError('Vui lòng tra cứu số phòng (Cabin Folio) trước khi thanh toán!');
      return;
    }

    if (
      paymentMethod === 'CABIN_FOLIO' &&
      folioAccount &&
      cartCalculations.grandTotal > folioAccount.availableBalance
    ) {
      setSubmitError(
        `Vượt hạn mức phòng! Cần $${cartCalculations.grandTotal.toFixed(
          2
        )}, khả dụng: $${folioAccount.availableBalance.toFixed(2)}.`
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = `TX-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    try {
      const payload = {
        stationId,
        cashierId,
        passengerId: folioAccount?.passengerId,
        cabinNumber: folioAccount?.cabinNumber,
        guestName: folioAccount?.guestName,
        paymentMethod,
        tax: cartCalculations.maritimeTax,
        gratuity: cartCalculations.serviceCharge,
        discount: cartCalculations.happyHourDiscount,
        notes: `Maritime POS Order | Outlet: ${selectedOutletId || 'ALL'} | ${voyageLocation}`,
        items: cart.map((i) => ({
          itemCode: i.product.sku,
          itemName: i.product.name,
          category: i.product.categoryName || 'GENERAL',
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      };

      const result = await posService.createTransaction(payload, idempotencyKeyRef.current);
      setCompletedTx(result);
      setIsReceiptOpen(true);
      clearCart();
      if (paymentMethod === 'CABIN_FOLIO' && folioAccount) {
        void handleLookupFolio();
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Đã xảy ra lỗi khi hoàn tất đơn hàng. Vui lòng thử lại!';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtering products
  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategory === 'ALL' ||
      p.categoryName?.toUpperCase() === selectedCategory.toUpperCase() ||
      String(p.categoryId) === selectedCategory;
    const matchesSearch =
      !searchItem ||
      p.name.toLowerCase().includes(searchItem.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchItem.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchItem));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full">
      {/* Toast Notification */}
      {scanNotification && (
        <div className="fixed top-5 right-5 z-50 bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top-3">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">{scanNotification}</span>
        </div>
      )}

      {/* LEFT COLUMN: Catalog & Visual Tiles Grid */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-4 lg:p-5 shadow-sm overflow-hidden min-h-[600px]">
        {/* Top Controls: Outlet selector, Voyage status, Barcode Scanner */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          {/* Outlet Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase text-slate-400">Điểm bán:</span>
            <select
              value={selectedOutletId || ''}
              onChange={(e) => setSelectedOutletId(e.target.value ? Number(e.target.value) : undefined)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.outletType})
                </option>
              ))}
            </select>
          </div>

          {/* Voyage Location & Happy Hour status */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setVoyageLocation((prev) =>
                  prev === 'IN_PORT' ? 'INTERNATIONAL_WATERS' : 'IN_PORT'
                )
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                voyageLocation === 'INTERNATIONAL_WATERS'
                  ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                  : 'bg-blue-950/70 border-blue-500/60 text-blue-300'
              }`}
            >
              <Ship className="w-3.5 h-3.5" />
              <span>
                {voyageLocation === 'INTERNATIONAL_WATERS' ? 'Hải phận Quốc tế (Duty-Free 0%)' : 'Tại Cảng (VAT 10%)'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsHappyHourActive((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                isHappyHourActive
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-sm animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Happy Hour (-20%)</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Barcode Scanner Input */}
        <div className="flex gap-3 py-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchItem}
              onChange={(e) => setSearchItem(e.target.value)}
              placeholder="Tìm kiếm theo tên món hoặc mã SKU..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleBarcodeLookup(barcodeInput);
            }}
            className="relative w-56 flex"
          >
            <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Quét mã vạch..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
            {isScanning && (
              <span className="absolute right-3 top-2.5 text-xs text-emerald-400 animate-spin">⟳</span>
            )}
          </form>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            Tất cả
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(String(c.id))}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === String(c.id)
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Visual Product Tiles Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500">
              <Search className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Không tìm thấy món nào phù hợp</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((p) => {
                const is86ed = p.is86ed || p.status === 'EIGHTY_SIXED';
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={is86ed}
                    onClick={() => void handleProductTileClick(p)}
                    className={`group relative flex flex-col justify-between p-3 rounded-2xl border text-left transition-all duration-150 ${
                      is86ed
                        ? 'bg-slate-900/60 border-rose-900/40 opacity-50 cursor-not-allowed'
                        : 'bg-slate-800/70 border-slate-700/80 hover:bg-slate-800 hover:border-blue-500/60 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
                    }`}
                  >
                    {/* Image / Thumbnail */}
                    <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-950 mb-2 relative">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <ShoppingCart className="w-6 h-6" />
                        </div>
                      )}

                      {/* 86'd Out of stock badge */}
                      {is86ed && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center">
                          <span className="px-2 py-1 rounded bg-rose-600 text-white font-bold text-xs uppercase flex items-center gap-1 shadow-sm">
                            <Ban className="w-3 h-3" />
                            86'd / Hết
                          </span>
                        </div>
                      )}

                      {/* Happy Hour Badge */}
                      {!is86ed && p.happyHourEligible && isHappyHourActive && (
                        <div className="absolute top-1.5 right-1.5 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                          <Flame className="w-3 h-3" />
                          -20%
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div>
                      <h4 className="font-semibold text-white text-xs sm:text-sm line-clamp-1 mb-0.5">
                        {p.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono line-clamp-1">
                        {p.sku} {p.barcode ? `• ${p.barcode}` : ''}
                      </p>
                    </div>

                    {/* Price and Add button */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
                      <div>
                        {isHappyHourActive && p.happyHourEligible ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-bold text-amber-400">
                              ${(p.basePrice * 0.8).toFixed(2)}
                            </span>
                            <span className="text-xs text-slate-500 line-through">
                              ${p.basePrice.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-emerald-400">
                            ${p.basePrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <span className="w-6 h-6 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Order Slip & Cart Management */}
      <div className="w-full lg:w-96 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-4 lg:p-5 shadow-sm">
        {/* Header Order Slip */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-base">Hóa Đơn Bán Hàng</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {cart.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={holdOrder}
                  className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition"
                  title="Lưu tạm đơn (Hold Order)"
                >
                  <PauseCircle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={clearCart}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                  title="Xóa toàn bộ giỏ hàng"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Guest Folio Lookup Bar */}
        <div className="py-3 border-b border-slate-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={cabinInput}
              onChange={(e) => setCabinInput(e.target.value.toUpperCase())}
              placeholder="Nhập số Cabin (vd: CABIN-7012)"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => void handleLookupFolio()}
              disabled={isLookingUpFolio}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1 transition"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>{isLookingUpFolio ? '...' : 'Kiểm tra'}</span>
            </button>
          </div>

          {folioError && (
            <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {folioError}
            </p>
          )}

          {folioAccount && (
            <div className="mt-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">{folioAccount.guestName}</p>
                <p className="text-[11px] text-slate-400">
                  Phòng: <span className="font-mono text-slate-300">{folioAccount.cabinNumber}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Hạn mức khả dụng</span>
                <span className="font-bold text-emerald-400">
                  ${folioAccount.availableBalance.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 min-h-[220px]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-8">
              <ShoppingCart className="w-8 h-8 mb-2 opacity-30" />
              <span>Chưa có món nào trong giỏ hàng</span>
              <span className="text-[11px] text-slate-600 mt-1">Chạm vào sản phẩm hoặc quét mã vạch</span>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartId}
                className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800 hover:border-slate-700 text-xs flex flex-col gap-1.5 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className="font-semibold text-white block">{item.product.name}</span>
                    {item.selectedModifiers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {item.selectedModifiers.map((m, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60"
                          >
                            +{m.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.notes && (
                      <span className="text-[10px] text-slate-400 italic block mt-0.5">
                        Ghi chú: {item.notes}
                      </span>
                    )}
                  </div>

                  <span className="font-bold text-white whitespace-nowrap">
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400">
                    ${item.unitPrice.toFixed(2)} / món
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartId, -1)}
                      className="w-5 h-5 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 flex items-center justify-center transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-white min-w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartId, 1)}
                      className="w-5 h-5 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 flex items-center justify-center transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.cartId)}
                      className="text-slate-500 hover:text-rose-400 ml-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Real-time Maritime Financial Breakdown */}
        <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Tạm tính (Subtotal):</span>
            <span className="text-slate-200 font-mono">${cartCalculations.subtotal.toFixed(2)}</span>
          </div>

          {cartCalculations.happyHourDiscount > 0 && (
            <div className="flex justify-between text-amber-400 font-medium">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3" />
                Giảm giá Happy Hour:
              </span>
              <span className="font-mono">-${cartCalculations.happyHourDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-400">
            <span>Thuế hải phận ({cartCalculations.taxRatePercent}%):</span>
            <span className="text-slate-200 font-mono">
              {cartCalculations.isDutyFree ? 'Miễn thuế (0%)' : `$${cartCalculations.maritimeTax.toFixed(2)}`}
            </span>
          </div>

          <div className="flex justify-between text-slate-400">
            <span>Phí phục vụ hàng hải (18% Gratuity):</span>
            <span className="text-slate-200 font-mono">${cartCalculations.serviceCharge.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
            <span>Tổng thanh toán:</span>
            <span className="text-emerald-400 text-base font-mono">
              ${cartCalculations.grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="pt-3" role="group" aria-label="Phương thức thanh toán">
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              aria-pressed={paymentMethod === 'CABIN_FOLIO'}
              onClick={() => setPaymentMethod('CABIN_FOLIO')}
              className={`py-2 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 transition ${
                paymentMethod === 'CABIN_FOLIO'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Cabin Folio</span>
            </button>
            <button
              type="button"
              aria-pressed={paymentMethod === 'CREDIT_CARD'}
              onClick={() => setPaymentMethod('CREDIT_CARD')}
              className={`py-2 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 transition ${
                paymentMethod === 'CREDIT_CARD'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Thẻ TD</span>
            </button>
            <button
              type="button"
              aria-pressed={paymentMethod === 'CASH'}
              onClick={() => setPaymentMethod('CASH')}
              className={`py-2 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 transition ${
                paymentMethod === 'CASH'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tiền mặt</span>
            </button>
          </div>
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="mt-2.5 p-2 rounded-xl bg-rose-950/60 border border-rose-800 text-[11px] text-rose-300 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Checkout Button */}
        <button
          type="button"
          disabled={isSubmitting || cart.length === 0}
          onClick={() => void handleCheckout()}
          className="mt-3 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span className="animate-pulse">Đang xử lý thanh toán...</span>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              <span>Thanh Toán (${cartCalculations.grandTotal.toFixed(2)})</span>
            </>
          )}
        </button>
      </div>

      {/* Modifier Selector Modal */}
      <ModifierSelectorModal
        isOpen={isModifierModalOpen}
        product={customizingProduct}
        onClose={() => setIsModifierModalOpen(false)}
        onConfirm={(prod, mods, notes) => addItemWithModifiers(prod, mods, notes)}
      />

      {/* Receipt Modal */}
      {completedTx && (
        <PosReceiptModal
          isOpen={isReceiptOpen}
          transaction={completedTx}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}
    </div>
  );
};
