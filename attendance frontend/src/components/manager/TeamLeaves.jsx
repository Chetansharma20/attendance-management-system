import React, { useState } from 'react';
import {
  useGetTeamLeavesQuery,
  useUpdateLeaveStatusMutation,
} from '../../redux/api/leaveApi.js';
import { CheckCircle2, XCircle, Clock3, Users } from 'lucide-react';

const LEAVE_ICONS = { sick: '🤒', casual: '☀️', earned: '🏖️', unpaid: '📋' };

const STATUS_STYLES = {
  pending: {
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
    label: 'Pending',
    icon: <Clock3 className="w-3.5 h-3.5" />
  },
  approved: {
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
    label: 'Approved',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />
  },
  rejected: {
    badge: 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20',
    label: 'Rejected',
    icon: <XCircle className="w-3.5 h-3.5" />
  },
};

const FILTER_TABS = ['all', 'pending', 'approved', 'rejected'];

export default function TeamLeaves() {
  const [activeFilter, setActiveFilter] = useState('pending');
  const [actionMap, setActionMap] = useState({}); // { leaveId: { mode: 'approve'|'reject', note: '' } }

  const { data, isLoading, isFetching } = useGetTeamLeavesQuery(activeFilter);
  const [updateLeaveStatus, { isLoading: updating }] = useUpdateLeaveStatusMutation();

  const leaves = data?.data || [];

  const openAction = (leaveId, mode) => {
    setActionMap((prev) => ({ ...prev, [leaveId]: { mode, note: '' } }));
  };

  const cancelAction = (leaveId) => {
    setActionMap((prev) => { const n = { ...prev }; delete n[leaveId]; return n; });
  };

  const handleAction = async (leaveId) => {
    const action = actionMap[leaveId];
    if (!action) return;
    if (action.mode === 'reject' && !action.note.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }
    try {
      await updateLeaveStatus({
        leaveId,
        status: action.mode === 'approve' ? 'approved' : 'rejected',
        rejectionReason: action.mode === 'reject' ? action.note : undefined,
      }).unwrap();
      cancelAction(leaveId);
    } catch (err) {
      alert(err?.data?.message || 'Action failed. Please try again.');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl border border-violet-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-theme-bright">Team Leave Requests</h2>
            <p className="text-xs text-theme-muted">Manage leave applications submitted by your team members</p>
          </div>
        </div>

        <div className="flex gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-4 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeFilter === tab
                  ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/10'
                  : 'bg-theme-card border-theme-border text-theme-muted hover:text-theme-bright hover:bg-theme-card-hover'
              }`}
            >
              <span className="capitalize">{tab}</span>
              {tab === 'pending' && leaves.length > 0 && activeFilter === 'pending' && (
                <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full leading-none">
                  {leaves.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {isLoading || isFetching ? (
        <div className="py-20 flex justify-center items-center">
          <span className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : leaves.length === 0 ? (
        <div className="bg-theme-card border border-theme-border rounded-2xl py-16 text-center shadow-lg">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-theme-text font-medium text-sm">
            No {activeFilter === 'all' ? '' : activeFilter} leave requests found.
          </p>
          <p className="text-theme-muted text-xs mt-1">Leave requests from your team will appear here.</p>
        </div>
      ) : (
        <div className="bg-theme-card border border-theme-border rounded-2xl shadow-xl overflow-hidden transition-colors duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-theme-border text-xs font-semibold text-theme-muted uppercase tracking-wider bg-theme-card-hover/50">
                  <th className="py-3.5 px-5">Employee</th>
                  <th className="py-3.5 px-5">Type</th>
                  <th className="py-3.5 px-5">From</th>
                  <th className="py-3.5 px-5">To</th>
                  <th className="py-3.5 px-5 text-center">Days</th>
                  <th className="py-3.5 px-5">Reason</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/60 text-sm">
                {leaves.map((leave) => {
                  const s = STATUS_STYLES[leave.status] || STATUS_STYLES.pending;
                  const action = actionMap[leave._id];
                  return (
                    <React.Fragment key={leave._id}>
                      <tr className="hover:bg-theme-card-hover/40 transition-colors">
                        <td className="py-4 px-5">
                          <div className="font-semibold text-theme-bright">{leave.employeeId?.name || '—'}</div>
                          <div className="text-xs text-theme-muted">{leave.employeeId?.email || ''}</div>
                        </td>
                        <td className="py-4 px-5 font-semibold text-theme-bright capitalize">
                          {LEAVE_ICONS[leave.leaveType] || '📋'} {leave.leaveType}
                        </td>
                        <td className="py-4 px-5 text-theme-text">
                          {new Date(leave.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-4 px-5 text-theme-text">
                          {new Date(leave.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-4 px-5 text-center font-bold text-theme-bright">{leave.totalDays}</td>
                        <td className="py-4 px-5 text-theme-text max-w-xs truncate" title={leave.reason}>
                          {leave.reason}
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${s.badge}`}>
                            {s.icon}
                            {s.label}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          {leave.status === 'pending' && !action && (
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() => openAction(leave._id, 'approve')}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => openAction(leave._id, 'reject')}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 active:scale-95 transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {leave.status !== 'pending' && (
                            <span className="text-xs text-theme-muted font-medium">
                              {leave.status === 'approved'
                                ? `Approved by ${leave.approvedBy?.name || 'Manager'}`
                                : 'Rejected'}
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Inline confirmation row */}
                      {action && (
                        <tr>
                          <td colSpan={8} className="p-0 bg-theme-bg/10">
                            <div
                              className={`m-4 border rounded-xl p-4 flex flex-col gap-3 transition-colors ${
                                action.mode === 'approve'
                                  ? 'border-emerald-500/30 bg-emerald-500/5'
                                  : 'border-red-500/30 bg-red-500/5'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className={`font-semibold ${action.mode === 'approve' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                                  {action.mode === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'} for{' '}
                                  <strong className="text-theme-bright">{leave.employeeId?.name}</strong>'s {leave.leaveType} leave ({leave.totalDays} days)
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAction(leave._id)}
                                    disabled={updating}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
                                      action.mode === 'approve'
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                    }`}
                                  >
                                    {updating ? 'Processing…' : `Yes, ${action.mode}`}
                                  </button>
                                  <button
                                    onClick={() => cancelAction(leave._id)}
                                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-theme-bg border border-theme-border text-theme-text hover:bg-theme-card-hover transition-colors cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>

                              <input
                                type="text"
                                placeholder={action.mode === 'reject' ? 'Rejection reason (required)…' : 'Optional note…'}
                                value={action.note}
                                onChange={(e) => setActionMap((prev) => ({
                                  ...prev,
                                  [leave._id]: { ...prev[leave._id], note: e.target.value },
                                }))}
                                className="w-full bg-theme-bg border border-theme-input-border text-theme-text rounded-lg px-3 py-2 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors text-xs"
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
