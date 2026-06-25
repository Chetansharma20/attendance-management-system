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
  Building2
} from 'lucide-react';
import {
  BarChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid
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
  const todayStats = todayStatsResponse?.data || { total: 0, present: 0, onLeave: 0, absent: 0 };

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

  // Summary computations
  const kpis = useMemo(() => {
    if (reportData.length === 0) return { presence: 0, hours: 0, leaves: 0, overtime: 0 };
    const totalHours = reportData.reduce((sum, item) => sum + item.attendance.totalWorkedHours, 0);
    const totalLeaves = reportData.reduce((sum, item) => sum + item.leaves.approvedDays, 0);
    const totalOT = reportData.reduce((sum, item) => sum + item.overtime.approvedHours, 0);
    const avgPresence = reportData.reduce((sum, item) => sum + item.attendance.daysPresent, 0) / reportData.length;

    return {
      presence: Math.round(avgPresence),
      hours: Number(totalHours.toFixed(1)),
      leaves: totalLeaves,
      overtime: Number(totalOT.toFixed(1)),
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

            {/* Today Present/Absent */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Today's Attendance</span>
                <div className="flex gap-1 text-emerald-600 dark:text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-theme-bright tracking-tight">
                  {todayStats.present} <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">P</span>
                  <span className="text-xl font-normal text-theme-muted mx-2">/</span>
                  {todayStats.absent} <span className="text-sm font-semibold text-rose-500">A</span>
                </h3>
                <p className="text-xs text-theme-muted mt-1">Present vs. Absent employees today</p>
              </div>
            </div>

            {/* Today On Leave */}
            <div className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/20 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">On Leave Today</span>
                <UserX className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-theme-bright tracking-tight">
                  {todayStats.onLeave} <span className="text-xs font-semibold">people</span>
                </h3>
                <p className="text-xs text-theme-muted mt-1">Employees on approved leave today</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">Worked Hours</span>
                <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-theme-bright tracking-tight">{kpis.hours}</h3>
                <p className="text-xs text-theme-muted mt-1">Accumulated worked hours this month</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Avg Presence</span>
                <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-theme-bright tracking-tight">{kpis.presence} <span className="text-xs font-semibold">days</span></h3>
                <p className="text-xs text-theme-muted mt-1">Average presence days per employee</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-sky-500/10 to-blue-500/10 border border-sky-500/20 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest">Leaves Taken</span>
                <Briefcase className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-theme-bright tracking-tight">{kpis.leaves} <span className="text-xs font-semibold">days</span></h3>
                <p className="text-xs text-theme-muted mt-1">Approved leaves across members</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Approved OT</span>
                <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-theme-bright tracking-tight">{kpis.overtime} <span className="text-xs font-semibold">hrs</span></h3>
                <p className="text-xs text-theme-muted mt-1">Approved overtime hours this month</p>
              </div>
            </div>

          </div>

          {/* ─── Visual Charts ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Recharts Bar Chart */}
            <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl transition-colors duration-200">
              <h3 className="text-sm font-bold text-theme-bright mb-6 uppercase tracking-wider">Worked Hours Breakdown</h3>

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

            {/* Detailed Table view */}
            <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl overflow-hidden flex flex-col justify-between transition-colors duration-200">
              <h3 className="text-sm font-bold text-theme-bright mb-4 uppercase tracking-wider">Employee Summaries</h3>

              <div className="flex-1 overflow-y-auto max-h-[220px] divide-y divide-theme-border">
                {reportData.map((item) => (
                  <div key={item.employee._id} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="font-bold text-theme-bright">{item.employee.name}</p>
                      <p className="text-[10px] text-theme-muted">{item.employee.email}</p>
                    </div>
                    <div className="text-right font-semibold font-mono space-y-0.5">
                      <p className="text-theme-text">{item.attendance.daysPresent} days present</p>
                      <p className="text-violet-650 dark:text-violet-400">{item.attendance.totalWorkedHours} hrs worked</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
