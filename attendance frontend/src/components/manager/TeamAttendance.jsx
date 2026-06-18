import React, { useState } from 'react';
import { useGetTeamAttendanceQuery, useValidateAttendanceMutation } from '../../redux/api/attendanceApi.js';
import { Users, RefreshCw, AlertCircle, UserCheck, X, Calendar } from 'lucide-react';
import DailyReportModal from '../common/DailyReportModal.jsx';
import AttendanceVerificationDetails from '../common/AttendanceVerificationDetails.jsx';

export default function TeamAttendance() {
  const {
    data: teamAttendanceResponse,
    isLoading: isTeamAttendanceLoading,
    isError: isTeamAttendanceError,
    error: teamAttendanceError,
    refetch: refetchTeamAttendance,
  } = useGetTeamAttendanceQuery();

  const [validateAttendance, { isLoading: isValidating }] = useValidateAttendanceMutation();

  const [expandedRows, setExpandedRows] = useState(new Set());
  const [validatingRow, setValidatingRow] = useState({ id: null, status: null });
  const [remarks, setRemarks] = useState('');
  // Optimistic: track IDs being validated so buttons hide immediately on confirm
  const [pendingValidations, setPendingValidations] = useState(new Set());
  const [isReportOpen, setIsReportOpen] = useState(false);

  const teamAttendance = teamAttendanceResponse?.data || [];

  const toggleExpand = (id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleValidate = async (attendanceId, status, remarks = '') => {
    // Optimistically hide buttons immediately
    setPendingValidations((prev) => new Set(prev).add(attendanceId));
    setValidatingRow({ id: null, status: null });
    setRemarks('');
    try {
      await validateAttendance({ attendanceId, status, remarks }).unwrap();
    } catch (err) {
      // Revert optimistic update on failure
      setPendingValidations((prev) => {
        const next = new Set(prev);
        next.delete(attendanceId);
        return next;
      });
      alert(err?.data?.message || err?.error || 'Validation failed');
    }
  };

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper to format time
  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    return new Date(timeStr).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Team Attendance</h2>
            <p className="text-xs text-slate-400">Track and validate your team's check-ins</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsReportOpen(true)}
            className="inline-flex items-center gap-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/20 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Report</span>
          </button>
          <button
            onClick={refetchTeamAttendance}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Refresh team attendance"
          >
            <RefreshCw className={`w-4 h-4 ${isTeamAttendanceLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isTeamAttendanceLoading ? (
        <div className="py-12 flex justify-center items-center">
          <span className="w-8 h-8 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : isTeamAttendanceError ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Failed to load team attendance</p>
            <p className="text-xs text-slate-400">{teamAttendanceError?.data?.message || teamAttendanceError?.error || 'Unknown error'}</p>
          </div>
        </div>
      ) : teamAttendance.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">No team member attendance logs recorded.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-slate-950/40">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/30">
                <th className="py-4 px-5 w-1/4">Employee</th>
                <th className="py-4 px-5 w-[11%]">Date</th>
                <th className="py-4 px-5 w-[11%]">Punch In</th>
                <th className="py-4 px-5 w-[11%]">Punch Out</th>
                <th className="py-4 px-5 w-[8%]">Hours</th>
                <th className="py-4 px-5 w-[11%]">Status</th>
                <th className="py-4 px-5 w-[11%]">Validation</th>
                <th className="py-4 px-5 w-[6%] text-center">Verify</th>
                <th className="py-4 px-5 w-[6%] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-sm">
              {teamAttendance.map((log) => {
                const empName = log.employeeId?.name || 'Unknown User';
                const empEmail = log.employeeId?.email || '';
                const isPending = log.validation?.status === 'pending' && !pendingValidations.has(log._id);
                const isExpanded = expandedRows.has(log._id);

                return (
                  <React.Fragment key={log._id}>
                    <tr className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-4 px-5">
                        <p className="font-medium text-white">{empName}</p>
                        <p className="text-xs text-slate-400">{empEmail}</p>
                      </td>
                      <td className="py-4 px-5 text-slate-300">{formatDate(log.date)}</td>
                      <td className="py-4 px-5 font-mono text-slate-300 text-xs">{formatTime(log.punchIn?.time)}</td>
                      <td className="py-4 px-5 font-mono text-slate-300 text-xs">{formatTime(log.punchOut?.time)}</td>
                      <td className="py-4 px-5 text-slate-200 font-medium font-mono">
                        {log.workingHours ? `${log.workingHours.toFixed(2)}h` : '-'}
                      </td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                          log.completionStatus === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {log.completionStatus || 'incomplete'}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          log.validation?.status === 'valid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : log.validation?.status === 'invalid'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {log.validation?.status || 'pending'}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <button
                          onClick={() => toggleExpand(log._id)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                            isExpanded
                              ? 'bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {isExpanded ? 'Hide' : 'View Details'}
                        </button>
                      </td>
                      <td className="py-4 px-5 text-center">
                        {isPending ? (
                          validatingRow.id === log._id ? (
                            <div className="flex flex-col gap-2 min-w-[200px] bg-slate-900 border border-slate-800 p-2 rounded-lg shadow-lg mx-auto align-middle">
                              <input
                                type="text"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder={validatingRow.status === 'valid' ? "Remarks (optional)..." : "Reason for rejection..."}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-violet-500"
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => {
                                    setValidatingRow({ id: null, status: null });
                                    setRemarks('');
                                  }}
                                  className="text-[10px] text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={async () => {
                                    if (validatingRow.status === 'invalid' && !remarks.trim()) {
                                      alert("Please enter a remark.");
                                      return;
                                    }
                                    await handleValidate(log._id, validatingRow.status, remarks.trim());
                                  }}
                                  disabled={isValidating}
                                  className={`text-[10px] text-white font-bold px-2 py-1 rounded transition-all cursor-pointer ${
                                    validatingRow.status === 'valid' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                                  }`}
                                >
                                  Confirm
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setValidatingRow({ id: log._id, status: 'valid' });
                                  setRemarks('');
                                }}
                                disabled={isValidating}
                                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/40 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
                                title="Approve as Valid"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => {
                                  setValidatingRow({ id: log._id, status: 'invalid' });
                                  setRemarks('');
                                }}
                                disabled={isValidating}
                                className="inline-flex items-center gap-1 bg-red-600/80 hover:bg-red-600 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
                                title="Reject as Invalid"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          )
                        ) : (
                          <span className="text-slate-500 text-xs">-</span>
                        )}
                      </td>
                    </tr>

                    <AttendanceVerificationDetails
                      log={log}
                      isExpanded={isExpanded}
                      colSpan={9}
                    />
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <DailyReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        logs={teamAttendance}
        title="Team Attendance Daily Report"
      />
    </section>
  );
}
