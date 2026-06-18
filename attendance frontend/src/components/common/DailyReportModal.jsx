import React, { useState, useMemo } from 'react';
import { Calendar, Download, X, MapPin, Camera, ExternalLink, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useDownloadDailyReportMutation } from '../../redux/api/attendanceApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">

      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-850 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-violet-400" />
            <h3 className="text-lg font-bold text-white">Generate Daily Report</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Selector Console */}
        <div className="px-6 py-4 bg-slate-950/30 border-b border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-slate-300">Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
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
        <div className="flex-1 overflow-y-auto p-6" id="printable-report-area">
          
          {/* Printable Report Header Block */}
          <div className="mb-6 space-y-1">
            <h1 className="text-2xl font-extrabold text-white print:text-black tracking-tight">{title}</h1>
            <p className="text-sm font-bold text-violet-400 print:text-slate-700">
              Report Date: {formatDateLabel(selectedDate)}
            </p>
            {isSingleEmployee && employeeName && (
              <p className="text-xs text-slate-400 print:text-slate-600">Employee: <span className="font-semibold">{employeeName}</span></p>
            )}
            <p className="text-[10px] text-slate-500 print:text-slate-400 uppercase tracking-widest pt-1">
              Generated on {new Date().toLocaleString()}
            </p>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/20 no-print">
              <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No attendance records found for this date.</p>
              <p className="text-slate-500 text-xs mt-1">Please select another date from the controls above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-none bg-slate-950/20">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/40 print:bg-slate-100">
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
                <tbody className="divide-y divide-slate-850 text-sm">
                  {filteredLogs.map((log) => {
                    const empName = log.employeeId?.name || employeeName || 'Unknown';
                    const empEmail = log.employeeId?.email || '';

                    return (
                      <tr key={log._id} className="hover:bg-slate-900/20 transition-colors">

                        {/* Employee Name & Email */}
                        {!isSingleEmployee && (
                          <td className="py-4 px-4 align-middle">
                            <p className="font-semibold text-white print:text-black">{empName}</p>
                            <p className="text-xs text-slate-400 print:text-slate-600">{empEmail}</p>
                          </td>
                        )}

                        {/* Punch In Time */}
                        <td className="py-4 px-4 align-middle font-mono text-xs text-slate-300 print:text-black">
                          {log.punchIn?.time ? new Date(log.punchIn.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>

                        {/* Punch In Selfie */}
                        <td className="py-4 px-4 align-middle text-center">
                          {log.punchIn?.selfieUrl ? (
                            <img
                              src={log.punchIn.selfieUrl}
                              alt="In Selfie"
                              className="w-16 h-12 object-cover rounded border border-slate-800 mx-auto"
                            />
                          ) : (
                            <span className="text-xs text-slate-500 italic">-</span>
                          )}
                        </td>

                        {/* Punch In Location */}
                        <td className="py-4 px-4 align-middle text-xs font-mono text-slate-300 print:text-black">
                          {log.punchIn?.location?.latitude ? (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0 print:hidden" />
                              <span>{log.punchIn.location.latitude.toFixed(4)}, {log.punchIn.location.longitude.toFixed(4)}</span>
                              <a
                                href={`https://www.google.com/maps?q=${log.punchIn.location.latitude},${log.punchIn.location.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-violet-400 hover:text-violet-300 inline-flex items-center gap-0.5 ml-1 transition-colors print:hidden"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          ) : (
                            <span className="italic text-slate-500">-</span>
                          )}
                        </td>

                        {/* Punch Out Time */}
                        <td className="py-4 px-4 align-middle font-mono text-xs text-slate-300 print:text-black">
                          {log.punchOut?.time ? new Date(log.punchOut.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>

                        {/* Punch Out Selfie */}
                        <td className="py-4 px-4 align-middle text-center">
                          {log.punchOut?.selfieUrl ? (
                            <img
                              src={log.punchOut.selfieUrl}
                              alt="Out Selfie"
                              className="w-16 h-12 object-cover rounded border border-slate-800 mx-auto"
                            />
                          ) : (
                            <span className="text-xs text-slate-500 italic">-</span>
                          )}
                        </td>

                        {/* Punch Out Location */}
                        <td className="py-4 px-4 align-middle text-xs font-mono text-slate-300 print:text-black">
                          {log.punchOut?.location?.latitude ? (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0 print:hidden" />
                              <span>{log.punchOut.location.latitude.toFixed(4)}, {log.punchOut.location.longitude.toFixed(4)}</span>
                              <a
                                href={`https://www.google.com/maps?q=${log.punchOut.location.latitude},${log.punchOut.location.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-violet-400 hover:text-violet-300 inline-flex items-center gap-0.5 ml-1 transition-colors print:hidden"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          ) : (
                            <span className="italic text-slate-500">-</span>
                          )}
                        </td>

                        {/* Working Hours */}
                        <td className="py-4 px-4 align-middle text-right font-mono font-semibold text-slate-200 print:text-black">
                          {log.workingHours ? `${log.workingHours.toFixed(2)}h` : '-'}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 align-middle text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${log.completionStatus === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
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
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-850 bg-slate-900/30 flex justify-end no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold tracking-wide transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
