import React from 'react';
import { Camera, AlertCircle, X, RefreshCw, MapPin } from 'lucide-react';

export default function VerificationCamera({
  videoRef,
  cameraLoading,
  isSubmitting,
  gpsLoading,
  error,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="mt-6 border border-slate-800/80 rounded-xl bg-slate-950/80 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-bold text-white">Security Verification</h3>
        </div>
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="text-slate-500 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs leading-relaxed">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Camera Frame Viewport */}
      <div className="relative aspect-[4/3] max-w-sm mx-auto bg-black rounded-lg overflow-hidden border border-slate-800 shadow-inner">
        {cameraLoading && (
          <div className="absolute inset-0 flex flex-col justify-center items-center gap-2.5 text-slate-500">
            <span className="w-6 h-6 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin" />
            <span className="text-xs">Initializing Camera...</span>
          </div>
        )}
        
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover scale-x-[-1] ${cameraLoading ? 'hidden' : 'block'}`}
        />

        {/* Target Face Guide Overlay */}
        {!cameraLoading && !isSubmitting && (
          <div className="absolute inset-0 border-[30px] border-slate-950/40 pointer-events-none flex items-center justify-center">
            <div className="w-44 h-56 rounded-[50%] border-2 border-dashed border-violet-500/40 bg-transparent flex items-center justify-center">
              <span className="text-[10px] text-violet-400/60 font-semibold uppercase tracking-wider select-none">Position Face</span>
            </div>
          </div>
        )}

        {/* Verification Processing Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col justify-center items-center gap-3 text-slate-300">
            <RefreshCw className="w-7 h-7 text-violet-400 animate-spin" />
            <div className="text-center space-y-1 px-4">
              <p className="text-sm font-semibold text-white">Verifying details...</p>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                {gpsLoading ? 'Reading secure GPS coordinate markers...' : 'Uploading verified identification image...'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!cameraLoading && (
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white rounded-xl text-xs font-semibold tracking-wide transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold tracking-wide transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Confirm Identity & Location</span>
          </button>
        </div>
      )}
    </div>
  );
}
