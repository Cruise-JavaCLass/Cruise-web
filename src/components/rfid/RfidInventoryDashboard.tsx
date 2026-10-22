import {
  AlertOctagon,
  CheckCircle,
  CreditCard,
  Layers,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  type RfidCardInventoryDto,
  type RfidInventoryDashboardDto,
  rfidCardService,
} from '../../services/rfidCardService';

interface RfidInventoryDashboardProps {
  onOpenBulkScanner: () => void;
  onOpenQuarantineDrawer: (card?: RfidCardInventoryDto) => void;
}

export const RfidInventoryDashboard: React.FC<RfidInventoryDashboardProps> = ({
  onOpenBulkScanner,
  onOpenQuarantineDrawer,
}) => {
  const [metrics, setMetrics] = useState<RfidInventoryDashboardDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rfidCardService.getDashboard();
      setMetrics(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch RFID inventory metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboard();
  }, []);

  const cards = metrics?.recentCards || [];
  const filteredCards = cards.filter((c) => {
    const matchesSearch =
      c.cardUid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.assignedPassengerName && c.assignedPassengerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.assignedCabinNumber && c.assignedCabinNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold tracking-tight text-white uppercase font-mono">
              RFID & NFC Card Pool Inventory Management
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track blank card stock, terminal pairing lifecycles, and broadcast instant POS blacklists
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={onOpenBulkScanner}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-xs font-bold rounded-xl text-white shadow-lg transition"
          >
            <PlusCircle className="w-4 h-4" />
            Bulk Ingest Batch
          </button>
          <button
            onClick={() => onOpenQuarantineDrawer()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-500 text-xs font-bold rounded-xl text-white shadow-lg transition"
          >
            <ShieldAlert className="w-4 h-4" />
            Quarantine Card
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-950/80 border border-red-500 rounded-xl text-red-200 text-xs">
          {error}
        </div>
      )}

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[11px] font-mono text-slate-400 block uppercase">Total In Inventory</span>
          <span className="text-2xl font-black text-white font-mono mt-1 block">
            {metrics?.totalCards ?? 0}
          </span>
        </div>

        <div className="p-4 bg-slate-900 border border-emerald-900/60 rounded-2xl">
          <span className="text-[11px] font-mono text-emerald-400 block uppercase">Available Stock</span>
          <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
            {metrics?.availableCards ?? 0}
          </span>
        </div>

        <div className="p-4 bg-slate-900 border border-cyan-900/60 rounded-2xl">
          <span className="text-[11px] font-mono text-cyan-400 block uppercase">Issued To Guests</span>
          <span className="text-2xl font-black text-cyan-400 font-mono mt-1 block">
            {metrics?.issuedCards ?? 0}
          </span>
        </div>

        <div className="p-4 bg-slate-900 border border-red-900/60 rounded-2xl">
          <span className="text-[11px] font-mono text-red-400 block uppercase">Blacklisted / Lost</span>
          <span className="text-2xl font-black text-red-400 font-mono mt-1 block">
            {metrics?.lostOrBlacklistedCards ?? 0}
          </span>
        </div>

        <div className="p-4 bg-slate-900 border border-amber-900/60 rounded-2xl">
          <span className="text-[11px] font-mono text-amber-400 block uppercase">Damaged / Flawed</span>
          <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">
            {metrics?.damagedCards ?? 0}
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search UID, Batch Number, Guest Name, Cabin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="ISSUED">ISSUED</option>
            <option value="BLACKLISTED">BLACKLISTED</option>
            <option value="LOST_REPORTED">LOST_REPORTED</option>
            <option value="DAMAGED">DAMAGED</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[11px]">
              <tr>
                <th className="p-3.5">Card UID</th>
                <th className="p-3.5">Chip Type</th>
                <th className="p-3.5">Batch #</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Assigned Guest / Cabin</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No RFID cards matching criteria found.
                  </td>
                </tr>
              ) : (
                filteredCards.map((card) => (
                  <tr key={card.id || card.cardUid} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono font-bold text-cyan-400">{card.cardUid}</td>
                    <td className="p-3.5 text-slate-300">{card.cardType}</td>
                    <td className="p-3.5 font-mono text-slate-400">{card.batchNumber}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          card.status === 'AVAILABLE'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : card.status === 'ISSUED'
                            ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                            : card.status === 'BLACKLISTED' || card.status === 'LOST_REPORTED'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {card.status}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {card.assignedPassengerName ? (
                        <div>
                          <div className="font-semibold text-white">{card.assignedPassengerName}</div>
                          <span className="text-[10px] font-mono text-amber-300">
                            Cabin: {card.assignedCabinNumber || 'N/A'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      {card.status !== 'BLACKLISTED' && (
                        <button
                          onClick={() => onOpenQuarantineDrawer(card)}
                          className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 rounded-lg text-[11px] font-semibold transition"
                        >
                          Quarantine
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
