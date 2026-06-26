import React, { useState } from 'react';
import {
  useGetLeavePolicyQuery,
  useUpdateLeavePolicyMutation,
  useGetAllLeaveBalancesQuery,
  useUpdateLeaveBalanceMutation,
  useGetAllLeavesQuery,
  useUpdateLeaveStatusMutation,
} from '../../redux/api/leaveApi';
import { Settings, BarChart3, ListOrdered, Save, Download } from 'lucide-react';
import { exportToCsv } from '../../utils/csvExport';

const TABS = ['Policy', 'Balances', 'All Leaves'];
const LEAVE_ICONS: Record<string, string> = { sick: '🤒', casual: '☀️', earned: '🏖️', unpaid: '📋' };

const STATUS_STYLES = {
  pending: {
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
    label: 'Pending'
  },
  approved: {
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
    label: 'Approved'
  },
  rejected: {
    badge: 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20',
    label: 'Rejected'
  },
};

interface PolicyForm {
  sick: string | number;
  casual: string | number;
  earned: string | number;
  [key: string]: string | number;
}

// ─── Policy Tab ───────────────────────────────────────────────────────────────
function PolicyTab() {
  const { data, isLoading } = useGetLeavePolicyQuery();
  const [updatePolicy, { isLoading: saving }] = useUpdateLeavePolicyMutation();
  const [form, setForm] = useState<PolicyForm>({ sick: '', casual: '', earned: '' });
  const [msg, setMsg] = useState<string>('');

  React.useEffect(() => {
    if (data?.data) {
      setForm({ sick: data.data.sick, casual: data.data.casual, earned: data.data.earned });
    }
  }, [data]);

  const handleSave = async () => {
    setMsg('');
    try {
      await updatePolicy({
        sick: Number(form.sick),
        casual: Number(form.casual),
        earned: Number(form.earned),
      }).unwrap();
      setMsg('✅ Policy updated successfully.');
    } catch {
      setMsg('❌ Failed to update policy.');
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center items-center">
        <span className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 rounded-xl p-4 text-sm leading-relaxed">
        <strong>ℹ️ Note:</strong> Changing the policy sets new defaults for employees who haven't had any leave balance created yet this year. Existing balances are not changed automatically.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { key: 'sick', label: 'Sick Leave Days', icon: '🤒', color: 'border-red-500/40 focus:border-red-500 focus:ring-red-500/20' },
          { key: 'casual', label: 'Casual Leave Days', icon: '☀️', color: 'border-blue-500/40 focus:border-blue-500 focus:ring-blue-500/20' },
          { key: 'earned', label: 'Earned Leave Days', icon: '🏖️', color: 'border-emerald-500/40 focus:border-emerald-500 focus:ring-emerald-500/20' },
        ].map(({ key, label, icon, color }) => (
          <div key={key} className="bg-theme-bg/40 border border-theme-border rounded-xl p-5 flex flex-col items-center text-center">
            <div className="text-4xl mb-2">{icon}</div>
            <div className="text-xs font-semibold text-theme-bright mb-3">{label}</div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="365"
                value={form[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                className={`w-20 bg-theme-bg text-theme-bright font-extrabold text-xl text-center rounded-lg px-2 py-1.5 border outline-none transition-all ${color}`}
              />
              <span className="text-xs text-theme-muted font-medium">days</span>
            </div>
          </div>
        ))}
      </div>

      {msg && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          msg.startsWith('✅')
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400'
        }`}>
          {msg}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 text-sm"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Saving…' : 'Save Policy'}
      </button>
    </div>
  );
}

// ─── Balances Tab ─────────────────────────────────────────────────────────────
function BalancesTab() {
  const { data, isLoading } = useGetAllLeaveBalancesQuery();
  const [updateBalance] = useUpdateLeaveBalanceMutation();
  const [editMap, setEditMap] = useState<Record<string, Record<string, string>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const balances = data?.data || [];

  const getEdit = (id: string, key: string, fallback: any) => editMap[id]?.[key] ?? fallback;

  const setEdit = (id: string, key: string, val: string) =>
    setEditMap((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [key]: val } }));

  const handleSave = async (user: any, balance: any) => {
    setSavingId(user._id);
    try {
      await updateBalance({
        employeeId: user._id,
        sick: Number(getEdit(user._id, 'sick', balance.sick)),
        casual: Number(getEdit(user._id, 'casual', balance.casual)),
        earned: Number(getEdit(user._id, 'earned', balance.earned)),
      }).unwrap();
      setSavedId(user._id);
      setTimeout(() => setSavedId(null), 2000);
    } catch {
      alert('Failed to update balance.');
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center items-center">
        <span className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-theme-border bg-theme-bg/30">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-theme-border text-xs font-semibold text-theme-muted uppercase tracking-wider bg-theme-card-hover/50">
            <th className="py-3.5 px-5">Employee</th>
            <th className="py-3.5 px-5">Role</th>
            <th className="py-3.5 px-5">🤒 Sick</th>
            <th className="py-3.5 px-5">☀️ Casual</th>
            <th className="py-3.5 px-5">🏖️ Earned</th>
            <th className="py-3.5 px-5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-theme-border/60 text-sm">
          {balances.map(({ user, balance }: any) => (
            <tr key={user._id} className="hover:bg-theme-card-hover/40 transition-colors">
              <td className="py-3.5 px-5">
                <div className="font-semibold text-theme-bright">{user.name}</div>
                <div className="text-xs text-theme-muted">{user.email}</div>
              </td>
              <td className="py-3.5 px-5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold capitalize ${
                  user.role === 'manager'
                    ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20'
                    : 'bg-theme-bg border border-theme-border text-theme-text'
                }`}>
                  {user.role}
                </span>
              </td>
              {['sick', 'casual', 'earned'].map((type) => (
                <td key={type} className="py-3.5 px-5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      value={getEdit(user._id, type, balance[type])}
                      onChange={(e) => setEdit(user._id, type, e.target.value)}
                      className="w-14 bg-theme-bg border border-theme-input-border text-theme-bright font-bold text-center rounded-lg px-1.5 py-1 outline-none focus:border-violet-500 transition-colors text-sm"
                    />
                    <span className="text-xs text-theme-muted font-medium">/ {balance[`${type}Total`]}</span>
                  </div>
                </td>
              ))}
              <td className="py-3.5 px-5 text-right">
                <button
                  onClick={() => handleSave(user, balance)}
                  disabled={savingId === user._id}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all active:scale-95 cursor-pointer ${
                    savedId === user._id ? 'bg-emerald-600' : 'bg-violet-600 hover:bg-violet-750'
                  }`}
                >
                  {savingId === user._id ? '…' : savedId === user._id ? '✓ Saved' : 'Save'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── All Leaves Tab ───────────────────────────────────────────────────────────
function AllLeavesTab() {
  const [page, setPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data, isLoading } = useGetAllLeavesQuery({ page, limit: 15, status: statusFilter });
  const [updateLeaveStatus, { isLoading: updating }] = useUpdateLeaveStatusMutation();
  const [rejectMap, setRejectMap] = useState<Record<string, string>>({});

  const leaves = data?.data?.leaves || [];
  const pagination = data?.data?.pagination;

  const handleAction = async (leaveId: string, status: string) => {
    if (status === 'rejected') {
      const reason = rejectMap[leaveId];
      if (!reason?.trim()) { alert('Please enter a rejection reason.'); return; }
      try {
        await updateLeaveStatus({ leaveId, status, rejectionReason: reason }).unwrap();
        setRejectMap((p) => { const n = { ...p }; delete n[leaveId]; return n; });
      } catch (err: any) { alert(err?.data?.message || 'Failed.'); }
    } else {
      try {
        await updateLeaveStatus({ leaveId, status }).unwrap();
      } catch (err: any) { alert(err?.data?.message || 'Failed.'); }
    }
  };

  const handleExportCsv = () => {
    if (leaves.length === 0) return;

    const columns = [
      { label: 'Employee Name', key: 'employeeId', format: (val: any) => val?.name || 'Unknown' },
      { label: 'Employee Email', key: 'employeeId', format: (val: any) => val?.email || '-' },
      { label: 'Leave Type', key: 'leaveType' },
      { label: 'Start Date', key: 'startDate', format: (val: any) => new Date(val).toLocaleDateString() },
      { label: 'End Date', key: 'endDate', format: (val: any) => new Date(val).toLocaleDateString() },
      { label: 'Total Days', key: 'totalDays' },
      { label: 'Reason', key: 'reason' },
      { label: 'Status', key: 'status' },
      { label: 'Rejection Reason', key: 'rejectionReason' },
    ];

    exportToCsv(`all-employee-leaves-${new Date().toISOString().split('T')[0]}.csv`, leaves, columns);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-4 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                statusFilter === s
                  ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/10'
                  : 'bg-theme-card border-theme-border text-theme-muted hover:text-theme-bright hover:bg-theme-card-hover'
              }`}
            >
              <span className="capitalize">{s}</span>
            </button>
          ))}
        </div>
        
        <button
          onClick={handleExportCsv}
          disabled={leaves.length === 0}
          className="inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export leaves to CSV"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center items-center">
          <span className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : leaves.length === 0 ? (
        <div className="text-center py-12 text-theme-muted text-sm border border-dashed border-theme-border rounded-xl">
          No leave records found.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-theme-border bg-theme-bg/30">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-theme-border text-xs font-semibold text-theme-muted uppercase tracking-wider bg-theme-card-hover/50">
                  <th className="py-3.5 px-5">Employee</th>
                  <th className="py-3.5 px-5">Type</th>
                  <th className="py-3.5 px-5">Dates</th>
                  <th className="py-3.5 px-5 text-center">Days</th>
                  <th className="py-3.5 px-5">Reason</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/60 text-sm">
                {leaves.map((leave: any) => {
                  const s = (STATUS_STYLES as any)[leave.status] || STATUS_STYLES.pending;
                  return (
                    <tr key={leave._id} className="hover:bg-theme-card-hover/40 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-theme-bright">{leave.employeeId?.name || '—'}</div>
                        <div className="text-xs text-theme-muted">{leave.employeeId?.email || ''}</div>
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-theme-bright capitalize">
                        {LEAVE_ICONS[leave.leaveType] || '📋'} {leave.leaveType}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="text-theme-bright font-medium">{new Date(leave.startDate).toLocaleDateString()}</div>
                        <div className="text-[11px] text-theme-muted">→ {new Date(leave.endDate).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3.5 px-5 text-center font-bold text-theme-bright">{leave.totalDays}</td>
                      <td className="py-3.5 px-5 text-theme-text max-w-xs truncate" title={leave.reason}>{leave.reason}</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${s.badge}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {leave.status === 'pending' && (
                          <div className="inline-flex flex-col gap-2 items-end">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAction(leave._id, 'approved')}
                                disabled={updating}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleAction(leave._id, 'rejected')}
                                disabled={updating}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-700 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                            <input
                              type="text"
                              placeholder="Rejection reason…"
                              value={rejectMap[leave._id] || ''}
                              onChange={(e) => setRejectMap((p) => ({ ...p, [leave._id]: e.target.value }))}
                              className="w-40 bg-theme-bg border border-theme-input-border text-theme-text rounded-lg px-2.5 py-1 outline-none focus:border-violet-500 transition-colors text-[11px]"
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-1.5 rounded-lg border border-theme-border text-xs font-semibold bg-theme-card text-theme-text hover:bg-theme-card-hover transition-colors disabled:opacity-50 cursor-pointer"
              >
                ← Prev
              </button>
              <span className="text-xs text-theme-muted font-medium">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-4 py-1.5 rounded-lg border border-theme-border text-xs font-semibold bg-theme-card text-theme-text hover:bg-theme-card-hover transition-colors disabled:opacity-50 cursor-pointer"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LeaveManagement() {
  const [activeTab, setActiveTab] = useState<string>('Policy');

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Tab Bar */}
      <div className="flex gap-1.5 bg-theme-bg/60 border border-theme-border/60 rounded-xl p-1 w-fit">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-theme-card text-violet-600 dark:text-violet-400 shadow-md shadow-violet-500/5'
                  : 'text-theme-muted hover:text-theme-bright'
              }`}
            >
              {tab === 'Policy' && <Settings className="w-3.5 h-3.5" />}
              {tab === 'Balances' && <BarChart3 className="w-3.5 h-3.5" />}
              {tab === 'All Leaves' && <ListOrdered className="w-3.5 h-3.5" />}
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl transition-colors duration-200">
        {activeTab === 'Policy' && <PolicyTab />}
        {activeTab === 'Balances' && <BalancesTab />}
        {activeTab === 'All Leaves' && <AllLeavesTab />}
      </div>
    </div>
  );
}
