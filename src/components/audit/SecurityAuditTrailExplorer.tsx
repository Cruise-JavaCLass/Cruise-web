import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileSearch,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShieldCheck,
  Code2,
  X,
} from 'lucide-react';
import type { SystemAuditLog, SystemAuditLogQuery } from '../../services/adminTypes';
import { adminAuditService } from '../../services/adminService';

export const SecurityAuditTrailExplorer: React.FC = () => {
  const [logs, setLogs] = useState<SystemAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [category, setCategory] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const [actor, setActor] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [appliedFilters, setAppliedFilters] = useState<{
    category: string;
    action: string;
    actor: string;
    targetId: string;
  }>({ category: '', action: '', actor: '', targetId: '' });
  const fetchGenRef = useRef(0);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Modal inspection state
  const [inspectedLog, setInspectedLog] = useState<SystemAuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    const gen = ++fetchGenRef.current;
    try {
      setLoading(true);
      setError(null);
      const query: SystemAuditLogQuery = {
        category: appliedFilters.category || undefined,
        action: appliedFilters.action || undefined,
        actor: appliedFilters.actor || undefined,
        targetId: appliedFilters.targetId || undefined,
        page,
        size: 15,
      };
      const res = await adminAuditService.queryLogs(query);
      if (gen !== fetchGenRef.current) return;
      setLogs(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err: unknown) {
      if (gen !== fetchGenRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to retrieve system audit trails');
    } finally {
      if (gen === fetchGenRef.current) {
        setLoading(false);
      }
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilters({ category, action, actor, targetId });
    setPage(0);
  };

  const handleExportCsv = () => {
    const query: SystemAuditLogQuery = {
      category: appliedFilters.category || undefined,
      action: appliedFilters.action || undefined,
      actor: appliedFilters.actor || undefined,
      targetId: appliedFilters.targetId || undefined,
    };
    const url = adminAuditService.getExportCsvUrl(query);
    window.open(url, '_blank');
  };

  const safeFormatJson = (val?: string): string => {
    if (!val) return '';
    try {
      return JSON.stringify(JSON.parse(val), null, 2);
    } catch {
      return val;
    }
  };

  const renderJsonDiff = (before?: string, after?: string) => {
    if (!before && !after) {
      return <div className="text-slate-400 italic text-xs">No payload difference captured.</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3">
          <div className="font-bold text-rose-800 mb-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Previous State (Before)
          </div>
          <pre className="text-[11px] text-rose-900 overflow-x-auto whitespace-pre-wrap">
            {before ? safeFormatJson(before) : 'null (Newly created)'}
          </pre>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
          <div className="font-bold text-emerald-800 mb-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Updated State (After)
          </div>
          <pre className="text-[11px] text-emerald-900 overflow-x-auto whitespace-pre-wrap">
            {after ? safeFormatJson(after) : 'null (Deleted/Purged)'}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Security Audit Trail Explorer</h2>
            <p className="text-xs text-slate-500">Centralized immutable audit records with SHA-256 integrity verification & diff inspection</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchLogs()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" /> Export Audit CSV
          </button>
        </div>
      </div>

      {/* Filter Form Bar */}
      <form onSubmit={handleApplyFilter} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Audit Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="DEVICE">DEVICE (Terminals / Hardware)</option>
              <option value="AUTH">AUTH (Authentication / Passwords)</option>
              <option value="SECURITY">SECURITY (Access Control / Keys)</option>
              <option value="CATALOG">CATALOG (Menu & Pricing)</option>
              <option value="SETTLEMENT">SETTLEMENT (Folio Invoicing)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Action / Event</label>
            <input
              type="text"
              placeholder="e.g. DEVICE_PROVISIONED"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Actor (User / System)</label>
            <input
              type="text"
              placeholder="e.g. ADMIN_JULES"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Target Resource ID</label>
            <input
              type="text"
              placeholder="e.g. TERM-DECK9-01"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" /> Apply Filter
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Audit Records ({totalElements})
          </span>
          <span className="text-xs text-slate-400">Page {page + 1} of {totalPages}</span>
        </div>

        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50/70 text-slate-500 font-semibold">
            <tr>
              <th className="px-5 py-3.5">Timestamp</th>
              <th className="px-5 py-3.5">Category & Action</th>
              <th className="px-5 py-3.5">Actor</th>
              <th className="px-5 py-3.5">Target</th>
              <th className="px-5 py-3.5">Reason / Summary</th>
              <th className="px-5 py-3.5">Integrity Hash</th>
              <th className="px-5 py-3.5 text-right">Inspect Diff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  <FileSearch className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No audit trail records matched the search criteria.
                </td>
              </tr>
            ) : (
              logs.map((logEntry) => (
                <tr key={logEntry.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                    {new Date(logEntry.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 mr-1.5">
                      {logEntry.category}
                    </span>
                    <span className="font-semibold text-slate-900">{logEntry.action}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-900">{logEntry.actor}</div>
                    {logEntry.ipAddress && <div className="text-[10px] text-slate-400 font-mono">{logEntry.ipAddress}</div>}
                  </td>
                  <td className="px-5 py-3.5">
                    {logEntry.targetId ? (
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase">{logEntry.targetResource || 'RESOURCE'}: </span>
                        <span className="font-mono text-slate-800 font-medium">{logEntry.targetId}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 max-w-[200px] truncate text-slate-600" title={logEntry.reason}>
                    {logEntry.reason || '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100" title={logEntry.immutableHash}>
                      {logEntry.immutableHash ? `${logEntry.immutableHash.substring(0, 12)}...` : 'N/A'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => setInspectedLog(logEntry)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                    >
                      <Code2 className="w-3.5 h-3.5" /> Diff
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </button>
          <span className="text-xs text-slate-500">Page {page + 1} of {totalPages}</span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Payload Diff Modal */}
      {inspectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-indigo-600" />
                  Audit Event Diff Inspector: {inspectedLog.action}
                </h3>
                <p className="text-xs text-slate-500">Recorded on {new Date(inspectedLog.createdAt).toLocaleString()} by {inspectedLog.actor}</p>
              </div>
              <button
                onClick={() => setInspectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono space-y-1">
                <div><strong>Category:</strong> {inspectedLog.category}</div>
                <div><strong>Target:</strong> {inspectedLog.targetResource} / {inspectedLog.targetId}</div>
                <div><strong>Reason:</strong> {inspectedLog.reason || 'None provided'}</div>
                <div><strong>Immutable Hash (SHA-256):</strong> <span className="text-indigo-600 font-bold">{inspectedLog.immutableHash}</span></div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">State Payload Comparison</h4>
                {renderJsonDiff(inspectedLog.payloadBefore, inspectedLog.payloadAfter)}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInspectedLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
