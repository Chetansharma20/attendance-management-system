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
    <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">My Team</h2>
            <p className="text-xs text-slate-400">
              {isLoading ? 'Loading...' : `${employees.length} employee${employees.length !== 1 ? 's' : ''} under your management`}
            </p>
          </div>
        </div>
        <button
          onClick={refetch}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
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
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Failed to load team</p>
            <p className="text-xs text-slate-400">{error?.data?.message || error?.error || 'Unknown error'}</p>
          </div>
        </div>
      ) : employees.length === 0 ? (
        <div className="py-14 text-center">
          <UserCheck className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No employees assigned to you yet.</p>
          <p className="text-slate-600 text-xs mt-1">Contact your admin to assign team members.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-slate-950/40">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/30">
                <th className="py-4 px-5">#</th>
                <th className="py-4 px-5">Name</th>
                <th className="py-4 px-5">Email</th>
                <th className="py-4 px-5">Joined On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-sm">
              {employees.map((emp, idx) => (
                <tr key={emp._id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="py-4 px-5 text-slate-500 font-mono text-xs">{idx + 1}</td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      {/* Avatar initials */}
                      <div className="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold shrink-0">
                        {emp.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="font-medium text-white">{emp.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-300">{emp.email}</td>
                  <td className="py-4 px-5 text-slate-400">{formatDate(emp.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
