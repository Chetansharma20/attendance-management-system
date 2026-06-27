import { useState, useContext, useEffect, lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLogoutMutation } from '../../redux/api/authApi';
import NotificationBell from '../../components/NotificationBell.jsx';

// Lazy loaded components
const UsersList = lazy(() => import('../../components/admin/Users'));
const AttendanceLogs = lazy(() => import('../../components/admin/AttendanceLogs'));
const TeamAttendance = lazy(() => import('../../components/manager/TeamAttendance'));
const PendingOvertime = lazy(() => import('../../components/manager/PendingOvertime'));
const OvertimeHistory = lazy(() => import('../../components/admin/OvertimeHistory'));
const MyTeam = lazy(() => import('../../components/manager/MyTeam'));
const MyAttendance = lazy(() => import('../../components/employee/MyAttendance'));
const MyOvertimeRequests = lazy(() => import('../../components/employee/MyOvertimeRequests'));
const AdminSettings = lazy(() => import('../../components/admin/AdminSettings'));
const ShiftManagement = lazy(() => import('../../components/admin/ShiftManagement'));
const LeaveManagement = lazy(() => import('../../components/admin/LeaveManagement'));
const DepartmentManagement = lazy(() => import('../../components/admin/DepartmentManagement'));
const HolidayManagement = lazy(() => import('../../components/admin/HolidayManagement'));
const TeamLeaves = lazy(() => import('../../components/manager/TeamLeaves'));
const MyLeaves = lazy(() => import('../../components/employee/MyLeaves'));
const AnalyticsDashboard = lazy(() => import('../../components/analytics/AnalyticsDashboard.jsx'));
const AiChatAssistant = lazy(() => import('../../components/common/AiChatAssistant'));
const CompanyCalendar = lazy(() => import('../../components/common/CompanyCalendar'));

