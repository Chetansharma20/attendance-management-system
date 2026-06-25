import React, { useState } from 'react';
import {
  useGetAllDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  Department,
} from '../../redux/api/departmentApi';
import { useFetchUsersQuery } from '../../redux/api/authApi';
import {
  Building2,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  AlertTriangle,
  UserCheck,
  Users,
} from 'lucide-react';

interface EditState {
  id: string;
  name: string;
  description: string;
  managerId: string;
}

export default function DepartmentManagement() {
  const { data: departmentsResponse, isLoading, isError, refetch } = useGetAllDepartmentsQuery();
  const [createDepartment, { isLoading: isCreating }] = useCreateDepartmentMutation();
  const [updateDepartment, { isLoading: isUpdating }] = useUpdateDepartmentMutation();
  const [deleteDepartment, { isLoading: isDeleting }] = useDeleteDepartmentMutation();

  const { data: managersResponse } = useFetchUsersQuery({ role: 'manager', limit: 100 });
  const managers = managersResponse?.data?.users || [];

  // Create form state
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [managerId, setManagerId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Edit state
  const [editState, setEditState] = useState<EditState | null>(null);
  const [editError, setEditError] = useState<string>('');

  const departments: Department[] = departmentsResponse?.data || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await createDepartment({
        name: name.trim(),
        description: description.trim(),
        managerId: managerId || null,
      }).unwrap();
      setName('');
      setDescription('');
      setManagerId('');
      setSuccessMsg('Department created successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err?.data?.message || err?.error || 'Failed to create department');
    }
  };

  const handleDelete = async (id: string, deptName: string) => {
    if (!window.confirm(`Delete department "${deptName}"? This cannot be undone.`)) return;
    try {
      await deleteDepartment(id).unwrap();
    } catch (err: any) {
      alert(err?.data?.message || err?.error || 'Failed to delete department');
    }
  };

  const startEdit = (dept: Department) => {
    setEditState({
      id: dept._id,
      name: dept.name,
      description: dept.description || '',
      managerId: dept.managerId?._id || '',
    });
    setEditError('');
  };

  const cancelEdit = () => {
    setEditState(null);
    setEditError('');
  };

  const handleUpdate = async () => {
    if (!editState) return;
    setEditError('');
    try {
      await updateDepartment({
        id: editState.id,
        name: editState.name.trim(),
        description: editState.description.trim(),
        managerId: editState.managerId || null,
      }).unwrap();
      setEditState(null);
    } catch (err: any) {
      setEditError(err?.data?.message || err?.error || 'Failed to update department');
    }
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">

      {/* Left 2 Columns: Departments List */}
      <div className="lg:col-span-2 bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl space-y-6 transition-colors duration-200">
        <div className="border-b border-theme-border pb-3 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-theme-bright flex items-center gap-2">
              <Building2 className="w-5 h-5 text-violet-500" />
              Departments
            </h2>
            <p className="text-xs text-theme-muted mt-0.5">Organisational departments with assigned managers</p>
          </div>
          <button
            onClick={() => refetch()}
            className="text-xs font-semibold text-violet-650 hover:text-violet-500 cursor-pointer"
          >
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <span className="w-8 h-8 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-xs">Failed to load departments. Please try refreshing.</p>
          </div>
        ) : departments.length === 0 ? (
          <div className="py-12 text-center text-theme-muted text-sm border border-dashed border-theme-border rounded-xl bg-theme-bg/10">
            No departments created yet. Create your first department using the form →
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {departments.map((dept) => (
              <div
                key={dept._id}
                className="p-5 rounded-2xl border border-theme-border bg-theme-bg/10 hover:border-violet-500/40 hover:bg-theme-bg/25 transition-all flex flex-col gap-4"
              >
                {editState?.id === dept._id ? (
                  /* ── Inline Edit Form ── */
                  <div className="space-y-3">
                    {editError && (
                      <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        {editError}
                      </p>
                    )}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider">Name</label>
                      <input
                        type="text"
                        value={editState.name}
                        onChange={(e) => setEditState({ ...editState, name: e.target.value })}
                        className="w-full bg-theme-bg border border-theme-input-border rounded-xl px-3 py-2 text-sm text-theme-bright focus:outline-none focus:border-violet-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider">Description</label>
                      <input
                        type="text"
                        value={editState.description}
                        onChange={(e) => setEditState({ ...editState, description: e.target.value })}
                        placeholder="Optional description"
                        className="w-full bg-theme-bg border border-theme-input-border rounded-xl px-3 py-2 text-sm text-theme-bright focus:outline-none focus:border-violet-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider">Manager</label>
                      <select
                        value={editState.managerId}
                        onChange={(e) => setEditState({ ...editState, managerId: e.target.value })}
                        className="w-full bg-theme-bg border border-theme-input-border rounded-xl px-3 py-2 text-sm text-theme-bright focus:outline-none focus:border-violet-500 transition-colors"
                      >
                        <option value="">— Unassigned —</option>
                        {managers.map((m: any) => (
                          <option key={m._id} value={m._id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleUpdate}
                        disabled={isUpdating}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-xl transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {isUpdating ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 border border-theme-border hover:bg-theme-card-hover text-theme-muted hover:text-theme-bright text-xs font-bold py-2 rounded-xl transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Display Card ── */
                  <>
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1 min-w-0">
                        <span className="text-sm font-bold text-theme-bright flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-violet-500 shrink-0" />
                          <span className="truncate">{dept.name}</span>
                        </span>
                        {dept.description && (
                          <p className="text-xs text-theme-muted pl-6 leading-relaxed">{dept.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(dept)}
                          className="p-1.5 text-violet-500 hover:bg-violet-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Edit department"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(dept._id, dept.name)}
                          disabled={isDeleting}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete department"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-theme-border/40">
                      {dept.managerId ? (
                        <div className="flex items-center gap-2 text-xs text-theme-muted">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>
                            Manager:{' '}
                            <strong className="text-theme-bright font-semibold">
                              {dept.managerId.name}
                            </strong>
                            <span className="ml-1 text-theme-muted/70">({dept.managerId.email})</span>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                          <Users className="w-3.5 h-3.5 shrink-0" />
                          <span>No manager assigned</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right 1 Column: Create Department Form */}
      <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl space-y-6 transition-colors duration-200 self-start">
        <div>
          <h2 className="text-lg font-bold text-theme-bright">Create Department</h2>
          <p className="text-xs text-theme-muted mt-0.5">Add a new organisational department</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-muted">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering"
              className="w-full bg-theme-bg border border-theme-input-border rounded-xl px-3 py-2.5 text-sm text-theme-bright placeholder-theme-muted/50 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-muted">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Handles product development"
              className="w-full bg-theme-bg border border-theme-input-border rounded-xl px-3 py-2.5 text-sm text-theme-bright placeholder-theme-muted/50 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-muted">Assign Manager</label>
            {managers.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                No managers found. Create a manager account first.
              </p>
            ) : (
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="w-full bg-theme-bg border border-theme-input-border rounded-xl px-3 py-2.5 text-sm text-theme-bright focus:outline-none focus:border-violet-500 transition-colors"
              >
                <option value="">— Unassigned —</option>
                {managers.map((m: any) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
            )}
            <p className="text-[10px] text-theme-muted">You can assign or change the manager later.</p>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="w-full inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreating ? 'Creating...' : 'Create Department'}</span>
          </button>
        </form>
      </div>
    </section>
  );
}
