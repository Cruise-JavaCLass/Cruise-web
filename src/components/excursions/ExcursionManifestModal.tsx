import { useState, useId, useRef, useEffect } from 'react';
import {
  X,
  Bus,
  Search,
  Phone,
  Clock,
  ShieldCheck,
  UserCheck,
  Users,
  UserPlus,
  Trash2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  type ShoreExcursion,
  type ExcursionPassenger,
  DEFAULT_EXCURSION_GROUPS,
  INITIAL_EXCURSION_PASSENGERS,
  assignPassengerToGroup,
  bulkAssignPassengersToGroup,
  addPassengerToExcursion,
  removePassengerFromExcursion,
  updateExcursionPassengers,
} from '../../services/excursionService';
import { INITIAL_PASSENGERS } from '../../services/passengerService';

interface ExcursionManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  excursion: ShoreExcursion;
  onUpdatePassengers?: (updatedPassengers: ExcursionPassenger[]) => void;
}

export function ExcursionManifestModal({
  isOpen,
  onClose,
  excursion,
  onUpdatePassengers,
}: ExcursionManifestModalProps) {
  const [passengers, setPassengers] = useState<ExcursionPassenger[]>(
    excursion.passengers && excursion.passengers.length > 0
      ? excursion.passengers
      : []
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [selectedPassengerIds, setSelectedPassengerIds] = useState<number[]>([]);
  const [bulkTargetGroupId, setBulkTargetGroupId] = useState<string>(DEFAULT_EXCURSION_GROUPS[0].id);

  // Add passenger modal/drawer state
  const [isAddPassengerOpen, setIsAddPassengerOpen] = useState(false);
  const [selectedShipPassengerId, setSelectedShipPassengerId] = useState<string>('');
  const [newPassengerName, setNewPassengerName] = useState('');
  const [newCabinNumber, setNewCabinNumber] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSpecialReq, setNewSpecialReq] = useState('');
  const [newGroupId, setNewGroupId] = useState<string>(DEFAULT_EXCURSION_GROUPS[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchInputId = useId();
  const busFilterId = useId();

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const showNotification = (msg: string, isError = false) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    if (isError) {
      setErrorMessage(msg);
      setSuccessMessage(null);
    } else {
      setSuccessMessage(msg);
      setErrorMessage(null);
    }
    notificationTimeoutRef.current = setTimeout(() => {
      setSuccessMessage(null);
      setErrorMessage(null);
    }, 4500);
  };

  const syncPassengers = (newPassengerList: ExcursionPassenger[]) => {
    setPassengers(newPassengerList);
    onUpdatePassengers?.(newPassengerList);
  };

  // Helper to resolve a passenger's group ID matching groupName first, then busNumber
  const resolvePassengerGroupId = (p: ExcursionPassenger): string => {
    const byGroupName = DEFAULT_EXCURSION_GROUPS.find((g) => g.groupName === p.groupName);
    if (byGroupName) return byGroupName.id;
    const byBus = DEFAULT_EXCURSION_GROUPS.find((g) => g.busNumber === p.busNumber);
    return byBus?.id || DEFAULT_EXCURSION_GROUPS[0].id;
  };

  const filteredPassengers = passengers.filter((p) => {
    const matchSearch =
      p.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cabinNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ticketCode.toLowerCase().includes(searchTerm.toLowerCase());
    const passengerGroupId = resolvePassengerGroupId(p);
    const matchGroup =
      selectedGroup === 'ALL' ||
      passengerGroupId === selectedGroup ||
      p.busNumber === selectedGroup ||
      p.groupName === selectedGroup;
    return matchSearch && matchGroup;
  });

  // Calculate distinct buses from passengers + default groups
  const busOptions = Array.from(
    new Set([
      ...passengers.map((p) => p.busNumber),
      ...DEFAULT_EXCURSION_GROUPS.map((g) => g.busNumber),
    ])
  );

  // Group breakdown calculations matching groupName first, then fallback to busNumber
  const groupCounts = DEFAULT_EXCURSION_GROUPS.map((g) => {
    const count = passengers.filter(
      (p) => resolvePassengerGroupId(p) === g.id
    ).length;
    return {
      ...g,
      currentCount: count,
    };
  });

  const handleToggleStatus = async (id: number) => {
    const updated = passengers.map((p) => {
      if (p.id !== id) return p;
      let nextStatus: ExcursionPassenger['status'] = 'CHECKED_IN';
      if (p.status === 'REGISTERED') nextStatus = 'CHECKED_IN';
      else if (p.status === 'CHECKED_IN') nextStatus = 'ON_TOUR';
      else if (p.status === 'ON_TOUR') nextStatus = 'RETURNED_SAFE';
      else if (p.status === 'RETURNED_SAFE') nextStatus = 'REGISTERED';
      return { ...p, status: nextStatus };
    });
    try {
      const res = await updateExcursionPassengers(excursion.id, updated);
      syncPassengers(res.passengers || updated);
    } catch {
      syncPassengers(updated);
    }
  };

  // Inline group/bus re-assignment for an individual passenger with group capacity guard
  const handleInlineGroupChange = async (passengerId: number, targetGroupId: string) => {
    const targetGroup = DEFAULT_EXCURSION_GROUPS.find((g) => g.id === targetGroupId);
    if (!targetGroup) return;

    // Capacity validation: count current passengers in target group (excluding this passenger)
    const currentCountInTarget = passengers.filter(
      (p) => p.id !== passengerId && resolvePassengerGroupId(p) === targetGroup.id
    ).length;

    if (currentCountInTarget >= targetGroup.maxSeats) {
      showNotification(
        `Không thể chuyển: ${targetGroup.groupName} đã đầy (${currentCountInTarget}/${targetGroup.maxSeats} chỗ). Vui lòng chọn đoàn khác!`,
        true
      );
      return;
    }

    try {
      const res = await assignPassengerToGroup(
        excursion.id,
        passengerId,
        targetGroup.groupName,
        targetGroup.busNumber
      );
      syncPassengers(res.passengers ?? passengers);
      showNotification(`Đã chuyển hành khách sang ${targetGroup.groupName} (${targetGroup.busNumber})`);
    } catch (err: unknown) {
      const msg = err instanceof Error && err.message
        ? err.message
        : 'Không thể đổi nhóm cho hành khách.';
      showNotification(msg, true);
    }
  };

  // Selection toggle
  const handleToggleSelectOne = (id: number) => {
    setSelectedPassengerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllFilteredSelected =
    filteredPassengers.length > 0 &&
    filteredPassengers.every((p) => selectedPassengerIds.includes(p.id));

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredIds = new Set(filteredPassengers.map((p) => p.id));
      setSelectedPassengerIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const newIds = Array.from(
        new Set([...selectedPassengerIds, ...filteredPassengers.map((p) => p.id)])
      );
      setSelectedPassengerIds(newIds);
    }
  };

  // Bulk Assignment Handler with capacity guard
  const handleBulkAssign = async () => {
    if (selectedPassengerIds.length === 0) return;
    const targetGroup = DEFAULT_EXCURSION_GROUPS.find((g) => g.id === bulkTargetGroupId);
    if (!targetGroup) return;

    // Check capacity before assigning
    const selectedSet = new Set(selectedPassengerIds);
    const nonSelectedCountInTarget = passengers.filter(
      (p) => !selectedSet.has(p.id) && resolvePassengerGroupId(p) === targetGroup.id
    ).length;

    const availableSeats = targetGroup.maxSeats - nonSelectedCountInTarget;
    if (selectedPassengerIds.length > availableSeats) {
      showNotification(
        `Không thể gán hàng loạt: ${targetGroup.groupName} chỉ còn ${Math.max(0, availableSeats)} chỗ trống, nhưng bạn đã chọn ${selectedPassengerIds.length} khách!`,
        true
      );
      return;
    }

    const idsToAssign = [...selectedPassengerIds];
    try {
      const res = await bulkAssignPassengersToGroup(
        excursion.id,
        idsToAssign,
        targetGroup.groupName,
        targetGroup.busNumber
      );
      syncPassengers(res.passengers ?? passengers);
      showNotification(
        `Đã gán thành công ${idsToAssign.length} hành khách vào ${targetGroup.groupName}!`
      );
      setSelectedPassengerIds([]);
    } catch (err: unknown) {
      const msg = err instanceof Error && err.message
        ? err.message
        : 'Không thể gán nhóm hàng loạt cho hành khách.';
      showNotification(msg, true);
    }
  };

  // Auto-distribute passengers evenly across available groups/buses
  const handleAutoAssign = async () => {
    if (passengers.length === 0) return;
    const distributed = passengers.map((p, index) => {
      const g = DEFAULT_EXCURSION_GROUPS[index % DEFAULT_EXCURSION_GROUPS.length];
      return {
        ...p,
        groupName: g.groupName,
        busNumber: g.busNumber,
      };
    });
    try {
      const res = await updateExcursionPassengers(excursion.id, distributed);
      syncPassengers(res.passengers ?? distributed);
      showNotification(
        `Đã tự động chia đều ${passengers.length} hành khách vào ${DEFAULT_EXCURSION_GROUPS.length} nhóm & xe!`
      );
    } catch {
      syncPassengers(distributed);
      showNotification(
        `Đã tự động chia đều ${passengers.length} hành khách vào ${DEFAULT_EXCURSION_GROUPS.length} nhóm & xe!`
      );
    }
  };

  // Remove passenger from tour
  const handleRemovePassenger = async (id: number, name: string) => {
    try {
      const res = await removePassengerFromExcursion(excursion.id, id);
      setSelectedPassengerIds((prev) => prev.filter((item) => item !== id));
      syncPassengers(res.passengers ?? passengers.filter((p) => p.id !== id));
      showNotification(`Đã xóa hành khách ${name} khỏi danh sách tour.`);
    } catch (err: unknown) {
      const msg = err instanceof Error && err.message
        ? err.message
        : `Không thể xóa hành khách ${name} khỏi tour.`;
      showNotification(msg, true);
    }
  };

  // Handle ship passenger select in Add modal
  const handleSelectShipPassenger = (shipPassengerId: string) => {
    setSelectedShipPassengerId(shipPassengerId);
    if (!shipPassengerId) return;

    const found = INITIAL_PASSENGERS.find((p) => p.id.toString() === shipPassengerId);
    if (found) {
      setNewPassengerName(found.fullName);
      setNewCabinNumber(found.cabinNumber);
      setNewPhone(found.phoneNumber || '+84 900 000 000');
    }
  };

  // Add passenger submit
  const handleAddPassengerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Check tour capacity
    if (passengers.length >= excursion.maxCapacity) {
      showNotification(
        `Không thể thêm hành khách: Tour đã đạt sức chứa tối đa (${excursion.maxCapacity} khách)!`,
        true
      );
      return;
    }

    if (!newPassengerName.trim() || !newCabinNumber.trim()) {
      showNotification('Vui lòng nhập họ tên hành khách và số cabin!', true);
      return;
    }

    const targetGroup =
      DEFAULT_EXCURSION_GROUPS.find((g) => g.id === newGroupId) || DEFAULT_EXCURSION_GROUPS[0];

    const maxId = passengers.reduce((max, p) => (p.id > max ? p.id : max), 0);
    const newPassengerId = maxId + 1;

    const newPassengerData: Omit<ExcursionPassenger, 'id'> = {
      passengerName: newPassengerName.trim(),
      cabinNumber: newCabinNumber.trim(),
      ticketCode: `EXC-TKT-${String(newPassengerId).padStart(3, '0')}`,
      busNumber: targetGroup.busNumber,
      groupName: targetGroup.groupName,
      emergencyPhone: newPhone.trim() || '+84 900 000 000',
      status: 'REGISTERED',
      specialRequirements: newSpecialReq.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      const res = await addPassengerToExcursion(excursion.id, newPassengerData);
      const fallbackWithNew: ExcursionPassenger[] = [
        ...passengers,
        { ...newPassengerData, id: newPassengerId },
      ];
      syncPassengers(res.passengers ?? fallbackWithNew);
      showNotification(`Đã thêm hành khách ${newPassengerData.passengerName} vào ${targetGroup.groupName}!`);

      // Reset form
      setNewPassengerName('');
      setNewCabinNumber('');
      setNewPhone('');
      setNewSpecialReq('');
      setSelectedShipPassengerId('');
      setIsAddPassengerOpen(false);
    } catch (err: unknown) {
      const errMsg = err instanceof Error && err.message
        ? err.message
        : 'Không thể thêm hành khách vào tour.';
      showNotification(errMsg, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPassengerStatusBadge = (status: ExcursionPassenger['status']) => {
    switch (status) {
      case 'REGISTERED':
        return {
          label: 'Đã Đăng Ký',
          cls: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: Clock,
        };
      case 'CHECKED_IN':
        return {
          label: 'Đã Lên Xe',
          cls: 'bg-[#397C80]/10 text-[#397C80] border-[#397C80]/30',
          icon: UserCheck,
        };
      case 'ON_TOUR':
        return {
          label: 'Đang Tham Quan',
          cls: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: Bus,
        };
      case 'RETURNED_SAFE':
        return {
          label: 'Về Tàu An Toàn',
          cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: ShieldCheck,
        };
    }
  };

  const returnedSafeCount = passengers.filter((p) => p.status === 'RETURNED_SAFE').length;
  const isCapacityFull = passengers.length >= excursion.maxCapacity;

  // Onboard passengers not currently in this excursion
  const availableShipPassengers = INITIAL_PASSENGERS.filter(
    (sp) => !passengers.some((ep) => ep.passengerName.toLowerCase() === sp.fullName.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manifest-modal-title"
    >
      <div className="bg-white border border-[#E5E0D7] w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E0D7] flex items-center justify-between bg-[#F7F4ED]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#397C80]/10 border border-[#397C80]/20 flex items-center justify-center text-[#397C80]">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h3 id="manifest-modal-title" className="text-base font-bold text-[#102A43] flex items-center gap-2">
                Danh Sách Đoàn & Xe Đưa Đón (Passenger Manifest)
              </h3>
              <p className="text-xs text-[#252B32]/70">
                {excursion.title} • {excursion.portCity} ({excursion.excursionDate})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto Assign Button */}
            <button
              type="button"
              onClick={handleAutoAssign}
              className="px-3 py-1.5 bg-[#397C80]/10 hover:bg-[#397C80]/20 text-[#397C80] border border-[#397C80]/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer"
              title="Tự động chia đều hành khách vào các nhóm và xe"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#397C80]" />
              Chia nhóm tự động
            </button>

            {/* Add Passenger Button */}
            <button
              type="button"
              onClick={() => setIsAddPassengerOpen((prev) => !prev)}
              disabled={isCapacityFull}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                isCapacityFull
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-[#102A43] hover:bg-[#0B1F33] text-white border border-[#102A43]'
              }`}
              title={isCapacityFull ? 'Tour đã đạt sức chứa tối đa' : 'Thêm hành khách vào tour'}
            >
              <UserPlus className={`w-3.5 h-3.5 ${isCapacityFull ? 'text-slate-400' : 'text-white'}`} />
              + Thêm hành khách
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#252B32]/60 hover:text-[#102A43] rounded-lg hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback / Alert Notice */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Add Passenger Expandable Panel */}
        {isAddPassengerOpen && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-[#F7F4ED] border border-[#E5E0D7] space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E0D7]">
              <h4 className="text-xs font-bold text-[#102A43] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#397C80]" /> Thêm Hành Khách Vào Tour
              </h4>
              <span className="text-[11px] text-[#252B32]/70">
                Sức chứa hiện tại: {passengers.length} / {excursion.maxCapacity}
              </span>
            </div>

            <form onSubmit={handleAddPassengerSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Pick from onboard passengers */}
                <div className="sm:col-span-3">
                  <label htmlFor="select-ship-passenger" className="text-[11px] font-semibold text-[#102A43] block mb-1">
                    Chọn nhanh từ danh sách khách trên tàu (chưa tham gia):
                  </label>
                  <select
                    id="select-ship-passenger"
                    value={selectedShipPassengerId}
                    onChange={(e) => handleSelectShipPassenger(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#102A43] focus:outline-none focus:border-[#397C80] focus:ring-1 focus:ring-[#397C80]"
                  >
                    <option value="">-- Nhập thủ công hoặc chọn từ danh sách khách trên tàu --</option>
                    {availableShipPassengers.map((sp) => (
                      <option key={sp.id} value={sp.id.toString()}>
                        {sp.fullName} - Cabin: {sp.cabinNumber} ({sp.tourPackage})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="new-passenger-name" className="text-[11px] font-semibold text-[#102A43] block mb-1">
                    Họ và tên hành khách <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="new-passenger-name"
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={newPassengerName}
                    onChange={(e) => setNewPassengerName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#102A43] focus:outline-none focus:border-[#397C80] focus:ring-1 focus:ring-[#397C80]"
                  />
                </div>

                <div>
                  <label htmlFor="new-cabin-number" className="text-[11px] font-semibold text-[#102A43] block mb-1">
                    Số phòng / Cabin <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="new-cabin-number"
                    type="text"
                    required
                    placeholder="Suite-801"
                    value={newCabinNumber}
                    onChange={(e) => setNewCabinNumber(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#102A43] focus:outline-none focus:border-[#397C80] focus:ring-1 focus:ring-[#397C80]"
                  />
                </div>

                <div>
                  <label htmlFor="new-phone" className="text-[11px] font-semibold text-[#102A43] block mb-1">
                    SĐT khẩn cấp
                  </label>
                  <input
                    id="new-phone"
                    type="text"
                    placeholder="+84 912 345 678"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#102A43] focus:outline-none focus:border-[#397C80] focus:ring-1 focus:ring-[#397C80]"
                  />
                </div>

                <div>
                  <label htmlFor="new-group-select" className="text-[11px] font-semibold text-[#102A43] block mb-1">
                    Phân bổ vào Nhóm & Xe:
                  </label>
                  <select
                    id="new-group-select"
                    value={newGroupId}
                    onChange={(e) => setNewGroupId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#102A43] focus:outline-none focus:border-[#397C80] focus:ring-1 focus:ring-[#397C80]"
                  >
                    {DEFAULT_EXCURSION_GROUPS.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.groupName} — {g.busNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="new-special-req" className="text-[11px] font-semibold text-[#102A43] block mb-1">
                    Yêu cầu đặc biệt (Ăn chay, hỗ trợ y tế, xe lăn...)
                  </label>
                  <input
                    id="new-special-req"
                    type="text"
                    placeholder="Không có ghi chú"
                    value={newSpecialReq}
                    onChange={(e) => setNewSpecialReq(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#102A43] focus:outline-none focus:border-[#397C80] focus:ring-1 focus:ring-[#397C80]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E0D7]">
                <button
                  type="button"
                  onClick={() => setIsAddPassengerOpen(false)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#252B32] border border-[#E5E0D7] rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCapacityFull || isSubmitting}
                  className="px-4 py-1.5 bg-[#102A43] hover:bg-[#0B1F33] text-white rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Đang thêm...' : 'Xác nhận thêm khách'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Info & KPI Bar */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#F7F4ED] p-3 rounded-xl border border-[#E5E0D7]">
              <span className="text-[11px] text-[#252B32]/70 block font-medium">Tổng số khách đăng ký</span>
              <span className="text-base font-bold text-[#102A43]">
                {passengers.length} / {excursion.maxCapacity} khách
              </span>
            </div>
            <div className="bg-[#F7F4ED] p-3 rounded-xl border border-[#E5E0D7]">
              <span className="text-[11px] text-[#252B32]/70 block font-medium">Hướng dẫn viên</span>
              <span className="text-xs font-semibold text-[#397C80] truncate block">
                {excursion.guideName || 'Chưa phân bổ'}
              </span>
              <span className="text-[10px] text-[#252B32]/60">{excursion.guidePhone}</span>
            </div>
            <div className="bg-[#F7F4ED] p-3 rounded-xl border border-[#E5E0D7]">
              <span className="text-[11px] text-[#252B32]/70 block font-medium">Phương tiện chính</span>
              <span className="text-xs font-semibold text-[#102A43] truncate block">
                {excursion.busNumber || 'Xe du lịch'}
              </span>
              <span className="text-[10px] text-[#252B32]/60">{excursion.operatorName}</span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              <span className="text-[11px] text-emerald-800 block font-medium">Đã về tàu an toàn</span>
              <span className="text-base font-bold text-emerald-900">
                {returnedSafeCount} / {passengers.length} khách
              </span>
            </div>
          </div>

          {/* Group Capacity Distribution Chips / Filter by Group */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#102A43] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#397C80]" /> Phân Bổ Sức Chứa Theo Nhóm & Xe:
              </span>
              {selectedGroup !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedGroup('ALL')}
                  className="text-[11px] text-[#397C80] hover:text-[#2d6366] font-medium underline cursor-pointer"
                >
                  Xem tất cả đoàn
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Lọc hành khách theo đoàn">
              <button
                type="button"
                role="tab"
                aria-selected={selectedGroup === 'ALL'}
                onClick={() => setSelectedGroup('ALL')}
                className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                  selectedGroup === 'ALL'
                    ? 'bg-[#102A43] border-[#102A43] text-white font-semibold shadow-xs'
                    : 'bg-white border-[#E5E0D7] text-[#252B32] hover:bg-[#F7F4ED]'
                }`}
              >
                Tất cả các đoàn ({passengers.length})
              </button>
              {groupCounts.map((group) => {
                const isSelected = selectedGroup === group.id || selectedGroup === group.busNumber || selectedGroup === group.groupName;
                const isFull = group.currentCount >= group.maxSeats;
                return (
                  <button
                    key={group.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedGroup(isSelected ? 'ALL' : group.id)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#102A43] border-[#102A43] text-white font-semibold shadow-xs'
                        : group.currentCount > 0
                        ? 'bg-white border-[#E5E0D7] text-[#102A43] hover:border-[#397C80]'
                        : 'bg-slate-50 border-[#E5E0D7] text-[#252B32]/50'
                    }`}
                  >
                    <span className="font-semibold">{group.groupName}:</span>
                    <span className={isFull ? 'text-amber-700 font-bold' : 'text-[#252B32]'}>
                      {group.currentCount}/{group.maxSeats} chỗ
                    </span>
                    <span className="text-[10px] text-[#252B32]/60 hidden sm:inline">({group.busNumber})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="relative w-full sm:w-72">
              <label htmlFor={searchInputId} className="sr-only">
                Tìm hành khách theo tên hoặc cabin
              </label>
              <Search className="w-4 h-4 text-[#252B32]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id={searchInputId}
                type="text"
                placeholder="Tìm theo tên, cabin, mã vé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#102A43] placeholder-[#252B32]/40 focus:outline-none focus:border-[#397C80] focus:ring-1 focus:ring-[#397C80]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label htmlFor={busFilterId} className="text-xs font-semibold text-[#102A43] whitespace-nowrap">
                Lọc theo xe:
              </label>
              <select
                id={busFilterId}
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#102A43] focus:outline-none focus:border-[#397C80] focus:ring-1 focus:ring-[#397C80]"
              >
                <option value="ALL">Tất cả xe đưa đón</option>
                {busOptions.map((bus) => (
                  <option key={bus} value={bus}>
                    {bus}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk Assignment Toolbar */}
          {selectedPassengerIds.length > 0 && (
            <div className="p-3 bg-[#F7F4ED] border border-[#C5A572]/40 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#102A43] text-white text-xs font-bold">
                  Đã chọn {selectedPassengerIds.length} hành khách
                </span>
                <span className="text-xs text-[#252B32] hidden sm:inline">| Gán vào nhóm & xe:</span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  aria-label="Chọn đoàn gán hàng loạt"
                  value={bulkTargetGroupId}
                  onChange={(e) => setBulkTargetGroupId(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-[#E5E0D7] rounded-lg text-xs text-[#102A43] focus:outline-none focus:border-[#397C80]"
                >
                  {DEFAULT_EXCURSION_GROUPS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.groupName} ({g.busNumber})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleBulkAssign}
                  className="px-3 py-1.5 bg-[#102A43] hover:bg-[#0B1F33] text-white rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  Gán nhóm hàng loạt
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPassengerIds([])}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-[#252B32] border border-[#E5E0D7] rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          )}

          {/* Passenger Table */}
          <div className="overflow-x-auto border border-[#E5E0D7] rounded-xl max-h-80 overflow-y-auto bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F4ED] text-[#102A43] text-[11px] uppercase tracking-wider sticky top-0 backdrop-blur-md border-b border-[#E5E0D7]">
                <tr>
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả hành khách"
                      checked={isAllFilteredSelected}
                      onChange={handleToggleSelectAll}
                      className="rounded border-[#E5E0D7] text-[#397C80] focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3">Hành Khách</th>
                  <th className="py-2.5 px-3">Cabin</th>
                  <th className="py-2.5 px-3">Mã Vé</th>
                  <th className="py-2.5 px-3">Xe / Nhóm Phân Bổ</th>
                  <th className="py-2.5 px-3">SĐT Khẩn Cấp</th>
                  <th className="py-2.5 px-3">Trạng Thái</th>
                  <th className="py-2.5 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D7] text-[#252B32]">
                {filteredPassengers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#252B32]/50">
                      Không tìm thấy hành khách nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredPassengers.map((p) => {
                    const badge = getPassengerStatusBadge(p.status);
                    const Icon = badge.icon;
                    const isSelected = selectedPassengerIds.includes(p.id);

                    // Find corresponding group for inline select matching (groupName first, then busNumber)
                    const currentGroupId = resolvePassengerGroupId(p);

                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-[#397C80]/10 hover:bg-[#397C80]/15' : 'hover:bg-[#F7F4ED]/60'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <input
                            type="checkbox"
                            aria-label={`Chọn ${p.passengerName}`}
                            checked={isSelected}
                            onChange={() => handleToggleSelectOne(p.id)}
                            className="rounded border-[#E5E0D7] text-[#397C80] focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#102A43]">
                          {p.passengerName}
                          {p.specialRequirements && (
                            <span className="block text-[10px] text-amber-700 font-normal">
                              Lưu ý: {p.specialRequirements}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-[#397C80] font-semibold">{p.cabinNumber}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#252B32]/70">{p.ticketCode}</td>
                        <td className="py-2.5 px-3">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#252B32] font-medium">
                              <Bus className="w-3 h-3 text-[#397C80]" />
                              {p.busNumber}
                            </span>
                            <div>
                              <select
                                aria-label={`Đổi đoàn cho ${p.passengerName}`}
                                value={currentGroupId}
                                onChange={(e) => handleInlineGroupChange(p.id, e.target.value)}
                                className="px-2 py-0.5 bg-white border border-[#E5E0D7] rounded text-[10px] text-[#102A43] focus:outline-none focus:border-[#397C80]"
                              >
                                {DEFAULT_EXCURSION_GROUPS.map((g) => (
                                  <option key={g.id} value={g.id}>
                                    {g.groupName}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-[#252B32]/70">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#252B32]/40" /> {p.emergencyPhone}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.cls}`}>
                            <Icon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(p.id)}
                              className="px-2.5 py-1 bg-white hover:bg-[#F7F4ED] border border-[#E5E0D7] text-[#102A43] rounded-lg text-[10px] font-medium transition-colors cursor-pointer shadow-xs"
                              title="Chuyển trạng thái điểm danh"
                            >
                              Đổi trạng thái
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemovePassenger(p.id, p.passengerName)}
                              className="p-1 text-[#252B32]/40 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title={`Xóa ${p.passengerName} khỏi tour`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Modal Footer Controls */}
          <footer className="pt-3 border-t border-[#E5E0D7] flex items-center justify-between">
            <span className="text-[11px] text-[#252B32]/70">
              Hiển thị {filteredPassengers.length} / {passengers.length} hành khách
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-[#F7F4ED] border border-[#E5E0D7] active:scale-95 text-[#102A43] rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              Đóng
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
