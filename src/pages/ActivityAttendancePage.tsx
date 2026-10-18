import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  QrCode,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ArrowLeft,
  DollarSign,
  UserCheck,
  UserPlus,
  ShieldCheck,
  X,
  CreditCard,
  Building,
} from 'lucide-react';
import {
  activityAttendanceService,
  type ActivityAttendanceSummaryResponse,
  type ActivityRosterPassengerResponse,
  type ActivityAttendanceStatus,
  type ActivityCheckInRequest,
  type WalkInCheckInRequest,
} from '../services/activityAttendanceService';
import { fetchActivities, type OnboardActivity } from '../services/activityService';

export const ActivityAttendancePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activities, setActivities] = useState<OnboardActivity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<number>(Number(id) || 1);
  const [summary, setSummary] = useState<ActivityAttendanceSummaryResponse | null>(null);
  const [roster, setRoster] = useState<ActivityRosterPassengerResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ActivityAttendanceStatus>('ALL');

  // Quick Check-in State
  const [quickInput, setQuickInput] = useState<string>('');
  const [quickInputType, setQuickInputType] = useState<'QR' | 'RFID' | 'CABIN'>('QR');
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Scanner Modal State
  const [isScannerModalOpen, setIsScannerModalOpen] = useState<boolean>(false);

  // Walk-in Modal State
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState<boolean>(false);
  const [walkInCabin, setWalkInCabin] = useState<string>('');
  const [walkInName, setWalkInName] = useState<string>('');
  const [walkInFee, setWalkInFee] = useState<number>(0);
  const [walkInNote, setWalkInNote] = useState<string>('');
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState<boolean>(false);

  const loadRequestIdRef = useRef(0);

  const loadData = useCallback(async (targetId: number) => {
    const reqId = ++loadRequestIdRef.current;
    setIsLoading(true);
    try {
      const [sumData, rosterData] = await Promise.all([
        activityAttendanceService.getAttendanceSummary(targetId),
        activityAttendanceService.getActivityRoster(targetId, { size: 50 }),
      ]);

      if (reqId === loadRequestIdRef.current) {
        setSummary(sumData);
        setRoster(rosterData.content || []);
      }
    } catch (err: unknown) {
      if (reqId === loadRequestIdRef.current) {
        console.error('Error loading attendance data:', err);
      }
    } finally {
      if (reqId === loadRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    fetchActivities()
      .then((acts) => {
        if (!isMounted) return;
        setActivities(acts);
        const resolvedId = Number(id) || acts[0]?.id || 1;
        setSelectedActivityId(resolvedId);
        void loadData(resolvedId);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load activities list:', err);
        const fallbackId = Number(id) || 1;
        setSelectedActivityId(fallbackId);
        void loadData(fallbackId);
      });

    return () => {
      isMounted = false;
    };
  }, [id, loadData]);

  const handleActivityChange = (newId: number) => {
    setSelectedActivityId(newId);
    setNotification(null);
    void loadData(newId);
  };

  const handleQuickCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    setIsSubmittingCheckIn(true);
    setNotification(null);

    const payload: ActivityCheckInRequest = {
      staffId: 'STAFF-DESK-01',
      staffName: 'Nhân viên lễ tân',
      deviceId: 'GATE-READER-01',
    };

    if (quickInputType === 'QR') payload.qrToken = quickInput.trim();
    else if (quickInputType === 'RFID') payload.rfidTag = quickInput.trim();
    else if (quickInputType === 'CABIN') payload.cabinNumber = quickInput.trim();

    try {
      const res = await activityAttendanceService.checkIn(selectedActivityId, payload);
      setNotification({
        type: 'success',
        message: `Điểm danh thành công: ${res.passengerName} (Cabin ${res.cabinNumber}) - Phương thức: ${res.method}`,
      });
      setQuickInput('');
      void loadData(selectedActivityId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Điểm danh thất bại';
      setNotification({
        type: 'error',
        message: msg,
      });
    } finally {
      setIsSubmittingCheckIn(false);
    }
  };

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInCabin.trim()) return;

    setIsSubmittingWalkIn(true);
    try {
      const payload: WalkInCheckInRequest = {
        cabinNumber: walkInCabin.trim(),
        passengerName: walkInName.trim() || undefined,
        feePaid: walkInFee > 0 ? walkInFee : undefined,
        paymentMethod: 'FOLIO',
        staffId: 'STAFF-DESK-01',
        deviceId: 'GATE-POS-01',
        note: walkInNote.trim() || 'Khách vãng lai tại cửa',
      };

      const res = await activityAttendanceService.walkInCheckIn(selectedActivityId, payload);
      setNotification({
        type: 'success',
        message: `Đăng ký & Điểm danh Walk-in thành công: ${res.passengerName} (Cabin ${res.cabinNumber}) - Ghi nợ Folio: ${res.chargedAmount.toLocaleString('vi-VN')} đ`,
      });
      setIsWalkInModalOpen(false);
      setWalkInCabin('');
      setWalkInName('');
      setWalkInFee(0);
      setWalkInNote('');
      void loadData(selectedActivityId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng ký khách vãng lai thất bại';
      alert(msg);
    } finally {
      setIsSubmittingWalkIn(false);
    }
  };

  // Filter roster
  const filteredRoster = roster.filter((p) => {
    const matchSearch =
      p.passengerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.cabinNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.rfidTag && p.rfidTag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const selectedActivity = activities.find((a) => a.id === selectedActivityId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <Link
            to="/activities"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Quay lại danh sách hoạt động"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                Staff Ops Dashboard
              </span>
              <span className="text-xs text-slate-400">ID: #{selectedActivityId}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Điểm Danh & Quét Vé Hoạt Động
            </h1>
          </div>
        </div>

        {/* Activity Selector & Refresh */}
        <div className="flex items-center space-x-3">
          <select
            value={selectedActivityId}
            onChange={(e) => handleActivityChange(Number(e.target.value))}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            {activities.length > 0 ? (
              activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({a.startTime} - {a.location})
                </option>
              ))
            ) : (
              <option value={selectedActivityId}>Hoạt động #{selectedActivityId}</option>
            )}
          </select>

          <button
            onClick={() => void loadData(selectedActivityId)}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Real-time KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registered */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Đã Đăng Ký
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {summary ? summary.totalRegistered : 0}
              <span className="text-sm font-normal text-slate-400 ml-1">
                / {summary?.maxCapacity || selectedActivity?.maxCapacity || 100}
              </span>
            </h3>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center">
              <Users className="w-3.5 h-3.5 mr-1" /> Danh sách dự kiến
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Checked In */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Đã Vào Cửa
            </p>
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {summary ? summary.checkedInCount : 0}
              <span className="text-xs font-semibold px-2 py-0.5 ml-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full">
                {summary?.attendanceRatePercentage || 0}%
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center">
              <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Tỉ lệ có mặt
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Walk-in Guests */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Khách Vãng Lai
            </p>
            <h3 className="text-2xl font-extrabold text-amber-500 dark:text-amber-400 mt-1">
              {summary ? summary.walkInCount : 0}
            </h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center">
              <DollarSign className="w-3.5 h-3.5 mr-0.5" /> Ghi nợ tài khoản cabin
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 dark:text-amber-400">
            <UserPlus className="w-6 h-6" />
          </div>
        </div>

        {/* Remaining Capacity */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Chỗ Trống Còn Lại
            </p>
            <h3 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
              {summary ? summary.remainingCapacity : 0}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-indigo-500" /> Sức chứa tối đa
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Notification Toast Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between shadow-sm animate-in fade-in slide-in-from-top-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Scanner & Gate Actions Card */}
      <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-600" />
              Soát Vé & Điểm Danh Tại Cửa
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hỗ trợ máy quét mã vạch/QR siêu tốc, chạm thẻ RFID NFC hoặc nhập số Cabin
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsScannerModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              <span>Bật Camera Quét QR</span>
            </button>

            <button
              type="button"
              onClick={() => setIsWalkInModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Khách Vãng Lai (+ Walk-in)</span>
            </button>
          </div>
        </div>

        {/* Quick Input Bar Form */}
        <form onSubmit={handleQuickCheckInSubmit} className="flex flex-col sm:flex-row gap-3 pt-2">
          {/* Method selector */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-700/60 p-1 shrink-0">
            <button
              type="button"
              onClick={() => setQuickInputType('QR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                quickInputType === 'QR'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Mã QR
            </button>
            <button
              type="button"
              onClick={() => setQuickInputType('RFID')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                quickInputType === 'RFID'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Thẻ RFID
            </button>
            <button
              type="button"
              onClick={() => setQuickInputType('CABIN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                quickInputType === 'CABIN'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Số Cabin
            </button>
          </div>

          <div className="relative flex-1">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder={
                quickInputType === 'QR'
                  ? 'Quét mã QR hoặc dán mã QR Token...'
                  : quickInputType === 'RFID'
                  ? 'Chạm thẻ RFID hoặc nhập mã thẻ (VD: RFID-101)...'
                  : 'Nhập số phòng Cabin (VD: 101, A-204)...'
              }
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmittingCheckIn || !quickInput.trim()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shrink-0"
          >
            {isSubmittingCheckIn ? 'Đang điểm danh...' : 'Điểm danh ngay'}
          </button>
        </form>
      </div>

      {/* Attendance Roster Table Section */}
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm overflow-hidden">
        {/* Table Filter Controls */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Danh Sách Điểm Danh (Roster)
            </h3>
            <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-semibold">
              {filteredRoster.length} hành khách
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Status Filter Tabs */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-700/60 p-1">
              {(['ALL', 'REGISTERED', 'CHECKED_IN'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === st
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? 'Tất cả' : st === 'REGISTERED' ? 'Chưa quét' : 'Đã vào cửa'}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên, cabin, RFID..."
                className="w-full sm:w-56 pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Hành khách</th>
                <th className="py-3 px-4">Số Cabin</th>
                <th className="py-3 px-4">Thẻ RFID</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Phương thức</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Nhân viên</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredRoster.length > 0 ? (
                filteredRoster.map((p) => {
                  const isChecked = p.status === 'CHECKED_IN';
                  return (
                    <tr
                      key={p.attendanceId || p.passengerId}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center space-x-2">
                          <span>{p.passengerName}</span>
                          {p.isWalkIn && (
                            <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded font-bold">
                              Walk-in
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {p.cabinNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                        {p.rfidTag || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isChecked
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {isChecked ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" /> Đã vào cửa
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 mr-1 text-slate-400" /> Chưa quét
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                        {p.checkInMethod || '-'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
                        {p.checkedInAt ? new Date(p.checkedInAt).toLocaleTimeString('vi-VN') : '-'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {p.checkedInByStaffId || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isChecked ? (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await activityAttendanceService.checkIn(selectedActivityId, {
                                  passengerId: p.passengerId,
                                  staffId: 'STAFF-DESK-01',
                                });
                                void loadData(selectedActivityId);
                              } catch (err: unknown) {
                                alert(err instanceof Error ? err.message : 'Điểm danh lỗi');
                              }
                            }}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Quét ngay
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-medium">Hoàn tất</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                    {isLoading ? 'Đang tải dữ liệu điểm danh...' : 'Không tìm thấy hành khách nào phù hợp.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Camera QR Scanner Simulation Modal */}
      {isScannerModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Camera Quét Mã QR Vé Hoạt Động</h3>
              </div>
              <button
                onClick={() => setIsScannerModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewport Simulation */}
            <div className="p-6 flex flex-col items-center">
              <div className="relative w-64 h-64 bg-slate-950 rounded-2xl border-2 border-dashed border-blue-500/60 overflow-hidden flex items-center justify-center">
                {/* Laser scan animation line */}
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-bounce shadow-lg shadow-cyan-500/50" />

                {/* Corner reticle markers */}
                <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
                <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
                <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
                <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-cyan-400" />

                <div className="text-center text-slate-500 text-xs px-4">
                  <QrCode className="w-12 h-12 mx-auto mb-2 text-slate-600 animate-pulse" />
                  Hướng camera vào mã QR trên điện thoại của hành khách
                </div>
              </div>

              {/* Simulation Quick Trigger Buttons */}
              <div className="w-full mt-6 space-y-2">
                <p className="text-xs font-semibold text-slate-400 text-center uppercase tracking-wider">
                  Giả Lập Tín Hiệu Quét Nhanh
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await activityAttendanceService.checkIn(selectedActivityId, {
                          passengerId: roster[0]?.passengerId || 1,
                          staffId: 'CAMERA-GATE-01',
                        });
                        setNotification({
                          type: 'success',
                          message: `Quét camera thành công: ${res.passengerName} (Cabin ${res.cabinNumber})`,
                        });
                        setIsScannerModalOpen(false);
                        void loadData(selectedActivityId);
                      } catch (err: unknown) {
                        alert(err instanceof Error ? err.message : 'Lỗi quét QR');
                      }
                    }}
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
                  >
                    ✓ Quét Vé Hợp Lệ
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        // Thử check-in người đã check-in để kích hoạt 409 Conflict
                        const checkedPassenger = roster.find((p) => p.status === 'CHECKED_IN');
                        await activityAttendanceService.checkIn(selectedActivityId, {
                          passengerId: checkedPassenger ? checkedPassenger.passengerId : 1,
                          staffId: 'CAMERA-GATE-01',
                        });
                      } catch (err: unknown) {
                        setNotification({
                          type: 'error',
                          message: err instanceof Error ? err.message : 'Trùng lặp vé!',
                        });
                        setIsScannerModalOpen(false);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium transition-colors"
                  >
                    ⚠ Thử Quét Trùng Lặp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Walk-in Registration Modal */}
      {isWalkInModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-amber-500 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5" />
                <h3 className="font-bold text-lg">Đăng Ký Khách Vãng Lai (Walk-in)</h3>
              </div>
              <button
                onClick={() => setIsWalkInModalOpen(false)}
                className="p-1 rounded-full text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWalkInSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Số Phòng Cabin (*)
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={walkInCabin}
                    onChange={(e) => setWalkInCabin(e.target.value)}
                    placeholder="VD: 101, A-204..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Họ Tên Khách Hàng (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="Nhập họ tên nếu có..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phụ Phí Tham Gia (VNĐ)
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    min="0"
                    value={walkInFee}
                    onChange={(e) => setWalkInFee(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Hệ thống tự động ghi nợ vào hóa đơn Folio của Cabin này
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi Chú
                </label>
                <textarea
                  rows={2}
                  value={walkInNote}
                  onChange={(e) => setWalkInNote(e.target.value)}
                  placeholder="Ghi chú thêm về khách..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsWalkInModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWalkIn || !walkInCabin.trim()}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmittingWalkIn ? 'Đang đăng ký...' : 'Xác nhận vào cửa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
