import React, { useState, useEffect } from 'react';
import { X, MapPin, Plus, Trash2, Clock, Anchor } from 'lucide-react';
import type { CruiseTour } from '../../services/tourService';
import type { Port, CruiseStop, StopFormData } from '../../services/portStopService';
import { getTourStops, createTourStop, deleteTourStop } from '../../services/portStopService';
import { StopFormModal } from './StopFormModal';

interface TourStopsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: CruiseTour | null;
  ports: Port[];
}

export const TourStopsModal: React.FC<TourStopsModalProps> = ({
  isOpen,
  onClose,
  tour,
  ports,
}) => {
  const [stops, setStops] = useState<CruiseStop[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && tour) {
      setLoading(true);
      void getTourStops(tour.id)
        .then(setStops)
        .finally(() => setLoading(false));
    }
  }, [isOpen, tour]);

  if (!isOpen || !tour) return null;

  const handleCreateStop = async (formData: StopFormData) => {
    const created = await createTourStop(tour.id, formData);
    setStops((prev) => [...prev, created].sort((a, b) => a.stopOrder - b.stopOrder));
  };

  const handleDeleteStop = async (stopId: number) => {
    await deleteTourStop(tour.id, stopId);
    setStops((prev) => prev.filter((s) => s.id !== stopId));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-white border border-[#E5E0D7] rounded-2xl shadow-xl p-6 text-[#252B32] flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#5A6578] hover:text-[#102A43] p-1.5 rounded-lg hover:bg-[#E5E0D7]/50 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D7] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#102A43] text-[#C5A572] flex items-center justify-center shadow-xs">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif text-[#102A43]">Quản Lý Điểm Dừng Hải Trình</h2>
              <p className="text-xs text-[#5A6578]">
                {tour.name} ({tour.code}) • {tour.startDate} → {tour.endDate}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#102A43] hover:bg-[#0B1F33] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#C5A572]" /> Thêm Điểm Dừng
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <p className="text-xs text-[#5A6578] text-center py-6">Đang tải danh sách điểm dừng...</p>
          ) : stops.length === 0 ? (
            <div className="text-center py-8 text-[#5A6578] text-xs border border-dashed border-[#E5E0D7] rounded-xl">
              Chưa có điểm dừng nào được cấu hình cho tour này.
            </div>
          ) : (
            stops.map((stop) => (
              <div
                key={stop.id}
                className="p-3.5 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl flex items-center justify-between gap-3 text-[#252B32]"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#F7F4ED] text-[#397C80] border border-[#E5E0D7] font-bold text-xs flex items-center justify-center shrink-0">
                    #{stop.stopOrder}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#102A43] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#397C80] shrink-0" />
                      {stop.portName || `Cảng #${stop.portId}`} {stop.portCity ? `(${stop.portCity})` : ''}
                    </h4>
                    <p className="text-[11px] text-[#5A6578] flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-[#5A6578] shrink-0" />
                      <span>Cập cảng: {stop.arrivalTime.replace('T', ' ')}</span>
                      <span>•</span>
                      <span>Rời bến: {stop.departureTime.replace('T', ' ')}</span>
                    </p>
                    {stop.description && (
                      <p className="text-[11px] text-[#5A6578] mt-1 italic">{stop.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteStop(stop.id)}
                  className="p-1.5 text-[#5A6578] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Xóa điểm dừng"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <StopFormModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onSubmit={handleCreateStop}
          ports={ports}
          tourStartDate={tour.startDate}
          tourEndDate={tour.endDate}
        />
      </div>
    </div>
  );
};

export default TourStopsModal;
