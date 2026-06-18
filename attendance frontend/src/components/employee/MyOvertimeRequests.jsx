import React from 'react';
import { useGetMyOvertimeRequestsQuery } from '../../redux/api/overtimeApi.js';
import { Timer, RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock3 } from 'lucide-react';

function StatusBadge({ status }) {
  const map = {
    approved: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  };
  const iconMap = {
    approved: <CheckCircle2 className="w-3.5 h-3.5" />,
    rejected: <XCircle className="w-3.5 h-3.5" />,
    pending: <Clock3 className="w-3.5 h-3.5" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${map[status] || map.pending}`}
    >
      {iconMap[status] || iconMap.pending}
      {status || 'pending'}
    </span>
  );
}

export default function MyOvertimeRequests() {
  const {
    data: overtimeResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetMyOvertimeRequestsQuery();

  const requests = overtimeResponse?.data || [];

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-xl border border-violet-500/20">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">My Overtime Requests</h2>
            <p className="text-xs text-slate-400">All your submitted overtime requests and their status</p>
          </div>
        </div>
        <button
          onClick={refetch}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Refresh overtime requests"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <span className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Failed to load overtime requests</p>
              <p className="text-xs text-slate-400">{error?.data?.message || error?.error || 'Unknown error'}</p>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center">
            <Timer className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No overtime requests submitted yet.</p>
            <p className="text-slate-600 text-xs mt-1">
              You can request overtime from a completed attendance log above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-slate-950/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/30">
                  <th className="py-4 px-5">Submitted On</th>
                  <th className="py-4 px-5">Requested Hours</th>
                  <th className="py-4 px-5">Reason</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-900/30 transition-colors">
                    {/* Submitted On */}
                    <td className="py-4 px-5 text-slate-300">
                      {formatDate(req.createdAt)}
                    </td>

                    {/* Requested Hours */}
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center gap-1.5 font-bold font-mono text-white text-base">
                        <Timer className="w-4 h-4 text-violet-400" />
                        {req.requestedHours} hr{req.requestedHours !== 1 ? 's' : ''}
                      </span>
                    </td>

                    {/* Reason */}
                    <td className="py-4 px-5 text-slate-300 italic max-w-xs">
                      <span
                        className="block truncate max-w-[200px]"
                        title={req.reason}
                      >
                        "{req.reason}"
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-5">
                      <StatusBadge status={req.status} />
                    </td>

                    {/* Details: rejection reason or approval info */}
                    <td className="py-4 px-5">
                      {req.status === 'rejected' && req.rejectionReason ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 max-w-[200px]">
                          <p className="text-xs text-red-400 font-semibold mb-0.5">Rejection Reason:</p>
                          <p className="text-xs text-red-300">{req.rejectionReason}</p>
                        </div>
                      ) : req.status === 'approved' && req.approvedAt ? (
                        <div className="text-xs text-emerald-400">
                          <p className="font-semibold">Approved</p>
                          <p className="text-slate-500">{formatDateTime(req.approvedAt)}</p>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
