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
    <section className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl space-y-6 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-theme-bright">Pending Overtime Requests</h2>
            <p className="text-xs text-theme-muted">Review and approve employee overtime requests</p>
          </div>
        </div>
        <button
          onClick={refetchPendingOvertime}
          className="p-2 text-theme-muted hover:text-theme-bright hover:bg-theme-card-hover rounded-lg transition-colors cursor-pointer"
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
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Failed to load overtime requests</p>
            <p className="text-xs text-theme-muted">{pendingOvertimeError?.data?.message || pendingOvertimeError?.error || 'Unknown error'}</p>
          </div>
        </div>
      ) : pendingOvertime.length === 0 ? (
        <div className="py-12 text-center text-theme-muted text-sm">No pending overtime requests found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-theme-border bg-theme-bg/30">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-theme-border text-xs font-semibold text-theme-muted uppercase tracking-wider bg-theme-card-hover/50">
                <th className="py-4 px-5">Employee</th>
                <th className="py-4 px-5">Requested Hours</th>
                <th className="py-4 px-5">Reason</th>
                <th className="py-4 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border/60 text-sm">
              {pendingOvertime.map((req) => {
                const empName = req.employeeId?.name || 'Unknown User';
                const empEmail = req.employeeId?.email || '';

                return (
                  <tr key={req._id} className="hover:bg-theme-card-hover/50 transition-colors">
                    <td className="py-4 px-5">
                      <p className="font-medium text-theme-bright">{empName}</p>
                      <p className="text-xs text-theme-muted">{empEmail}</p>
                    </td>
                    <td className="py-4 px-5 text-theme-bright font-bold font-mono text-base">
                      {req.requestedHours} hr{req.requestedHours !== 1 ? 's' : ''}
                    </td>
                    <td className="py-4 px-5 text-theme-text italic max-w-xs truncate" title={req.reason}>
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