import { 
  LogOut, 
  Clock, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Users, 
  Folder, 
  Calendar, 
  ClipboardList, 
  Hourglass, 
  FileSpreadsheet, 
  BarChart3, 
  Settings, 
  FileText
} from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext.jsx';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useSelector((state: any) => state.auth);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  
  const themeContext = useContext(ThemeContext);
  if (!themeContext) {
    throw new Error("ThemeContext is required");
  }
  const { theme, toggleTheme } = themeContext;

  const [adminTab, setAdminTab] = useState('dashboard');
  const [managerTab, setManagerTab] = useState('team');
  const [employeeTab, setEmployeeTab] = useState('attendance');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';

  const queryTab = searchParams.get('tab');

  useEffect(() => {
    if (queryTab) {
      if (isAdmin) setAdminTab(queryTab);
      else if (isManager) setManagerTab(queryTab);
      else setEmployeeTab(queryTab);
    }
  }, [queryTab, isAdmin, isManager]);

  const handleTabChange = (tabId: string) => {
    if (isAdmin) setAdminTab(tabId);
    else if (isManager) setManagerTab(tabId);
    else setEmployeeTab(tabId);

    setSearchParams({ tab: tabId });
    setIsSidebarOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout(undefined).unwrap();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (!user) {
    return null;
  }

  const adminTabs: Tab[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Manage Employees', icon: Users },
    { id: 'departments', label: 'Departments', icon: Folder },
    { id: 'shifts', label: 'Manage Shifts', icon: Calendar },
    { id: 'attendance', label: 'Attendance Records', icon: ClipboardList },
    { id: 'overtime', label: 'Overtime Requests', icon: Hourglass },
    { id: 'overtime-history', label: 'Overtime History', icon: Clock },
    { id: 'leave', label: 'Leave Management', icon: FileSpreadsheet },
    { id: 'holidays', label: 'Holidays', icon: Calendar },
    { id: 'calendar', label: 'Company Calendar', icon: Calendar },
    { id: 'settings', label: 'Geofence Settings', icon: Settings },
  ];

  const managerTabs: Tab[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'calendar', label: 'Company Calendar', icon: Calendar },
    { id: 'team', label: 'My Team', icon: Users },
    { id: 'attendance', label: 'Team Attendance', icon: ClipboardList },
    { id: 'overtime', label: 'Team Overtime', icon: Hourglass },
    { id: 'leaves', label: 'Team Leaves', icon: FileSpreadsheet },
    { id: 'my-attendance', label: 'My Attendance', icon: Calendar },
    { id: 'my-overtime', label: 'My Overtime', icon: Clock },
    { id: 'my-leaves', label: 'My Leaves', icon: FileText },
  ];

  const employeeTabs: Tab[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'calendar', label: 'Company Calendar', icon: Calendar },
    { id: 'attendance', label: 'Punch & Attendance', icon: Calendar },
    { id: 'overtime', label: 'Overtime Requests', icon: Clock },
    { id: 'leaves', label: 'My Leaves', icon: FileText },
  ];

  const tabs = isAdmin ? adminTabs : isManager ? managerTabs : employeeTabs;
  const activeTab = isAdmin ? adminTab : isManager ? managerTab : employeeTab;

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-theme-border">
        <div className="w-9 h-9 bg-violet-600/10 dark:bg-violet-600/20 border border-violet-500/20 dark:border-violet-500/30 rounded-xl flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight text-theme-bright truncate">Attendance</h1>
          <p className="text-2xs text-theme-muted truncate">
            {isAdmin ? 'Admin Control Center' : isManager ? 'Manager Dashboard' : 'Employee Portal'}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/10'
                  : 'text-theme-muted hover:text-theme-bright hover:bg-theme-card-hover'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-theme-muted group-hover:text-theme-bright'}`} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Profile & Controls */}
      <div className="p-4 border-t border-theme-border bg-theme-bg/50">
        <div className="flex items-center gap-3 px-2 py-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-theme-bright truncate">{user.name}</p>
            <p className="text-xs text-theme-muted truncate capitalize">{user.role}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-theme-card hover:bg-theme-card-hover border border-theme-border text-theme-muted hover:text-theme-bright transition-colors cursor-pointer"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            <span className="text-xs font-semibold">Theme</span>
          </button>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex-1 flex items-center justify-center gap-2 bg-theme-card hover:bg-theme-card-hover text-theme-text hover:text-theme-bright py-2.5 rounded-xl text-xs font-semibold transition-colors border border-theme-border cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text flex font-sans transition-colors duration-200 relative overflow-hidden">
      {/* Dynamic Background Auroras */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-violet-600/5 dark:bg-violet-600/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 border-r border-theme-border bg-theme-card z-20 shrink-0">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
          {/* Drawer content */}
          <aside className="relative flex flex-col w-64 max-w-xs h-full bg-theme-card border-r border-theme-border shadow-2xl animate-in slide-in-from-left duration-200">
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-theme-card border border-theme-border text-theme-muted hover:text-theme-bright cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10 h-screen overflow-y-auto">
        {/* Top Header Navbar */}
        <header className="border-b border-theme-border bg-theme-header backdrop-blur-md sticky top-0 z-20 px-4 sm:px-6 py-4 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-theme-card border border-theme-border text-theme-muted hover:text-theme-bright transition-colors cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-violet-600/10 dark:bg-violet-600/20 border border-violet-500/20 dark:border-violet-500/30 rounded-xl flex items-center justify-center lg:hidden">
                <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-theme-bright">
                  {activeTab === 'dashboard' && 'Dashboard'}
                  {activeTab === 'users' && 'Manage Employees'}
                  {activeTab === 'departments' && 'Departments'}
                  {activeTab === 'shifts' && 'Manage Shifts'}
                  {activeTab === 'attendance' && (isAdmin ? 'Attendance Records' : 'Team Attendance')}
                  {activeTab === 'overtime' && (isAdmin ? 'Overtime Requests' : 'Team Overtime')}
                  {activeTab === 'overtime-history' && 'Overtime History'}
                  {activeTab === 'leave' && 'Leave Management'}
                  {activeTab === 'leaves' && 'Team Leaves'}
                  {activeTab === 'calendar' && 'Company Calendar'}
                  {activeTab === 'settings' && 'Geofence Settings'}
                  {activeTab === 'holidays' && 'Holiday Management'}
                  {activeTab === 'team' && 'My Team'}
                  {activeTab === 'my-attendance' && 'My Attendance'}
                  {activeTab === 'my-overtime' && 'My Overtime Requests'}
                  {activeTab === 'my-leaves' && 'My Leaves'}
                </h1>
                <p className="text-xs text-theme-muted hidden sm:block">
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

              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
            </div>
          }>
            {isAdmin ? (
              <>
                {adminTab === 'dashboard' && <AnalyticsDashboard />}
                {adminTab === 'users' && <UsersList />}
                {adminTab === 'departments' && <DepartmentManagement />}
                {adminTab === 'shifts' && <ShiftManagement />}
                {adminTab === 'attendance' && <AttendanceLogs />}
                {adminTab === 'overtime' && <PendingOvertime />}
                {adminTab === 'overtime-history' && <OvertimeHistory />}
                {adminTab === 'leave' && <LeaveManagement />}
                {adminTab === 'holidays' && <HolidayManagement />}
                {adminTab === 'calendar' && <CompanyCalendar />}
                {adminTab === 'settings' && <AdminSettings />}
              </>
            ) : isManager ? (
              <>
                {managerTab === 'dashboard' && <AnalyticsDashboard />}
                {managerTab === 'calendar' && <CompanyCalendar />}
                {managerTab === 'team' && <MyTeam />}
                {managerTab === 'attendance' && <TeamAttendance />}
                {managerTab === 'overtime' && <PendingOvertime />}
                {managerTab === 'leaves' && <TeamLeaves />}
                {managerTab === 'my-attendance' && <MyAttendance />}
                {managerTab === 'my-overtime' && <MyOvertimeRequests />}
                {managerTab === 'my-leaves' && <MyLeaves />}
              </>
            ) : (
              <>
                {employeeTab === 'dashboard' && <AnalyticsDashboard />}
                {employeeTab === 'calendar' && <CompanyCalendar />}
                {employeeTab === 'attendance' && <MyAttendance />}
                {employeeTab === 'overtime' && <MyOvertimeRequests />}
                {employeeTab === 'leaves' && <MyLeaves />}
              </>
            )}
          </Suspense>
        </main>

        {/* Footer */}
        <footer className="border-t border-theme-border bg-theme-card/10 px-6 py-6 text-center text-xs text-theme-muted transition-colors duration-200">
          &copy; {new Date().getFullYear()} Attendance Management System. All rights reserved.
        </footer>
        <Suspense fallback={null}>
          <AiChatAssistant />
        </Suspense>
      </div>
    </div>
  );
}
