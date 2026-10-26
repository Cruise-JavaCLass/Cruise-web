import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import {
  posCatalogService,
  type BulkProductImportItem,
  type BulkImportResponse,
} from '../../services/posCatalogService';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [manifestNumber, setManifestNumber] = useState('MANIFEST-OCT-2026');
  const [items, setItems] = useState<BulkProductImportItem[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportResponse | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        if (file.name.endsWith('.json')) {
          const parsed: unknown = JSON.parse(content);
          const rawList: unknown[] | null = Array.isArray(parsed)
            ? parsed
            : parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).products)
              ? ((parsed as Record<string, unknown>).products as unknown[])
              : null;
          if (!rawList) {
            throw new Error('Dữ liệu JSON không hợp lệ: phải là mảng hoặc đối tượng chứa mảng "products".');
          }
          const validatedList: BulkProductImportItem[] = [];
          for (let i = 0; i < rawList.length; i++) {
            const item = rawList[i] as Record<string, unknown> | null | undefined;
            if (!item || typeof item !== 'object') {
              throw new Error(`Dòng JSON #${i + 1}: Mục sản phẩm không hợp lệ.`);
            }
            const sku = typeof item.sku === 'string' ? item.sku.trim() : '';
            const name = typeof item.name === 'string' ? item.name.trim() : '';
            if (!sku || !name) {
              throw new Error(`Dòng JSON #${i + 1}: SKU và tên sản phẩm phải là chuỗi không rỗng.`);
            }
            const rawPrice = item.basePrice;
            const numPrice = typeof rawPrice === 'number' ? rawPrice : typeof rawPrice === 'string' && rawPrice.trim() !== '' ? Number(rawPrice) : NaN;
            if (!Number.isFinite(numPrice) || numPrice <= 0) {
              throw new Error(`Dòng JSON #${i + 1}: basePrice không hợp lệ.`);
            }
            let stockQuantity = 100;
            if (item.stockQuantity !== undefined && item.stockQuantity !== null && String(item.stockQuantity).trim() !== '') {
              const numStock = Number(item.stockQuantity);
              if (!Number.isInteger(numStock) || numStock < 0) {
                throw new Error(`Dòng JSON #${i + 1}: Số lượng tồn kho không hợp lệ (${String(item.stockQuantity)}).`);
              }
              stockQuantity = numStock;
            }
            const happyHourDiscount =
              item.happyHourDiscountPercent !== undefined &&
              item.happyHourDiscountPercent !== null &&
              Number.isFinite(Number(item.happyHourDiscountPercent))
                ? Number(item.happyHourDiscountPercent)
                : undefined;

            const modifiers = Array.isArray(item.modifiers) ? item.modifiers : undefined;

            validatedList.push({
              sku,
              name,
              basePrice: numPrice,
              costPrice: item.costPrice !== undefined && item.costPrice !== null && Number.isFinite(Number(item.costPrice)) ? Number(item.costPrice) : undefined,
              outletCode: typeof item.outletCode === 'string' ? item.outletCode : undefined,
              categoryCode: typeof item.categoryCode === 'string' ? item.categoryCode : undefined,
              stockQuantity,
              barcode: typeof item.barcode === 'string' ? item.barcode : undefined,
              taxCategory: typeof item.taxCategory === 'string' ? item.taxCategory : undefined,
              description: typeof item.description === 'string' ? item.description : undefined,
              imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : undefined,
              happyHourEligible: typeof item.happyHourEligible === 'boolean' ? item.happyHourEligible : undefined,
              happyHourDiscountPercent: happyHourDiscount,
              modifiers,
            });
          }
          setItems(validatedList);
        } else {
          // Parse CSV (Header: sku,name,basePrice,costPrice,outletCode,categoryCode,stockQuantity,barcode)
          const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
          if (lines.length <= 1) {
            throw new Error('Tập tin CSV không có dòng dữ liệu nào.');
          }

          const parsedList: BulkProductImportItem[] = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = parseCsvLine(lines[i]);
            if (cols.length < 3) {
              throw new Error(`Dòng CSV #${i + 1}: Không đủ các cột bắt buộc (sku, name, basePrice).`);
            }
            const sku = cols[0].trim();
            const name = cols[1].trim();
            if (!sku || !name) {
              throw new Error(`Dòng CSV #${i + 1}: Thiếu SKU hoặc tên sản phẩm.`);
            }
            const rawPrice = cols[2].trim();
            const numPrice = Number(rawPrice);
            if (!Number.isFinite(numPrice) || numPrice <= 0 || rawPrice === '') {
              throw new Error(`Dòng CSV #${i + 1}: Giá basePrice không hợp lệ (${rawPrice}).`);
            }
            let stock = 100;
            if (cols[6] !== undefined && cols[6].trim() !== '') {
              const parsedStock = Number.parseInt(cols[6].trim(), 10);
              if (Number.isNaN(parsedStock) || parsedStock < 0) {
                throw new Error(`Dòng CSV #${i + 1}: Số lượng tồn kho không hợp lệ (${cols[6]}).`);
              }
              stock = parsedStock;
            }
            parsedList.push({
              sku,
              name,
              basePrice: numPrice,
              costPrice: cols[3] && Number.isFinite(Number(cols[3])) ? Number.parseFloat(cols[3]) : undefined,
              outletCode: cols[4] || undefined,
              categoryCode: cols[5] || undefined,
              stockQuantity: stock,
              barcode: cols[7] || undefined,
            });
          }
          setItems(parsedList);
        }
      } catch (err: unknown) {
        setParseError((err as Error).message || 'Không thể đọc nội dung file.');
        setItems([]);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (items.length === 0) return;
    setIsImporting(true);
    setParseError(null);
    try {
      const resp = await posCatalogService.bulkImportProducts({
        supplierManifestNumber: manifestNumber,
        performedBy: 'CHIEF_PURSER',
        products: items,
      });
      setImportResult(resp);
      setItems([]);
      setFileName(null);
      onSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Đã xảy ra lỗi khi nhập danh mục.';
      setParseError(msg);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-import-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F33]/60 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div className="bg-white border border-[#E5E0D7] w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E5E0D7] bg-[#F7F4ED]">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-[#397C80]" />
            <h3 id="bulk-import-title" className="text-base font-serif font-bold text-[#102A43]">
              Nhập Danh Mục Hàng Loạt (Bulk Manifest Sync)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#687787] hover:text-[#102A43] rounded-lg hover:bg-[#E5E0D7]/60 transition"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {parseError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {importResult && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Nhập danh mục hoàn tất!</span>
              </div>
              <p>
                Tổng số mục: <strong>{importResult.totalItems}</strong> | Thành công:{' '}
                <strong className="text-emerald-700">{importResult.successCount}</strong> | Lỗi:{' '}
                <strong className="text-rose-700">{importResult.failedCount}</strong>
              </p>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-2 pt-2 border-t border-emerald-200 text-rose-700">
                  <p className="font-semibold mb-1">Chi tiết lỗi:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Manifest Info */}
          <div>
            <label htmlFor="bulk-manifest-number" className="text-xs font-semibold text-[#687787] block mb-1">
              Số Vận Đơn Nhà Cung Cấp (Manifest Number)
            </label>
            <input
              id="bulk-manifest-number"
              type="text"
              value={manifestNumber}
              onChange={(e) => setManifestNumber(e.target.value)}
              placeholder="VD: MANIFEST-OCT-2026"
              className="w-full bg-white border border-[#E5E0D7] rounded-xl px-3 py-2 text-xs text-[#252B32] font-mono focus:outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
            />
          </div>

          {/* File Upload Box */}
          <div className="p-6 rounded-2xl border-2 border-dashed border-[#E5E0D7] hover:border-[#102A43] transition text-center bg-[#F7F4ED]/60 cursor-pointer relative">
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <FileText className="w-8 h-8 text-[#687787] mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#102A43]">
              {fileName ? fileName : 'Kéo thả file CSV hoặc JSON vào đây, hoặc bấm để chọn file'}
            </p>
            <p className="text-[11px] text-[#687787] mt-1">Hỗ trợ định dạng: .csv, .json</p>
          </div>

          {/* Items Preview Table */}
          {items.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#102A43] uppercase tracking-wider">
                  Bảng Xem Trước ({items.length} món)
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto border border-[#E5E0D7] rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F4ED] text-[#687787] uppercase font-semibold">
                    <tr>
                      <th className="p-2">SKU</th>
                      <th className="p-2">Tên món</th>
                      <th className="p-2">Điểm bán</th>
                      <th className="p-2 text-right">Giá</th>
                      <th className="p-2 text-right">Tồn kho</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D7]">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#F7F4ED]/50 transition-colors">
                        <td className="p-2 font-mono text-[#252B32]">{item.sku}</td>
                        <td className="p-2 font-medium text-[#102A43]">{item.name}</td>
                        <td className="p-2 text-[#687787]">{item.outletCode || 'CHUNG'}</td>
                        <td className="p-2 text-right font-mono font-bold text-[#102A43]">
                          ${item.basePrice.toFixed(2)}
                        </td>
                        <td className="p-2 text-right font-mono text-[#252B32]">
                          {item.stockQuantity ?? 100}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E0D7] bg-[#F7F4ED]/50 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E5E0D7] text-[#687787] hover:bg-[#F7F4ED] hover:text-[#102A43] text-xs font-semibold transition shadow-xs"
          >
            Đóng
          </button>

          <button
            type="button"
            disabled={isImporting || items.length === 0}
            onClick={() => void handleConfirmImport()}
            className="px-5 py-2 rounded-xl bg-[#102A43] hover:bg-[#183B5B] disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            {isImporting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang nhập dữ liệu...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Xác nhận nhập ({items.length} món)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
