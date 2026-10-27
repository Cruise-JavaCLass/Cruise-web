import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Smartphone,
  KeyRound,
  RotateCw,
  Ban,
  Trash2,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Copy,
  Clock,
  Radio,
} from 'lucide-react';
import type { PosTerminal, ProvisionTerminalResponse } from '../../services/adminTypes';
import { adminDeviceService } from '../../services/adminService';

export const PosTerminalRegistry: React.FC = () => {
  const [terminals, setTerminals] = useState<PosTerminal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modal states
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [provisionResult, setProvisionResult] = useState<ProvisionTerminalResponse | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form input for provision
  const [newDeviceId, setNewDeviceId] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newStationId, setNewStationId] = useState('BAR-DECK-9');
  const [newIpAddress, setNewIpAddress] = useState('');

  const loadTerminals = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await adminDeviceService.listTerminals(page, 20);
      setTerminals(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Failed to fetch terminal registry');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadTerminals();
  }, [loadTerminals]);

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);
      const res = await adminDeviceService.provisionTerminal({
        deviceId: newDeviceId,
        deviceName: newDeviceName,
        stationId: newStationId,
        ipAddress: newIpAddress || undefined,
      });
      setProvisionResult(res);
      setIsProvisionOpen(false);
      setNewDeviceId('');
      setNewDeviceName('');
      void loadTerminals();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Provisioning failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRotateKey = async (deviceId: string) => {
    if (!window.confirm(`Rotate API Key for device ${deviceId}? Previous key will stop working.`)) return;
    try {
      setActionLoading(true);
      setError(null);
      setActionMessage(null);
      const res = await adminDeviceService.rotateApiKey(deviceId, { reason: 'Operator manual rotation' });
      setProvisionResult(res);
      setActionMessage(`New API key generated for ${deviceId}`);
      void loadTerminals();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to rotate API key');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenewCertificate = async (deviceId: string) => {
    try {
      setActionLoading(true);
      setError(null);
      setActionMessage(null);
      const res = await adminDeviceService.renewCertificate(deviceId);
      setActionMessage(`Certificate renewed successfully for ${deviceId}. Expiry: ${new Date(res.certificateExpiry).toLocaleDateString()}`);
      void loadTerminals();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to renew certificate');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async (deviceId: string) => {
    if (!window.confirm(`REVOKE credentials for device ${deviceId}? The terminal cannot process transactions anymore.`)) return;
    try {
      setActionLoading(true);
      setError(null);
      setActionMessage(null);
      await adminDeviceService.revokeTerminal(deviceId, { reason: 'Security de-authorization' });
      setActionMessage(`Device ${deviceId} revoked.`);
      void loadTerminals();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to revoke device');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoteWipe = async (deviceId: string) => {
    const reason = window.prompt(`CRITICAL: Enter reason for REMOTE WIPE on device ${deviceId}:`);
    if (!reason) return;
    try {
      setActionLoading(true);
      setError(null);
      setActionMessage(null);
      await adminDeviceService.issueRemoteWipe(deviceId, { reason });
      setActionMessage(`REMOTE WIPE instruction issued for ${deviceId}. Memory & encryption keys will be purged.`);
      void loadTerminals();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to issue remote wipe');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: PosTerminal['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"><Radio className="w-3 h-3 text-emerald-600 animate-pulse" /> Active</span>;
      case 'PROVISIONED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">Provisioned</span>;
      case 'REVOKED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200"><Ban className="w-3 h-3" /> Revoked</span>;
      case 'WIPED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200"><Trash2 className="w-3 h-3" /> Wiped</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5E0D7] shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#102A43]">POS Terminal Registry & Fleet Security</h2>
              <p className="text-xs text-[#252B32]/70">Mutual TLS certificates, dynamic API keys rotation & emergency remote wipe</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void loadTerminals()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#102A43] bg-[#F7F4ED] hover:bg-[#ECE7DC] border border-[#E5E0D7] rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => setIsProvisionOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#102A43] hover:bg-[#0B1F33] rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Provision New Terminal
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> {actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-700 hover:underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" /> {error}
        </div>
      )}

      {/* Secret Key Notification Modal / Banner if freshly provisioned or rotated */}
      {provisionResult && provisionResult.rawApiKey && (
        <div className="p-5 bg-[#F7F4ED] border border-[#C5A572] rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#102A43] font-bold text-sm">
            <KeyRound className="w-5 h-5 text-[#C5A572]" />
            <span>Important: Save Newly Issued Device API Key</span>
          </div>
          <p className="text-xs text-[#252B32]/80">
            This secret token is displayed only once. Copy and install it onto POS terminal <strong>{provisionResult.terminal.deviceId}</strong>.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={provisionResult.rawApiKey}
              className="w-full font-mono text-xs p-2.5 bg-white border border-[#E5E0D7] rounded-xl text-[#102A43]"
            />
            <button
              onClick={async () => {
                if (!provisionResult.rawApiKey) return;
                try {
                  await navigator.clipboard.writeText(provisionResult.rawApiKey);
                  alert('API key copied to clipboard!');
                } catch {
                  alert('Copy failed. Select the key text and copy it manually.');
                }
              }}
              className="p-2.5 bg-[#102A43] hover:bg-[#0B1F33] text-white rounded-xl flex items-center gap-1 text-xs font-semibold cursor-pointer transition-colors"
            >
              <Copy className="w-4 h-4" /> Copy
            </button>
            <button
              onClick={() => setProvisionResult(null)}
              className="p-2.5 bg-[#F7F4ED] hover:bg-[#ECE7DC] border border-[#E5E0D7] text-[#102A43] rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Terminal Fleet Table */}
      <div className="bg-white rounded-2xl border border-[#E5E0D7] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E5E0D7] flex items-center justify-between bg-[#F7F4ED]">
          <span className="text-xs font-bold text-[#102A43] uppercase tracking-wider">Registered Terminals ({totalElements})</span>
        </div>
        <table className="min-w-full divide-y divide-[#E5E0D7] text-left text-xs">
          <thead className="bg-[#F7F4ED]/50 text-[#102A43] font-semibold border-b border-[#E5E0D7]">
            <tr>
              <th className="px-5 py-3.5">Device ID & Name</th>
              <th className="px-5 py-3.5">Station Outlet</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">mTLS Certificate</th>
              <th className="px-5 py-3.5">API Key Prefix</th>
              <th className="px-5 py-3.5">Token Ver.</th>
              <th className="px-5 py-3.5 text-right">Fleet Security Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E0D7] text-[#252B32] bg-white">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-[#252B32]/40">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#102A43]" />
                  Loading POS terminals...
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-rose-600">
                  <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-rose-600" />
                  {loadError}
                </td>
              </tr>
            ) : terminals.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-[#252B32]/40">
                  <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#102A43]" />
                  No POS terminals provisioned yet.
                </td>
              </tr>
            ) : (
              terminals.map((t) => (
                <tr key={t.id} className="hover:bg-[#F7F4ED]/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-[#102A43]">{t.deviceId}</div>
                    <div className="text-[11px] text-[#252B32]/60">{t.deviceName} ({t.ipAddress || 'DHCP'})</div>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-[#252B32]">{t.stationId}</td>
                  <td className="px-5 py-3.5">{getStatusBadge(t.status)}</td>
                  <td className="px-5 py-3.5">
                    <div className="font-mono text-[11px] text-[#252B32]/70 truncate max-w-[140px]" title={t.certificateFingerprint}>
                      {t.certificateFingerprint?.substring(0, 16)}...
                    </div>
                    {t.certificateExpiry && (
                      <div className="text-[10px] text-[#252B32]/60 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> Exp: {new Date(t.certificateExpiry).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[#252B32]/70">
                    {t.apiKeyPrefix ? `${t.apiKeyPrefix}****` : 'N/A'}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-[#102A43]">v{t.tokenVersion}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        title="Rotate API Key"
                        disabled={actionLoading || t.status === 'WIPED' || t.status === 'REVOKED'}
                        onClick={() => handleRotateKey(t.deviceId)}
                        className="p-1.5 hover:bg-[#F7F4ED] text-[#102A43] rounded-lg disabled:opacity-30 cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        title="Renew mTLS Certificate"
                        disabled={actionLoading || t.status === 'WIPED' || t.status === 'REVOKED'}
                        onClick={() => handleRenewCertificate(t.deviceId)}
                        className="p-1.5 hover:bg-[#F7F4ED] text-[#397C80] rounded-lg disabled:opacity-30 cursor-pointer"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                      <button
                        title="Revoke Credentials"
                        disabled={actionLoading || t.status === 'REVOKED' || t.status === 'WIPED'}
                        onClick={() => handleRevoke(t.deviceId)}
                        className="p-1.5 hover:bg-[#F7F4ED] text-amber-700 rounded-lg disabled:opacity-30 cursor-pointer"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                      <button
                        title="Emergency Remote Wipe"
                        disabled={actionLoading || t.status === 'WIPED'}
                        onClick={() => handleRemoteWipe(t.deviceId)}
                        className="p-1.5 hover:bg-rose-50 text-rose-700 rounded-lg disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="p-4 border-t border-[#E5E0D7] flex items-center justify-between text-xs text-[#252B32]/70 bg-[#F7F4ED]">
          <span>Page {page + 1} of {totalPages || 1} ({totalElements} total)</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 0 || loading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-[#E5E0D7] bg-white hover:bg-[#F7F4ED] disabled:opacity-50 font-medium text-[#102A43] cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1 || loading}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-xl border border-[#E5E0D7] bg-white hover:bg-[#F7F4ED] disabled:opacity-50 font-medium text-[#102A43] cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Provision Terminal Modal */}
      {isProvisionOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1F33]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E0D7] text-[#252B32]">
            <h3 className="text-lg font-bold text-[#102A43] mb-1">Provision POS Terminal</h3>
            <p className="text-xs text-[#252B32]/70 mb-4">Enroll terminal into ship local mesh with mutual TLS and API credential.</p>

            <form onSubmit={handleProvisionSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#102A43] mb-1">Device ID / Terminal Key</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TERM-DECK9-BAR01"
                  value={newDeviceId}
                  onChange={(e) => setNewDeviceId(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#102A43] mb-1">Friendly Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Poolside Bar Main Register"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#102A43] mb-1">Assigned Station / Outlet</label>
                <select
                  value={newStationId}
                  onChange={(e) => setNewStationId(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
                >
                  <option value="BAR-DECK-9">BAR-DECK-9 (Poolside Lido Bar)</option>
                  <option value="REST-DECK-5">REST-DECK-5 (Specialty Steakhouse)</option>
                  <option value="SPA-DECK-11">SPA-DECK-11 (Wellness Spa)</option>
                  <option value="GIFT-DECK-6">GIFT-DECK-6 (Souvenir Boutique)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#102A43] mb-1">IP Address (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 192.168.10.45"
                  value={newIpAddress}
                  onChange={(e) => setNewIpAddress(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E0D7]">
                <button
                  type="button"
                  onClick={() => setIsProvisionOpen(false)}
                  className="px-4 py-2 bg-[#F7F4ED] hover:bg-[#ECE7DC] border border-[#E5E0D7] text-[#102A43] rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#102A43] hover:bg-[#0B1F33] text-white rounded-xl font-semibold transition-colors shadow-xs cursor-pointer"
                >
                  {actionLoading ? 'Enrolling...' : 'Enroll Terminal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
