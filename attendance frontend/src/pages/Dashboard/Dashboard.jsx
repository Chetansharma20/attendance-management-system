import { useState, useContext } from 'react';
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
import { LogOut, Clock, Sun, Moon } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext.jsx';

// Reusable Tab Bar component
function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 bg-theme-card border border-theme-border p-1 rounded-xl shrink-0 self-start sm:self-auto transition-colors duration-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            active === tab.id
              ? 'bg-violet-600 text-white shadow-md'
              : 'text-theme-muted hover:text-theme-bright'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const { theme, toggleTheme } = useContext(ThemeContext);

  const [adminTab, setAdminTab] = useState('users');
  const [managerTab, setManagerTab] = useState('team');
  const [employeeTab, setEmployeeTab] = useState('attendance');

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

  const adminTabs = [
    { id: 'users',      label: 'Manage Employees' },
    { id: 'attendance', label: 'Attendance Records' },
    { id: 'overtime',   label: 'Overtime Requests' },
  ];

  const managerTabs = [
    { id: 'team',       label: 'My Team' },
    { id: 'attendance', label: 'Team Attendance' },
    { id: 'overtime',   label: 'Overtime Requests' },
  ];

  const employeeTabs = [
    { id: 'attendance', label: 'Punch & Attendance' },
    { id: 'overtime',   label: 'Overtime Requests' },
  ];

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col font-sans transition-colors duration-200">

      {/* Dynamic Background Auroras */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-violet-600/5 dark:bg-violet-600/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Top Navbar */}
      <header className="border-b border-theme-border bg-theme-header backdrop-blur-md sticky top-0 z-20 px-6 py-4 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600/10 dark:bg-violet-600/20 border border-violet-500/20 dark:border-violet-500/30 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-theme-bright">Attendance Portal</h1>
              <p className="text-xs text-theme-muted">
                {isAdmin ? 'Admin Control Center' : isManager ? 'Manager Dashboard' : 'Employee Portal'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-theme-bright">{user.name}</p>
              <p className="text-xs text-theme-muted">
                {user.email} • <span className="text-violet-600 dark:text-violet-400 font-medium capitalize">{user.role}</span>
              </p>
            </div>
            
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-theme-card hover:bg-theme-card-hover border border-theme-border text-theme-muted hover:text-theme-bright transition-colors cursor-pointer"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              <span className="text-xs font-semibold capitalize hidden md:inline">
                {theme === 'light' ? 'Dark' : 'Light'} Mode
              </span>
            </button>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2 bg-theme-card hover:bg-theme-card-hover text-theme-text hover:text-theme-bright px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border border-theme-border cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area based on User Role */}
      {isAdmin ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8 z-10">
          {/* Admin Header + Tabs */}
          <div className="border-b border-theme-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-theme-bright">
                Admin Control Center
              </h2>
              <p className="text-sm text-theme-muted mt-1">
                Manage users, view all attendance records, and handle overtime requests.
              </p>
            </div>
            <TabBar tabs={adminTabs} active={adminTab} onChange={setAdminTab} />
          </div>

          {/* Admin Tab Content */}
          {adminTab === 'users' && <UsersList />}
          {adminTab === 'attendance' && <AttendanceLogs />}
          {adminTab === 'overtime' && <PendingOvertime />}
        </main>

      ) : isManager ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8 z-10">
          {/* Manager Header + Tabs */}
          <div className="border-b border-theme-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-theme-bright">
                Manager Dashboard
              </h2>
              <p className="text-sm text-theme-muted mt-1">
                View your team's attendance, manage members, and handle overtime requests.
              </p>
            </div>
            <TabBar tabs={managerTabs} active={managerTab} onChange={setManagerTab} />
          </div>

          {/* Manager Tab Content */}
          {managerTab === 'team' && <MyTeam />}
          {managerTab === 'attendance' && <TeamAttendance />}
          {managerTab === 'overtime' && <PendingOvertime />}
        </main>

      ) : (
        /* Employee Dashboard */
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8 z-10">
          {/* Employee Header + Tabs */}
          <div className="border-b border-theme-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-theme-bright">
                Welcome back, <span className="bg-gradient-to-r from-violet-600 to-sky-600 dark:from-violet-400 dark:to-sky-400 bg-clip-text text-transparent">{user.name}</span> 👋
              </h2>
              <p className="text-sm text-theme-muted mt-1">
                Track your attendance, working hours, and manage overtime requests.
              </p>
            </div>
            <TabBar tabs={employeeTabs} active={employeeTab} onChange={setEmployeeTab} />
          </div>

          {/* Employee Tab Content */}
          {employeeTab === 'attendance' ? (
            <MyAttendance />
          ) : (
            <MyOvertimeRequests />
          )}
        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-theme-border bg-theme-card/10 px-6 py-6 text-center text-xs text-theme-muted z-10 transition-colors duration-200">
        &copy; {new Date().getFullYear()} Attendance Management System. All rights reserved.
      </footer>
    </div>
  );
}
