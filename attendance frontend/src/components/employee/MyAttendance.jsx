import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetMyAttendanceQuery } from '../../redux/api/attendanceApi.js';
import PunchPanel from './PunchPanel.jsx';
import DailyReportModal from '../common/DailyReportModal.jsx';
import StatCard from './StatCard.jsx';
import OvertimeRequestForm from './OvertimeRequestForm.jsx';
import {
  Calendar,
  RefreshCw,
  AlertCircle,
  Clock,
  TrendingUp,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Timer,
  X,
} from 'lucide-react';

export default function MyAttendance() {
  const {
    data: attendanceResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetMyAttendanceQuery();

  const { user } = useSelector((state) => state.auth);
  // Track which row has the overtime form open
  const [overtimeFormFor, setOvertimeFormFor] = useState(null);
  // Track rows that just had overtime submitted (to hide the button)
  const [submittedOvertimeIds, setSubmittedOvertimeIds] = useState(new Set());
  // Expandable validation remarks
  const [expandedRemarks, setExpandedRemarks] = useState(new Set());
  const [isReportOpen, setIsReportOpen] = useState(false);

  const logs = attendanceResponse?.data || [];

  // Compute stats from attendance data
  const stats = useMemo(() => {
    if (logs.length === 0) return { totalHours: 0, daysWorked: 0, avgHours: 0, completedDays: 0 };
    const totalHours = logs.reduce((sum, log) => sum + (log.workingHours || 0), 0);
    const daysWorked = logs.length;
    const completedDays = logs.filter((l) => l.completionStatus === 'completed').length;
    const avgHours = daysWorked > 0 ? totalHours / daysWorked : 0;
    return { totalHours, daysWorked, avgHours, completedDays };
  }, [logs]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    return new Date(timeStr).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleRemarks = (id) => {
    setExpandedRemarks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleOvertimeSuccess = (id) => {
    setSubmittedOvertimeIds((prev) => new Set([...prev, id]));
    setOvertimeFormFor(null);
    refetch();
  };

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">My Attendance</h2>
            <p className="text-xs text-slate-400">Your personal clock-in & clock-out history</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsReportOpen(true)}
            className="inline-flex items-center gap-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Report</span>
          </button>
          <button
            onClick={refetch}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Refresh attendance"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Punch In/Out security console */}
      {!isLoading && !isError && (
        <PunchPanel logs={logs} refetch={refetch} />
      )}

      {/* Stats Cards */}
      {!isLoading && !isError && logs.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Clock}
            label="Total Hours Worked"
            value={`${stats.totalHours.toFixed(1)}h`}
            subValue="all time"
            color="violet"
          />
          <StatCard
            icon={CalendarDays}
            label="Days Worked"
            value={stats.daysWorked}
            subValue="total logs"
            color="sky"
          />
          <StatCard
            icon={TrendingUp}
            label="Avg Daily Hours"
            value={`${stats.avgHours.toFixed(1)}h`}
            subValue="per day"
            color="emerald"
          />
          <StatCard
            icon={Timer}
            label="Completed Days"
            value={stats.completedDays}
            subValue={`of ${stats.daysWorked} logged`}
            color="amber"
          />
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <span className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Failed to load attendance</p>
              <p className="text-xs text-slate-400">{error?.data?.message || error?.error || 'Unknown error'}</p>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No attendance records found.</p>
            <p className="text-slate-600 text-xs mt-1">Your logs will appear here after you punch in.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-slate-950/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/30">
                  <th className="py-4 px-5 w-[15%]">Date</th>
                  <th className="py-4 px-5 w-[15%]">Punch In</th>
                  <th className="py-4 px-5 w-[15%]">Punch Out</th>
                  <th className="py-4 px-5 w-[10%]">Hours</th>
                  <th className="py-4 px-5 w-[15%]">Status</th>
                  <th className="py-4 px-5 w-[18%]">Validation</th>
                  <th className="py-4 px-5 w-[12%] text-center">Overtime</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-800/40">
                {logs.map((log) => {
                  const isCompleted = log.completionStatus === 'completed';
                  const otRequest = log.overtimeRequest;
                  const alreadyRequested = submittedOvertimeIds.has(log._id) || !!otRequest;
                  const hasOvertimeForm = overtimeFormFor === log._id;
                  const remarks = log.validation?.remarks;

                  return (
                    <React.Fragment key={log._id}>
                      <tr className="hover:bg-slate-900/30 transition-colors">
                        {/* Date */}
                        <td className="py-4 px-5 text-slate-200 font-medium">{formatDate(log.date)}</td>

                        {/* Punch In */}
                        <td className="py-4 px-5 font-mono text-slate-300 text-xs">
                          {log.punchIn?.time ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                              {formatTime(log.punchIn.time)}
                            </span>
                          ) : '-'}
                        </td>

                        {/* Punch Out */}
                        <td className="py-4 px-5 font-mono text-slate-300 text-xs">
                          {log.punchOut?.time ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                              {formatTime(log.punchOut.time)}
                            </span>
                          ) : '-'}
                        </td>

                        {/* Working Hours */}
                        <td className="py-4 px-5 font-mono text-slate-100 font-semibold">
                          {log.workingHours ? `${log.workingHours.toFixed(2)}h` : '-'}
                        </td>

                        {/* Completion Status */}
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            isCompleted
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {log.completionStatus || 'incomplete'}
                          </span>
                        </td>

                        {/* Validation Status */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                              log.validation?.status === 'valid'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : log.validation?.status === 'invalid'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {log.validation?.status || 'pending'}
                            </span>
                            {remarks && (
                              <button
                                onClick={() => toggleRemarks(log._id)}
                                className="text-slate-500 hover:text-slate-300 transition-colors"
                                title="Show remarks"
                              >
                                {expandedRemarks.has(log._id) ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Overtime Action */}
                        <td className="py-4 px-5 text-center">
                          {isCompleted && !alreadyRequested ? (
                            hasOvertimeForm ? (
                              <button
                                onClick={() => setOvertimeFormFor(null)}
                                className="inline-flex items-center gap-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                                Close
                              </button>
                            ) : (
                              <button
                                onClick={() => setOvertimeFormFor(log._id)}
                                className="inline-flex items-center gap-1.5 bg-violet-600/80 hover:bg-violet-600 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                              >
                                <Timer className="w-3.5 h-3.5" />
                                Request
                              </button>
                            )
                          ) : otRequest ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                              otRequest.status === 'approved'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : otRequest.status === 'rejected'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {otRequest.status === 'approved' && 'Approved ✓'}
                              {otRequest.status === 'rejected' && 'Rejected ✗'}
                              {otRequest.status === 'pending' && 'Pending ⌛'}
                            </span>
                          ) : alreadyRequested ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Pending ⌛
                            </span>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Remarks expand row */}
                      {remarks && expandedRemarks.has(log._id) && (
                        <tr className="bg-slate-950/40">
                          <td colSpan={7} className="px-5 pb-3 pt-0">
                            <p className="text-xs text-slate-400 italic bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-2.5">
                              <span className="text-slate-500 not-italic font-semibold mr-1">Remarks:</span>
                              {remarks}
                            </p>
                          </td>
                        </tr>
                      )}

                      {/* Overtime request form row */}
                      {hasOvertimeForm && (
                        <tr className="bg-slate-950/20">
                          <td colSpan={7} className="px-5 pb-4 pt-0">
                            <OvertimeRequestForm
                              attendanceId={log._id}
                              onSuccess={() => handleOvertimeSuccess(log._id)}
                              onCancel={() => setOvertimeFormFor(null)}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DailyReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        logs={logs}
        title="My Attendance Daily Report"
        isSingleEmployee={true}
        employeeName={user?.name}
      />
    </section>
  );
}
