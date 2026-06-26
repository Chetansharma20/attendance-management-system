import React, { useState } from 'react';
import { 
  useFetchHolidaysQuery, 
  useCreateHolidayMutation, 
  useDeleteHolidayMutation 
} from '../../redux/api/holidayApi';
import { Calendar, Trash2, Plus, AlertCircle, RefreshCw } from 'lucide-react';

export default function HolidayManagement() {
  const { data: response, isLoading, isError, refetch } = useFetchHolidaysQuery();
  const [createHoliday, { isLoading: isCreating }] = useCreateHolidayMutation();
  const [deleteHoliday, { isLoading: isDeleting }] = useDeleteHolidayMutation();

  const [form, setForm] = useState({ name: '', date: '', type: 'public', description: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const holidays = response?.data || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!form.name.trim() || !form.date) {
      setErrorMsg('Name and date are required fields.');
      return;
    }

    try {
      await createHoliday(form).unwrap();
      setSuccessMsg('Holiday created successfully.');
      setForm({ name: '', date: '', type: 'public', description: '' });
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to create holiday.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;
    try {
      await deleteHoliday(id).unwrap();
      setSuccessMsg('Holiday deleted successfully.');
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to delete holiday.');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Create Holiday Form */}
      <section className="lg:col-span-1 bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl space-y-6 h-fit transition-colors duration-200">
        <div>
          <h2 className="text-lg font-bold text-theme-bright">Add New Holiday</h2>
          <p className="text-xs text-theme-muted">Schedule a new company public holiday</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-theme-muted">Holiday Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. New Year's Day"
              className="w-full bg-theme-bg border border-theme-input-border text-theme-text rounded-lg px-3 py-2 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-theme-muted">Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full bg-theme-bg border border-theme-input-border text-theme-text rounded-lg px-3 py-2 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors text-sm cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-theme-muted">Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full bg-theme-bg border border-theme-input-border text-theme-text rounded-lg px-3 py-2 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors text-sm cursor-pointer"
              >
                <option value="public">Public</option>
                <option value="restricted">Restricted</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-theme-muted">Description (Optional)</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Provide holiday details..."
              className="w-full bg-theme-bg border border-theme-input-border text-theme-text rounded-lg px-3 py-2 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors text-sm resize-none"
            />
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 p-3 rounded-lg text-xs">
              ✨ {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isCreating}
            className="w-full inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreating ? 'Adding...' : 'Add Holiday'}</span>
          </button>
        </form>
      </section>

      {/* Holiday Directory List */}
      <section className="lg:col-span-2 bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl space-y-6 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-theme-bright">Holiday List</h2>
              <p className="text-xs text-theme-muted">All scheduled company holidays for this calendar year</p>
            </div>
          </div>
          
          <button
            onClick={() => refetch()}
            className="p-2 text-theme-muted hover:text-theme-bright hover:bg-theme-card-hover rounded-lg transition-colors cursor-pointer"
            title="Refresh holidays"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <span className="w-8 h-8 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Failed to fetch holidays list.</span>
          </div>
        ) : holidays.length === 0 ? (
          <div className="py-14 text-center">
            <Calendar className="w-12 h-12 text-theme-muted mx-auto mb-3" />
            <p className="text-theme-muted text-sm">No holidays are currently scheduled.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-theme-border bg-theme-bg/30">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-theme-border text-xs font-semibold text-theme-muted uppercase tracking-wider bg-theme-card-hover/50">
                  <th className="py-4 px-5">Holiday</th>
                  <th className="py-4 px-5">Date</th>
                  <th className="py-4 px-5">Type</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/60 text-sm">
                {holidays.map((h: any) => (
                  <tr key={h._id} className="hover:bg-theme-card-hover/40 transition-colors">
                    <td className="py-4 px-5 font-semibold text-theme-bright">{h.name}</td>
                    <td className="py-4 px-5 text-theme-text">{formatDate(h.date)}</td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        h.type === 'public' 
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' 
                          : h.type === 'restricted'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20'
                      }`}>
                        {h.type}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => handleDelete(h._id)}
                        disabled={isDeleting}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete holiday"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}
