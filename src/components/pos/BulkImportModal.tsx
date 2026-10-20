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
            if (!Number.isFinite(numPrice) || numPrice < 0) {
              throw new Error(`Dòng JSON #${i + 1}: basePrice không hợp lệ.`);
            }
            validatedList.push({
              sku,
              name,
              basePrice: numPrice,
              costPrice: item.costPrice !== undefined && item.costPrice !== null && Number.isFinite(Number(item.costPrice)) ? Number(item.costPrice) : undefined,
              outletCode: typeof item.outletCode === 'string' ? item.outletCode : undefined,
              categoryCode: typeof item.categoryCode === 'string' ? item.categoryCode : undefined,
              stockQuantity: item.stockQuantity !== undefined && Number.isFinite(Number(item.stockQuantity)) ? Number(item.stockQuantity) : 100,
              barcode: typeof item.barcode === 'string' ? item.barcode : undefined,
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
            if (!Number.isFinite(numPrice) || numPrice < 0 || rawPrice === '') {
              throw new Error(`Dòng CSV #${i + 1}: Giá basePrice không hợp lệ (${rawPrice}).`);
            }
            let stock = 100;
            if (cols[6] !== undefined && cols[6].trim() !== '') {
              const parsedStock = parseInt(cols[6].trim(), 10);
              if (isNaN(parsedStock) || parsedStock < 0) {
                throw new Error(`Dòng CSV #${i + 1}: Số lượng tồn kho không hợp lệ (${cols[6]}).`);
              }
              stock = parsedStock;
            }
            parsedList.push({
              sku,
              name,
              basePrice: numPrice,
              costPrice: cols[3] && Number.isFinite(Number(cols[3])) ? parseFloat(cols[3]) : undefined,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in"
    >
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-400" />
            <h3 id="bulk-import-title" className="text-base font-bold text-white">
              Nhập Danh Mục Hàng Loạt (Bulk Manifest Sync)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {parseError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {importResult && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Nhập danh mục hoàn tất!</span>
              </div>
              <p>
                Tổng số mục: <strong>{importResult.totalItems}</strong> | Thành công:{' '}
                <strong className="text-emerald-400">{importResult.successCount}</strong> | Lỗi:{' '}
                <strong className="text-rose-400">{importResult.failedCount}</strong>
              </p>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-2 pt-2 border-t border-emerald-900/60 text-rose-300">
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
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Số Vận Đơn Nhà Cung Cấp (Manifest Number)
            </label>
            <input
              type="text"
              value={manifestNumber}
              onChange={(e) => setManifestNumber(e.target.value)}
              placeholder="VD: MANIFEST-OCT-2026"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* File Upload Box */}
          <div className="p-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-blue-500 transition text-center bg-slate-800/40 cursor-pointer relative">
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-white">
              {fileName ? fileName : 'Kéo thả file CSV hoặc JSON vào đây, hoặc bấm để chọn file'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Hỗ trợ định dạng: .csv, .json</p>
          </div>

          {/* Items Preview Table */}
          {items.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Bảng Xem Trước ({items.length} món)
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-2">SKU</th>
                      <th className="p-2">Tên món</th>
                      <th className="p-2">Điểm bán</th>
                      <th className="p-2 text-right">Giá</th>
                      <th className="p-2 text-right">Tồn kho</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/50">
                        <td className="p-2 font-mono text-slate-300">{item.sku}</td>
                        <td className="p-2 font-medium text-white">{item.name}</td>
                        <td className="p-2 text-slate-400">{item.outletCode || 'CHUNG'}</td>
                        <td className="p-2 text-right font-mono text-emerald-400">
                          ${item.basePrice.toFixed(2)}
                        </td>
                        <td className="p-2 text-right font-mono text-slate-300">
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
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition"
          >
            Đóng
          </button>

          <button
            type="button"
            disabled={isImporting || items.length === 0}
            onClick={() => void handleConfirmImport()}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition"
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
