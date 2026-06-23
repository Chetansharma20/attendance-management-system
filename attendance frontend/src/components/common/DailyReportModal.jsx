import React, { useState, useMemo } from 'react';
import { Calendar, Download, X, MapPin, ExternalLink, Loader2 } from 'lucide-react';
import { useDownloadDailyReportMutation } from '../../redux/api/attendanceApi';

export default function DailyReportModal({ isOpen, onClose, logs, title, isSingleEmployee = false, employeeName = "" }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [isDownloading, setIsDownloading] = useState(false);

  // Filter logs for the selected date (matching year, month, and day)
  const filteredLogs = useMemo(() => {
    if (!selectedDate) return [];
    return logs.filter((log) => {
      if (!log.date) return false;
      const logDateStr = new Date(log.date).toISOString().split('T')[0];
      return logDateStr === selectedDate;
    });
  }, [logs, selectedDate]);

  const [downloadDailyPdf] = useDownloadDailyReportMutation();

  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const blob = await downloadDailyPdf(selectedDate).unwrap();

      // Create a blob URL and click it to download the file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `daily-attendance-report-${selectedDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to generate and download PDF report.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getFirstPunchInObj = (punches) => {
    if (!punches || punches.length === 0) return null;
    return punches.find(p => p.type === 'in') || null;
  };

  const getLastPunchOutObj = (punches) => {
    if (!punches || punches.length === 0) return null;
    for (let i = punches.length - 1; i >= 0; i--) {
      if (punches[i].type === 'out') {
        return punches[i];
      }
    }
    return null;
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-slate-950/85 backdrop-blur-sm transition-colors duration-200">

      {/* Modal Container */}
      <div className="bg-theme-card border border-theme-border rounded-2xl max-w-5xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden transition-colors duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border bg-theme-bg/30">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-violet-650 dark:text-violet-400" />
            <h3 className="text-lg font-bold text-theme-bright">Generate Daily Report</h3>
          </div>
          <button
            onClick={onClose}
            className="text-theme-muted hover:text-theme-bright p-1 hover:bg-theme-card-hover rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Selector Console */}
        <div className="px-6 py-4 bg-theme-bg/50 border-b border-theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-theme-text">Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-theme-card border border-theme-input-border rounded-xl px-3 py-2 text-sm text-theme-bright focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={filteredLogs.length === 0 || isDownloading}
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>

        {/* Printable & Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-theme-bg/10" id="printable-report-area">
          
          {/* Printable Report Header Block */}
          <div className="mb-6 space-y-1">
            <h1 className="text-2xl font-extrabold text-theme-bright print:text-black tracking-tight">{title}</h1>
            <p className="text-sm font-bold text-violet-600 dark:text-violet-400 print:text-slate-700">
              Report Date: {formatDateLabel(selectedDate)}
            </p>
            {isSingleEmployee && employeeName && (
              <p className="text-xs text-theme-muted print:text-slate-600">Employee: <span className="font-semibold text-theme-text">{employeeName}</span></p>
            )}
            <p className="text-[10px] text-theme-muted print:text-slate-450 uppercase tracking-widest pt-1">
              Generated on {new Date().toLocaleString()}
            </p>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-theme-border rounded-xl bg-theme-bg/20 no-print">
              <Calendar className="w-12 h-12 text-theme-muted mx-auto mb-3" />
              <p className="text-theme-muted text-sm">No attendance records found for this date.</p>
              <p className="text-theme-muted/70 text-xs mt-1">Please select another date from the controls above.</p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block print:block overflow-x-auto rounded-xl border border-theme-border print:border-none bg-theme-bg/25">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-theme-border text-xs font-semibold text-theme-muted uppercase tracking-wider bg-theme-card-hover/50 print:bg-slate-100">
                      {!isSingleEmployee && <th className="py-3 px-4">Employee</th>}
                      <th className="py-3 px-4">Punch In</th>
                      <th className="py-3 px-4 text-center">In Selfie</th>
                      <th className="py-3 px-4">In Location</th>
                      <th className="py-3 px-4">Punch Out</th>
                      <th className="py-3 px-4 text-center">Out Selfie</th>
                      <th className="py-3 px-4">Out Location</th>
                      <th className="py-3 px-4 text-right">Hours</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border/60 text-sm">
                    {filteredLogs.map((log) => {
                      const empName = log.employeeId?.name || employeeName || 'Unknown';
                      const empEmail = log.employeeId?.email || '';

                      return (
                        <tr key={log._id} className="hover:bg-theme-card-hover/30 transition-colors">

                          {/* Employee Name & Email */}
                          {!isSingleEmployee && (
                            <td className="py-4 px-4 align-middle">
                              <p className="font-semibold text-theme-bright print:text-black">{empName}</p>
                              <p className="text-xs text-theme-muted print:text-slate-650">{empEmail}</p>
                            </td>
                          )}

                          {/* Punch In Time */}
                          <td className="py-4 px-4 align-middle font-mono text-xs text-theme-text print:text-black">
                            {getFirstPunchInObj(log.punches)?.time ? new Date(getFirstPunchInObj(log.punches).time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>

                          {/* Punch In Selfie */}
                          <td className="py-4 px-4 align-middle text-center">
                            {getFirstPunchInObj(log.punches)?.selfieUrl ? (
                              <img
                                src={getFirstPunchInObj(log.punches).selfieUrl}
                                alt="In Selfie"
                                className="w-16 h-12 object-cover rounded border border-theme-border mx-auto"
                              />
                            ) : (
                              <span className="text-xs text-theme-muted italic">-</span>
                            )}
                          </td>

                          {/* Punch In Location */}
                          <td className="py-4 px-4 align-middle text-xs font-mono text-theme-text print:text-black">
                            {getFirstPunchInObj(log.punches)?.location?.latitude ? (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0 print:hidden" />
                                <span>{getFirstPunchInObj(log.punches).location.latitude.toFixed(4)}, {getFirstPunchInObj(log.punches).location.longitude.toFixed(4)}</span>
                                <a
                                  href={`https://www.google.com/maps?q=${getFirstPunchInObj(log.punches).location.latitude},${getFirstPunchInObj(log.punches).location.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-violet-650 dark:text-violet-400 hover:text-violet-500 inline-flex items-center gap-0.5 ml-1 transition-colors print:hidden"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            ) : (
                              <span className="italic text-theme-muted">-</span>
                            )}
                          </td>

                          {/* Punch Out Time */}
                          <td className="py-4 px-4 align-middle font-mono text-xs text-theme-text print:text-black">
                            {getLastPunchOutObj(log.punches)?.time ? new Date(getLastPunchOutObj(log.punches).time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>

                          {/* Punch Out Selfie */}
                          <td className="py-4 px-4 align-middle text-center">
                            {getLastPunchOutObj(log.punches)?.selfieUrl ? (
                              <img
                                src={getLastPunchOutObj(log.punches).selfieUrl}
                                alt="Out Selfie"
                                className="w-16 h-12 object-cover rounded border border-theme-border mx-auto"
                              />
                            ) : (
                              <span className="text-xs text-theme-muted italic">-</span>
                            )}
                          </td>

                          {/* Punch Out Location */}
                          <td className="py-4 px-4 align-middle text-xs font-mono text-theme-text print:text-black">
                            {getLastPunchOutObj(log.punches)?.location?.latitude ? (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0 print:hidden" />
                                <span>{getLastPunchOutObj(log.punches).location.latitude.toFixed(4)}, {getLastPunchOutObj(log.punches).location.longitude.toFixed(4)}</span>
                                <a
                                  href={`https://www.google.com/maps?q=${getLastPunchOutObj(log.punches).location.latitude},${getLastPunchOutObj(log.punches).location.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-violet-650 dark:text-violet-400 hover:text-violet-500 inline-flex items-center gap-0.5 ml-1 transition-colors print:hidden"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            ) : (
                              <span className="italic text-theme-muted">-</span>
                            )}
                          </td>

                          {/* Working Hours */}
                          <td className="py-4 px-4 align-middle text-right font-mono font-semibold text-theme-bright print:text-black">
                            {log.workingHours ? `${log.workingHours.toFixed(2)}h` : '-'}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4 align-middle text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${log.completionStatus === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              }`}>
                              {log.completionStatus || 'incomplete'}
                            </span>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="lg:hidden print:hidden space-y-4">
                {filteredLogs.map((log) => {
                  const empName = log.employeeId?.name || employeeName || 'Unknown';
                  const empEmail = log.employeeId?.email || '';

                  return (
                    <div key={log._id} className="bg-theme-bg/25 border border-theme-border rounded-xl p-4 space-y-4 transition-colors duration-200">
                      {/* Header */}
                      {!isSingleEmployee && (
                        <div className="border-b border-theme-border/60 pb-2">
                          <p className="font-semibold text-theme-bright text-sm">{empName}</p>
                          <p className="text-xs text-theme-muted">{empEmail}</p>
                        </div>
                      )}

                      {/* Overall Summary Row */}
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="text-theme-muted mr-1">Hours Worked:</span>
                          <span className="font-mono font-bold text-theme-bright">
                            {log.workingHours ? `${log.workingHours.toFixed(2)}h` : '-'}
                          </span>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          log.completionStatus === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {log.completionStatus || 'incomplete'}
                        </span>
                      </div>

                      {/* Verification blocks */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-theme-border/60">
                        {/* Punch In */}
                        <div className="space-y-1.5 text-xs">
                          <p className="font-bold text-violet-650 dark:text-violet-400 uppercase tracking-wider text-[10px]">Punch In</p>
                          <p className="font-mono text-theme-text">
                            Time: {getFirstPunchInObj(log.punches)?.time ? new Date(getFirstPunchInObj(log.punches).time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </p>
                          {getFirstPunchInObj(log.punches)?.selfieUrl ? (
                            <img src={getFirstPunchInObj(log.punches).selfieUrl} alt="In Selfie" className="w-24 aspect-[4/3] object-cover rounded border border-theme-border" />
                          ) : (
                            <p className="text-xs text-theme-muted italic">No selfie</p>
                          )}
                          {getFirstPunchInObj(log.punches)?.location?.latitude ? (
                            <div className="flex items-center gap-1 font-mono text-theme-muted text-[10px]">
                              <span>{getFirstPunchInObj(log.punches).location.latitude.toFixed(4)}, {getFirstPunchInObj(log.punches).location.longitude.toFixed(4)}</span>
                              <a href={`https://www.google.com/maps?q=${getFirstPunchInObj(log.punches).location.latitude},${getFirstPunchInObj(log.punches).location.longitude}`} target="_blank" rel="noopener noreferrer" className="text-violet-650 dark:text-violet-400 hover:text-violet-500"><ExternalLink className="w-3 h-3" /></a>
                            </div>
                          ) : (
                            <p className="text-xs text-theme-muted italic">No location</p>
                          )}
                        </div>

                        {/* Punch Out */}
                        <div className="space-y-1.5 text-xs border-t sm:border-t-0 sm:border-l border-theme-border/60 pt-3 sm:pt-0 sm:pl-3">
                          <p className="font-bold text-violet-650 dark:text-violet-400 uppercase tracking-wider text-[10px]">Punch Out</p>
                          <p className="font-mono text-theme-text">
                            Time: {getLastPunchOutObj(log.punches)?.time ? new Date(getLastPunchOutObj(log.punches).time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </p>
                          {getLastPunchOutObj(log.punches)?.selfieUrl ? (
                            <img src={getLastPunchOutObj(log.punches).selfieUrl} alt="Out Selfie" className="w-24 aspect-[4/3] object-cover rounded border border-theme-border" />
                          ) : (
                            <p className="text-xs text-theme-muted italic">No selfie</p>
                          )}
                          {getLastPunchOutObj(log.punches)?.location?.latitude ? (
                            <div className="flex items-center gap-1 font-mono text-theme-muted text-[10px]">
                              <span>{getLastPunchOutObj(log.punches).location.latitude.toFixed(4)}, {getLastPunchOutObj(log.punches).location.longitude.toFixed(4)}</span>
                              <a href={`https://www.google.com/maps?q=${getLastPunchOutObj(log.punches).location.latitude},${getLastPunchOutObj(log.punches).location.longitude}`} target="_blank" rel="noopener noreferrer" className="text-violet-650 dark:text-violet-400 hover:text-violet-500"><ExternalLink className="w-3 h-3" /></a>
                            </div>
                          ) : (
                            <p className="text-xs text-theme-muted italic">No location</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-theme-border bg-theme-bg/30 flex justify-end no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-theme-border hover:bg-theme-card-hover text-theme-muted hover:text-theme-bright rounded-xl text-xs font-semibold tracking-wide transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
