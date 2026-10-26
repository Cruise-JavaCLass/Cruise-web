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
  Edit2,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  RefreshCw,
  History,
} from 'lucide-react';
import type { CruiseTour } from '../../services/tourService';
import type {
  TourDailyItinerary,
  DailyActivityItem,
  ActivityFormData,
} from '../../services/dailyItineraryService';
import {
  getDailyItinerary,
  addDailyActivity,
  updateDailyActivity,
  reorderDailyActivities,
  deleteDailyActivity,
  CATEGORY_LABELS,
} from '../../services/dailyItineraryService';
import { ActivityFormModal } from './ActivityFormModal';
import { ItineraryChangeHistoryModal } from './ItineraryChangeHistoryModal';

interface DailyItineraryTimelineProps {
  tour: CruiseTour;
  onBack?: () => void;
}

export const DailyItineraryTimeline: React.FC<DailyItineraryTimelineProps> = ({ tour }) => {
  const [dailyData, setDailyData] = useState<TourDailyItinerary | null>(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [editingActivity, setEditingActivity] = useState<DailyActivityItem | null>(null);
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

  const handleOpenAdd = () => {
    setEditingActivity(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (act: DailyActivityItem) => {
    setEditingActivity(act);
    setIsFormModalOpen(true);
  };

  const updateActivitiesForCurrentDay = (updater: (activities: DailyActivityItem[]) => DailyActivityItem[]) => {
    setDailyData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map((day) =>
          day.dayNumber === selectedDayNumber
            ? { ...day, activities: updater(day.activities) }
            : day
        ),
      };
    });
  };

  const handleSaveActivity = async (formData: ActivityFormData) => {
    if (!dailyData) return;

    if (editingActivity) {
      const updated = await updateDailyActivity(tour.id, selectedDayNumber, editingActivity.id, formData);
      updateActivitiesForCurrentDay((acts) => acts.map((a) => (a.id === editingActivity.id ? updated : a)));
      showToast(`Đã cập nhật hoạt động "${updated.title}"`);
    } else {
      const created = await addDailyActivity(tour.id, selectedDayNumber, formData);
      updateActivitiesForCurrentDay((acts) =>
        [...acts, created].sort((a, b) => a.time.localeCompare(b.time))
      );
      showToast(`Đã thêm "${created.title}" vào lịch trình Ngày ${selectedDayNumber}`);
    }
  };

  const handleMoveActivity = async (index: number, direction: 'UP' | 'DOWN') => {
    if (!currentDay) return;
    const activities = [...currentDay.activities];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activities.length) return;

    const [moved] = activities.splice(index, 1);
    activities.splice(targetIndex, 0, moved);

    const orderedIds = activities.map((a) => a.id);
    await reorderDailyActivities(tour.id, selectedDayNumber, orderedIds);
    updateActivitiesForCurrentDay(() => activities);
    showToast(`Đã thay đổi thứ tự hoạt động`);
  };

  const handleDeleteActivity = async (actId: number, actTitle: string) => {
    await deleteDailyActivity(tour.id, selectedDayNumber, actId);
    updateActivitiesForCurrentDay((acts) => acts.filter((a) => a.id !== actId));
    showToast(`Đã xóa hoạt động "${actTitle}"`);
  };

  const filteredActivities = (currentDay?.activities || []).filter((act) => {
    if (categoryFilter === 'ALL') return true;
    return act.category === categoryFilter;
  });

  if (loading) {
    return (
      <div className="bg-white border border-[#E5E0D7] rounded-2xl p-12 text-center text-[#5A6578] text-xs shadow-xs">
        <Clock className="w-8 h-8 text-[#102A43] animate-spin mx-auto mb-3" />
        Đang tải lịch trình hàng ngày...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl shadow-lg backdrop-blur-md text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tour banner info — Luxury Maritime */}
      <div className="bg-white border border-[#E5E0D7] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F7F4ED] text-[#397C80] border border-[#E5E0D7]">
              {tour.code}
            </span>
            <span className="text-xs text-[#5A6578]">
              {tour.durationDays} Ngày {tour.durationNights} Đêm
            </span>
            {dailyData?.lastUpdated && (
              <span className="flex items-center gap-1 text-[10px] text-[#102A43] bg-[#F7F4ED] px-2.5 py-0.5 rounded-full border border-[#E5E0D7]">
                <RefreshCw className="w-3 h-3 text-[#397C80]" />
                Cập nhật: {dailyData.lastUpdated}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold font-serif text-[#102A43]">{tour.name}</h2>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#5A6578] mt-2">
            <span className="flex items-center gap-1.5">
              <Ship className="w-3.5 h-3.5 text-[#102A43]" />
              {tour.shipName || 'Chưa gán tàu'}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#5A6578]" />
              {tour.startDate} → {tour.endDate}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#397C80]" />
              {tour.departurePort} → {tour.destinationPort}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            aria-label="Xem lịch sử thay đổi lịch trình"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#F7F4ED] hover:bg-[#ECE7DC] text-[#102A43] border border-[#E5E0D7] rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-colors"
          >
            <History className="w-4 h-4 text-[#397C80]" /> Lịch Sử Thay Đổi
            {dailyData?.changeHistory && dailyData.changeHistory.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-[#397C80]/10 text-[#397C80] rounded-full text-[10px] font-mono">
                {dailyData.changeHistory.length}
              </span>
            )}
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#102A43] hover:bg-[#0B1F33] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#C5A572]" /> Thêm Hoạt Động Vào Ngày {selectedDayNumber}
          </button>
        </div>
      </div>

      {/* Updated Itinerary Notice Banner */}
      {dailyData?.updateNotice && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold text-amber-950">Thông báo điều chỉnh hải trình: </span>
            <span>{dailyData.updateNotice}</span>
          </div>
        </div>
      )}

      {/* Day Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {dailyData?.days.map((day) => {
          const isSelected = day.dayNumber === selectedDayNumber;
          return (
            <button
              key={day.dayNumber}
              onClick={() => setSelectedDayNumber(day.dayNumber)}
              className={`px-4 py-3 rounded-2xl border text-left transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-[#102A43] border-[#102A43] text-white shadow-sm'
                  : 'bg-white border-[#E5E0D7] hover:bg-[#F7F4ED] text-[#252B32]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`text-xs font-bold ${
                    isSelected ? 'text-white' : 'text-[#102A43]'
                  }`}
                >
                  Ngày {day.dayNumber}
                </span>
                {day.seaDay ? (
                  <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-[#C5A572]' : 'bg-[#F7F4ED] text-[#397C80] border border-[#E5E0D7]'
                  }`}>
                    <Waves className="w-3 h-3" /> Trên biển
                  </span>
                ) : (
                  <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-emerald-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                  }`}>
                    <Anchor className="w-3 h-3" /> Cảng
                  </span>
                )}
              </div>
              <p className={`text-[11px] mt-1 truncate max-w-[150px] ${
                isSelected ? 'text-white/80' : 'text-[#5A6578]'
              }`}>
                {day.portName || day.title}
              </p>
              <span className={`text-[10px] mt-0.5 block ${
                isSelected ? 'text-white/60' : 'text-[#5A6578]/70'
              }`}>
                {day.activities.length} hoạt động
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Day Header & Category Filter */}
      {currentDay && (
        <div className="bg-white border border-[#E5E0D7] rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-serif text-[#102A43]">
                  Ngày {currentDay.dayNumber}: {currentDay.title}
                </h3>
                <span className="text-xs text-[#5A6578]">• {currentDay.date}</span>
                {currentDay.isAffected && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Đã điều chỉnh lịch trình
                  </span>
                )}
              </div>
              <p className="text-xs text-[#397C80] mt-1 flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5" />
                Địa điểm trọng tâm: {currentDay.portName || 'Hải trình mở trên biển'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#5A6578]">Lọc mục:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Lọc hoạt động theo loại"
                className="px-3 py-1.5 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10"
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

          {/* Port Times & Weather Bar (KAN-206, KAN-207) */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#E5E0D7] text-xs">
            {currentDay.arrivalTime && (
              <span className="flex items-center gap-1.5 text-emerald-800 font-mono bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80">
                <Clock className="w-3.5 h-3.5 text-emerald-600" /> Giờ cập bến: <strong>{currentDay.arrivalTime}</strong>
              </span>
            )}
            {currentDay.allAboardTime && (
              <span className="flex items-center gap-1.5 text-rose-800 font-mono bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/80 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Tất cả lên tàu (All-Aboard): <strong>{currentDay.allAboardTime}</strong>
              </span>
            )}
            {currentDay.departureTime && (
              <span className="flex items-center gap-1.5 text-[#102A43] font-mono bg-[#F7F4ED] px-2.5 py-1 rounded-lg border border-[#E5E0D7]">
                <Ship className="w-3.5 h-3.5 text-[#397C80]" /> Giờ rời bến: <strong>{currentDay.departureTime}</strong>
              </span>
            )}
            {currentDay.weatherForecast && (
              <span className="flex items-center gap-1.5 text-[#5A6578] ml-auto bg-[#F7F4ED] px-2.5 py-1 rounded-lg border border-[#E5E0D7]">
                🌤️ {currentDay.weatherForecast}
              </span>
            )}
          </div>

          {/* Specific Day Change Alert Notice (KAN-207) */}
          {currentDay.isAffected && currentDay.changeReason && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-950">Cảnh báo thay đổi ngày {currentDay.dayNumber}:</strong> {currentDay.changeReason}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timeline View */}
      {filteredActivities.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E5E0D7] rounded-2xl p-10 text-center">
          <Info className="w-8 h-8 text-[#5A6578]/40 mx-auto mb-2" />
          <p className="text-xs text-[#5A6578]">
            Chưa có hoạt động nào trong Ngày {selectedDayNumber} với bộ lọc hiện tại.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-3 text-xs text-[#102A43] hover:underline font-semibold cursor-pointer"
          >
            + Thêm hoạt động đầu tiên cho ngày này
          </button>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E5E0D7]">
          {filteredActivities.map((act, index) => {
            const catBadge = CATEGORY_LABELS[act.category] || CATEGORY_LABELS.OTHER;
            return (
              <div key={act.id} className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-6 sm:-left-8 top-3 w-4 h-4 rounded-full bg-white border-2 border-[#102A43] shadow-xs flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C5A572]" />
                </div>

                {/* Card */}
                <div className="bg-white border border-[#E5E0D7] rounded-2xl p-4 sm:p-5 hover:border-[#102A43]/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 text-xs font-mono font-bold text-[#102A43] bg-[#F7F4ED] px-2.5 py-0.5 rounded-lg border border-[#E5E0D7]">
                        <Clock className="w-3.5 h-3.5 text-[#397C80]" />
                        {act.time}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${catBadge.bg} ${catBadge.color} ${catBadge.border}`}
                      >
                        {catBadge.label}
                      </span>
                      {act.isIncluded ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                          Đã bao gồm trong tour
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80">
                          Phụ thu: {act.price?.toLocaleString()} {act.currency || 'VND'}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-[#102A43]">{act.title}</h4>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#5A6578]">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#397C80] shrink-0" />
                        {act.location}
                      </span>
                      {act.capacity && (
                        <span className="flex items-center gap-1 text-amber-800">
                          <Tag className="w-3 h-3 text-amber-600" />
                          Sức chứa: {act.enrolledCount || 0}/{act.capacity} khách
                        </span>
                      )}
                    </div>

                    {act.description && (
                      <p className="text-xs text-[#5A6578] italic pt-1 border-t border-[#E5E0D7]">
                        {act.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1.5 shrink-0">
                    {/* Reorder Buttons */}
                    <button
                      onClick={() => void handleMoveActivity(index, 'UP')}
                      disabled={index === 0}
                      className="p-1.5 text-[#5A6578] hover:text-[#102A43] hover:bg-[#F7F4ED] disabled:opacity-30 disabled:hover:text-[#5A6578] disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                      title="Di chuyển lên trên"
                      aria-label={`Di chuyển lên trên ${act.title}`}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => void handleMoveActivity(index, 'DOWN')}
                      disabled={index === filteredActivities.length - 1}
                      className="p-1.5 text-[#5A6578] hover:text-[#102A43] hover:bg-[#F7F4ED] disabled:opacity-30 disabled:hover:text-[#5A6578] disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                      title="Di chuyển xuống dưới"
                      aria-label={`Di chuyển xuống dưới ${act.title}`}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEdit(act)}
                      className="p-1.5 text-[#5A6578] hover:text-[#102A43] hover:bg-[#F7F4ED] rounded-lg transition-colors cursor-pointer"
                      title="Cập nhật hoạt động"
                      aria-label={`Cập nhật hoạt động ${act.title}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => void handleDeleteActivity(act.id, act.title)}
                      className="p-1.5 text-[#5A6578] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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

      {/* Modal Add / Edit Activity */}
      {currentDay && (
        <ActivityFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingActivity(null);
          }}
          onSubmit={handleSaveActivity}
          dayNumber={currentDay.dayNumber}
          dayTitle={currentDay.title}
          initialData={editingActivity}
        />
      )}

      {/* Modal Itinerary Change History (KAN-130) */}
      <ItineraryChangeHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        tourName={tour.name}
        history={dailyData?.changeHistory || []}
      />
    </div>
  );
};
