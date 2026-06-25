import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetMonthlyReportDataQuery,
  useDownloadMonthlyReportMutation,
  useGetTodayStatsQuery,
} from '../../redux/api/attendanceApi';
import { useGetAllDepartmentsQuery } from '../../redux/api/departmentApi';
import {
  Calendar,
  Clock,
  Briefcase,
  FileText,
  Download,
  AlertCircle,
  TrendingUp,
  Award,
  UserCheck,
  UserX,
  Building2,
  Users,
  Timer,
  FileCheck,
  X
} from 'lucide-react';
import {
  BarChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import { MonthlyReportItem } from '../../types/api.types.js';

export default function AnalyticsDashboard() {
  const { user } = useSelector((state: any) => state.auth);

  // Default to current year and month (YYYY-MM)
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [downloadMsg, setDownloadMsg] = useState<string>('');
  const [activeModal, setActiveModal] = useState<null | 'today-attendance' | 'pending-leaves' | 'on-leave-today'>(null);
  const [attendanceTab, setAttendanceTab] = useState<'present' | 'absent'>('present');

  // Fetch JSON report data
  const { data: reportResponse, isLoading, error } = useGetMonthlyReportDataQuery(
    { month: selectedMonth, departmentId: selectedDepartment || undefined },
    { skip: !user || !selectedMonth }
  );

  // Fetch all departments for the filter dropdown (admin only)
  const { data: departmentsResponse } = useGetAllDepartmentsQuery(undefined, { skip: user?.role !== 'admin' });
  const departments = departmentsResponse?.data || [];

  // Fetch today's real-time statistics
  const { data: todayStatsResponse } = useGetTodayStatsQuery(undefined, {
    skip: !user,
  });
  const todayStats = todayStatsResponse?.data || { total: 0, present: 0, onLeave: 0, absent: 0, late: 0 };

  // Export report mutation
  const [downloadMonthlyReport, { isLoading: isDownloading }] = useDownloadMonthlyReportMutation();

  const reportData: MonthlyReportItem[] = reportResponse?.data || [];

  // Prepare chart data format for Recharts
  const chartData = useMemo(() => {
    return reportData.map((item) => ({
      name: item.employee.name.split(' ')[0],
      fullName: item.employee.name,
      hours: item.attendance.totalWorkedHours,
    }));
  }, [reportData]);

  // Department-wise attendance chart data
  const departmentChartData = useMemo(() => {
    const deptMap: { [key: string]: { name: string; present: number; total: number; hours: number } } = {};
    
    // Initialize map with all departments
    departments.forEach((dept: any) => {
      deptMap[dept._id] = { name: dept.name, present: 0, total: 0, hours: 0 };
    });
    
    deptMap['unassigned'] = { name: 'Unassigned', present: 0, total: 0, hours: 0 };

    reportData.forEach((item) => {
      const deptId = item.employee.departmentId || 'unassigned';
      if (!deptMap[deptId]) {
        deptMap[deptId] = { name: 'Other', present: 0, total: 0, hours: 0 };
      }
      deptMap[deptId].present += item.attendance.daysPresent;
      deptMap[deptId].total += 1;
      deptMap[deptId].hours += item.attendance.totalWorkedHours;
    });

    return Object.values(deptMap)
      .filter((d) => d.total > 0)
      .map((d) => ({
        name: d.name,
        'Avg Presence': Number((d.present / d.total).toFixed(1)),
        'Total Hours': Number(d.hours.toFixed(1)),
      }));
  }, [reportData, departments]);

  // Leave trends/breakdown chart data
  const leaveBreakdownData = useMemo(() => {
    const typeMap: { [key: string]: number } = {};
    reportData.forEach((item) => {
      if (item.leaves && item.leaves.rawList) {
        item.leaves.rawList.forEach((l: any) => {
          if (l.status === 'approved') {
            const type = l.type || 'Other';
            typeMap[type] = (typeMap[type] || 0) + (l.totalDays || 0);
          }
        });
      }
    });

    return Object.entries(typeMap).map(([name, value]) => ({
      name,
      Days: value
    }));
  }, [reportData]);

  // Top late-comers list
  const topLateComers = useMemo(() => {
    return [...reportData]
      .filter((item) => (item.attendance.lateArrivals ?? 0) > 0)
      .sort((a, b) => (b.attendance.lateArrivals ?? 0) - (a.attendance.lateArrivals ?? 0))
      .slice(0, 5);
  }, [reportData]);

  // Pending leaves list
  const pendingLeavesList = useMemo(() => {
    const list: any[] = [];
    reportData.forEach((item) => {
      if (item.leaves && item.leaves.rawList) {
        item.leaves.rawList.forEach((l: any) => {
          if (l.status === 'pending') {
            list.push({
              employee: item.employee,
              type: l.type,
              startDate: l.startDate,
              endDate: l.endDate,
              totalDays: l.totalDays,
              status: l.status
            });
          }
        });
      }
    });
    return list;
  }, [reportData]);

  // Summary computations
  const kpis = useMemo(() => {
    if (reportData.length === 0) return { presence: 0, hours: 0, leaves: 0, overtime: 0, pendingLeaves: 0 };
    const totalHours = reportData.reduce((sum, item) => sum + item.attendance.totalWorkedHours, 0);
    const totalLeaves = reportData.reduce((sum, item) => sum + item.leaves.approvedDays, 0);
    const totalOT = reportData.reduce((sum, item) => sum + item.overtime.approvedHours, 0);
    const avgPresence = reportData.reduce((sum, item) => sum + item.attendance.daysPresent, 0) / reportData.length;
    const pendingLeaves = reportData.reduce((sum, item) => sum + (item.leaves.pendingRequests ?? 0), 0);

    return {
      presence: Math.round(avgPresence),
      hours: Number(totalHours.toFixed(1)),
      leaves: totalLeaves,
      overtime: Number(totalOT.toFixed(1)),
      pendingLeaves,
    };
  }, [reportData]);

  const handleExport = async (format: 'pdf' | 'csv') => {
    try {
      setDownloadMsg('Preparing your download...');
      const blob = await downloadMonthlyReport({
        month: selectedMonth,
        format,
        departmentId: selectedDepartment || undefined,
      }).unwrap();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const selectedDeptName = departments.find((d: any) => d._id === selectedDepartment)?.name;
      const fileSuffix = selectedDeptName
        ? `${selectedMonth}-${selectedDeptName.replace(/\s+/g, '_')}`
        : selectedMonth;
      link.setAttribute('download', `monthly-report-${fileSuffix}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setDownloadMsg('');
    } catch (err) {
      console.error(err);
      setDownloadMsg('Download failed. Please try again.');
      setTimeout(() => setDownloadMsg(''), 3000);
    }
  };

  return (
    <div className="space-y-6">

      {/* ─── Filter & Action Controls ────────────────────────────────────────── */}
      <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-sm font-bold text-theme-muted uppercase tracking-wider">Select Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-theme-bg border border-theme-input-border text-theme-text rounded-xl px-4 py-2.5 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-sm font-semibold cursor-pointer"
            />
          </div>

          {/* Department filter — admin only */}
          {user?.role === 'admin' && departments.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-sm font-bold text-theme-muted uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-violet-500" />
                Department:
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="bg-theme-bg border border-theme-input-border text-theme-text rounded-xl px-4 py-2.5 outline-none focus:border-violet-500 transition-all text-sm font-semibold cursor-pointer"
              >
                <option value="">All Departments</option>
                {departments.map((d: any) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => handleExport('pdf')}
            disabled={isDownloading || reportData.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            PDF Export
          </button>

          <button
            onClick={() => handleExport('csv')}
            disabled={isDownloading || reportData.length === 0}
            className="flex items-center gap-2 bg-theme-bg hover:bg-theme-card-hover border border-theme-border text-theme-bright font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            CSV Export
          </button>
        </div>
      </div>

      {downloadMsg && (
        <div className="bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse">
          <TrendingUp className="w-4 h-4" />
          {downloadMsg}
        </div>
      )}

      {isLoading ? (
        <div className="py-24 flex justify-center items-center">
          <span className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-6 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-semibold">Failed to load analytics data. Please ensure the backend server is running.</p>
        </div>
      ) : reportData.length === 0 ? (
        <div className="bg-theme-card border border-theme-border rounded-2xl py-16 text-center text-theme-muted text-sm space-y-2">
          <Calendar className="w-12 h-12 mx-auto opacity-40 text-violet-500" />
          <h3 className="font-bold text-theme-bright">No Data Available</h3>
          <p className="text-xs">There are no attendance or shift records logged for {selectedMonth} yet.</p>
        </div>
      ) : (
        <>
          {/* ─── KPI Cards Grid ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Today Present/Absent/Late */}
            <button
              onClick={() => { setActiveModal('today-attendance'); setAttendanceTab('present'); }}
              className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-left w-full"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Today's Attendance</span>
                <div className="flex gap-1 text-emerald-600 dark:text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-extrabold text-theme-bright tracking-tight">
                    {todayStats.present} <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">P</span>
                    <span className="text-xl font-normal text-theme-muted mx-2">/</span>
                    {todayStats.absent} <span className="text-sm font-semibold text-rose-500">A</span>
                  </h3>
                </div>
                <div className="flex items-center gap-2 mt-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1 w-max">
                  <Timer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                    {todayStats.late || 0} Late Arrivals Today
                  </span>
                </div>
              </div>
            </button>

            {/* Leave requests pending */}
            <button
              onClick={() => setActiveModal('pending-leaves')}
              className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/20 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-left w-full"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Pending Leaves</span>
                <FileCheck className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-theme-bright tracking-tight">
                  {kpis.pendingLeaves} <span className="text-xs font-semibold">requests</span>
                </h3>
                <p className="text-xs text-theme-muted mt-1">Pending leaves needing approval</p>
              </div>
            </button>

            {/* On Leave Today */}
            <button
              onClick={() => setActiveModal('on-leave-today')}
              className="bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-left w-full"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">On Leave Today</span>
                <UserX className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-theme-bright tracking-tight">
                  {todayStats.onLeave} <span className="text-xs font-semibold">people</span>
                </h3>
                <p className="text-xs text-theme-muted mt-1">Employees on approved leave today</p>
              </div>
            </button>

          </div>

          {/* ─── Visual Charts ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Department-wise Attendance Chart */}
            <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl transition-colors duration-200">
              <h3 className="text-sm font-bold text-theme-bright mb-6 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-violet-500" />
                Department-wise Attendance
              </h3>

              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="deptGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.9} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border, #2d2d30)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'var(--color-text-muted, #71717a)', fontSize: 10, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'var(--color-text-muted, #71717a)', fontSize: 10, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip
                      cursor={false}
                      contentStyle={{
                        backgroundColor: 'var(--color-card, #18181b)',
                        border: '1px solid var(--color-border, #27272a)',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: 'var(--color-text-bright, #f4f4f5)'
                      }}
                    />
                    <RechartsBar
                      dataKey="Avg Presence"
                      fill="url(#deptGradient)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Worked Hours Breakdown */}
            <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl transition-colors duration-200">
              <h3 className="text-sm font-bold text-theme-bright mb-6 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-500" />
                Worked Hours Breakdown
              </h3>

              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.9} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border, #2d2d30)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'var(--color-text-muted, #71717a)', fontSize: 10, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'var(--color-text-muted, #71717a)', fontSize: 10, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip
                      cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                      contentStyle={{
                        backgroundColor: 'var(--color-card, #18181b)',
                        border: '1px solid var(--color-border, #27272a)',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: 'var(--color-text-bright, #f4f4f5)'
                      }}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                      formatter={(value: any, name: any, props: any) => [`${value} hrs`, props.payload.fullName]}
                    />
                    <RechartsBar
                      dataKey="hours"
                      fill="url(#barGradient)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Leave Trends Chart */}
            <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl transition-colors duration-200">
              <h3 className="text-sm font-bold text-theme-bright mb-6 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-violet-500" />
                Leave Trends (Approved Days by Type)
              </h3>

              <div className="w-full h-64">
                {leaveBreakdownData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-theme-muted text-xs">
                    <p>No leaves taken this month</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leaveBreakdownData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="leaveGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.9} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border, #2d2d30)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: 'var(--color-text-muted, #71717a)', fontSize: 10, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'var(--color-text-muted, #71717a)', fontSize: 10, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        cursor={false}
                        contentStyle={{
                          backgroundColor: 'var(--color-card, #18181b)',
                          border: '1px solid var(--color-border, #27272a)',
                          borderRadius: '12px',
                          fontSize: '11px',
                          color: 'var(--color-text-bright, #f4f4f5)'
                        }}
                      />
                      <RechartsBar
                        dataKey="Days"
                        fill="url(#leaveGradient)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Top Late-Comers this month */}
            <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-colors duration-200">
              <div>
                <h3 className="text-sm font-bold text-theme-bright mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Timer className="w-4 h-4 text-rose-500" />
                  Top Late-Comers This Month
                </h3>
                <div className="divide-y divide-theme-border max-h-[220px] overflow-y-auto">
                  {topLateComers.length === 0 ? (
                    <p className="py-8 text-center text-xs text-theme-muted">No late-comers logged this month! 🎉</p>
                  ) : (
                    topLateComers.map((item) => (
                      <div key={item.employee._id} className="py-3 flex items-center justify-between gap-4 text-xs">
                        <div>
                          <p className="font-bold text-theme-bright">{item.employee.name}</p>
                          <p className="text-[10px] text-theme-muted">{item.employee.email}</p>
                        </div>
                        <div className="text-right">
                          <span className="bg-red-500/10 text-red-600 dark:text-red-400 font-bold px-2.5 py-1 rounded-lg">
                            {item.attendance.lateArrivals} times late
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Employee Summaries Table */}
          <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl transition-colors duration-200">
            <h3 className="text-sm font-bold text-theme-bright mb-4 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-500" />
              Employee Summaries
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-theme-border text-theme-muted uppercase tracking-wider text-[10px] font-bold">
                    <th className="pb-3">Employee</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Days Present</th>
                    <th className="pb-3 text-right">Hours Worked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border">
                  {reportData.map((item) => (
                    <tr key={item.employee._id} className="hover:bg-theme-card-hover/50 transition-colors">
                      <td className="py-3.5 pr-4">
                        <div>
                          <p className="font-bold text-theme-bright">{item.employee.name}</p>
                          <p className="text-[10px] text-theme-muted">{item.employee.email}</p>
                        </div>
                      </td>
                      <td className="py-3.5 capitalize text-theme-muted">{item.employee.role}</td>
                      <td className="py-3.5 font-semibold text-theme-text">{item.attendance.daysPresent} days</td>
                      <td className="py-3.5 text-right font-mono font-bold text-violet-650 dark:text-violet-400">
                        {item.attendance.totalWorkedHours} hrs
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal Drill-Down View */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Background Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setActiveModal(null)}
          />
          
          {/* Modal Card */}
          <div className="relative bg-theme-card border border-theme-border rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border bg-theme-bg/50">
              <div>
                <h3 className="text-base font-bold text-theme-bright">
                  {activeModal === 'today-attendance' && "Today's Attendance Detail"}
                  {activeModal === 'pending-leaves' && "Pending Leave Requests"}
                  {activeModal === 'on-leave-today' && "Employees On Leave Today"}
                </h3>
                <p className="text-xs text-theme-muted">
                  {activeModal === 'today-attendance' && "View who is present or absent today"}
                  {activeModal === 'pending-leaves' && "Pending leaves requiring action"}
                  {activeModal === 'on-leave-today' && "Approved leaves active today"}
                </p>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg hover:bg-theme-card-hover text-theme-muted hover:text-theme-bright transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* Sub-tabs for Today's Attendance */}
              {activeModal === 'today-attendance' && (
                <div className="flex gap-2 border-b border-theme-border pb-3">
                  <button
                    onClick={() => setAttendanceTab('present')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      attendanceTab === 'present'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-theme-muted hover:text-theme-bright'
                    }`}
                  >
                    Present ({todayStats.presentEmployees?.length || 0})
                  </button>
                  <button
                    onClick={() => setAttendanceTab('absent')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      attendanceTab === 'absent'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'text-theme-muted hover:text-theme-bright'
                    }`}
                  >
                    Absent ({todayStats.absentEmployees?.length || 0})
                  </button>
                </div>
              )}

              {/* Render Lists */}
              <div className="divide-y divide-theme-border">
                {activeModal === 'today-attendance' && attendanceTab === 'present' && (
                  (todayStats.presentEmployees || []).length === 0 ? (
                    <p className="text-center py-8 text-xs text-theme-muted">No employees are present today yet.</p>
                  ) : (
                    todayStats.presentEmployees?.map((emp: any) => (
                      <div key={emp._id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-theme-bright">{emp.name}</p>
                          <p className="text-[10px] text-theme-muted">{emp.email}</p>
                        </div>
                        <div className="text-right space-y-0.5 font-semibold">
                          <p className="text-theme-text">In: {emp.punchInTime ? new Date(emp.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                          <p className="text-[10px] text-theme-muted">Out: {emp.punchOutTime ? new Date(emp.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Still In'}</p>
                          {emp.arrivalStatus === 'late' && (
                            <span className="text-[9px] bg-red-500/10 text-red-600 dark:text-red-400 font-bold px-1.5 py-0.5 rounded">Late</span>
                          )}
                        </div>
                      </div>
                    ))
                  )
                )}

                {activeModal === 'today-attendance' && attendanceTab === 'absent' && (
                  (todayStats.absentEmployees || []).length === 0 ? (
                    <p className="text-center py-8 text-xs text-theme-muted">Nobody is absent today! 🎉</p>
                  ) : (
                    todayStats.absentEmployees?.map((emp: any) => (
                      <div key={emp._id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-theme-bright">{emp.name}</p>
                          <p className="text-[10px] text-theme-muted">{emp.email}</p>
                        </div>
                        <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                          Absent
                        </span>
                      </div>
                    ))
                  )
                )}

                {activeModal === 'pending-leaves' && (
                  pendingLeavesList.length === 0 ? (
                    <p className="text-center py-8 text-xs text-theme-muted">No pending leave requests! 🎉</p>
                  ) : (
                    pendingLeavesList.map((req, idx) => (
                      <div key={idx} className="py-4 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-theme-bright">{req.employee.name}</p>
                          <p className="text-[10px] text-theme-muted">{req.employee.email}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold px-1.5 py-0.5 rounded text-[10px]">
                              {req.type}
                            </span>
                            <span className="text-theme-muted text-[10px] self-center">
                              {new Date(req.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} - {new Date(req.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2.5 py-1 rounded-lg">
                            {req.totalDays} {req.totalDays === 1 ? 'day' : 'days'}
                          </span>
                        </div>
                      </div>
                    ))
                  )
                )}

                {activeModal === 'on-leave-today' && (
                  (todayStats.onLeaveEmployees || []).length === 0 ? (
                    <p className="text-center py-8 text-xs text-theme-muted">No employees are on leave today.</p>
                  ) : (
                    todayStats.onLeaveEmployees?.map((emp: any) => (
                      <div key={emp._id} className="py-4 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-theme-bright">{emp.name}</p>
                          <p className="text-[10px] text-theme-muted">{emp.email}</p>
                          <span className="bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold px-1.5 py-0.5 rounded text-[10px] mt-1 inline-block">
                            {emp.leaveType}
                          </span>
                        </div>
                        <div className="text-right text-theme-muted text-[10px]">
                          <p>Until {new Date(emp.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
