import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useGetMyAttendanceQuery } from '../../redux/api/attendanceApi';
import PunchPanel from './PunchPanel';
import DailyReportModal, { AttendanceLogItem } from '../common/DailyReportModal';
import StatCard from './StatCard';
import OvertimeRequestForm from './OvertimeRequestForm';
import { RootState } from '../../redux/store';
import {
  Calendar,
  RefreshCw,
  AlertCircle,
  Clock,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Timer,
  X,
  Download,
} from 'lucide-react';
import { exportToCsv } from '../../utils/csvExport';

export default function MyAttendance() {
  const {
    data: attendanceResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetMyAttendanceQuery();

  const { user } = useSelector((state: RootState) => state.auth);
  // Track which row has the overtime form open
  const [overtimeFormFor, setOvertimeFormFor] = useState<string | null>(null);
  // Track rows that just had overtime submitted (to hide the button)
  const [submittedOvertimeIds, setSubmittedOvertimeIds] = useState<Set<string>>(new Set());
  // Expandable validation remarks
  const [expandedRemarks, setExpandedRemarks] = useState<Set<string>>(new Set());
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  const logs: AttendanceLogItem[] = attendanceResponse?.data || [];

  const totalHours = useMemo(() => {
    return logs.reduce((sum, log) => sum + (log.workingHours || 0), 0);
  }, [logs]);

  const getFirstPunchIn = (punches?: any[]) => {
    if (!punches || punches.length === 0) return null;
    const firstIn = punches.find((p) => p.type === 'in');
    return firstIn ? firstIn.time : null;
  };

  const getLastPunchOut = (punches?: any[]) => {
    if (!punches || punches.length === 0) return null;
    for (let i = punches.length - 1; i >= 0; i--) {
      if (punches[i].type === 'out') {
        return punches[i].time;
      }
    }
    return null;
  };

  const formatDate = (dateStr: string | Date) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string | Date | null) => {
    if (!timeStr) return '-';
    return new Date(timeStr).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleRemarks = (id: string) => {
    setExpandedRemarks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleOvertimeSuccess = (id: string) => {
    setSubmittedOvertimeIds((prev) => new Set([...prev, id]));
    setOvertimeFormFor(null);
    refetch();
  };

  const handleExportCsv = () => {
    if (logs.length === 0) return;
    
    const columns = [
      { label: 'Date', key: 'date', format: (val: any) => new Date(val).toLocaleDateString() },
      { label: 'Punch In', key: 'punches', format: (punches: any) => {
          const time = getFirstPunchIn(punches);
          return time ? new Date(time).toLocaleTimeString() : '-';
        }
      },
      { label: 'Punch Out', key: 'punches', format: (punches: any) => {
          const time = getLastPunchOut(punches);
          return time ? new Date(time).toLocaleTimeString() : '-';
        }
      },
      { label: 'Working Hours', key: 'workingHours', format: (val: any) => val ? val.toFixed(2) + ' hrs' : '0 hrs' },
      { label: 'Arrival Status', key: 'arrivalStatus', format: (val: any) => val || 'On Time' },
      { label: 'Departure Status', key: 'departureStatus', format: (val: any) => val || '-' },
      { label: 'Completion Status', key: 'completionStatus', format: (val: any) => val || '-' },
      { label: 'Validation Status', key: 'validation', format: (val: any) => val?.status || 'pending' },
      { label: 'Remarks', key: 'validation', format: (val: any) => val?.remarks || '' },
    ];

    exportToCsv(`my-attendance-history-${new Date().toISOString().split('T')[0]}.csv`, logs, columns);
  };

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/10 text-sky-655 dark:text-sky-400 rounded-xl border border-sky-500/20">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-theme-bright">My Attendance</h2>
            <p className="text-xs text-theme-muted">Your personal clock-in & clock-out history</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export history to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsReportOpen(true)}
            className="inline-flex items-center gap-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-655 dark:text-sky-400 border border-sky-500/20 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Report</span>
          </button>
          <button
            onClick={refetch}
            className="p-2 text-theme-muted hover:text-theme-bright hover:bg-theme-card-hover rounded-lg transition-colors cursor-pointer"
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

      {/* Stats Card (Working Hours only) */}
      {!isLoading && !isError && logs.length > 0 && (
        <div className="flex">
          <StatCard
            icon={Clock}
            label="Total Working Hours"
            value={`${totalHours.toFixed(2)}h`}
            subValue="cumulative shift duration"
            color="violet"
          />
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl space-y-5 transition-colors duration-200">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <span className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Failed to load attendance</p>
              <p className="text-xs text-theme-muted">{(error as any)?.data?.message || (error as any)?.error || 'Unknown error'}</p>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="w-12 h-12 text-theme-muted mx-auto mb-3" />
            <p className="text-theme-muted text-sm">No attendance records found.</p>
            <p className="text-theme-muted/80 text-xs mt-1">Your logs will appear here after you punch in.</p>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto rounded-xl border border-theme-border bg-theme-bg/30">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-theme-border text-xs font-semibold text-theme-muted uppercase tracking-wider bg-theme-card-hover/50">
                    <th className="py-4 px-5 w-[15%]">Date</th>
                    <th className="py-4 px-5 w-[15%]">Punch In</th>
                    <th className="py-4 px-5 w-[15%]">Punch Out</th>
                    <th className="py-4 px-5 w-[10%]">Hours</th>
                    <th className="py-4 px-5 w-[15%]">Status</th>
                    <th className="py-4 px-5 w-[18%]">Validation</th>
                    <th className="py-4 px-5 w-[12%] text-center">Overtime</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-theme-border/60">
                  {logs.map((log) => {
                    const isCompleted = log.completionStatus === 'completed';
                    const otRequest = log.overtimeRequest;
                    const alreadyRequested = submittedOvertimeIds.has(log._id) || !!otRequest;
                    const hasOvertimeForm = overtimeFormFor === log._id;
                    const remarks = log.validation?.remarks;

                    return (
                      <React.Fragment key={log._id}>
                        <tr className="hover:bg-theme-card-hover/50 transition-colors">
                          {/* Date */}
                          <td className="py-4 px-5 text-theme-bright font-medium">{formatDate(log.date)}</td>

                          {/* Punch In */}
                          <td className="py-4 px-5 font-mono text-theme-text text-xs">
                            {getFirstPunchIn(log.punches) ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                  {formatTime(getFirstPunchIn(log.punches))}
                                </span>
                                {log.arrivalStatus === 'late' ? (
                                  <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider block">Late</span>
                                ) : log.arrivalStatus === 'on-time' ? (
                                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider block">On-Time</span>
                                ) : null}
                              </div>
                            ) : '-'}
                          </td>

                          {/* Punch Out */}
                          <td className="py-4 px-5 font-mono text-theme-text text-xs">
                            {getLastPunchOut(log.punches) ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                  {formatTime(getLastPunchOut(log.punches))}
                                </span>
                                {log.departureStatus === 'early-departure' ? (
                                  <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider block">Early Leave</span>
                                ) : log.departureStatus === 'regular' ? (
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Regular</span>
                                ) : null}
                              </div>
                            ) : '-'}
                          </td>

                          {/* Working Hours */}
                          <td className="py-4 px-5 font-mono text-theme-bright font-semibold">
                            {log.workingHours ? `${log.workingHours.toFixed(2)}h` : '-'}
                          </td>

                          {/* Completion Status */}
                          <td className="py-4 px-5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                              isCompleted
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}>
                              {log.completionStatus || 'incomplete'}
                            </span>
                          </td>

                          {/* Validation Status */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                log.validation?.status === 'valid'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : log.validation?.status === 'invalid'
                                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              }`}>
                                {log.validation?.status || 'pending'}
                              </span>
                              {remarks && (
                                <button
                                  onClick={() => toggleRemarks(log._id)}
                                  className="text-theme-muted hover:text-theme-bright transition-colors cursor-pointer"
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
                                  className="inline-flex items-center gap-1 text-theme-muted hover:text-theme-bright bg-theme-card-hover border border-theme-border text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                  Close
                                </button>
                              ) : (
                                <button
                                  onClick={() => setOvertimeFormFor(log._id)}
                                  className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                                >
                                  <Timer className="w-3.5 h-3.5" />
                                  Request
                                </button>
                              )
                            ) : otRequest ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                otRequest.status === 'approved'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : otRequest.status === 'rejected'
                                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              }`}>
                                {otRequest.status === 'approved' && 'Approved ✓'}
                                {otRequest.status === 'rejected' && 'Rejected ✗'}
                                {otRequest.status === 'pending' && 'Pending ⌛'}
                              </span>
                            ) : alreadyRequested ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Pending ⌛
                              </span>
                            ) : (
                              <span className="text-theme-muted text-xs">—</span>
                            )}
                          </td>
                        </tr>

                        {/* Remarks expand row */}
                        {remarks && expandedRemarks.has(log._id) && (
                          <tr className="bg-theme-bg/50">
                            <td colSpan={7} className="px-5 pb-3 pt-0">
                              <p className="text-xs text-theme-muted italic bg-theme-card border border-theme-border rounded-lg px-4 py-2.5">
                                <span className="text-theme-muted not-italic font-semibold mr-1">Remarks:</span>
                                {remarks}
                              </p>
                            </td>
                          </tr>
                        )}

                        {/* Overtime request form row */}
                        {hasOvertimeForm && (
                          <tr className="bg-theme-bg/30">
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

            {/* Mobile Card List */}
            <div className="lg:hidden space-y-4">
              {logs.map((log) => {
                const isCompleted = log.completionStatus === 'completed';
                const otRequest = log.overtimeRequest;
                const alreadyRequested = submittedOvertimeIds.has(log._id) || !!otRequest;
                const hasOvertimeForm = overtimeFormFor === log._id;
                const remarks = log.validation?.remarks;

                return (
                  <div key={log._id} className="bg-theme-bg/25 border border-theme-border rounded-xl p-4 space-y-4 transition-colors duration-200">
                    {/* Date & Completion Status */}
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-theme-bright text-sm">{formatDate(log.date)}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {log.completionStatus || 'incomplete'}
                      </span>
                    </div>

                    {/* Punch Details Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-theme-muted block mb-0.5 font-medium">Punch In:</span>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-theme-text inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            {getFirstPunchIn(log.punches) ? formatTime(getFirstPunchIn(log.punches)) : '-'}
                          </span>
                          {log.arrivalStatus === 'late' ? (
                            <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Late</span>
                          ) : log.arrivalStatus === 'on-time' ? (
                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">On-Time</span>
                          ) : null}
                        </div>
                      </div>
                      <div>
                        <span className="text-theme-muted block mb-0.5 font-medium">Punch Out:</span>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-theme-text inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                            {getLastPunchOut(log.punches) ? formatTime(getLastPunchOut(log.punches)) : '-'}
                          </span>
                          {log.departureStatus === 'early-departure' ? (
                            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Early Leave</span>
                          ) : log.departureStatus === 'regular' ? (
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Regular</span>
                          ) : null}
                        </div>
                      </div>
                      <div>
                        <span className="text-theme-muted block mb-0.5 font-medium">Working Hours:</span>
                        <span className="font-mono font-semibold text-theme-bright">
                          {log.workingHours ? `${log.workingHours.toFixed(2)}h` : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-theme-muted block mb-0.5 font-medium">Validation:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          log.validation?.status === 'valid'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : log.validation?.status === 'invalid'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {log.validation?.status || 'pending'}
                        </span>
                      </div>
                    </div>

                    {/* Collapsible Remarks */}
                    {remarks && (
                      <div className="bg-theme-card border border-theme-border/60 rounded-lg p-2.5 text-xs">
                        <span className="font-semibold text-theme-muted block mb-1">Manager Remarks:</span>
                        <p className="text-theme-text italic">"{remarks}"</p>
                      </div>
                    )}

                    {/* Overtime Request Console */}
                    <div className="border-t border-theme-border/60 pt-3 flex justify-between items-center text-xs">
                      <span className="text-theme-muted font-medium">Overtime:</span>
                      <div>
                        {isCompleted && !alreadyRequested ? (
                          hasOvertimeForm ? (
                            <button
                              onClick={() => setOvertimeFormFor(null)}
                              className="inline-flex items-center gap-1 text-theme-muted hover:text-theme-bright bg-theme-card hover:bg-theme-card-hover border border-theme-border px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                              Close Form
                            </button>
                          ) : (
                            <button
                              onClick={() => setOvertimeFormFor(log._id)}
                              className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-3.5 py-1.5 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                            >
                              <Timer className="w-3.5 h-3.5" />
                              Request Overtime
                            </button>
                          )
                        ) : otRequest ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            otRequest.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : otRequest.status === 'rejected'
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}>
                            {otRequest.status === 'approved' && 'Approved ✓'}
                            {otRequest.status === 'rejected' && 'Rejected ✗'}
                            {otRequest.status === 'pending' && 'Pending ⌛'}
                          </span>
                        ) : alreadyRequested ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Pending ⌛
                          </span>
                        ) : (
                          <span className="text-theme-muted">—</span>
                        )}
                      </div>
                    </div>

                    {/* Overtime Form */}
                    {hasOvertimeForm && (
                      <div className="border-t border-theme-border/60 pt-3">
                        <OvertimeRequestForm
                          attendanceId={log._id}
                          onSuccess={() => handleOvertimeSuccess(log._id)}
                          onCancel={() => setOvertimeFormFor(null)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
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
