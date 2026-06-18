import React from 'react';
import { useGetMyTeamQuery } from '../../redux/api/authApi.js';
import { Users, RefreshCw, AlertCircle, UserCheck } from 'lucide-react';

export default function MyTeam() {
  const {
    data: teamResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetMyTeamQuery();

  const employees = teamResponse?.data || [];

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <section className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl space-y-6 transition-colors duration-200">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-theme-bright">My Team</h2>
            <p className="text-xs text-theme-muted">
              {isLoading ? 'Loading...' : `${employees.length} employee${employees.length !== 1 ? 's' : ''} under your management`}
            </p>
          </div>
        </div>
        <button
          onClick={refetch}
          className="p-2 text-theme-muted hover:text-theme-bright hover:bg-theme-card-hover rounded-lg transition-colors cursor-pointer"
          title="Refresh team"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-12 flex justify-center items-center">
          <span className="w-8 h-8 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Failed to load team</p>
            <p className="text-xs text-theme-muted">{error?.data?.message || error?.error || 'Unknown error'}</p>
          </div>
        </div>
      ) : employees.length === 0 ? (
        <div className="py-14 text-center">
          <UserCheck className="w-12 h-12 text-theme-muted mx-auto mb-3" />
          <p className="text-theme-muted text-sm">No employees assigned to you yet.</p>
          <p className="text-theme-muted/80 text-xs mt-1">Contact your admin to assign team members.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-theme-border bg-theme-bg/30">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-theme-border text-xs font-semibold text-theme-muted uppercase tracking-wider bg-theme-card-hover/50">
                <th className="py-4 px-5">#</th>
                <th className="py-4 px-5">Name</th>
                <th className="py-4 px-5">Email</th>
                <th className="py-4 px-5">Joined On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border/60 text-sm">
              {employees.map((emp, idx) => (
                <tr key={emp._id} className="hover:bg-theme-card-hover/50 transition-colors">
                  <td className="py-4 px-5 text-theme-muted font-mono text-xs">{idx + 1}</td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      {/* Avatar initials */}
                      <div className="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center text-xs font-bold shrink-0">
                        {emp.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="font-medium text-theme-bright">{emp.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-theme-text">{emp.email}</td>
                  <td className="py-4 px-5 text-theme-muted">{formatDate(emp.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
