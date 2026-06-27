import React, { useState } from 'react';
import { useGetAllOvertimeQuery, useDeleteOvertimeMutation } from '../../redux/api/overtimeApi';
import { Loader2, Trash2, AlertCircle, RefreshCw, Filter } from 'lucide-react';

interface OvertimeRequest {
  _id: string;
  employeeId: {
    _id: string;
    name: string;
    email: string;
  };
  attendanceId: string;
  requestedHours: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

export default function OvertimeHistory() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: overtimeResponse, isLoading, isError, error, refetch } = useGetAllOvertimeQuery({
    page,
    limit: 10,
    status: statusFilter
  });

  const [deleteOvertime, { isLoading: isDeleting }] = useDeleteOvertimeMutation();

  const overtimes: OvertimeRequest[] = overtimeResponse?.data?.overtimes || [];
  const pagination = overtimeResponse?.data?.pagination;

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this overtime request? This cannot be undone.')) {
      try {
        await deleteOvertime(id).unwrap();
      } catch (err) {
        console.error('Failed to delete overtime request', err);
        alert('Failed to delete overtime request');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      default: return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
  };

  return (
    <div className="bg-theme-card border border-theme-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 border-b border-theme-border bg-theme-bg/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-theme-bright">Overtime History</h2>
          <p className="text-xs text-theme-muted mt-1">View and manage all overtime requests</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="pl-9 pr-8 py-2 bg-theme-bg border border-theme-input-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <button
            onClick={() => refetch()}
            className="p-2.5 text-theme-muted hover:text-theme-bright hover:bg-theme-bg border border-theme-border rounded-xl transition-colors shadow-sm cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-theme-muted">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            <p className="text-sm font-medium">Loading overtime history...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-500">
            <AlertCircle className="w-8 h-8 opacity-80" />
            <p className="font-semibold">Failed to load history.</p>
          </div>
        ) : overtimes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-theme-muted">
            <p className="text-sm">No overtime requests found.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-theme-border bg-theme-bg/50">
                <th className="py-3 px-4 text-xs font-semibold text-theme-muted uppercase tracking-wider">Employee</th>
                <th className="py-3 px-4 text-xs font-semibold text-theme-muted uppercase tracking-wider">Date Applied</th>
                <th className="py-3 px-4 text-xs font-semibold text-theme-muted uppercase tracking-wider">Hours</th>
                <th className="py-3 px-4 text-xs font-semibold text-theme-muted uppercase tracking-wider">Reason</th>
                <th className="py-3 px-4 text-xs font-semibold text-theme-muted uppercase tracking-wider text-center">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-theme-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border">
              {overtimes.map((req) => (
                <tr key={req._id} className="hover:bg-theme-card-hover transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-theme-bright text-sm">{req.employeeId?.name || 'Unknown'}</div>
                    <div className="text-xs text-theme-muted">{req.employeeId?.email || 'N/A'}</div>
                  </td>
                  <td className="py-3 px-4 text-sm text-theme-text whitespace-nowrap">
                    {new Date(req.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="py-3 px-4 text-sm font-bold text-theme-bright">
                    {req.requestedHours}h
                  </td>
                  <td className="py-3 px-4 text-sm text-theme-text max-w-[200px] truncate" title={req.reason}>
                    {req.reason}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-lg border ${getStatusColor(req.status)} uppercase tracking-wider`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(req._id)}
                      disabled={isDeleting}
                      className="p-1.5 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-theme-border bg-theme-bg/30 flex items-center justify-between">
          <p className="text-xs text-theme-muted font-medium">
            Showing <span className="text-theme-bright">{overtimes.length}</span> of <span className="text-theme-bright">{pagination.total}</span> requests
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-semibold border border-theme-border rounded-lg hover:bg-theme-bg disabled:opacity-50 transition-colors cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-3 py-1.5 text-xs font-semibold border border-theme-border rounded-lg hover:bg-theme-bg disabled:opacity-50 transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
