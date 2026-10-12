import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Ship,
  Waves,
  Tag,
  Anchor,
  CheckCircle2,
  Info,
} from 'lucide-react';
import type { CruiseTour } from '../../services/tourService';
import type {
  TourDailyItinerary,
  ActivityFormData,
} from '../../services/dailyItineraryService';
import {
  getDailyItinerary,
  addDailyActivity,
  deleteDailyActivity,
  CATEGORY_LABELS,
} from '../../services/dailyItineraryService';
import { ActivityFormModal } from './ActivityFormModal';

interface DailyItineraryTimelineProps {
  tour: CruiseTour;
  onBack?: () => void;
}

export const DailyItineraryTimeline: React.FC<DailyItineraryTimelineProps> = ({ tour }) => {
  const [dailyData, setDailyData] = useState<TourDailyItinerary | null>(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    void getDailyItinerary(tour.id)
      .then((res) => {
        if (isMounted) {
          if (res) {
            setDailyData(res);
            setSelectedDayNumber(res.days[0]?.dayNumber || 1);
          } else {
            // Generate fallback skeleton days if no custom data exists
            const daysCount = tour.durationDays || 3;
            const fallbackDays = Array.from({ length: daysCount }, (_, i) => ({
              dayNumber: i + 1,
              date: tour.startDate,
              title: `Ngày ${i + 1}: Hải trình khám phá`,
              portName: i === 0 ? tour.departurePort : i === daysCount - 1 ? tour.destinationPort : 'Trên biển',
              portStatus: (i === 0 ? 'DEPARTURE' : i === daysCount - 1 ? 'ARRIVAL' : 'AT_SEA') as any,
              seaDay: i > 0 && i < daysCount - 1,
              activities: [],
            }));
            setDailyData({
              tourId: tour.id,
              tourName: tour.name,
              tourCode: tour.code,
              startDate: tour.startDate,
              endDate: tour.endDate,
              days: fallbackDays,
            });
            setSelectedDayNumber(1);
          }
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [tour]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const currentDay = dailyData?.days.find((d) => d.dayNumber === selectedDayNumber);

  const handleAddActivity = async (formData: ActivityFormData) => {
    if (!dailyData) return;
    const created = await addDailyActivity(tour.id, selectedDayNumber, formData);
    setDailyData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map((day) => {
          if (day.dayNumber === selectedDayNumber) {
            const updated = [...day.activities, created].sort((a, b) => a.time.localeCompare(b.time));
            return { ...day, activities: updated };
          }
          return day;
        }),
      };
    });
    showToast(`Đã thêm "${created.title}" vào lịch trình Ngày ${selectedDayNumber}`);
  };

  const handleDeleteActivity = async (actId: number, actTitle: string) => {
    await deleteDailyActivity(tour.id, selectedDayNumber, actId);
    setDailyData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map((day) => {
          if (day.dayNumber === selectedDayNumber) {
            return {
              ...day,
              activities: day.activities.filter((a) => a.id !== actId),
            };
          }
          return day;
        }),
      };
    });
    showToast(`Đã xóa hoạt động "${actTitle}"`);
  };

  const filteredActivities = (currentDay?.activities || []).filter((act) => {
    if (categoryFilter === 'ALL') return true;
    return act.category === categoryFilter;
  });

  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
        <Clock className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
        Đang tải lịch trình hàng ngày...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tour banner info */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/30 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {tour.code}
            </span>
            <span className="text-xs text-slate-400">
              {tour.durationDays} Ngày {tour.durationNights} Đêm
            </span>
          </div>
          <h2 className="text-lg font-bold text-white">{tour.name}</h2>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
            <span className="flex items-center gap-1.5">
              <Ship className="w-3.5 h-3.5 text-cyan-400" />
              {tour.shipName || 'Chưa gán tàu'}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {tour.startDate} → {tour.endDate}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              {tour.departurePort} → {tour.destinationPort}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Thêm Hoạt Động Vào Ngày {selectedDayNumber}
        </button>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {dailyData?.days.map((day) => {
          const isSelected = day.dayNumber === selectedDayNumber;
          return (
            <button
              key={day.dayNumber}
              onClick={() => setSelectedDayNumber(day.dayNumber)}
              className={`px-4 py-3 rounded-xl border text-left transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-slate-800 border-cyan-500/60 shadow-lg shadow-cyan-950/50'
                  : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`text-xs font-bold ${
                    isSelected ? 'text-cyan-400' : 'text-slate-300'
                  }`}
                >
                  Ngày {day.dayNumber}
                </span>
                {day.seaDay ? (
                  <span className="flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                    <Waves className="w-3 h-3" /> Trên biển
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    <Anchor className="w-3 h-3" /> Cảng
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate max-w-[150px]">
                {day.portName || day.title}
              </p>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {day.activities.length} hoạt động
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Day Header & Category Filter */}
      {currentDay && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                Ngày {currentDay.dayNumber}: {currentDay.title}
              </h3>
              <span className="text-xs text-slate-400">• {currentDay.date}</span>
            </div>
            <p className="text-xs text-cyan-400 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Địa điểm trọng tâm: {currentDay.portName || 'Hải trình mở trên biển'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Lọc mục:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Lọc hoạt động theo loại"
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">Tất cả danh mục</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Timeline View */}
      {filteredActivities.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-10 text-center">
          <Info className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">
            Chưa có hoạt động nào trong Ngày {selectedDayNumber} với bộ lọc hiện tại.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
          >
            + Thêm hoạt động đầu tiên cho ngày này
          </button>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
          {filteredActivities.map((act) => {
            const catBadge = CATEGORY_LABELS[act.category] || CATEGORY_LABELS.OTHER;
            return (
              <div key={act.id} className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-6 sm:-left-8 top-3 w-4 h-4 rounded-full bg-slate-900 border-2 border-cyan-500 shadow-md flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                </div>

                {/* Card */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-slate-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-lg border border-cyan-500/20">
                        <Clock className="w-3.5 h-3.5" />
                        {act.time}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${catBadge.bg} ${catBadge.color} ${catBadge.border}`}
                      >
                        {catBadge.label}
                      </span>
                      {act.isIncluded ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Đã bao gồm trong tour
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Phụ thu: {act.price?.toLocaleString()} {act.currency || 'VND'}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white">{act.title}</h4>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        {act.location}
                      </span>
                      {act.capacity && (
                        <span className="flex items-center gap-1 text-amber-300">
                          <Tag className="w-3 h-3" />
                          Sức chứa: {act.enrolledCount || 0}/{act.capacity} khách
                        </span>
                      )}
                    </div>

                    {act.description && (
                      <p className="text-xs text-slate-300 italic pt-1 border-t border-slate-800/40">
                        {act.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0">
                    <button
                      onClick={() => void handleDeleteActivity(act.id, act.title)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
                      title="Xóa hoạt động khỏi ngày này"
                      aria-label={`Xóa hoạt động ${act.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add Activity */}
      {currentDay && (
        <ActivityFormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddActivity}
          dayNumber={currentDay.dayNumber}
          dayTitle={currentDay.title}
        />
      )}
    </div>
  );
};
