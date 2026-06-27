import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetchUsersQuery } from '../../redux/api/authApi';
import { Users as UsersIcon, RefreshCw, AlertCircle, UserPlus, Search } from 'lucide-react';
import AddUserModal from './AddUserModal';
import EmployeeProfileModal from './EmployeeProfileModal';
import Pagination from '../common/Pagination.jsx';

interface Shift {
  _id: string;
  name: string;
}

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  shiftId?: Shift;
  createdAt: string;
}

export default function UsersList() {
  const navigate = useNavigate();
  const [roleFilter, setRoleFilter] = React.useState<string>('all');
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [showAddModal, setShowAddModal] = React.useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = React.useState<boolean>(false);
  
  const [searchVal, setSearchVal] = React.useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>('');

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchVal);
      setCurrentPage(1);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchVal]);

  const {
    data: usersResponse,
    isLoading: isUsersLoading,
    isError: isUsersError,
    error: usersError,
    refetch: refetchUsers,
  } = useFetchUsersQuery({ role: roleFilter, page: currentPage, limit: 10, search: debouncedSearch });

  const users: UserItem[] = usersResponse?.data?.users || [];
  const pagination = usersResponse?.data?.pagination;

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1); // Reset page to 1 on filter change
  };

  const formatDate = (dateStr: string) => {
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

  const getErrorMsg = (err: any) => {
    return err?.data?.message || err?.error || 'Unknown error';
  };

  const handleRowClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <>
      <AddUserModal isOpen={showAddModal} onClose={handleModalClose} />
      <EmployeeProfileModal 
        userId={selectedUserId || ''} 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />

      <section className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl space-y-6 transition-colors duration-200">

        {/* Unified Header Toolbar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-theme-border/60 pb-5">
          {/* Left side: Icon + Title & Description */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl">
              <UsersIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-theme-bright">Employee Directory</h2>
              <p className="text-xs text-theme-muted">All registered employees and managers (Click a row to view details)</p>
            </div>
          </div>

          {/* Right side: Unified Controls (Search, Filter, Refresh, Add) */}
          <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] sm:flex-initial">
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full sm:w-60 bg-theme-bg/40 border border-theme-border/80 focus:border-violet-500 rounded-xl pl-9 pr-3 py-2 text-sm text-theme-bright focus:outline-none transition-all placeholder:text-theme-muted"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            </div>

            {/* Filter select */}
            <select
              value={roleFilter}
              onChange={handleRoleChange}
              className="bg-theme-bg/40 border border-theme-border/80 focus:border-violet-500 rounded-xl px-3 py-2 text-sm text-theme-bright focus:outline-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="employee">Employees</option>
              <option value="manager">Managers</option>
            </select>

            {/* Refresh */}
            <button
              onClick={() => refetchUsers()}
              className="p-2.5 text-theme-muted hover:text-theme-bright hover:bg-theme-bg/80 border border-theme-border/80 rounded-xl transition-colors cursor-pointer"
              title="Refresh users"
            >
              <RefreshCw className={`w-4 h-4 ${isUsersLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Add Employee */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-md shadow-violet-500/10"
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
              <p className="text-xs text-theme-muted">{getErrorMsg(usersError)}</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="py-14 text-center">
            <UsersIcon className="w-12 h-12 text-theme-muted mx-auto mb-3" />
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
                    <th className="py-4 px-5 w-1/4">Email</th>
                    <th className="py-4 px-5 w-1/6">Role</th>
                    <th className="py-4 px-5 w-1/6">Shift</th>
                    <th className="py-4 px-5 w-1/6">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/60 text-sm">
                  {users.map((u) => (
                    <tr 
                      key={u._id} 
                      onClick={() => handleRowClick(u._id)}
                      className="hover:bg-theme-card-hover/70 transition-colors cursor-pointer"
                    >
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
                      <td className="py-4 px-5 text-theme-text font-medium">
                        {u.shiftId?.name || (
                          <span className="text-theme-muted italic font-normal">Default</span>
                        )}
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
                <div 
                  key={u._id} 
                  onClick={() => handleRowClick(u._id)}
                  className="bg-theme-bg/20 border border-theme-border rounded-xl p-4 space-y-3 transition-colors duration-200 cursor-pointer hover:bg-theme-card-hover/20"
                >
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
                      <span className="text-theme-muted font-medium">Shift: </span>
                      {u.shiftId?.name || <span className="text-theme-muted italic">Default Timings</span>}
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
