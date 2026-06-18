import React from 'react';
import { useGetPendingOvertimeQuery, useUpdateOvertimeStatusMutation } from '../../redux/api/overtimeApi.js';
import { Calendar, RefreshCw, AlertCircle, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function PendingOvertime() {
  const {
    data: pendingOvertimeResponse,
    isLoading: isPendingOvertimeLoading,
    isError: isPendingOvertimeError,
    error: pendingOvertimeError,
    refetch: refetchPendingOvertime,
  } = useGetPendingOvertimeQuery();

  const [updateOvertimeStatus, { isLoading: isUpdatingOvertime }] = useUpdateOvertimeStatusMutation();

  const pendingOvertime = pendingOvertimeResponse?.data || [];

  const handleOvertimeStatus = async (requestId, status) => {
    let rejectionReason = '';
    if (status === 'rejected') {
      const reason = prompt('Please enter a rejection reason (required):');
      if (reason === null) return; // cancelled
      if (!reason.trim()) {
        alert('Rejection reason is required.');
        return;
      }
      rejectionReason = reason;
    }

    try {
      await updateOvertimeStatus({
        requestId,
        status,
        rejectionReason: rejectionReason || undefined,
      }).unwrap();
    } catch (err) {
      alert(err?.data?.message || err?.error || 'Failed to update request');
    }
  };

  return (
    <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Pending Overtime Requests</h2>
            <p className="text-xs text-slate-400">Review and approve employee overtime requests</p>
          </div>
        </div>
        <button
          onClick={refetchPendingOvertime}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Refresh overtime requests"
        >
          <RefreshCw className={`w-4 h-4 ${isPendingOvertimeLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isPendingOvertimeLoading ? (
        <div className="py-12 flex justify-center items-center">
          <span className="w-8 h-8 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : isPendingOvertimeError ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Failed to load overtime requests</p>
            <p className="text-xs text-slate-400">{pendingOvertimeError?.data?.message || pendingOvertimeError?.error || 'Unknown error'}</p>
          </div>
        </div>
      ) : pendingOvertime.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">No pending overtime requests found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-slate-950/40">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/30">
                <th className="py-4 px-5">Employee</th>
                <th className="py-4 px-5">Requested Hours</th>
                <th className="py-4 px-5">Reason</th>
                <th className="py-4 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-sm">
              {pendingOvertime.map((req) => {
                const empName = req.employeeId?.name || 'Unknown User';
                const empEmail = req.employeeId?.email || '';

                return (
                  <tr key={req._id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 px-5">
                      <p className="font-medium text-white">{empName}</p>
                      <p className="text-xs text-slate-400">{empEmail}</p>
                    </td>
                    <td className="py-4 px-5 text-slate-200 font-bold font-mono text-base">
                      {req.requestedHours} hr{req.requestedHours !== 1 ? 's' : ''}
                    </td>
                    <td className="py-4 px-5 text-slate-300 italic max-w-xs truncate" title={req.reason}>
                      "{req.reason}"
                    </td>
                    <td className="py-4 px-5 flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleOvertimeStatus(req._id, 'approved')}
                        disabled={isUpdatingOvertime}
                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/40 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleOvertimeStatus(req._id, 'rejected')}
                        disabled={isUpdatingOvertime}
                        className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-500 disabled:bg-red-600/40 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
