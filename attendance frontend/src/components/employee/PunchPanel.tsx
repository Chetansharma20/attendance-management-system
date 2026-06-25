import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  usePunchInMutation,
  usePunchOutMutation,
  useStartBreakMutation,
  useEndBreakMutation,
} from '../../redux/api/attendanceApi';
import VerificationCamera from './VerificationCamera';
import { Clock } from 'lucide-react';
import useCamera from '../../hooks/useCamera';
import useGps from '../../hooks/useGps';
import { RootState } from '../../redux/store';
import { AttendanceLogItem, BreakItem } from '../common/DailyReportModal';

interface PunchPanelProps {
  logs: AttendanceLogItem[];
  refetch: () => void;
}

export default function PunchPanel({ logs, refetch }: PunchPanelProps) {
  const [time, setTime] = useState<Date>(new Date());
  const [punchIn, { isLoading: isPunchingIn }] = usePunchInMutation();
  const [punchOut, { isLoading: isPunchingOut }] = usePunchOutMutation();
  const [startBreak, { isLoading: isStartingBreak }] = useStartBreakMutation();
  const [endBreak, { isLoading: isEndingBreak }] = useEndBreakMutation();

  const { user } = useSelector((state: RootState) => state.auth);
  const breakPolicy = user?.shiftId?.breakPolicy || {
    tea: { maxCount: 2, duration: 15 },
    lunch: { enabled: true, duration: 60 },
    dinner: { enabled: false, duration: 60 }
  };
  
  const {
    cameraActive,
    cameraLoading,
    cameraError,
    videoRef,
    startCamera,
    stopCamera,
    captureSelfie
  } = useCamera();

  const { gpsLoading, getCoordinates } = useGps();

  const [error, setError] = useState<string | null>(null);
  const [breakDuration, setBreakDuration] = useState<number>(0);
  const [accruedHours, setAccruedHours] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const latestLog = logs[0];
  const isLatestToday = latestLog && new Date(latestLog.date).toDateString() === new Date().toDateString();
  const isClockedIn = isLatestToday && latestLog.punches && latestLog.punches.length > 0 && latestLog.punches[latestLog.punches.length - 1].type === 'in';
  const isCompletedToday = isLatestToday && latestLog.punches && latestLog.punches.length > 0 && latestLog.punches[latestLog.punches.length - 1].type === 'out';
  const activeLog = isClockedIn ? latestLog : null;

  const activeBreak = latestLog && latestLog.breaks ? latestLog.breaks.find(b => !b.endTime) : null;
  const isOnBreak = !!activeBreak;

  const teaBreaksCount = latestLog && latestLog.breaks
    ? latestLog.breaks.filter(b => b.type === 'tea').length
    : 0;
  const isLunchTaken = latestLog && latestLog.breaks
    ? latestLog.breaks.some(b => b.type === 'lunch')
    : false;
  const isDinnerTaken = latestLog && latestLog.breaks
    ? latestLog.breaks.some(b => b.type === 'dinner')
    : false;

  useEffect(() => {
    let interval: any;
    if (isOnBreak && activeBreak) {
      const start = new Date(activeBreak.startTime).getTime();
      setBreakDuration(Math.floor((Date.now() - start) / 1000));
      interval = setInterval(() => {
        setBreakDuration(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      setBreakDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOnBreak, activeBreak]);

  // Live accrued hours and 8-hour alert trigger
  useEffect(() => {
    if (!latestLog || !latestLog.punches || latestLog.punches.length === 0) {
      setAccruedHours(0);
      return;
    }

    const updateAccrued = () => {
      let totalMs = 0;
      const punches = latestLog.punches || [];

      for (let i = 0; i < punches.length - 1; i += 2) {
        const punchInObj = punches[i];
        const punchOutObj = punches[i + 1];
        if (punchInObj.type === 'in' && punchOutObj && punchOutObj.type === 'out') {
          totalMs += new Date(punchOutObj.time).getTime() - new Date(punchInObj.time).getTime();
        }
      }

      const lastPunch = punches[punches.length - 1];
      if (lastPunch.type === 'in') {
        totalMs += Date.now() - new Date(lastPunch.time).getTime();
      }

      if (latestLog.breaks && latestLog.breaks.length > 0) {
        latestLog.breaks.forEach((b) => {
          const start = new Date(b.startTime).getTime();
          const end = b.endTime ? new Date(b.endTime).getTime() : Date.now();
          totalMs -= (end - start);
        });
      }

      const hours = Math.max(0, totalMs / (1000 * 60 * 60));
      setAccruedHours(hours);

      // Trigger 8-hour browser notification alert
      if (hours >= 8.0 && user) {
        const storageKey = `alert_8h_${user._id}_${new Date().toDateString()}`;
        if (!localStorage.getItem(storageKey)) {
          localStorage.setItem(storageKey, 'true');

          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              new Notification("Shift Completed (8 Hours)", {
                body: "You have completed 8 hours of work today. Please punch out or request overtime.",
              });
            } catch (err) {
              console.error("[Notification] Desktop trigger failed:", err);
            }
          }
        }
      }
    };

    updateAccrued();
    const interval = setInterval(updateAccrued, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [latestLog, user]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePunch = async () => {
    setError(null);
    let coords = null;
    let selfieBase64 = null;

    try {
      coords = await getCoordinates();
      selfieBase64 = captureSelfie();
      if (!selfieBase64) {
        throw new Error("Failed to capture webcam frame.");
      }

      const payload = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        selfieUrl: selfieBase64
      };

      if (isClockedIn) {
        await punchOut(payload).unwrap();
      } else {
        await punchIn(payload).unwrap();
      }

      stopCamera();
      refetch();
    } catch (err: any) {
      console.error(err);
      setError(err?.data?.message || err?.message || "An error occurred during verification.");
    }
  };

  const handleStartBreak = async (breakType: 'tea' | 'lunch' | 'dinner') => {
    try {
      setError(null);
      await startBreak({ type: breakType }).unwrap();
      refetch();
    } catch (err: any) {
      console.error(err);
      setError(err?.data?.message || err?.message || "Failed to start break.");
    }
  };

  const handleEndBreak = async () => {
    try {
      setError(null);
      await endBreak().unwrap();
      refetch();
    } catch (err: any) {
      console.error(err);
      setError(err?.data?.message || err?.message || "Failed to end break.");
    }
  };

  const formattedTime = time.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const formattedDate = time.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isSubmitting = isPunchingIn || isPunchingOut || gpsLoading;

  const firstPunchInTime = latestLog && latestLog.punches
    ? latestLog.punches.find(p => p.type === 'in')?.time
    : null;
  const lastPunchOutTime = latestLog && latestLog.punches
    ? [...latestLog.punches].reverse().find(p => p.type === 'out')?.time
    : null;

  return (
    <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl relative overflow-hidden transition-colors duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap w-full lg:w-auto">
          {/* Left Side: Current State and Punch Buttons */}
          <div className="flex flex-row flex-wrap sm:flex-nowrap items-center justify-between sm:justify-start gap-4 bg-theme-bg border border-theme-border rounded-xl px-5 py-3.5 w-full sm:w-auto transition-colors duration-200">
            <div className="space-y-0.5 min-w-[120px]">
              <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest block font-sans">Current State</span>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isOnBreak ? 'bg-amber-500 animate-pulse' : isClockedIn ? 'bg-emerald-400 animate-pulse' : isCompletedToday ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <span className="text-sm font-bold text-theme-text">
                  {isOnBreak
                    ? `On Break (${activeBreak.type === 'tea' ? 'Tea' : activeBreak.type === 'lunch' ? 'Lunch' : 'Dinner'})`
                    : isClockedIn
                    ? 'Punched In'
                    : isCompletedToday
                    ? 'Attendance Completed'
                    : 'Not Punched In'}
                </span>
              </div>
              {isClockedIn && !isOnBreak && activeLog && activeLog.punches && activeLog.punches.length > 0 && (
                <span className="text-[10px] text-theme-muted block font-mono">
                  Started at {new Date(activeLog.punches[activeLog.punches.length - 1].time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {isClockedIn && (
                <span className={`text-[10px] font-bold block font-mono ${accruedHours >= 8.0 ? 'text-amber-500 animate-pulse' : 'text-violet-500'}`}>
                  Accrued Time: {accruedHours.toFixed(2)} hrs {accruedHours >= 8.0 && ' (8h Completed! ⚠️)'}
                </span>
              )}
              {isOnBreak && activeBreak && (
                <span className="text-[10px] text-amber-500 block font-mono font-bold">
                  Duration: {formatDuration(breakDuration)}
                </span>
              )}
              {isCompletedToday && latestLog && (
                <span className="text-[10px] text-theme-muted block font-mono">
                  In: {firstPunchInTime ? new Date(firstPunchInTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '-'} | Out: {lastPunchOutTime ? new Date(lastPunchOutTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '-'}
                </span>
              )}
            </div>
            
            {!cameraActive && (
              isCompletedToday ? (
                <button
                  disabled
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-theme-card-hover border border-theme-border text-theme-muted cursor-not-allowed opacity-70"
                >
                  Completed for Today
                </button>
              ) : isOnBreak ? (
                <button
                  onClick={handleEndBreak}
                  disabled={isEndingBreak}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:scale-[1.02] transition-all cursor-pointer shadow-emerald-950/20"
                >
                  {isEndingBreak ? 'Resuming...' : 'Resume Work'}
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer hover:scale-[1.02] ${
                    isClockedIn
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/20'
                      : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-950/20'
                  }`}
                >
                  {isClockedIn ? 'Punch Out' : 'Punch In'}
                </button>
              )
            )}
          </div>

          {/* Break Actions Section */}
          {isClockedIn && !isOnBreak && !cameraActive && (
            <div className="flex flex-row flex-wrap items-center gap-3 bg-theme-bg border border-theme-border rounded-xl px-5 py-3.5 w-full sm:w-auto transition-colors duration-200">
              <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest block font-sans">Breaks</span>
              
              {/* Tea Break Button */}
              <button
                onClick={() => handleStartBreak('tea')}
                disabled={isStartingBreak || teaBreaksCount >= breakPolicy.tea.maxCount}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all border ${
                  teaBreaksCount >= breakPolicy.tea.maxCount
                    ? 'border-theme-border text-theme-muted bg-theme-card-hover/30 cursor-not-allowed opacity-55'
                    : 'border-amber-500/20 text-amber-500 hover:bg-amber-500/10 cursor-pointer'
                }`}
              >
                Tea ({teaBreaksCount}/{breakPolicy.tea.maxCount})
              </button>

              {/* Lunch Break Button */}
              {breakPolicy.lunch?.enabled && (
                <button
                  onClick={() => handleStartBreak('lunch')}
                  disabled={isStartingBreak || isLunchTaken}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all border ${
                    isLunchTaken
                      ? 'border-theme-border text-theme-muted bg-theme-card-hover/30 cursor-not-allowed opacity-55'
                      : 'border-amber-500/20 text-amber-500 hover:bg-amber-500/10 cursor-pointer'
                  }`}
                >
                  Lunch ({breakPolicy.lunch.duration}m)
                </button>
              )}

              {/* Dinner Break Button */}
              {breakPolicy.dinner?.enabled && (
                <button
                  onClick={() => handleStartBreak('dinner')}
                  disabled={isStartingBreak || isDinnerTaken}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all border ${
                    isDinnerTaken
                      ? 'border-theme-border text-theme-muted bg-theme-card-hover/30 cursor-not-allowed opacity-55'
                      : 'border-amber-500/20 text-amber-500 hover:bg-amber-500/10 cursor-pointer'
                  }`}
                >
                  Dinner ({breakPolicy.dinner.duration}m)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Real-time Clock */}
        <div className="space-y-1 md:text-right">
          <div className="flex items-center md:justify-end gap-2 text-theme-muted text-sm font-semibold uppercase tracking-wider">
            <Clock className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span>Real-time Clock</span>
          </div>
          <p className="text-3xl font-extrabold text-theme-bright font-mono tracking-tight">{formattedTime}</p>
          <p className="text-xs text-theme-muted font-medium">{formattedDate}</p>
        </div>

      </div>

      {cameraActive && (
        <VerificationCamera
          videoRef={videoRef}
          cameraLoading={cameraLoading}
          isSubmitting={isSubmitting}
          gpsLoading={gpsLoading}
          error={error || cameraError}
          onCancel={stopCamera}
          onConfirm={handlePunch}
        />
      )}
    </div>
  );
}
