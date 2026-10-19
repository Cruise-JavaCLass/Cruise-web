import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  UserCheck,
  AlertCircle,
  Search
} from 'lucide-react';
import { posService, PaymentMethod, FolioAccountResponse, PosTransaction } from '../../services/posService';
import { PosReceiptModal } from './PosReceiptModal';

interface CatalogItem {
  code: string;
  name: string;
  category: 'BEVERAGE' | 'FOOD' | 'DUTY_FREE' | 'SPA';
  price: number;
}

const DEFAULT_CATALOG: CatalogItem[] = [
  { code: 'BEV-01', name: 'Cocktail Mojito Bạc Hà', category: 'BEVERAGE', price: 14.50 },
  { code: 'BEV-02', name: 'Rượu Vang Đỏ Bordeaux', category: 'BEVERAGE', price: 28.00 },
  { code: 'BEV-03', name: 'Nước Ép Trái Cây Nhiệt Đới', category: 'BEVERAGE', price: 6.50 },
  { code: 'BEV-04', name: 'Bia Tươi Thủ Công Deck 9', category: 'BEVERAGE', price: 9.00 },
  { code: 'FOOD-01', name: 'Hải Sản Tôm Hùm Nướng Bơ Tỏi', category: 'FOOD', price: 45.00 },
  { code: 'FOOD-02', name: 'Bò Wagyu Thượng Hạng', category: 'FOOD', price: 58.00 },
  { code: 'FOOD-03', name: 'Bánh Mì Kẹp Cá Hồi Xông Khói', category: 'FOOD', price: 16.00 },
  { code: 'FOOD-04', name: 'Pizza Hải Sản Phô Mai', category: 'FOOD', price: 22.00 },
  { code: 'DUTY-01', name: 'Nước Hoa Chanel Coco Mademoiselle', category: 'DUTY_FREE', price: 135.00 },
  { code: 'DUTY-02', name: 'Kính Râm RayBan Aviator', category: 'DUTY_FREE', price: 160.00 },
  { code: 'DUTY-03', name: 'Socola Thụy Sĩ Lindt Hộp Cao Cấp', category: 'DUTY_FREE', price: 24.00 },
  { code: 'SPA-01', name: 'Liệu Trình Massage Thụy Điển (60p)', category: 'SPA', price: 95.00 },
  { code: 'SPA-02', name: 'Chăm Sóc Da Mặt Tảo Biển', category: 'SPA', price: 75.00 },
];

