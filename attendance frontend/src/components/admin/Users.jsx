import React from 'react';
import { useFetchUsersQuery } from '../../redux/api/authApi.js';
import { Users, RefreshCw, AlertCircle, UserPlus } from 'lucide-react';
import AddUserModal from './AddUserModal.jsx';
import Pagination from '../common/Pagination.jsx';

export default function UsersList() {
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [showAddModal, setShowAddModal] = React.useState(false);

  const {
    data: usersResponse,
    isLoading: isUsersLoading,
    isError: isUsersError,
    error: usersError,
    refetch: refetchUsers,
  } = useFetchUsersQuery({ role: roleFilter, page: currentPage, limit: 10 });

  const users = usersResponse?.data?.users || [];
  const pagination = usersResponse?.data?.pagination;

  const handleRoleChange = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1); // Reset page to 1 on filter change
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    refetchUsers(); // refresh list after adding
  };

  return (
    <>
      <AddUserModal isOpen={showAddModal} onClose={handleModalClose} />

      <section className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl space-y-6 transition-colors duration-200">

        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-theme-bright">Employee Directory</h2>
              <p className="text-xs text-theme-muted">All registered employees and managers</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Role filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-theme-text">Filter:</label>
              <select
                value={roleFilter}
                onChange={handleRoleChange}
                className="bg-theme-card border border-theme-input-border rounded-lg px-3 py-1.5 text-sm text-theme-bright focus:outline-none focus:border-violet-500 transition-colors"
              >
                <option value="all">All Roles</option>
                <option value="employee">Employees</option>
                <option value="manager">Managers</option>
              </select>
            </div>

            {/* Refresh */}
            <button
              onClick={refetchUsers}
              className="p-2 text-theme-muted hover:text-theme-bright hover:bg-theme-card-hover rounded-lg transition-colors cursor-pointer"
              title="Refresh users"
            >
              <RefreshCw className={`w-4 h-4 ${isUsersLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Add User */}
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {isUsersLoading ? (
          <div className="py-12 flex justify-center items-center">
            <span className="w-8 h-8 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : isUsersError ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Failed to load users</p>
              <p className="text-xs text-theme-muted">{usersError?.data?.message || usersError?.error || 'Unknown error'}</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="py-14 text-center">
            <Users className="w-12 h-12 text-theme-muted mx-auto mb-3" />
            <p className="text-theme-muted text-sm">No users found matching the selected filter.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-500 text-sm font-medium transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Add your first user
            </button>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto rounded-xl border border-theme-border bg-theme-bg/30">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-theme-border text-xs font-semibold text-theme-muted uppercase tracking-wider bg-theme-card-hover/50">
                    <th className="py-4 px-5 w-1/4">Name</th>
                    <th className="py-4 px-5 w-1/3">Email</th>
                    <th className="py-4 px-5 w-1/5">Role</th>
                    <th className="py-4 px-5 w-1/5">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/60 text-sm">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-theme-card-hover/50 transition-colors">
                      <td className="py-4 px-5 font-medium text-theme-bright">{u.name}</td>
                      <td className="py-4 px-5 text-theme-text">{u.email}</td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/20'
                            : u.role === 'manager'
                            ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20'
                            : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-theme-muted">{formatDate(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-4">
              {users.map((u) => (
                <div key={u._id} className="bg-theme-bg/20 border border-theme-border rounded-xl p-4 space-y-3 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-theme-bright text-sm">{u.name}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      u.role === 'admin'
                        ? 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/20'
                        : u.role === 'manager'
                        ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20'
                        : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="text-theme-text">
                      <span className="text-theme-muted font-medium">Email: </span>
                      {u.email}
                    </p>
                    <p className="text-theme-text">
                      <span className="text-theme-muted font-medium">Joined On: </span>
                      {formatDate(u.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={pagination?.totalPages || 1}
              onPageChange={setCurrentPage}
              totalItems={pagination?.total}
              limit={pagination?.limit}
            />
          </>
        )}
      </section>
    </>
  );
}
