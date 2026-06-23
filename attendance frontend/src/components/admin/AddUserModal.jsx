/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { X, UserPlus, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useRegisterMutation, useFetchUsersQuery } from '../../redux/api/authApi.js';
import { useGetShiftsQuery } from '../../redux/api/settingsApi.js';

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'employee',
  managerId: '',
  shiftId: '',
};

export default function AddUserModal({ isOpen, onClose }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [register, { isLoading }] = useRegisterMutation();

  const { data: managersResponse } = useFetchUsersQuery({ role: 'manager', limit: 100 });
  const managers = managersResponse?.data?.users || [];

  const { data: shiftsResponse } = useGetShiftsQuery();
  const shifts = shiftsResponse?.data || [];

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL_FORM);
      setFormError('');
      setSuccessMsg('');
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      // clear managerId if role changes away from employee
      ...(name === 'role' && value !== 'employee' ? { managerId: '' } : {}),
    }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
      ...(form.role === 'employee' ? { managerId: form.managerId } : {}),
      shiftId: form.shiftId || null,
    };

    try {
      await register(payload).unwrap();
      setSuccessMsg(`User "${form.name}" registered successfully!`);
      setForm(INITIAL_FORM);
    } catch (err) {
      setFormError(err?.data?.message || err?.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-slate-950/80 backdrop-blur-sm transition-colors duration-200">
      <div className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transition-colors duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border bg-theme-bg/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-lg">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-theme-bright">Add New User</h3>
          </div>
          <button
            onClick={onClose}
            className="text-theme-muted hover:text-theme-bright p-1.5 hover:bg-theme-card-hover rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Success */}
          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
              <span className="mt-0.5">✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error */}
          {formError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-text uppercase tracking-wider">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              autoComplete="off"
              className="w-full bg-theme-bg border border-theme-input-border rounded-xl px-4 py-2.5 text-sm text-theme-bright placeholder-theme-muted/50 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-text uppercase tracking-wider">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. john@company.com"
              autoComplete="off"
              className="w-full bg-theme-bg border border-theme-input-border rounded-xl px-4 py-2.5 text-sm text-theme-bright placeholder-theme-muted/50 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-text uppercase tracking-wider">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="enter password"
                autoComplete="new-password"
                className="w-full bg-theme-bg border border-theme-input-border rounded-xl px-4 py-2.5 pr-10 text-sm text-theme-bright placeholder-theme-muted/50 focus:outline-none focus:border-violet-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-bright transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-text uppercase tracking-wider">
              Role (Choose Employee or Manager) <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              required
              value={form.role}
              onChange={handleChange}
              className="w-full bg-theme-bg border border-theme-input-border rounded-xl px-4 py-2.5 text-sm text-theme-bright focus:outline-none focus:border-violet-500 transition-colors"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          {/* Manager (only when role = employee) */}
          {form.role === 'employee' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-theme-text uppercase tracking-wider">
                Assign Manager (Manager who will approve attendance & overtime) <span className="text-red-500">*</span>
              </label>
              {managers.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  No managers found. Create a manager account first.
                </p>
              ) : (
                <select
                  name="managerId"
                  required
                  value={form.managerId}
                  onChange={handleChange}
                  className="w-full bg-theme-bg border border-theme-input-border rounded-xl px-4 py-2.5 text-sm text-theme-bright focus:outline-none focus:border-violet-500 transition-colors"
                >
                  <option value="">— Select a Manager —</option>
                  {managers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Shift Assignment Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-text uppercase tracking-wider">
              Assign Work Shift
            </label>
            <select
              name="shiftId"
              value={form.shiftId}
              onChange={handleChange}
              className="w-full bg-theme-bg border border-theme-input-border rounded-xl px-4 py-2.5 text-sm text-theme-bright focus:outline-none focus:border-violet-500 transition-colors"
            >
              <option value="">— Use Global Settings Timing —</option>
              {shifts.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.startTime} - {s.endTime})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-theme-muted">
              Select a custom shift layout, or leave blank to fall back to the default company schedule.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-theme-border hover:bg-theme-card-hover text-theme-text hover:text-theme-bright rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create User</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
