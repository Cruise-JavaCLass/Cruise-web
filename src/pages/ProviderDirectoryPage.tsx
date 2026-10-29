import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react';
import { getTourProviders, type TourProvider } from '../services/tourService';

type ProviderStatus = TourProvider['status'];
type StatusFilter = 'ALL' | ProviderStatus;

const PAGE_SIZE = 10;

const STATUS_LABELS: Record<ProviderStatus, string> = {
  ACTIVE: 'Đang hoạt động',
  SUSPENDED: 'Tạm ngưng',
  TERMINATED: 'Đã chấm dứt',
};

const STATUS_STYLES: Record<ProviderStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SUSPENDED: 'bg-amber-50 text-amber-700 border-amber-200',
  TERMINATED: 'bg-rose-50 text-rose-700 border-rose-200',
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Không thể tải danh sách nhà cung cấp.';
}

function isStatusFilter(value: string): value is StatusFilter {
  return value === 'ALL' || Object.hasOwn(STATUS_LABELS, value);
}

export function ProviderDirectoryPage() {
  const [providers, setProviders] = useState<TourProvider[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [portFilter, setPortFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getTourProviders()
      .then((data) => {
        if (active) setProviders(data);
      })
      .catch((loadError: unknown) => {
        if (active) setError(getErrorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const portIds = useMemo(
    () => [...new Set(providers.map((provider) => provider.portId))].sort(),
    [providers]
  );

  const filteredProviders = useMemo(() => {
    const keyword = searchTerm.trim().toLocaleLowerCase();
    return providers.filter((provider) => {
      const matchesSearch =
        !keyword ||
        [
          provider.id,
          provider.code,
          provider.name,
          provider.taxCode,
          provider.licenseNumber,
          provider.contactPerson,
          provider.email,
          provider.phone,
          provider.emergencyHotline,
          provider.portId,
        ].some((value) => value.toLocaleLowerCase().includes(keyword));
      const matchesPort = portFilter === 'ALL' || provider.portId === portFilter;
      const matchesStatus = statusFilter === 'ALL' || provider.status === statusFilter;
      return matchesSearch && matchesPort && matchesStatus;
    });
  }, [providers, searchTerm, portFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProviders.length / PAGE_SIZE));
  const pageProviders = filteredProviders.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const updateSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0);
  };

  const updatePortFilter = (value: string) => {
    setPortFilter(value);
    setCurrentPage(0);
  };

  const updateStatusFilter = (value: StatusFilter) => {
    setStatusFilter(value);
    setCurrentPage(0);
  };

  const refreshProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      setProviders(await getTourProviders());
    } catch (loadError: unknown) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-[#E5E0D7] bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="mb-1 text-[10px] font-semibold tracking-wider text-[#687787]">EXCURSION OPERATIONS</p>
            <h1 className="font-serif text-xl font-bold tracking-tight text-[#102A43] sm:text-2xl">
              Quản Lý Nhà Cung Cấp Tour
            </h1>
            <p className="mt-1 text-xs text-[#687787]">
              Danh bạ và trạng thái hoạt động của các nhà cung cấp tour trên bờ.
            </p>
          </div>
          <button
            type="button"
            onClick={refreshProviders}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-[#E5E0D7] bg-white px-3 py-2 text-xs font-semibold text-[#102A43] transition-colors hover:bg-[#F7F4ED] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </header>

      <section className="overflow-hidden rounded-xl border border-[#E5E0D7] bg-white shadow-xs">
        <div className="flex flex-col gap-3 border-b border-[#E5E0D7] p-4 md:flex-row">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687787]" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Tìm theo tên, mã, liên hệ, email..."
              aria-label="Tìm kiếm nhà cung cấp"
              className="w-full rounded-lg border border-[#E5E0D7] py-2 pl-9 pr-3 text-sm text-[#102A43] outline-none focus:border-[#C5A572]"
            />
          </label>
          <select
            value={portFilter}
            onChange={(event) => updatePortFilter(event.target.value)}
            aria-label="Lọc theo portId"
            className="rounded-lg border border-[#E5E0D7] bg-white px-3 py-2 text-sm text-[#102A43] outline-none focus:border-[#C5A572]"
          >
            <option value="ALL">Tất cả cảng</option>
            {portIds.map((portId) => (
              <option key={portId} value={portId}>{portId}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => {
              if (isStatusFilter(event.target.value)) {
                updateStatusFilter(event.target.value);
              }
            }}
            aria-label="Lọc theo trạng thái"
            className="rounded-lg border border-[#E5E0D7] bg-white px-3 py-2 text-sm text-[#102A43] outline-none focus:border-[#C5A572]"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <option key={status} value={status}>{label}</option>
            ))}
          </select>
        </div>

        {error && (
          <div role="alert" className="m-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
            <thead className="bg-[#F7F4ED] text-[11px] uppercase tracking-wide text-[#687787]">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Nhà cung cấp</th>
                <th scope="col" className="px-4 py-3 font-semibold">Mã số thuế</th>
                <th scope="col" className="px-4 py-3 font-semibold">Giấy phép</th>
                <th scope="col" className="px-4 py-3 font-semibold">Người liên hệ</th>
                <th scope="col" className="px-4 py-3 font-semibold">Email / Điện thoại</th>
                <th scope="col" className="px-4 py-3 font-semibold">Hotline khẩn cấp</th>
                <th scope="col" className="px-4 py-3 font-semibold">Port ID</th>
                <th scope="col" className="px-4 py-3 font-semibold">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEEAE2]">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-[#687787]">Đang tải danh sách nhà cung cấp...</td></tr>
              ) : pageProviders.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-[#687787]">Không tìm thấy nhà cung cấp phù hợp.</td></tr>
              ) : (
                pageProviders.map((provider) => (
                  <tr key={provider.id} className="text-[#334E68] hover:bg-[#FCFBF8]">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#102A43]">{provider.name}</div>
                      <div className="mt-0.5 text-xs text-[#687787]">{provider.code} · {provider.id}</div>
                    </td>
                    <td className="px-4 py-3">{provider.taxCode || '—'}</td>
                    <td className="px-4 py-3">{provider.licenseNumber || '—'}</td>
                    <td className="px-4 py-3">{provider.contactPerson || '—'}</td>
                    <td className="px-4 py-3">
                      <div>{provider.email || '—'}</div>
                      <div className="mt-0.5 text-xs text-[#687787]">{provider.phone || '—'}</div>
                    </td>
                    <td className="px-4 py-3">{provider.emergencyHotline || '—'}</td>
                    <td className="px-4 py-3">{provider.portId || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[provider.status]}`}>
                        {STATUS_LABELS[provider.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col items-center justify-between gap-3 border-t border-[#E5E0D7] px-4 py-3 text-xs text-[#687787] sm:flex-row">
          <span>
            {filteredProviders.length === 0
              ? '0 nhà cung cấp'
              : `${currentPage * PAGE_SIZE + 1}–${Math.min((currentPage + 1) * PAGE_SIZE, filteredProviders.length)} / ${filteredProviders.length} nhà cung cấp`}
          </span>
          <div className="flex items-center gap-3">
            <span>Trang {currentPage + 1} / {totalPages}</span>
            <button
              type="button"
              aria-label="Trang trước"
              onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
              disabled={currentPage === 0 || loading}
              className="rounded-md border border-[#E5E0D7] p-1.5 text-[#102A43] hover:bg-[#F7F4ED] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Trang sau"
              onClick={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))}
              disabled={currentPage >= totalPages - 1 || loading}
              className="rounded-md border border-[#E5E0D7] p-1.5 text-[#102A43] hover:bg-[#F7F4ED] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
