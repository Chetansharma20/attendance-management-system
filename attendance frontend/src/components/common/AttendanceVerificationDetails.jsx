import React from 'react';
import { Camera, MapPin, ExternalLink } from 'lucide-react';

export default function AttendanceVerificationDetails({ log, isExpanded, colSpan }) {
  if (!isExpanded) return null;

  return (
    <tr className="bg-theme-bg/30">
      <td colSpan={colSpan} className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-theme-card border border-theme-border rounded-xl transition-colors duration-200">
          
          {/* Punch In Verification */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              Punch In Verification
            </h4>
            {log.punchIn?.selfieUrl ? (
              <div className="relative w-48 aspect-[4/3] rounded-lg overflow-hidden border border-theme-border bg-black group">
                <img
                  src={log.punchIn.selfieUrl}
                  alt="Punch In Selfie"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ) : (
              <p className="text-xs text-theme-muted italic">No selfie captured.</p>
            )}
            {log.punchIn?.location?.latitude ? (
              <div className="flex items-center gap-2 text-xs text-theme-text font-mono">
                <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>
                  {log.punchIn.location.latitude.toFixed(6)}, {log.punchIn.location.longitude.toFixed(6)}
                </span>
                <a
                  href={`https://www.google.com/maps?q=${log.punchIn.location.latitude},${log.punchIn.location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-655 dark:text-violet-400 hover:text-violet-500 inline-flex items-center gap-0.5 ml-1 transition-colors"
                  title="Open in Google Maps"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <p className="text-xs text-theme-muted italic">No GPS coordinates captured.</p>
            )}
          </div>

          {/* Punch Out Verification */}
          <div className="space-y-3 border-t md:border-t-0 md:border-l border-theme-border pt-4 md:pt-0 md:pl-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              Punch Out Verification
            </h4>
            {log.punchOut?.selfieUrl ? (
              <div className="relative w-48 aspect-[4/3] rounded-lg overflow-hidden border border-theme-border bg-black group">
                <img
                  src={log.punchOut.selfieUrl}
                  alt="Punch Out Selfie"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ) : (
              <p className="text-xs text-theme-muted italic">No selfie captured.</p>
            )}
            {log.punchOut?.location?.latitude ? (
              <div className="flex items-center gap-2 text-xs text-theme-text font-mono">
                <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>
                  {log.punchOut.location.latitude.toFixed(6)}, {log.punchOut.location.longitude.toFixed(6)}
                </span>
                <a
                  href={`https://www.google.com/maps?q=${log.punchOut.location.latitude},${log.punchOut.location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-655 dark:text-violet-400 hover:text-violet-500 inline-flex items-center gap-0.5 ml-1 transition-colors"
                  title="Open in Google Maps"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <p className="text-xs text-theme-muted italic">No GPS coordinates captured.</p>
            )}
          </div>

        </div>
      </td>
    </tr>
  );
}
