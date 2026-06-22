import React from 'react';
import { useGetMyOvertimeRequestsQuery } from '../../redux/api/overtimeApi.js';
import { Timer, RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock3 } from 'lucide-react';

function StatusBadge({ status }) {
  const map = {
    approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
    pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
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
          <div className="p-2.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl border border-violet-500/20">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-theme-bright">My Overtime Requests</h2>
            <p className="text-xs text-theme-muted">All your submitted overtime requests and their status</p>
          </div>
        </div>
        <button
          onClick={refetch}
          className="p-2 text-theme-muted hover:text-theme-bright hover:bg-theme-card-hover rounded-lg transition-colors cursor-pointer"
          title="Refresh overtime requests"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl transition-colors duration-200">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <span className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Failed to load overtime requests</p>
              <p className="text-xs text-theme-muted">{error?.data?.message || error?.error || 'Unknown error'}</p>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center">
            <Timer className="w-12 h-12 text-theme-muted mx-auto mb-3" />
            <p className="text-theme-muted text-sm">No overtime requests submitted yet.</p>
            <p className="text-theme-muted/80 text-xs mt-1">
              You can request overtime from a completed attendance log above.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto rounded-xl border border-theme-border bg-theme-bg/30">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-theme-border text-xs font-semibold text-theme-muted uppercase tracking-wider bg-theme-card-hover/50">
                    <th className="py-4 px-5">Submitted On</th>
                    <th className="py-4 px-5">Requested Hours</th>
                    <th className="py-4 px-5">Reason</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/60 text-sm">
                  {requests.map((req) => (
                    <tr key={req._id} className="hover:bg-theme-card-hover/50 transition-colors">
                      {/* Submitted On */}
                      <td className="py-4 px-5 text-theme-text">
                        {formatDate(req.createdAt)}
                      </td>

                      {/* Requested Hours */}
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1.5 font-bold font-mono text-theme-bright text-base">
                          <Timer className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          {req.requestedHours} hr{req.requestedHours !== 1 ? 's' : ''}
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="py-4 px-5 text-theme-text italic max-w-xs">
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
                            <p className="text-xs text-red-650 dark:text-red-400 font-semibold mb-0.5">Rejection Reason:</p>
                            <p className="text-xs text-red-600 dark:text-red-300">{req.rejectionReason}</p>
                          </div>
                        ) : req.status === 'approved' && req.approvedAt ? (
                          <div className="text-xs text-emerald-600 dark:text-emerald-400">
                            <p className="font-semibold">Approved</p>
                            <p className="text-theme-muted">{formatDateTime(req.approvedAt)}</p>
                          </div>
                        ) : (
                          <span className="text-theme-muted text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-4">
              {requests.map((req) => (
                <div key={req._id} className="bg-theme-bg/20 border border-theme-border rounded-xl p-4 space-y-3 transition-colors duration-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-theme-muted font-medium">Submitted: {formatDate(req.createdAt)}</span>
                    <StatusBadge status={req.status} />
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-theme-muted font-medium">Hours:</span>
                    <span className="inline-flex items-center gap-1.5 font-bold font-mono text-theme-bright text-sm">
                      <Timer className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                      {req.requestedHours} hr{req.requestedHours !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="text-xs text-theme-text italic bg-theme-card/30 border border-theme-border/60 rounded-lg p-2.5">
                    "{req.reason}"
                  </div>

                  {/* Details Section */}
                  {(req.status === 'rejected' && req.rejectionReason) || (req.status === 'approved' && req.approvedAt) ? (
                    <div className="border-t border-theme-border/60 pt-2.5 text-xs">
                      {req.status === 'rejected' && req.rejectionReason && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                          <p className="font-semibold text-red-650 dark:text-red-400 mb-0.5">Rejection Reason:</p>
                          <p className="text-red-600 dark:text-red-305">{req.rejectionReason}</p>
                        </div>
                      )}
                      {req.status === 'approved' && req.approvedAt && (
                        <div className="flex justify-between items-center text-emerald-650 dark:text-emerald-455 font-medium">
                          <span>Approved At:</span>
                          <span>{formatDateTime(req.approvedAt)}</span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
