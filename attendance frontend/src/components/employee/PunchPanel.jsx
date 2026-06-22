import React, { useState, useEffect, useRef } from 'react';
import { usePunchInMutation, usePunchOutMutation } from '../../redux/api/attendanceApi.js';
import VerificationCamera from './VerificationCamera.jsx';
import { Clock } from 'lucide-react';

export default function PunchPanel({ logs, refetch }) {
  const [time, setTime] = useState(new Date());
  const [punchIn, { isLoading: isPunchingIn }] = usePunchInMutation();
  const [punchOut, { isLoading: isPunchingOut }] = usePunchOutMutation();
  
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const videoRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeLog = logs.find(log => log.punchIn && !log.punchOut);
  const isClockedIn = !!activeLog;

  const startCamera = async () => {
    setError(null);
    setCameraLoading(true);
    setCameraActive(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("Camera access denied or unavailable. Please enable webcam permissions.");
      setCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const captureSelfie = () => {
    const video = videoRef.current;
    if (!video) return null;

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;

    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.7);
  };

  const getCoordinates = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLoading(false);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (err) => {
          setGpsLoading(false);
          let errMsg = "Failed to retrieve location. ";
          if (err.code === err.PERMISSION_DENIED) {
            errMsg += "Please grant location access permissions in your browser.";
          } else {
            errMsg += err.message;
          }
          reject(new Error(errMsg));
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
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
    } catch (err) {
      console.error(err);
      setError(err?.data?.message || err?.message || "An error occurred during verification.");
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

  return (
    <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl relative overflow-hidden transition-colors duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Left Side: Current State and Punch Buttons */}
        <div className="flex flex-row flex-wrap sm:flex-nowrap items-center justify-between sm:justify-start gap-4 bg-theme-bg border border-theme-border rounded-xl px-5 py-3.5 w-full sm:w-auto transition-colors duration-200">
          <div className="space-y-0.5 min-w-[120px]">
            <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest block font-sans">Current State</span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isClockedIn ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-sm font-bold text-theme-text">
                {isClockedIn ? 'Punched In' : 'Not Punched In'}
              </span>
            </div>
            {isClockedIn && activeLog?.punchIn?.time && (
              <span className="text-[10px] text-theme-muted block font-mono">
                Started at {new Date(activeLog.punchIn.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          
          {!cameraActive && (
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
          error={error}
          onCancel={stopCamera}
          onConfirm={handlePunch}
        />
      )}
    </div>
  );
}