export const PosRegister: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchItem, setSearchItem] = useState('');
  
  // Cart state
  const [cart, setCart] = useState<{ item: CatalogItem; quantity: number }[]>([]);
  const [taxPercent] = useState<number>(8); // 8% tax
  const [gratuityPercent, setGratuityPercent] = useState<number>(15); // 15% gratuity default
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  
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

  // Cart operations
  const addToCart = (item: CatalogItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.item.code === item.code);
      if (existing) {
        return prev.map((i) =>
          i.item.code === item.code ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (code: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.item.code === code ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (code: string) => {
    setCart((prev) => prev.filter((i) => i.item.code !== code));
  };

  const clearCart = () => setCart([]);

  // Calculations
  const subtotal = cart.reduce((sum, i) => sum + i.item.price * i.quantity, 0);
  const tax = Number(((subtotal * taxPercent) / 100).toFixed(2));
  const gratuity = Number(((subtotal * gratuityPercent) / 100).toFixed(2));
  const totalAmount = Math.max(0, Number((subtotal + tax + gratuity - discountAmount).toFixed(2)));

  // Lookup Folio
  const handleLookupFolio = async () => {
    if (!cabinInput.trim()) return;
    setIsLookingUpFolio(true);
    setFolioError(null);
    try {
      const data = await posService.getFolio(cabinInput.trim().toUpperCase());
      setFolioAccount(data);
    } catch {
      setFolioError(`Không tìm thấy tài khoản phòng ${cabinInput}. Bạn có thể thử CABIN-7012 hoặc CABIN-8015.`);
      setFolioAccount(null);
    } finally {
      setIsLookingUpFolio(false);
    }
  };

  // Submit Transaction
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'CABIN_FOLIO' && !cabinInput.trim()) {
      setSubmitError('Vui lòng nhập số phòng cabin để thanh toán Folio!');
      return;
    }

    if (paymentMethod === 'CABIN_FOLIO' && folioAccount && totalAmount > folioAccount.availableLimit) {
      setSubmitError(`Hạn mức phòng ${folioAccount.cabinNumber} chỉ còn $${folioAccount.availableLimit.toFixed(2)}, không đủ thanh toán $${totalAmount.toFixed(2)}!`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const idempotencyKey = 'IDEM-' + window.crypto.randomUUID();

    try {
      const response = await posService.createTransaction(
        {
          stationId,
          cashierId,
          cabinNumber: paymentMethod === 'CABIN_FOLIO' ? cabinInput.trim().toUpperCase() : undefined,
          guestName: folioAccount?.primaryGuestName,
          paymentMethod,
          tax,
          gratuity,
          discount: discountAmount,
          items: cart.map((c) => ({
            itemCode: c.item.code,
            itemName: c.item.name,
            category: c.item.category,
            quantity: c.quantity,
            unitPrice: c.item.price,
          })),
        },
        idempotencyKey
      );

      setCompletedTx(response);
      setIsReceiptOpen(true);
      clearCart();
      if (folioAccount && paymentMethod === 'CABIN_FOLIO') {
        // Refresh folio balance
        handleLookupFolio();
      }
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Lỗi khi xử lý thanh toán!';
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCatalog = DEFAULT_CATALOG.filter((item) => {
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchItem.toLowerCase()) || item.code.toLowerCase().includes(searchItem.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Item Catalog (8 cols) */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        {/* Category Filters & Search */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between shadow-lg">
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {[
              { id: 'ALL', label: 'Tất Cả' },
              { id: 'BEVERAGE', label: 'Đồ Uống' },
              { id: 'FOOD', label: 'Ẩm Thực' },
              { id: 'DUTY_FREE', label: 'Miễn Thuế' },
              { id: 'SPA', label: 'Spa' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm theo tên/mã..."
              value={searchItem}
              onChange={(e) => setSearchItem(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredCatalog.map((item) => (
            <div
              key={item.code}
              className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 p-4 rounded-2xl flex flex-col justify-between transition-all group shadow-sm hover:shadow-lg hover:shadow-amber-500/5"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                    {item.code}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-amber-400/90">
                    {item.category}
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors line-clamp-2">
                  {item.name}
                </h4>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-base font-extrabold text-emerald-400">
                  ${item.price.toFixed(2)}
                </span>
                <button
                  onClick={() => addToCart(item)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/10 cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Cart & Checkout Panel (4-5 cols) */}
      <div className="lg:col-span-5 xl:col-span-4 space-y-4">
        {/* Folio Guest Card Lookup */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-amber-400" /> Thẻ Khách & Folio Cabin
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Trạm: {stationId}</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập số phòng (VD: CABIN-7012)"
              value={cabinInput}
              onChange={(e) => setCabinInput(e.target.value.toUpperCase())}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 uppercase font-mono"
            />
            <button
              onClick={handleLookupFolio}
              disabled={isLookingUpFolio || !cabinInput.trim()}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              {isLookingUpFolio ? 'Tra cứu...' : 'Kiểm Tra'}
            </button>
          </div>

          {folioError && (
            <p className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              {folioError}
            </p>
          )}

          {folioAccount && (
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-1.5 animate-in fade-in">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Hành khách:</span>
                <span className="font-bold text-white">{folioAccount.primaryGuestName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Hạn mức phòng:</span>
                <span className="text-slate-300 font-mono">${folioAccount.creditLimit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Đã chi tiêu:</span>
                <span className="text-amber-400 font-mono">${folioAccount.currentBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                <span className="font-bold text-emerald-400">Hạn mức khả dụng:</span>
                <span className="font-extrabold text-emerald-400 font-mono">${folioAccount.availableLimit.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Cart & Breakdown */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col justify-between min-h-[420px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" /> Giỏ Hàng ({cart.length})
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="divide-y divide-slate-800/60 max-h-56 overflow-y-auto py-2">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Chưa có mặt hàng nào. Chọn từ danh mục bên trái.
                </div>
              ) : (
                cart.map(({ item, quantity }) => (
                  <div key={item.code} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="pr-2">
                      <p className="font-semibold text-white line-clamp-1">{item.name}</p>
                      <p className="text-slate-500">${item.price.toFixed(2)}/món</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(item.code, -1)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-white text-xs">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.code, 1)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="w-16 text-right font-bold text-white">
                        ${(item.price * quantity).toFixed(2)}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.code)}
                        className="p-1 text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pricing & Checkout */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            {/* Gratuity & Discount Options */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Tip / Phục vụ:</label>
                <select
                  value={gratuityPercent}
                  onChange={(e) => setGratuityPercent(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value={0}>0%</option>
                  <option value={10}>10%</option>
                  <option value={15}>15% (Tiêu chuẩn)</option>
                  <option value={18}>18% (Cao cấp)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Chiết khấu ($):</label>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1 text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
              <div className="flex justify-between">
                <span>Tạm tính (Subtotal):</span>
                <span className="text-white font-mono">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Thuế VAT ({taxPercent}%):</span>
                <span className="text-white font-mono">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí phục vụ ({gratuityPercent}%):</span>
                <span className="text-white font-mono">${gratuity.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Giảm giá:</span>
                  <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm font-extrabold text-white">
                <span>Tổng cộng:</span>
                <span className="text-emerald-400 text-base font-mono">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="text-slate-400 text-[11px] font-semibold block">Phương thức thanh toán:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'CABIN_FOLIO', label: 'Tài Khoản Phòng' },
                  { id: 'CREDIT_CARD', label: 'Thẻ Tín Dụng' },
                  { id: 'CASH', label: 'Tiền Mặt' },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                    className={`py-2 px-1 text-center rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                      paymentMethod === pm.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            {submitError && (
              <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-xl text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={isSubmitting || cart.length === 0}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-sm shadow-xl shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {isSubmitting ? (
                <>Đang ghi nhận giao dịch...</>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" /> Thanh Toán ${totalAmount.toFixed(2)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Electronic Receipt Modal */}
      <PosReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={completedTx}
      />
    </div>
  );
};
