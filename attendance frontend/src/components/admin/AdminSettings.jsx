import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, RefreshCw, Save, MapPin, Navigation, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useGetGeofenceSettingsQuery, useUpdateGeofenceSettingsMutation } from '../../redux/api/settingsApi.js';

export default function AdminSettings() {
  const {
    data: settingsResponse,
    isLoading: isSettingsLoading,
    isError: isSettingsError,
    error: settingsError,
    refetch,
  } = useGetGeofenceSettingsQuery();

  const [updateGeofence, { isLoading: isUpdating }] = useUpdateGeofenceSettingsMutation();

  const [geofenceEnabled, setGeofenceEnabled] = useState(false);
  const [geofenceLatitude, setGeofenceLatitude] = useState(0);
  const [geofenceLongitude, setGeofenceLongitude] = useState(0);
  const [geofenceRadius, setGeofenceRadius] = useState(100);
  const [workStartTime, setWorkStartTime] = useState("09:00");
  const [workEndTime, setWorkEndTime] = useState("18:00");
  const [gracePeriod, setGracePeriod] = useState(15);
  const [locationMessage, setLocationMessage] = useState('');
  const [locationSuccess, setLocationSuccess] = useState(null);

  useEffect(() => {
    if (settingsResponse?.data) {
      const { geofenceEnabled, geofenceLatitude, geofenceLongitude, geofenceRadius, workStartTime, workEndTime, gracePeriod } = settingsResponse.data;
      setGeofenceEnabled(geofenceEnabled);
      setGeofenceLatitude(geofenceLatitude);
      setGeofenceLongitude(geofenceLongitude);
      setGeofenceRadius(geofenceRadius);
      if (workStartTime) setWorkStartTime(workStartTime);
      if (workEndTime) setWorkEndTime(workEndTime);
      if (gracePeriod !== undefined) setGracePeriod(gracePeriod);
    }
  }, [settingsResponse]);

  const handleGetLocation = () => {
    setLocationMessage('Fetching current location...');
    setLocationSuccess(null);
    if (!navigator.geolocation) {
      setLocationMessage('Geolocation is not supported by your browser.');
      setLocationSuccess(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeofenceLatitude(Number(position.coords.latitude.toFixed(6)));
        setGeofenceLongitude(Number(position.coords.longitude.toFixed(6)));
        setLocationMessage('Location loaded successfully!');
        setLocationSuccess(true);
      },
      (error) => {
        setLocationMessage(`Error: ${error.message}. Please check browser permissions.`);
        setLocationSuccess(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateGeofence({
        geofenceEnabled,
        geofenceLatitude: Number(geofenceLatitude),
        geofenceLongitude: Number(geofenceLongitude),
        geofenceRadius: Number(geofenceRadius),
        workStartTime,
        workEndTime,
        gracePeriod: Number(gracePeriod),
      }).unwrap();
      alert('Settings updated successfully!');
      refetch();
    } catch (err) {
      alert(err?.data?.message || err?.error || 'Failed to update settings');
    }
  };

  return (
    <section className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-xl space-y-6 transition-colors duration-200 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-theme-bright">Geofence Settings</h2>
            <p className="text-xs text-theme-muted">Configure the allowed coordinate boundaries for employee clock-ins</p>
          </div>
        </div>
        <button
          onClick={refetch}
          className="p-2 text-theme-muted hover:text-theme-bright hover:bg-theme-card-hover rounded-lg transition-colors cursor-pointer"
          title="Refresh settings"
        >
          <RefreshCw className={`w-4 h-4 ${isSettingsLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isSettingsLoading ? (
        <div className="py-12 flex justify-center items-center">
          <span className="w-8 h-8 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : isSettingsError ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Failed to load settings</p>
            <p className="text-xs text-theme-muted">{settingsError?.data?.message || settingsError?.error || 'Unknown error'}</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Geofence Status Toggle Card */}
          <div className="p-5 rounded-2xl border border-theme-border bg-theme-bg/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
            <div className="space-y-1">
              <span className="text-sm font-bold text-theme-bright flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Enable Geofencing Enforcement
              </span>
              <p className="text-xs text-theme-muted">
                When enabled, employees can only punch in or out within the defined radius.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={geofenceEnabled}
                onChange={(e) => setGeofenceEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-650"></div>
            </label>
          </div>

          {/* Shift Schedule Configurations */}
          <div className="p-5 rounded-2xl border border-theme-border bg-theme-bg/20 space-y-4">
            <h3 className="text-sm font-bold text-theme-bright border-b border-theme-border pb-1">Expected Office Timings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-muted">Expected Start Time</label>
                <input
                  type="time"
                  required
                  value={workStartTime}
                  onChange={(e) => setWorkStartTime(e.target.value)}
                  className="w-full bg-theme-card border border-theme-input-border rounded-xl px-3 py-2 text-sm text-theme-bright focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-muted">Expected End Time</label>
                <input
                  type="time"
                  required
                  value={workEndTime}
                  onChange={(e) => setWorkEndTime(e.target.value)}
                  className="w-full bg-theme-card border border-theme-input-border rounded-xl px-3 py-2 text-sm text-theme-bright focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-muted">Grace Period (Minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  required
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(e.target.value)}
                  className="w-full bg-theme-card border border-theme-input-border rounded-xl px-3 py-2 text-sm text-theme-bright focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Coordinate Config Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Block: Coordinates form */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-theme-bright border-b border-theme-border pb-1">Geofence Boundary</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-muted">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={geofenceLatitude}
                    onChange={(e) => setGeofenceLatitude(e.target.value)}
                    className="w-full bg-theme-card border border-theme-input-border rounded-xl px-3 py-2 text-sm text-theme-bright focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-muted">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={geofenceLongitude}
                    onChange={(e) => setGeofenceLongitude(e.target.value)}
                    className="w-full bg-theme-card border border-theme-input-border rounded-xl px-3 py-2 text-sm text-theme-bright focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-muted flex justify-between">
                  <span>Radius (Meters)</span>
                  <span className="font-mono text-violet-650 dark:text-violet-400 font-bold">{geofenceRadius}m</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="5000"
                  step="10"
                  value={geofenceRadius}
                  onChange={(e) => setGeofenceRadius(e.target.value)}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
                />
                <input
                  type="number"
                  required
                  min="5"
                  max="50000"
                  value={geofenceRadius}
                  onChange={(e) => setGeofenceRadius(e.target.value)}
                  className="w-full bg-theme-card border border-theme-input-border rounded-xl px-3 py-2 text-sm text-theme-bright focus:outline-none focus:border-violet-500 transition-colors mt-2"
                />
              </div>

              {/* Utility helper button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="w-full inline-flex items-center justify-center gap-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/20 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Set to My Current Location</span>
                </button>
                {locationMessage && (
                  <p className={`text-xs mt-2 font-medium ${locationSuccess === true ? 'text-emerald-500' : locationSuccess === false ? 'text-red-500' : 'text-theme-muted animate-pulse'}`}>
                    {locationMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Right Block: Informational map placeholder & guidance */}
            <div className="space-y-4 bg-theme-bg/10 border border-theme-border rounded-2xl p-5 flex flex-col justify-center">
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-theme-bright flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  How Geofencing Works
                </h4>
                <ul className="text-xs text-theme-text space-y-2 list-disc list-inside pl-1">
                  <li>When an employee punches in/out, their browser coordinates are fetched automatically.</li>
                  <li>The backend calculates the distance between the employee's coordinates and the geofence center using the Haversine formula.</li>
                  <li>If the calculated distance exceeds the configured radius (currently <strong className="font-bold">{geofenceRadius} meters</strong>), the punch action is blocked.</li>
                  <li>Admins can update coordinates anytime to set a different geofence center (e.g. office address coordinates).</li>
                </ul>
              </div>

              {geofenceLatitude && geofenceLongitude ? (
                <div className="pt-4 border-t border-theme-border/60">
                  <a
                    href={`https://www.google.com/maps?q=${geofenceLatitude},${geofenceLongitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-violet-650 dark:text-violet-400 hover:text-violet-500 font-semibold"
                  >
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span>View geofence center on Google Maps</span>
                  </a>
                </div>
              ) : null}
            </div>
          </div>

          {/* Action Row */}
          <div className="border-t border-theme-border pt-5 flex justify-end">
            <button
              type="submit"
              disabled={isUpdating}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isUpdating ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
