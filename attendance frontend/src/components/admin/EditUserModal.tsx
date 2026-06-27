import React, { useState, useEffect } from 'react';
import { X, Edit, Loader2, AlertCircle } from 'lucide-react';
import { useUpdateUserMutation, useFetchUsersQuery, useUploadProfilePicMutation } from '../../redux/api/authApi';
import { useGetShiftsQuery } from '../../redux/api/settingsApi';
import { useGetAllDepartmentsQuery } from '../../redux/api/departmentApi';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    managerId?: any;
    shiftId?: any;
    departmentId?: any;
  } | null;
}

interface EditForm {
  name: string;
  email: string;
  role: string;
  managerId: string;
  shiftId: string;
  departmentId: string;
}

export default function EditUserModal({ isOpen, onClose, user }: EditUserModalProps) {
  const [form, setForm] = useState<EditForm>({
    name: '',
    email: '',
    role: 'employee',
    managerId: '',
    shiftId: '',
    departmentId: '',
  });
  const [formError, setFormError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [updateUser, { isLoading }] = useUpdateUserMutation();
  const [uploadProfilePic, { isLoading: isUploadingPic }] = useUploadProfilePicMutation();

  const { data: managersResponse } = useFetchUsersQuery({ role: 'manager', limit: 100 });
  const managers = managersResponse?.data?.users || [];

  const { data: shiftsResponse } = useGetShiftsQuery();
  const shifts = shiftsResponse?.data || [];

  const { data: departmentsResponse } = useGetAllDepartmentsQuery();
  const departments = departmentsResponse?.data || [];

  // Populate form on open or when user changes
  useEffect(() => {
    if (isOpen && user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'employee',
        managerId: typeof user.managerId === 'object' ? user.managerId?._id || '' : user.managerId || '',
        shiftId: typeof user.shiftId === 'object' ? user.shiftId?._id || '' : user.shiftId || '',
        departmentId: typeof user.departmentId === 'object' ? user.departmentId?._id || '' : user.departmentId || '',
      });
      setSelectedFile(null);
      setFormError('');
      setSuccessMsg('');
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      // clear managerId if role changes away from employee
      ...(name === 'role' && value !== 'employee' ? { managerId: '' } : {}),
    }));
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    const payload = {
      id: user._id,
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      managerId: form.role === 'employee' ? (form.managerId || null) : null,
      shiftId: form.shiftId || null,
      departmentId: form.departmentId || null,
    };

    try {
      await updateUser(payload).unwrap();
      
      // Upload photo if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('profilePic', selectedFile);
        formData.append('userId', user._id);
        await uploadProfilePic(formData).unwrap();
      }

      onClose();
    } catch (err: any) {
      setFormError(err?.data?.message || err?.error || 'Update failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-slate-950/80 backdrop-blur-sm transition-colors duration-200">
      <div className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transition-colors duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border bg-theme-bg/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-lg">
              <Edit className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-theme-bright">Edit User Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="text-theme-muted hover:text-theme-bright p-1.5 hover:bg-theme-card-hover rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          
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

          {/* Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-text uppercase tracking-wider">
              Role <span className="text-red-500">*</span>
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
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Manager (only when role = employee) */}
          {form.role === 'employee' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-theme-text uppercase tracking-wider">
                Assign Manager <span className="text-red-500">*</span>
              </label>
              {managers.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  No managers found.
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
                  {managers.filter((m: any) => m._id !== user._id).map((m: any) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Profile Photo Upload */}
          <div className="flex flex-col gap-1.5 pt-2">
            <label className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Profile Photo (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full bg-theme-bg border border-theme-input-border text-theme-text rounded-xl px-3 py-2 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-violet-500/10 file:text-violet-600 dark:file:text-violet-400 hover:file:bg-violet-500/20"
            />
          </div>

          {/* Department Assignment */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-text uppercase tracking-wider">
              Assign Department
            </label>
            {departments.length === 0 ? (
              <p className="text-xs text-theme-muted bg-theme-bg border border-theme-input-border rounded-lg px-3 py-2">
                No departments created yet.
              </p>
            ) : (
              <select
                name="departmentId"
                value={form.departmentId}
                onChange={handleChange}
                className="w-full bg-theme-bg border border-theme-input-border rounded-xl px-4 py-2.5 text-sm text-theme-bright focus:outline-none focus:border-violet-500 transition-colors"
              >
                <option value="">— No Department —</option>
                {departments.map((d: any) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
          </div>

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
              {shifts.map((s: any) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.startTime} - {s.endTime})
                </option>
              ))}
            </select>
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
              disabled={isLoading || isUploadingPic}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              {(isLoading || isUploadingPic) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
