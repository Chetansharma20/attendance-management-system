import React, { useState, useMemo } from 'react';
import {
  useGetMyLeavesQuery,
  useGetMyLeaveBalanceQuery,
  useApplyLeaveMutation,
  useGetLeavePolicyQuery,
} from '../../redux/api/leaveApi';
import { Calendar, Briefcase, PlusCircle, History, Download } from 'lucide-react';
import { exportToCsv } from '../../utils/csvExport';
import { useFetchHolidaysQuery } from '../../redux/api/holidayApi';

interface LeaveColorInfo {
  cardBg: string;
  barBg: string;
  text: string;
  icon: string;
}

const LEAVE_COLORS: Record<string, LeaveColorInfo> = {
  sick: {
    cardBg: 'bg-red-500/10 dark:bg-red-500/5 border border-red-500/20',
    barBg: 'bg-red-500',
    text: 'text-red-700 dark:text-red-400',
    icon: '🤒'
  },
  casual: {
    cardBg: 'bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20',
    barBg: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-400',
    icon: '☀️'
  },
  earned: {
    cardBg: 'bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20',
    barBg: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400',
    icon: '🏖️'
  },
};

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

const countWeekdays = (start: string, end: string, holidays: any[] = []): number => {
  if (!start || !end) return 0;
  let count = 0;
  const s = new Date(start);
  const e = new Date(end);
  s.setHours(0, 0, 0, 0);
  e.setHours(23, 59, 59, 999);
  if (e < s) return 0;

  // Set holiday dates to start of day for comparison
  const holidayDates = holidays.map(h => {
    const d = new Date(h.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

  const cur = new Date(s);
  while (cur <= e) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) {
      const curTime = cur.getTime();
      const isHoliday = holidayDates.includes(curTime);
      if (!isHoliday) {
        count++;
      }
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

interface ApplyForm {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  isHalfDay?: boolean;
}

export default function MyLeaves() {
  const { data: leavesData, isLoading: leavesLoading } = useGetMyLeavesQuery();
  const { data: balanceData, isLoading: balanceLoading } = useGetMyLeaveBalanceQuery();
  const { data: policyData } = useGetLeavePolicyQuery();
  const { data: holidaysResponse } = useFetchHolidaysQuery();
  const [applyLeave, { isLoading: applying }] = useApplyLeaveMutation();

  const [form, setForm] = useState<ApplyForm>({ leaveType: 'sick', startDate: '', endDate: '', reason: '' });
  const [isSingleDay, setIsSingleDay] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<string>('');

  const leaves = leavesData?.data || [];
  const balance = balanceData?.data;
  const policy = policyData?.data;
  const holidaysList = holidaysResponse?.data || [];

  const previewDays = useMemo(() => {
    if (form.isHalfDay) return 0.5;
    return countWeekdays(form.startDate, form.endDate, holidaysList);
  }, [form.startDate, form.endDate, form.isHalfDay, holidaysList]);

  const handleExportCsv = () => {
    if (leaves.length === 0) return;

    const columns = [
      { label: 'Leave Type', key: 'leaveType' },
      { label: 'Start Date', key: 'startDate', format: (val: any) => new Date(val).toLocaleDateString() },
      { label: 'End Date', key: 'endDate', format: (val: any) => new Date(val).toLocaleDateString() },
      { label: 'Total Days', key: 'totalDays' },
      { label: 'Reason', key: 'reason' },
      { label: 'Status', key: 'status' },
      { label: 'Rejection Reason', key: 'rejectionReason' },
    ];

    exportToCsv(`my-leave-history-${new Date().toISOString().split('T')[0]}.csv`, leaves, columns);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: name === 'isHalfDay' ? (e.target as HTMLInputElement).checked : value };
      if (isSingleDay && name === 'startDate') {
        updated.endDate = value;
      }
      return updated;
    });
    setFormError('');
    setFormSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      setFormError('All fields are required.');
      return;
    }
    if (previewDays < 0.5) {
      setFormError('Please select at least a half working day (Mon–Fri).');
      return;
    }
    try {
      await applyLeave(form).unwrap();
      setFormSuccess('Leave application submitted successfully!');
      setForm({ leaveType: 'sick', startDate: '', endDate: '', reason: '', isHalfDay: false });
    } catch (err: any) {
      setFormError(err?.data?.message || 'Failed to submit leave request.');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* ── Balance Cards ─────────────────────────────────────────────────── */}
      <section className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl transition-colors duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl border border-violet-500/20">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-theme-bright">Leave Balance</h2>
            <p className="text-xs text-theme-muted">Your available leave quotas for the current year</p>
          </div>
        </div>

        {balanceLoading ? (
          <div className="py-12 flex justify-center items-center">
            <span className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {['sick', 'casual', 'earned'].map((type) => {
              const c = LEAVE_COLORS[type];
              const remaining = balance ? balance[type] : (policy ? policy[type] : 0);
              const total = balance ? balance[`${type}Total`] : (policy ? policy[type] : 0);
              const pct = total > 0 ? Math.min(100, Math.round((remaining / total) * 100)) : 0;
              return (
                <div key={type} className={`rounded-xl p-5 flex flex-col items-start ${c.cardBg}`}>
                  <div className="text-3xl mb-2">{c.icon}</div>
                  <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${c.text}`}>
                    {type} Leave
                  </div>
                  <div className={`text-3xl font-extrabold mb-1 tracking-tight ${c.text}`}>
                    {remaining}
                  </div>
                  <div className={`text-[11px] font-medium opacity-80 mb-3 ${c.text}`}>
                    of {total} days remaining
                  </div>
                  <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${c.barBg}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {/* Unpaid */}
            <div className="rounded-xl p-5 flex flex-col items-start bg-theme-bg/60 border border-theme-border">
              <div className="text-3xl mb-2">📋</div>
              <div className="text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                Unpaid Leave
              </div>
              <div className="text-3xl font-extrabold text-theme-bright mb-1 tracking-tight">
                ∞
              </div>
              <div className="text-[11px] font-medium text-theme-muted mb-3">
                Unlimited
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Apply for Leave ───────────────────────────────────────────────── */}
      <section className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl transition-colors duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl border border-violet-500/20">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-theme-bright">Apply for Leave</h2>
            <p className="text-xs text-theme-muted">Submit a new leave request for manager approval</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-2xl">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="singleDay"
                checked={isSingleDay}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsSingleDay(checked);
                  if (checked && form.startDate) {
                    setForm(prev => ({ ...prev, endDate: prev.startDate }));
                  }
                  if (!checked) {
                    setForm(prev => ({ ...prev, isHalfDay: false }));
                  }
                }}
                className="rounded border-theme-input-border text-violet-600 focus:ring-violet-500 cursor-pointer w-4 h-4"
              />
              <label htmlFor="singleDay" className="text-xs font-semibold text-theme-muted cursor-pointer select-none">
                Single Day Leave
              </label>
            </div>
            
            {isSingleDay && (
              <div className="flex items-center gap-2 animate-fade-in">
                <input
                  type="checkbox"
                  id="isHalfDay"
                  name="isHalfDay"
                  checked={form.isHalfDay || false}
                  onChange={handleChange}
                  className="rounded border-theme-input-border text-violet-600 focus:ring-violet-500 cursor-pointer w-4 h-4"
                />
                <label htmlFor="isHalfDay" className="text-xs font-semibold text-theme-muted cursor-pointer select-none">
                  Half Day (0.5)
                </label>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-theme-muted">Leave Type</label>
              <select
                name="leaveType"
                value={form.leaveType}
                onChange={handleChange}
                className="w-full bg-theme-bg border border-theme-input-border text-theme-text rounded-lg px-3 py-2 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors cursor-pointer text-sm"
              >
                <option value="sick">🤒 Sick Leave</option>
                <option value="casual">☀️ Casual Leave</option>
                <option value="earned">🏖️ Earned Leave</option>
                <option value="unpaid">📋 Unpaid Leave</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-theme-muted">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                onClick={(e) => (e.target as any).showPicker?.()}
                className="w-full bg-theme-bg border border-theme-input-border text-theme-text rounded-lg px-3 py-2 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors text-sm cursor-pointer"
              />
            </div>
            {!isSingleDay && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-theme-muted">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  onClick={(e) => (e.target as any).showPicker?.()}
                  className="w-full bg-theme-bg border border-theme-input-border text-theme-text rounded-lg px-3 py-2 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors text-sm cursor-pointer"
                />
              </div>
            )}
          </div>

          {form.startDate && form.endDate && (
            <div className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 rounded-lg px-4 py-2.5 text-sm inline-flex items-center gap-2 self-start font-medium">
              <Calendar className="w-4 h-4" />
              <span>
                Selected <strong>{previewDays}</strong> working day{previewDays !== 1 ? 's' : ''} (weekends excluded)
              </span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-theme-muted">Reason</label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              rows={3}
              placeholder="Briefly describe the reason for your leave..."
              className="w-full bg-theme-bg border border-theme-input-border text-theme-text rounded-lg px-3 py-2 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors text-sm resize-none"
            />
          </div>

          {formError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">
              ⚠️ {formError}
            </div>
          )}
          {formSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 p-3 rounded-lg text-sm">
              ✨ {formSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={applying}
            className="px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-start text-sm"
          >
            {applying ? 'Submitting…' : 'Submit Application'}
          </button>
        </form>
      </section>

      {/* ── Leave History ─────────────────────────────────────────────────── */}
      <section className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl transition-colors duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl border border-violet-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-theme-bright">My Leave History</h2>
              <p className="text-xs text-theme-muted">Status of your current and past leave applications</p>
            </div>
          </div>
          <button
            onClick={handleExportCsv}
            disabled={leaves.length === 0}
            className="inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export leaves to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        {leavesLoading ? (
          <div className="py-12 flex justify-center items-center">
            <span className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : leaves.length === 0 ? (
          <div className="py-12 text-center text-theme-muted text-sm">
            No leave records found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-theme-border bg-theme-bg/30">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-theme-border text-xs font-semibold text-theme-muted uppercase tracking-wider bg-theme-card-hover/50">
                  <th className="py-3.5 px-5">Type</th>
                  <th className="py-3.5 px-5">Start Date</th>
                  <th className="py-3.5 px-5">End Date</th>
                  <th className="py-3.5 px-5 text-center">Days</th>
                  <th className="py-3.5 px-5">Reason</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/60 text-sm">
                {leaves.map((leave: any) => {
                  const s = (STATUS_STYLES as any)[leave.status] || STATUS_STYLES.pending;
                  return (
                    <tr key={leave._id} className="hover:bg-theme-card-hover/50 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-theme-bright capitalize">
                        {(LEAVE_COLORS as any)[leave.leaveType]?.icon || '📋'} {leave.leaveType}
                      </td>
                      <td className="py-3.5 px-5 text-theme-text">
                        {new Date(leave.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-5 text-theme-text">
                        {new Date(leave.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-5 text-center font-bold text-theme-bright">
                        {leave.totalDays}
                      </td>
                      <td className="py-3.5 px-5 text-theme-text max-w-xs truncate" title={leave.reason}>
                        {leave.reason}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${s.badge}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        {leave.status === 'rejected' && leave.rejectionReason && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5 max-w-[200px]">
                            <p className="text-[11px] text-red-700 dark:text-red-400 font-bold mb-0.5">Reason:</p>
                            <p className="text-xs text-red-600 dark:text-red-300">{leave.rejectionReason}</p>
                          </div>
                        )}
                        {leave.status === 'approved' && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            Approved by {leave.approvedBy?.name || 'Manager'}
                          </span>
                        )}
                        {leave.status === 'pending' && (
                          <span className="text-xs text-theme-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
