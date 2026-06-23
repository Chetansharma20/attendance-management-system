import React, { useState } from 'react';
import { useGetAllAttendanceQuery, useValidateAttendanceMutation } from '../../redux/api/attendanceApi.js';
import { Calendar, RefreshCw, AlertCircle, UserCheck, X, ExternalLink } from 'lucide-react';
import DailyReportModal from '../common/DailyReportModal.jsx';
import Pagination from '../common/Pagination.jsx';
import AttendanceVerificationDetails from '../common/AttendanceVerificationDetails.jsx';

export default function AttendanceLogs() {
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: attendanceResponse,
    isLoading: isAttendanceLoading,
    isError: isAttendanceError,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useGetAllAttendanceQuery({ page: currentPage, limit: 10 });

  const [expandedRows, setExpandedRows] = useState(new Set());
  const [validatingRow, setValidatingRow] = useState({ id: null, status: null });
  const [remarks, setRemarks] = useState('');
  // Optimistic: track IDs being validated so buttons hide immediately on confirm
  const [pendingValidations, setPendingValidations] = useState(new Set());
  const [isReportOpen, setIsReportOpen] = useState(false);

  const [validateAttendance, { isLoading: isValidating }] = useValidateAttendanceMutation();

  const attendanceLogs = attendanceResponse?.data?.attendances || [];
  const pagination = attendanceResponse?.data?.pagination;

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

  const getFirstPunchIn = (punches) => {
    if (!punches || punches.length === 0) return null;
    const firstIn = punches.find((p) => p.type === 'in');
    return firstIn ? firstIn.time : null;
  };

  const getLastPunchOut = (punches) => {
    if (!punches || punches.length === 0) return null;
    for (let i = punches.length - 1; i >= 0; i--) {
      if (punches[i].type === 'out') {
        return punches[i].time;
      }
    }
    return null;
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
    <section className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl space-y-6 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-theme-bright">Attendance Records</h2>
            <p className="text-xs text-theme-muted">All clock-in and clock-out activities</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsReportOpen(true)}
            className="inline-flex items-center gap-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/20 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Report</span>
          </button>
          <button
            onClick={refetchAttendance}
            className="p-2 text-theme-muted hover:text-theme-bright hover:bg-theme-card-hover rounded-lg transition-colors cursor-pointer"
            title="Refresh attendance"
          >
            <RefreshCw className={`w-4 h-4 ${isAttendanceLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isAttendanceLoading ? (
        <div className="py-12 flex justify-center items-center">
          <span className="w-8 h-8 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : isAttendanceError ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Failed to load attendance logs</p>
            <p className="text-xs text-theme-muted">{attendanceError?.data?.message || attendanceError?.error || 'Unknown error'}</p>
          </div>
        </div>
      ) : attendanceLogs.length === 0 ? (
        <div className="py-12 text-center text-theme-muted text-sm">No attendance logs recorded yet.</div>
      ) : (
        <>
          <div className="hidden lg:block overflow-x-auto rounded-xl border border-theme-border bg-theme-bg/30">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-theme-border text-xs font-semibold text-theme-muted uppercase tracking-wider bg-theme-card-hover/50">
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
              <tbody className="divide-y divide-theme-border/60 text-sm">
                {attendanceLogs.map((log) => {
                  const empName = log.employeeId?.name || 'Unknown User';
                  const empEmail = log.employeeId?.email || '';
                  const isExpanded = expandedRows.has(log._id);

                  return (
                    <React.Fragment key={log._id}>
                      <tr className="hover:bg-theme-card-hover/50 transition-colors">
                        <td className="py-4 px-5">
                          <p className="font-medium text-theme-bright">{empName}</p>
                          <p className="text-xs text-theme-muted">{empEmail}</p>
                        </td>
                        <td className="py-4 px-5 text-theme-text">{formatDate(log.date)}</td>
                        <td className="py-4 px-5 font-mono text-theme-text text-xs">
                          <div className="flex flex-col gap-0.5">
                            <span>{formatTime(getFirstPunchIn(log.punches))}</span>
                            {log.arrivalStatus === 'late' ? (
                              <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider block">Late</span>
                            ) : log.arrivalStatus === 'on-time' ? (
                              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider block">On-Time</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-4 px-5 font-mono text-theme-text text-xs">
                          <div className="flex flex-col gap-0.5">
                            <span>{formatTime(getLastPunchOut(log.punches))}</span>
                            {log.departureStatus === 'early-departure' ? (
                              <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider block">Early Leave</span>
                            ) : log.departureStatus === 'regular' ? (
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Regular</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-4 px-5 text-theme-bright font-medium font-mono">
                          {log.workingHours ? `${log.workingHours.toFixed(2)}h` : '-'}
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                            log.completionStatus === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}>
                            {log.completionStatus || 'incomplete'}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            log.validation?.status === 'valid'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : log.validation?.status === 'invalid'
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}>
                            {log.validation?.status || 'pending'}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-center">
                          <button
                            onClick={() => toggleExpand(log._id)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                              isExpanded
                                ? 'bg-theme-card-hover text-theme-bright border-theme-border'
                                : 'bg-theme-card text-theme-text border-theme-border hover:bg-theme-card-hover hover:text-theme-bright'
                            }`}
                          >
                            {isExpanded ? 'Hide' : 'View Details'}
                          </button>
                        </td>
                        <td className="py-4 px-5 text-center">
                          {log.validation?.status === 'pending' ? (
                            validatingRow.id === log._id ? (
                              <div className="flex flex-col gap-2 min-w-[200px] bg-theme-card border border-theme-border p-2 rounded-lg shadow-lg mx-auto align-middle">
                                <input
                                  type="text"
                                  value={remarks}
                                  onChange={(e) => setRemarks(e.target.value)}
                                  placeholder={validatingRow.status === 'valid' ? "Remarks (optional)..." : "Reason for rejection..."}
                                  className="w-full bg-theme-bg border border-theme-input-border rounded px-2 py-1 text-xs text-theme-bright focus:outline-none focus:border-violet-500"
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => {
                                      setValidatingRow({ id: null, status: null });
                                      setRemarks('');
                                    }}
                                    className="text-[10px] text-theme-muted hover:text-theme-bright px-2 py-1 bg-theme-card-hover rounded transition-colors cursor-pointer"
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
                            <span className="text-theme-muted text-xs">-</span>
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

          {/* Mobile Card List */}
          <div className="lg:hidden space-y-4">
            {attendanceLogs.map((log) => {
              const empName = log.employeeId?.name || 'Unknown User';
              const empEmail = log.employeeId?.email || '';
              const isExpanded = expandedRows.has(log._id);
              const isPending = log.validation?.status === 'pending' && !pendingValidations.has(log._id);

              return (
                <div key={log._id} className="bg-theme-bg/20 border border-theme-border rounded-xl p-4 space-y-4 transition-colors duration-200">
                  {/* Header: Name, Email & Date */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-semibold text-theme-bright text-sm">{empName}</p>
                      <p className="text-xs text-theme-muted">{empEmail}</p>
                    </div>
                    <span className="text-xs font-semibold text-theme-muted bg-theme-card px-2.5 py-1 rounded-lg border border-theme-border whitespace-nowrap">
                      {formatDate(log.date)}
                    </span>
                  </div>

                  {/* Stats/Badges Row */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-theme-muted block mb-0.5 font-medium">Punch In:</span>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-theme-text">{formatTime(getFirstPunchIn(log.punches))}</span>
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
                        <span className="font-mono text-theme-text">{formatTime(getLastPunchOut(log.punches))}</span>
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
                    <div className="space-y-1">
                      <span className="text-theme-muted block font-medium">Status:</span>
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        log.completionStatus === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {log.completionStatus || 'incomplete'}
                      </span>
                    </div>
                  </div>

                  {/* Validation Row */}
                  <div className="flex items-center justify-between border-t border-theme-border/60 pt-3">
                    <div>
                      <span className="text-theme-muted text-xs mr-2 font-medium">Validation:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        log.validation?.status === 'valid'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : log.validation?.status === 'invalid'
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {log.validation?.status || 'pending'}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => toggleExpand(log._id)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        isExpanded
                          ? 'bg-theme-card-hover text-theme-bright border-theme-border'
                          : 'bg-theme-card text-theme-text border-theme-border hover:bg-theme-card-hover hover:text-theme-bright'
                      }`}
                    >
                      {isExpanded ? 'Hide Details' : 'Verify Details'}
                    </button>
                  </div>

                  {/* Collapsible Details */}
                  {isExpanded && (
                    <div className="bg-theme-card border border-theme-border rounded-lg p-3 space-y-3">
                      <p className="text-xs font-bold text-violet-650 dark:text-violet-400 uppercase tracking-wider border-b border-theme-border/20 pb-1">Verification History ({log.punches?.length || 0})</p>
                      {(log.punches || []).map((punch, idx) => (
                        <div key={idx} className="space-y-2 text-xs border-b border-theme-border/10 pb-2.5 last:border-b-0 last:pb-0">
                          <p className="font-bold text-theme-bright">Punch {punch.type === 'in' ? 'In' : 'Out'} {formatTime(punch.time)}</p>
                          {punch.selfieUrl ? (
                            <img src={punch.selfieUrl} alt={`Selfie ${idx}`} className="w-24 aspect-[4/3] object-cover rounded border border-theme-border my-1" />
                          ) : (
                            <p className="text-[10px] text-theme-muted italic">No selfie captured.</p>
                          )}
                          {punch.location?.latitude ? (
                            <div className="flex items-center gap-1 font-mono text-theme-muted text-[10px]">
                              <span>{punch.location.latitude.toFixed(6)}, {punch.location.longitude.toFixed(6)}</span>
                              <a href={`https://www.google.com/maps?q=${punch.location.latitude},${punch.location.longitude}`} target="_blank" rel="noopener noreferrer" className="text-violet-650 dark:text-violet-400"><ExternalLink className="w-3 h-3" /></a>
                            </div>
                          ) : (
                            <p className="text-[10px] text-theme-muted italic">No GPS coordinates.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions Panel */}
                  {isPending && (
                    <div className="border-t border-theme-border/60 pt-3">
                      {validatingRow.id === log._id ? (
                        <div className="flex flex-col gap-2 bg-theme-card border border-theme-border p-2 rounded-lg shadow-lg">
                          <input
                            type="text"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder={validatingRow.status === 'valid' ? "Remarks (optional)..." : "Reason for rejection..."}
                            className="w-full bg-theme-bg border border-theme-input-border rounded px-2 py-1 text-xs text-theme-bright focus:outline-none focus:border-violet-500"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                setValidatingRow({ id: null, status: null });
                                setRemarks('');
                              }}
                              className="text-xs text-theme-muted hover:text-theme-bright px-2.5 py-1 bg-theme-card-hover rounded transition-colors cursor-pointer"
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
                              className={`text-xs text-white font-bold px-2.5 py-1 rounded transition-all cursor-pointer ${
                                validatingRow.status === 'valid' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-650 hover:bg-red-500'
                              }`}
                            >
                              Confirm
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setValidatingRow({ id: log._id, status: 'valid' });
                              setRemarks('');
                            }}
                            disabled={isValidating}
                            className="flex-1 inline-flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/40 text-white font-semibold text-xs py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
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
                            className="flex-1 inline-flex items-center justify-center gap-1 bg-red-650/80 hover:bg-red-600 text-white font-semibold text-xs py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={pagination?.totalPages || 1}
            onPageChange={setCurrentPage}
            totalItems={pagination?.total}
            limit={pagination?.limit}
          />
        </>
      )}

      <DailyReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        logs={attendanceLogs}
        title="All Attendance Daily Report"
      />
    </section>
  );
}
