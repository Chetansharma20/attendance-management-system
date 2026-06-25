import React from 'react';
import { Camera, MapPin, ExternalLink } from 'lucide-react';
import { AttendanceLogItem } from './DailyReportModal';

interface AttendanceVerificationDetailsProps {
  log: AttendanceLogItem;
  isExpanded: boolean;
  colSpan: number;
}

export default function AttendanceVerificationDetails({ log, isExpanded, colSpan }: AttendanceVerificationDetailsProps) {
  if (!isExpanded) return null;

  const punchesList = log.punches || [];

  return (
    <tr className="bg-theme-bg/30">
      <td colSpan={colSpan} className="px-6 py-4">
        <div className="p-5 bg-theme-card border border-theme-border rounded-xl transition-colors duration-200 space-y-4">
          <div className="border-b border-theme-border pb-2">
            <h4 className="text-sm font-bold text-violet-600 dark:text-violet-400 flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Verification History ({punchesList.length} Activity Log{punchesList.length !== 1 ? 's' : ''})
            </h4>
            <p className="text-[10px] text-theme-muted mt-0.5">Timeline of all punch actions and geofence verification data recorded today</p>
          </div>

          {punchesList.length === 0 ? (
            <p className="text-xs text-theme-muted italic">No punches recorded for this day.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {punchesList.map((punch, idx) => {
                const sessionNum = Math.floor(idx / 2) + 1;
                const isPunchIn = punch.type === 'in';
                return (
                  <div key={idx} className="space-y-3 p-4 bg-theme-bg/20 rounded-xl border border-theme-border/40 transition-colors">
                    <div className="flex justify-between items-center border-b border-theme-border/20 pb-1.5">
                      <h5 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isPunchIn ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        Punch {isPunchIn ? 'In' : 'Out'} {punchesList.length > 2 ? `#${sessionNum}` : ''}
                      </h5>
                      <span className="text-xs font-mono font-bold text-theme-bright">
                        {new Date(punch.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    {punch.selfieUrl ? (
                      <div className="relative w-48 aspect-[4/3] rounded-lg overflow-hidden border border-theme-border bg-black group">
                        <img
                          src={punch.selfieUrl}
                          alt={`Selfie ${idx}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-theme-muted italic">No selfie captured.</p>
                    )}

                    {punch.location?.latitude ? (
                      <div className="flex items-center gap-2 text-xs text-theme-text font-mono">
                        <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                        <span>
                          {punch.location.latitude.toFixed(6)}, {punch.location.longitude.toFixed(6)}
                        </span>
                        <a
                          href={`https://www.google.com/maps?q=${punch.location.latitude},${punch.location.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-650 dark:text-violet-400 hover:text-violet-500 inline-flex items-center gap-0.5 ml-1 transition-colors"
                          title="Open in Google Maps"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-theme-muted italic">No GPS coordinates captured.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
