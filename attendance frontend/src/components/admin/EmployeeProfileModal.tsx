import React from 'react';
import { createPortal } from 'react-dom';
import { useGetUserProfileQuery } from '../../redux/api/authApi';
import { 
  X, Mail, Calendar, Briefcase, Clock, User, Award, 
  CheckCircle, AlertTriangle, Shield, FileText, TrendingUp
} from 'lucide-react';

interface EmployeeProfileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function EmployeeProfileModal({ userId, isOpen, onClose }: EmployeeProfileModalProps) {
  const { data, isLoading, error } = useGetUserProfileQuery(userId, {
    skip: !userId || !isOpen
  });

  if (!isOpen) return null;

  const profile = data?.data;
  const user = profile?.user;
  const stats = profile?.stats;
  const recentAttendance = profile?.recentAttendance || [];

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

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        {/* Backdrop overlay */}
        <div 
          className="absolute inset-0 bg-black/50 transition-opacity backdrop-blur-sm" 
          onClick={onClose}
        ></div>

        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="pointer-events-auto w-screen max-w-2xl transform transition-transform duration-500 ease-in-out">
            <div className="flex h-full flex-col overflow-y-auto bg-white shadow-2xl">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-8 sm:px-8 relative">
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white hover:text-indigo-200 transition-colors p-2 rounded-full hover:bg-white/10"
                >
                  <X className="h-6 w-6" />
                </button>

                {isLoading ? (
                  <div className="h-24 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : error ? (
                  <div className="text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Failed to load employee details</span>
                  </div>
                ) : user ? (
                  <div className="flex items-center gap-5">
                    <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold border-2 border-white">
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white sm:text-3xl">{user.name}</h2>
                      <div className="mt-1.5 flex flex-wrap gap-2 items-center">
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 capitalize ring-1 ring-inset ring-indigo-700/10">
                          {user.role}
                        </span>
                        <span className="text-indigo-100 text-sm flex items-center gap-1">
                          <Mail className="h-4 w-4" /> {user.email}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Main Content */}
              {!isLoading && !error && user && (
                <div className="flex-1 space-y-8 px-6 py-6 sm:px-8 sm:py-8">
                  
                  {/* Job Details Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-start gap-3">
                      <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</span>
                        <span className="text-sm font-medium text-gray-900">{user.departmentId?.name || 'Unassigned'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Shift</span>
                        <span className="text-sm font-medium text-gray-900">{user.shiftId?.name || 'Unassigned'}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Manager</span>
                        <span className="text-sm font-medium text-gray-900">{user.managerId?.name || 'None'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Joined Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 border-b border-gray-100 pb-4">
                    <Calendar className="h-4 w-4" />
                    <span>Member since <strong>{formatDate(user.createdAt)}</strong></span>
                  </div>

                  {/* Performance / Stats Section */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-indigo-600" />
                      This Month's Metrics Summary
                    </h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {/* Days Present */}
                      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-gray-200 transition-all flex flex-col justify-between">
                        <span className="text-xs font-medium text-gray-500">Days Present</span>
                        <span className="text-2xl font-bold text-gray-900 mt-2">{stats?.daysPresent || 0}</span>
                      </div>

                      {/* Total Hours Worked */}
                      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-gray-200 transition-all flex flex-col justify-between">
                        <span className="text-xs font-medium text-gray-500">Hours Worked</span>
                        <span className="text-2xl font-bold text-gray-900 mt-2">{(stats?.totalHours || 0).toFixed(1)}h</span>
                      </div>

                      {/* Late Arrivals */}
                      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-gray-200 transition-all flex flex-col justify-between">
                        <span className="text-xs font-medium text-gray-500">Late Arrivals</span>
                        <span className={`text-2xl font-bold mt-2 ${stats?.lateArrivals > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                          {stats?.lateArrivals || 0}
                        </span>
                      </div>

                      {/* Early Departures */}
                      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-gray-200 transition-all flex flex-col justify-between">
                        <span className="text-xs font-medium text-gray-500">Early Departures</span>
                        <span className={`text-2xl font-bold mt-2 ${stats?.earlyDepartures > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                          {stats?.earlyDepartures || 0}
                        </span>
                      </div>

                      {/* Leaves Summary */}
                      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-gray-200 transition-all flex flex-col justify-between">
                        <span className="text-xs font-medium text-gray-500">Leaves (Approved)</span>
                        <div className="flex items-baseline justify-between mt-2">
                          <span className="text-2xl font-bold text-gray-900">{stats?.approvedLeaveDays || 0}d</span>
                          {stats?.pendingLeaves > 0 && (
                            <span className="text-xs text-amber-600 font-medium">({stats.pendingLeaves} pending)</span>
                          )}
                        </div>
                      </div>

                      {/* Overtime Summary */}
                      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-gray-200 transition-all flex flex-col justify-between">
                        <span className="text-xs font-medium text-gray-500">Overtime (Approved)</span>
                        <div className="flex items-baseline justify-between mt-2">
                          <span className="text-2xl font-bold text-gray-900">{(stats?.approvedOvertimeHours || 0).toFixed(1)}h</span>
                          {stats?.pendingOvertime > 0 && (
                            <span className="text-xs text-amber-600 font-medium">({stats.pendingOvertime} pending)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Log / Timeline */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      Recent Activity Log (Max 10)
                    </h3>
                    
                    {recentAttendance.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl text-gray-500 text-sm">
                        No activity records found for this month.
                      </div>
                    ) : (
                      <div className="overflow-hidden border border-gray-100 rounded-xl">
                        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 font-semibold text-gray-600">Date</th>
                              <th className="px-4 py-3 font-semibold text-gray-600">Punch In</th>
                              <th className="px-4 py-3 font-semibold text-gray-600">Punch Out</th>
                              <th className="px-4 py-3 font-semibold text-gray-600">Hours</th>
                              <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {recentAttendance.map((log: any) => {
                              const checkIn = log.punches?.find((p: any) => p.type === 'in')?.time;
                              const checkOut = log.punches?.find((p: any) => p.type === 'out')?.time;
                              const isLate = log.arrivalStatus === 'late';
                              const isEarlyOut = log.departureStatus === 'early-departure';
                              
                              return (
                                <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                                  <td className="whitespace-nowrap px-4 py-3 text-gray-900 font-medium">
                                    {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                                    {checkIn ? formatTime(checkIn) : '-'}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                                    {checkOut ? formatTime(checkOut) : '-'}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3 text-gray-900">
                                    {log.workingHours ? `${log.workingHours.toFixed(2)}h` : '0h'}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3">
                                    <div className="flex flex-col gap-1">
                                      {isLate ? (
                                        <span className="inline-flex w-fit items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                                          Late Check-in
                                        </span>
                                      ) : (
                                        <span className="inline-flex w-fit items-center rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                          On Time
                                        </span>
                                      )}
                                      {isEarlyOut && (
                                        <span className="inline-flex w-fit items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
