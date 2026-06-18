import React, { useState } from 'react';
import { useRequestOvertimeMutation } from '../../redux/api/overtimeApi.js';
import { X, CheckCircle2 } from 'lucide-react';

export default function OvertimeRequestForm({ attendanceId, onSuccess, onCancel }) {
  const [requestedHours, setRequestedHours] = useState('');
  const [reason, setReason] = useState('');
  const [requestOvertime, { isLoading }] = useRequestOvertimeMutation();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!requestedHours || isNaN(requestedHours) || Number(requestedHours) <= 0) {
      setError('Please enter a valid number of hours (> 0).');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason for overtime.');
      return;
    }
    try {
      await requestOvertime({
        attendanceId,
        requestedHours: Number(requestedHours),
        reason: reason.trim(),
      }).unwrap();
      onSuccess();
    } catch (err) {
      setError(err?.data?.message || err?.error || 'Failed to submit overtime request.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 bg-slate-950/60 border border-violet-500/20 rounded-xl p-4 space-y-3"
    >
      <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Request Overtime</p>
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs text-slate-400 block mb-1">Hours Requested</label>
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={requestedHours}
            onChange={(e) => setRequestedHours(e.target.value)}
            placeholder="e.g. 2"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <div className="flex-[2]">
          <label className="text-xs text-slate-400 block mb-1">Reason</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Brief reason for overtime..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {isLoading ? 'Submitting…' : 'Submit Request'}
        </button>
      </div>
    </form>
  );
}
