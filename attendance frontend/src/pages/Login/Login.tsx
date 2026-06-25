import React, { useState, useEffect, useContext } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Clock, Sun, Moon } from 'lucide-react';
import { useLoginMutation } from '../../redux/api/authApi';
import { ThemeContext } from '../../context/ThemeContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { user } = useSelector((state: any) => state.auth);
  const [login, { isLoading, error }] = useLoginMutation();
  const themeContext = useContext(ThemeContext);

  if (!themeContext) {
    throw new Error("ThemeContext is required");
  }
  const { theme, toggleTheme } = themeContext;

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await login(form);
  };

  const errData = error as any;
  const errorMessage = errData?.data?.message || errData?.error || null;

  return (
    <div className="relative min-h-screen bg-theme-bg flex items-center justify-center px-6 transition-colors duration-200">

      {/* Floating Theme Toggle in top corner */}
      <div className="absolute top-6 right-6 z-30">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-theme-card hover:bg-theme-card-hover border border-theme-border text-theme-muted hover:text-theme-bright transition-colors cursor-pointer shadow-sm"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          <span className="text-xs font-semibold capitalize">
            {theme === 'light' ? 'Dark' : 'Light'} Mode
          </span>
        </button>
      </div>

      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-52 -left-52 w-[600px] h-[600px] bg-violet-600/5 dark:bg-violet-600/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-52 -right-52 w-[600px] h-[600px] bg-indigo-600/5 dark:bg-indigo-600/15 rounded-full blur-[140px]" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-lg bg-theme-card border border-theme-border rounded-3xl shadow-xl px-6 py-10 sm:px-14 sm:py-16 transition-colors duration-200">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-violet-600/10 dark:bg-violet-600/20 border border-violet-500/20 dark:border-violet-500/30 rounded-2xl flex items-center justify-center mb-5">
            <Clock className="w-10 h-10 text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-3xl font-bold text-theme-bright tracking-tight">Attendance Portal</h1>
          <p className="text-theme-muted text-base mt-2">Sign in to your account to continue</p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-7 px-5 py-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm text-center">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-theme-text mb-2.5">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@company.com"
              className="w-full bg-theme-card border border-theme-input-border text-theme-bright placeholder-theme-muted/60 rounded-xl px-5 py-3.5 text-base outline-none transition-all duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-theme-text mb-2.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full bg-theme-card border border-theme-input-border text-theme-bright placeholder-theme-muted/60 rounded-xl px-5 py-3.5 pr-14 text-base outline-none transition-all duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-bright transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:bg-violet-600/40 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-4 text-base transition-all duration-200 shadow-lg shadow-violet-600/25 mt-4 cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign in
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-theme-muted text-sm mt-10">
          &copy; {new Date().getFullYear()} Attendance Management System
        </p>
      </div>
    </div>
  );
}
