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
      setError(null);
      const res = await adminDeviceService.listTerminals();
      setTerminals(res.content || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch terminal registry');
    } finally {
      setLoading(false);
    }
  }, []);

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
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><Radio className="w-3 h-3 text-emerald-600 animate-pulse" /> Active</span>;
      case 'PROVISIONED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Provisioned</span>;
      case 'REVOKED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"><Ban className="w-3 h-3" /> Revoked</span>;
      case 'WIPED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800"><Trash2 className="w-3 h-3" /> Wiped</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">POS Terminal Registry & Fleet Security</h2>
              <p className="text-xs text-slate-500">Mutual TLS certificates, dynamic API keys rotation & emergency remote wipe</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void loadTerminals()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => setIsProvisionOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" /> Provision New Terminal
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> {actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-700 hover:underline">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" /> {error}
        </div>
      )}

      {/* Secret Key Notification Modal / Banner if freshly provisioned or rotated */}
      {provisionResult && provisionResult.rawApiKey && (
        <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <KeyRound className="w-5 h-5 text-amber-600" />
            <span>Important: Save Newly Issued Device API Key</span>
          </div>
          <p className="text-xs text-amber-800">
            This secret token is displayed only once. Copy and install it onto POS terminal <strong>{provisionResult.terminal.deviceId}</strong>.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={provisionResult.rawApiKey}
              className="w-full font-mono text-xs p-2.5 bg-white border border-amber-300 rounded-lg selection:bg-amber-200"
            />
            <button
              onClick={() => {
                if (provisionResult.rawApiKey) {
                  navigator.clipboard.writeText(provisionResult.rawApiKey);
                  alert('API key copied to clipboard!');
                }
              }}
              className="p-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-1 text-xs font-semibold"
            >
              <Copy className="w-4 h-4" /> Copy
            </button>
            <button
              onClick={() => setProvisionResult(null)}
              className="p-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Terminal Fleet Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Registered Terminals ({terminals.length})</span>
        </div>
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50/70 text-slate-500 font-semibold">
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
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {terminals.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No POS terminals provisioned yet.
                </td>
              </tr>
            ) : (
              terminals.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900">{t.deviceId}</div>
                    <div className="text-[11px] text-slate-500">{t.deviceName} ({t.ipAddress || 'DHCP'})</div>
                  </td>
                  <td className="px-5 py-3.5 font-medium">{t.stationId}</td>
                  <td className="px-5 py-3.5">{getStatusBadge(t.status)}</td>
                  <td className="px-5 py-3.5">
                    <div className="font-mono text-[11px] text-slate-600 truncate max-w-[140px]" title={t.certificateFingerprint}>
                      {t.certificateFingerprint?.substring(0, 16)}...
                    </div>
                    {t.certificateExpiry && (
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> Exp: {new Date(t.certificateExpiry).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-600">
                    {t.apiKeyPrefix ? `${t.apiKeyPrefix}****` : 'N/A'}
                  </td>
                  <td className="px-5 py-3.5 font-semibold">v{t.tokenVersion}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        title="Rotate API Key"
                        disabled={actionLoading || t.status === 'WIPED' || t.status === 'REVOKED'}
                        onClick={() => handleRotateKey(t.deviceId)}
                        className="p-1.5 hover:bg-slate-100 text-indigo-600 rounded-lg disabled:opacity-30"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        title="Renew mTLS Certificate"
                        disabled={actionLoading || t.status === 'WIPED' || t.status === 'REVOKED'}
                        onClick={() => handleRenewCertificate(t.deviceId)}
                        className="p-1.5 hover:bg-slate-100 text-blue-600 rounded-lg disabled:opacity-30"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                      <button
                        title="Revoke Credentials"
                        disabled={actionLoading || t.status === 'REVOKED' || t.status === 'WIPED'}
                        onClick={() => handleRevoke(t.deviceId)}
                        className="p-1.5 hover:bg-slate-100 text-amber-600 rounded-lg disabled:opacity-30"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                      <button
                        title="Emergency Remote Wipe"
                        disabled={actionLoading || t.status === 'WIPED'}
                        onClick={() => handleRemoteWipe(t.deviceId)}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg disabled:opacity-30"
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
      </div>

      {/* Provision Terminal Modal */}
      {isProvisionOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Provision POS Terminal</h3>
            <p className="text-xs text-slate-500 mb-4">Enroll terminal into ship local mesh with mutual TLS and API credential.</p>

            <form onSubmit={handleProvisionSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Device ID / Terminal Key</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TERM-DECK9-BAR01"
                  value={newDeviceId}
                  onChange={(e) => setNewDeviceId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Friendly Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Poolside Bar Main Register"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Station / Outlet</label>
                <select
                  value={newStationId}
                  onChange={(e) => setNewStationId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                >
                  <option value="BAR-DECK-9">BAR-DECK-9 (Poolside Lido Bar)</option>
                  <option value="REST-DECK-5">REST-DECK-5 (Specialty Steakhouse)</option>
                  <option value="SPA-DECK-11">SPA-DECK-11 (Wellness Spa)</option>
                  <option value="GIFT-DECK-6">GIFT-DECK-6 (Souvenir Boutique)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">IP Address (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 192.168.10.45"
                  value={newIpAddress}
                  onChange={(e) => setNewIpAddress(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProvisionOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition shadow-sm"
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
