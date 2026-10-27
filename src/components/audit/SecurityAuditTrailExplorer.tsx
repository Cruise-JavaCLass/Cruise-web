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
      return <div className="text-[#5A6578] italic text-xs">No payload difference captured.</div>;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5E0D7] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#102A43]">Security Audit Trail Explorer</h2>
            <p className="text-xs text-[#252B32]/70">Centralized immutable audit records with SHA-256 integrity verification & diff inspection</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchLogs()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#102A43] bg-[#F7F4ED] hover:bg-[#ECE7DC] border border-[#E5E0D7] rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#102A43] hover:bg-[#0B1F33] rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Audit CSV
          </button>
        </div>
      </div>

      {/* Filter Form Bar */}
      <form onSubmit={handleApplyFilter} className="bg-white p-5 rounded-2xl border border-[#E5E0D7] shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-[#102A43] mb-1">Audit Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
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
            <label className="block font-semibold text-[#102A43] mb-1">Action / Event</label>
            <input
              type="text"
              placeholder="e.g. DEVICE_PROVISIONED"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#102A43] mb-1">Actor (User / System)</label>
            <input
              type="text"
              placeholder="e.g. ADMIN_JULES"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              className="w-full p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#102A43] mb-1">Target Resource ID</label>
            <input
              type="text"
              placeholder="e.g. TERM-DECK9-01"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 bg-[#102A43] hover:bg-[#0B1F33] text-white font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
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
      <div className="bg-white rounded-2xl border border-[#E5E0D7] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E5E0D7] flex items-center justify-between bg-[#F7F4ED]">
          <span className="text-xs font-bold text-[#102A43] uppercase tracking-wider">
            Audit Records ({totalElements})
          </span>
          <span className="text-xs text-[#252B32]/60">Page {page + 1} of {totalPages}</span>
        </div>

        <table className="min-w-full divide-y divide-[#E5E0D7] text-left text-xs">
          <thead className="bg-[#F7F4ED]/50 text-[#102A43] font-semibold border-b border-[#E5E0D7]">
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
          <tbody className="divide-y divide-[#E5E0D7] text-[#252B32] bg-white">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-[#252B32]/40">
                  <FileSearch className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#102A43]" />
                  No audit trail records matched the search criteria.
                </td>
              </tr>
            ) : (
              logs.map((logEntry) => (
                <tr key={logEntry.id} className="hover:bg-[#F7F4ED]/40 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap text-[#252B32]/60 font-mono text-[11px]">
                    {new Date(logEntry.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#F7F4ED] border border-[#E5E0D7] text-[#102A43] mr-1.5">
                      {logEntry.category}
                    </span>
                    <span className="font-semibold text-[#102A43]">{logEntry.action}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-[#102A43]">{logEntry.actor}</div>
                    {logEntry.ipAddress && <div className="text-[10px] text-[#252B32]/60 font-mono">{logEntry.ipAddress}</div>}
                  </td>
                  <td className="px-5 py-3.5">
                    {logEntry.targetId ? (
                      <div>
                        <span className="text-[10px] text-[#252B32]/60 uppercase">{logEntry.targetResource || 'RESOURCE'}: </span>
                        <span className="font-mono text-[#102A43] font-medium">{logEntry.targetId}</span>
                      </div>
                    ) : (
                      <span className="text-[#252B32]/40">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 max-w-[200px] truncate text-[#252B32]/80" title={logEntry.reason}>
                    {logEntry.reason || '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-[10px] text-[#102A43] bg-[#F7F4ED] px-2 py-1 rounded border border-[#E5E0D7]" title={logEntry.immutableHash}>
                      {logEntry.immutableHash ? `${logEntry.immutableHash.substring(0, 12)}...` : 'N/A'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => setInspectedLog(logEntry)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#102A43] hover:text-[#0B1F33] hover:bg-[#F7F4ED] rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[#E5E0D7]"
                    >
                      <Code2 className="w-3.5 h-3.5 text-[#397C80]" /> Diff
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination bar */}
        <div className="p-4 border-t border-[#E5E0D7] flex items-center justify-between bg-[#F7F4ED]">
          <button
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#102A43] bg-white border border-[#E5E0D7] rounded-lg disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </button>
          <span className="text-xs text-[#252B32]/70">Page {page + 1} of {totalPages}</span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#102A43] bg-white border border-[#E5E0D7] rounded-lg disabled:opacity-40 cursor-pointer"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Payload Diff Modal */}
      {inspectedLog && (
        <div className="fixed inset-0 z-50 bg-[#0B1F33]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-[#E5E0D7] max-h-[90vh] flex flex-col text-[#252B32]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D7] mb-4">
              <div>
                <h3 className="text-base font-bold text-[#102A43] flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-[#397C80]" />
                  Audit Event Diff Inspector: {inspectedLog.action}
                </h3>
                <p className="text-xs text-[#252B32]/70">Recorded on {new Date(inspectedLog.createdAt).toLocaleString()} by {inspectedLog.actor}</p>
              </div>
              <button
                onClick={() => setInspectedLog(null)}
                className="p-1.5 text-[#252B32]/60 hover:text-[#102A43] hover:bg-[#F7F4ED] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="text-xs bg-[#F7F4ED]/60 p-3 rounded-xl border border-[#E5E0D7] font-mono space-y-1 text-[#252B32]">
                <div><strong>Category:</strong> {inspectedLog.category}</div>
                <div><strong>Target:</strong> {inspectedLog.targetResource} / {inspectedLog.targetId}</div>
                <div><strong>Reason:</strong> {inspectedLog.reason || 'None provided'}</div>
                <div><strong>Immutable Hash (SHA-256):</strong> <span className="text-[#102A43] font-bold">{inspectedLog.immutableHash}</span></div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#102A43] uppercase mb-2">State Payload Comparison</h4>
                {renderJsonDiff(inspectedLog.payloadBefore, inspectedLog.payloadAfter)}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E0D7] flex justify-end">
              <button
                onClick={() => setInspectedLog(null)}
                className="px-4 py-2 bg-[#102A43] hover:bg-[#0B1F33] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
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
