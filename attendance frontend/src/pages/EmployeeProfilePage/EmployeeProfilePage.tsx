import React, { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetUserProfileQuery, useDeleteUserMutation, useUploadProfilePicMutation } from '../../redux/api/authApi';
import { ThemeContext } from '../../context/ThemeContext.jsx';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import EditUserModal from '../../components/admin/EditUserModal';
import { 
  ArrowLeft, Mail, Calendar, Briefcase, Clock, User, 
  CheckCircle, AlertTriangle, TrendingUp, Sun, Moon, LogOut 
} from 'lucide-react';

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const themeContext = useContext(ThemeContext);
  const { theme, toggleTheme } = themeContext || { theme: 'light', toggleTheme: () => {} };

  const [showEditModal, setShowEditModal] = React.useState<boolean>(false);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [deleteUser] = useDeleteUserMutation();
  const [uploadProfilePic, { isLoading: isUploading }] = useUploadProfilePicMutation();
  const [uploadError, setUploadError] = React.useState<string>('');

  const isAdmin = currentUser?.role === 'admin';
  const isOwnProfile = currentUser?.id === id || currentUser?._id === id;

  const { data, isLoading, error } = useGetUserProfileQuery(id || '', {
    skip: !id
  });

  const profile = data?.data;
  const user = profile?.user;
  const stats = profile?.stats;
  const recentAttendance = profile?.recentAttendance || [];
  const leaves = profile?.leaves || [];

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '-';
    return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    if (!window.confirm(`Are you sure you want to permanently delete the profile of ${user.name}? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteUser(user._id).unwrap();
      alert('User deleted successfully.');
      navigate(-1);
    } catch (err: any) {
      alert(err?.data?.message || err?.error || 'Failed to delete user.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePic', file);

    try {
      setUploadError('');
      await uploadProfilePic(formData).unwrap();
    } catch (err: any) {
      setUploadError(err?.data?.message || err?.error || 'Failed to upload image');
    }
  };

  // Base API URL to build static uploads path
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5000/api/v1';
  const serverRootUrl = apiBaseUrl.replace('/api/v1', '');

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text font-sans transition-colors duration-200 relative overflow-hidden pb-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-violet-600/5 dark:bg-violet-600/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      {user && (
        <EditUserModal 
          isOpen={showEditModal} 
          onClose={() => setShowEditModal(false)} 
          user={user} 
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-8 space-y-6">
        
        {/* Navigation & Controls header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-theme-card hover:bg-theme-card-hover border border-theme-border text-theme-muted hover:text-theme-bright transition-all cursor-pointer shadow-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-semibold">Back</span>
          </button>

          <div className="flex items-center gap-3 ml-auto">
            {isAdmin && user && user.role !== 'admin' && (
              <>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold cursor-pointer shadow-sm transition-colors"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold cursor-pointer shadow-sm transition-colors"
                >
                  Delete User
                </button>
              </>
            )}
            
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-theme-card hover:bg-theme-card-hover border border-theme-border text-theme-muted hover:text-theme-bright transition-colors cursor-pointer shadow-sm"
              title="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col justify-center items-center gap-4">
            <span className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            <p className="text-sm text-theme-muted font-medium animate-pulse">Loading profile details...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-6 rounded-2xl flex flex-col items-center text-center gap-3">
            <AlertTriangle className="w-12 h-12 shrink-0 text-red-500" />
            <div>
              <p className="font-bold text-lg">Failed to load profile details</p>
              <p className="text-sm text-theme-muted mt-1">Please try again or go back to the directory.</p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="mt-2 inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Go Back
            </button>
          </div>
        ) : user ? (
          <div className="space-y-6">
            
            {/* Profile Hero Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              {/* Overlay elements */}
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
              <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-indigo-500/20 rounded-full -mb-16 blur-xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                <div className="h-24 w-24 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white text-3xl font-extrabold border-2 border-white/20 shadow-inner shrink-0 overflow-hidden">
                  {user.profilePic ? (
                    <img 
                      src={`${serverRootUrl}${user.profilePic}`} 
                      alt={user.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    getInitials(user.name)
                  )}
                </div>
                <div className="text-center sm:text-left space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                    <h2 className="text-3xl font-black tracking-tight">{user.name}</h2>
                    <span className="w-fit self-center sm:self-auto inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md">
                      {user.role}
                    </span>
                  </div>
                  <p className="text-indigo-100 text-sm flex items-center justify-center sm:justify-start gap-2">
                    <Mail className="h-4 w-4 shrink-0 opacity-80" /> {user.email}
                  </p>
                  <p className="text-indigo-200/90 text-xs flex items-center justify-center sm:justify-start gap-2">
                    <Calendar className="h-4 w-4 shrink-0 opacity-80" /> Member since <strong>{formatDate(user.createdAt)}</strong>
                  </p>

                  {isOwnProfile && !user.profilePic && (
                    <div className="mt-3 flex flex-col items-center sm:items-start gap-1">
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/25 hover:bg-white/30 text-xs font-bold uppercase tracking-wider text-white cursor-pointer transition-colors w-fit border border-white/10">
                        {isUploading ? 'Uploading...' : 'Upload Profile Photo'}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileChange} 
                          className="hidden" 
                          disabled={isUploading} 
                        />
                      </label>
                      <p className="text-[10px] text-indigo-200">Note: Profile photos can only be uploaded once.</p>
                      {uploadError && <span className="text-xs text-red-200 font-semibold">{uploadError}</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Job Details Card */}
              <div className="md:col-span-1 bg-theme-card border border-theme-border rounded-2xl p-6 shadow-md space-y-6">
                <h3 className="text-sm font-bold text-theme-bright uppercase tracking-wider border-b border-theme-border pb-3">
                  Job details
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-violet-500 mt-0.5" />
                    <div>
                      <span className="block text-2xs font-semibold text-theme-muted uppercase tracking-wider">Department</span>
                      <span className="text-sm font-semibold text-theme-bright">{user.departmentId?.name || 'Unassigned'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-violet-500 mt-0.5" />
                    <div>
                      <span className="block text-2xs font-semibold text-theme-muted uppercase tracking-wider">Shift Schedule</span>
                      <span className="text-sm font-semibold text-theme-bright">{user.shiftId?.name || 'Default Shift'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-violet-500 mt-0.5" />
                    <div>
                      <span className="block text-2xs font-semibold text-theme-muted uppercase tracking-wider">Reports To</span>
                      <span className="text-sm font-semibold text-theme-bright">{user.managerId?.name || 'No Direct Manager'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Stats Summary */}
              <div className="md:col-span-2 bg-theme-card border border-theme-border rounded-2xl p-6 shadow-md space-y-4">
                <div className="flex items-center gap-2 border-b border-theme-border pb-3">
                  <TrendingUp className="h-4 w-4 text-violet-500" />
                  <h3 className="text-sm font-bold text-theme-bright uppercase tracking-wider">
                    This Month's Metrics Summary
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* Days Present */}
                  <div className="bg-theme-bg/30 border border-theme-border/60 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-xs font-semibold text-theme-muted">Days Present</span>
                    <span className="text-2xl font-bold text-theme-bright mt-2">{stats?.daysPresent || 0}</span>
                  </div>

                  {/* Total Hours Worked */}
                  <div className="bg-theme-bg/30 border border-theme-border/60 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-xs font-semibold text-theme-muted">Hours Worked</span>
                    <span className="text-2xl font-bold text-theme-bright mt-2">{(stats?.totalHours || 0).toFixed(1)}h</span>
                  </div>

                  {/* Late Arrivals */}
                  <div className="bg-theme-bg/30 border border-theme-border/60 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-xs font-semibold text-theme-muted">Late Arrivals</span>
                    <span className={`text-2xl font-bold mt-2 ${stats?.lateArrivals > 0 ? 'text-amber-500' : 'text-theme-bright'}`}>
                      {stats?.lateArrivals || 0}
                    </span>
                  </div>

                  {/* Early Departures */}
                  <div className="bg-theme-bg/30 border border-theme-border/60 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-xs font-semibold text-theme-muted">Early Departures</span>
                    <span className={`text-2xl font-bold mt-2 ${stats?.earlyDepartures > 0 ? 'text-amber-500' : 'text-theme-bright'}`}>
                      {stats?.earlyDepartures || 0}
                    </span>
                  </div>

                  {/* Leaves Summary */}
                  <div className="bg-theme-bg/30 border border-theme-border/60 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-xs font-semibold text-theme-muted">Leaves Approved</span>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-2xl font-bold text-theme-bright">{stats?.approvedLeaveDays || 0}d</span>
                      {stats?.pendingLeaves > 0 && (
                        <span className="text-2xs text-amber-500 font-bold">({stats.pendingLeaves} pending)</span>
                      )}
                    </div>
                  </div>

                  {/* Overtime Summary */}
                  <div className="bg-theme-bg/30 border border-theme-border/60 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-xs font-semibold text-theme-muted">Overtime Approved</span>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-2xl font-bold text-theme-bright">{(stats?.approvedOvertimeHours || 0).toFixed(1)}h</span>
                      {stats?.pendingOvertime > 0 && (
                        <span className="text-2xs text-amber-500 font-bold">({stats.pendingOvertime} pending)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Leave Request Details Table */}
            <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-md space-y-4">
              <h3 className="text-sm font-bold text-theme-bright uppercase tracking-wider flex items-center gap-2 border-b border-theme-border pb-3">
                <Calendar className="h-4 w-4 text-violet-500" />
                Leave Details
              </h3>
              
              {leaves.length === 0 ? (
                <div className="text-center py-8 text-theme-muted text-sm border border-dashed border-theme-border rounded-xl">
                  No leave records found for this employee.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-theme-border bg-theme-bg/10">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-theme-border text-xs font-semibold text-theme-muted uppercase tracking-wider bg-theme-card-hover/40">
                        <th className="py-3.5 px-5">Leave Type</th>
                        <th className="py-3.5 px-5">Duration</th>
                        <th className="py-3.5 px-5">Days</th>
                        <th className="py-3.5 px-5">Reason</th>
                        <th className="py-3.5 px-5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border/60">
                      {leaves.map((leave: any) => {
                        const statusColors: Record<string, string> = {
                          pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
                          approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
                          rejected: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        };
                        return (
                          <tr key={leave._id} className="hover:bg-theme-card-hover/30 transition-colors">
                            <td className="py-4 px-5 font-semibold text-theme-bright capitalize">
                              {leave.leaveType}
                            </td>
                            <td className="py-4 px-5 text-theme-text text-xs">
                              {new Date(leave.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              {' - '}
                              {new Date(leave.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="py-4 px-5 text-theme-bright font-medium">
                              {leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'}
                            </td>
                            <td className="py-4 px-5 text-theme-text text-xs max-w-sm truncate" title={leave.reason}>
                              {leave.reason}
                              {leave.status === 'rejected' && leave.rejectionReason && (
                                <p className="text-[10px] text-red-500 font-medium mt-1">
                                  Reason: {leave.rejectionReason}
                                </p>
                              )}
                            </td>
                            <td className="py-4 px-5">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize tracking-wide ${statusColors[leave.status] || ''}`}>
                                {leave.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Attendance Timeline / Logs */}
            <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-md space-y-4">
              <h3 className="text-sm font-bold text-theme-bright uppercase tracking-wider flex items-center gap-2 border-b border-theme-border pb-3">
                <CheckCircle className="h-4 w-4 text-violet-500" />
                Recent Attendance Log (Max 10)
              </h3>
              
              {recentAttendance.length === 0 ? (
                <div className="text-center py-8 text-theme-muted text-sm border border-dashed border-theme-border rounded-xl">
                  No attendance records found for this month.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-theme-border bg-theme-bg/10">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-theme-border text-xs font-semibold text-theme-muted uppercase tracking-wider bg-theme-card-hover/40">
                        <th className="py-3.5 px-5">Date</th>
                        <th className="py-3.5 px-5">Punch In</th>
                        <th className="py-3.5 px-5">Punch Out</th>
                        <th className="py-3.5 px-5">Hours</th>
                        <th className="py-3.5 px-5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border/60">
                      {recentAttendance.map((log: any) => {
                        const checkIn = log.punches?.find((p: any) => p.type === 'in')?.time;
                        const checkOut = log.punches?.find((p: any) => p.type === 'out')?.time;
                        const isLate = log.arrivalStatus === 'late';
                        const isEarlyOut = log.departureStatus === 'early-departure';
                        
                        return (
                          <tr key={log._id} className="hover:bg-theme-card-hover/30 transition-colors">
                            <td className="py-4 px-5 text-theme-bright font-semibold">
                              {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="py-4 px-5 text-theme-text font-mono text-xs">
                              {checkIn ? formatTime(checkIn) : '-'}
                            </td>
                            <td className="py-4 px-5 text-theme-text font-mono text-xs">
                              {checkOut ? formatTime(checkOut) : '-'}
                            </td>
                            <td className="py-4 px-5 text-theme-bright font-medium">
                              {log.workingHours ? `${log.workingHours.toFixed(2)}h` : '0h'}
                            </td>
                            <td className="py-4 px-5">
                              <div className="flex flex-wrap gap-1.5">
                                {isLate ? (
                                  <span className="inline-flex items-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 text-xs font-semibold">
                                    Late Check-in
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-xs font-semibold">
                                    On Time
                                  </span>
                                )}
                                {isEarlyOut && (
                                  <span className="inline-flex items-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-2 py-0.5 text-xs font-semibold">
                                    Early Out
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        ) : null}
      </div>
    </div>
  );
}
