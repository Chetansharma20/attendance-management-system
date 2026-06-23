import React, { useState } from 'react';
import { useGetShiftsQuery, useCreateShiftMutation, useDeleteShiftMutation } from '../../redux/api/settingsApi.js';
import { ShieldCheck, Plus, Trash2, Clock, Timer, AlertTriangle } from 'lucide-react';

export default function ShiftManagement() {
  const { data: shiftsResponse, isLoading, isError, refetch } = useGetShiftsQuery();
  const [createShift, { isLoading: isCreating }] = useCreateShiftMutation();
  const [deleteShift, { isLoading: isDeleting }] = useDeleteShiftMutation();

  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [gracePeriod, setGracePeriod] = useState(15);
  const [errorMsg, setErrorMsg] = useState('');

  const shifts = shiftsResponse?.data || [];

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await createShift({ name, startTime, endTime, gracePeriod: Number(gracePeriod) }).unwrap();
      setName('');
      setStartTime('09:00');
      setEndTime('18:00');
      setGracePeriod(15);
      alert('Shift created successfully!');
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.error || 'Failed to create shift');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) return;
    try {
      await deleteShift(id).unwrap();
      alert('Shift deleted successfully!');
    } catch (err) {
      alert(err?.data?.message || err?.error || 'Failed to delete shift');
    }
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
      {/* Left 2 Columns: Shifts List */}
      <div className="lg:col-span-2 bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl space-y-6 transition-colors duration-200">
        <div className="border-b border-theme-border pb-3 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-theme-bright">Shift Schedules</h2>
            <p className="text-xs text-theme-muted">Configured operational shifts for staff members</p>
          </div>
          <button
            onClick={refetch}
            className="text-xs font-semibold text-violet-650 hover:text-violet-500 cursor-pointer"
          >
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <span className="w-8 h-8 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-xs">Failed to load shifts. Please try refreshing.</p>
          </div>
        ) : shifts.length === 0 ? (
          <div className="py-12 text-center text-theme-muted text-sm border border-dashed border-theme-border rounded-xl bg-theme-bg/10">
            No custom shifts defined yet. Users will fallback to the global company settings.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {shifts.map((shift) => (
              <div
                key={shift._id}
                className="p-5 rounded-2xl border border-theme-border bg-theme-bg/10 hover:border-violet-500/40 hover:bg-theme-bg/25 transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-theme-bright flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      {shift.name}
                    </span>
                    <button
                      onClick={() => handleDelete(shift._id)}
                      disabled={isDeleting}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Delete shift"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-theme-border/40 text-xs">
                    <div>
                      <span className="text-theme-muted block font-medium mb-0.5">Start Time:</span>
                      <span className="font-mono text-theme-bright font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                        {shift.startTime}
                      </span>
                    </div>
                    <div>
                      <span className="text-theme-muted block font-medium mb-0.5">End Time:</span>
                      <span className="font-mono text-theme-bright font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        {shift.endTime}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-theme-muted bg-theme-card border border-theme-border rounded-xl px-3 py-1.5 self-start">
                  <Timer className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                  <span>Grace Period: <strong className="font-bold text-theme-bright">{shift.gracePeriod}m</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right 1 Column: Create Shift Form */}
      <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl space-y-6 transition-colors duration-200 self-start">
        <div>
          <h2 className="text-lg font-bold text-theme-bright">Create Shift</h2>
          <p className="text-xs text-theme-muted">Add a new operational shift timing config</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-muted">Shift Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning Shift"
              className="w-full bg-theme-bg border border-theme-input-border rounded-xl px-3 py-2.5 text-sm text-theme-bright focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-theme-muted">Start Time</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-theme-bg border border-theme-input-border rounded-xl px-3 py-2.5 text-sm text-theme-bright focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-theme-muted">End Time</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-theme-bg border border-theme-input-border rounded-xl px-3 py-2.5 text-sm text-theme-bright focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-muted flex justify-between">
              <span>Grace Period (Minutes)</span>
              <span className="font-mono text-violet-650 font-bold">{gracePeriod}m</span>
            </label>
            <input
              type="number"
              min="0"
              max="120"
              required
              value={gracePeriod}
              onChange={(e) => setGracePeriod(e.target.value)}
              className="w-full bg-theme-bg border border-theme-input-border rounded-xl px-3 py-2.5 text-sm text-theme-bright focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="w-full inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreating ? 'Creating...' : 'Create Shift'}</span>
          </button>
        </form>
      </div>
    </section>
  );
}
