import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLogoutMutation } from '../../redux/api/authApi.js';
import UsersList from '../../components/admin/Users.jsx';
import AttendanceLogs from '../../components/admin/AttendanceLogs.jsx';
import TeamAttendance from '../../components/manager/TeamAttendance.jsx';
import PendingOvertime from '../../components/manager/PendingOvertime.jsx';
import MyTeam from '../../components/manager/MyTeam.jsx';
import MyAttendance from '../../components/employee/MyAttendance.jsx';
import MyOvertimeRequests from '../../components/employee/MyOvertimeRequests.jsx';
import { LogOut, Clock } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">

      {/* Dynamic Background Auroras */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600/20 border border-violet-500/30 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Attendance Portal</h1>
              <p className="text-xs text-slate-400">
                {isAdmin ? 'Admin Control Center' : isManager ? 'Manager Dashboard' : 'Employee Portal'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email} • <span className="text-violet-400 font-medium capitalize">{user.role}</span></p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border border-slate-700 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area based on User Role */}
      {isAdmin ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-10 z-10">
          <UsersList />
          <AttendanceLogs />
          <PendingOvertime />
        </main>
      ) : isManager ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-10 z-10">
          <MyTeam />
          <TeamAttendance />
          <PendingOvertime />
        </main>
      ) : (
        /* Employee Dashboard */
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-10 z-10">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-violet-600/10 via-sky-600/10 to-transparent border border-violet-500/20 rounded-2xl px-6 py-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">
                Welcome back, <span className="text-violet-400">{user.name}</span> 👋
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Track your attendance, view your working hours, and manage overtime requests below.
              </p>
            </div>
          </div>

          {/* Personal Attendance Logs + Stats */}
          <MyAttendance />

          {/* Personal Overtime Requests */}
          <MyOvertimeRequests />
        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/20 px-6 py-6 text-center text-xs text-slate-500 z-10">
        &copy; {new Date().getFullYear()} Attendance Management System. All rights reserved.
      </footer>
    </div>
  );
}
