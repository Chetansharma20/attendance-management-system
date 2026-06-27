import React, { useState, useMemo } from 'react';
import { useFetchHolidaysQuery } from '../../redux/api/holidayApi';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, AlertCircle, Info } from 'lucide-react';

export default function CompanyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { data: holidaysResponse, isLoading, isError } = useFetchHolidaysQuery();
  const holidays = holidaysResponse?.data || [];

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStarts: 0 }); // Sunday start
    const endDate = endOfWeek(monthEnd, { weekStarts: 0 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper to find holidays for a given day
  const getHolidaysForDay = (day: Date) => {
    return holidays.filter((h: any) => isSameDay(new Date(h.date), day));
  };

  const getHolidayColor = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'mandatory': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'optional': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'company': return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
      default: return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 bg-theme-card border border-theme-border rounded-2xl shadow-sm">
        <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
        <p className="font-medium text-theme-muted">Loading calendar data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 bg-theme-card border border-theme-border rounded-2xl shadow-sm text-red-500">
        <AlertCircle className="w-10 h-10 opacity-80" />
        <p className="font-medium">Failed to load holidays</p>
      </div>
    );
  }

  return (
    <div className="bg-theme-card border border-theme-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-full max-h-[700px]">
      {/* Calendar Header */}
      <div className="p-4 border-b border-theme-border bg-theme-bg/30 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-theme-bright">Company Calendar</h2>
            <p className="text-xs text-theme-muted mt-0.5">View upcoming holidays and events</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={today}
            className="px-4 py-2 text-sm font-semibold border border-theme-border text-theme-muted hover:text-theme-bright hover:bg-theme-bg rounded-xl transition-colors cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center bg-theme-bg border border-theme-border rounded-xl p-1">
            <button 
              onClick={prevMonth}
              className="p-1.5 text-theme-muted hover:text-theme-bright hover:bg-theme-card rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="w-32 text-center text-sm font-bold text-theme-bright">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button 
              onClick={nextMonth}
              className="p-1.5 text-theme-muted hover:text-theme-bright hover:bg-theme-card rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-b border-theme-border bg-theme-bg/10 flex flex-wrap gap-4 items-center justify-center sm:justify-start">
        <div className="flex items-center gap-1.5 text-xs font-medium text-theme-muted">
          <Info className="w-3.5 h-3.5" /> Legend:
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-theme-bright">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Mandatory Holiday
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-theme-bright">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Optional Holiday
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-theme-bright">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span> Company Event
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-3 sm:p-4 bg-theme-bg/20 overflow-y-auto">
        <div className="grid grid-cols-7 gap-px bg-theme-border rounded-xl overflow-hidden border border-theme-border shadow-sm">
          {/* Weekday headers */}
          {weekDays.map(day => (
            <div key={day} className="bg-theme-card py-2 text-center text-[10px] font-semibold text-theme-muted uppercase tracking-wider">
              {day}
            </div>
          ))}

          {/* Days */}
          {days.map((day, dayIdx) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            const dayHolidays = getHolidaysForDay(day);

            return (
              <div 
                key={day.toString()} 
                className={`
                  bg-theme-card min-h-[70px] p-1.5 transition-colors relative group
                  ${!isCurrentMonth ? 'opacity-40 bg-theme-bg/50' : 'hover:bg-theme-card-hover'}
                `}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className={`
                    w-6 h-6 flex items-center justify-center text-xs rounded-full font-medium z-10
                    ${isTodayDate 
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20' 
                      : 'text-theme-bright group-hover:bg-theme-bg'
                    }
                  `}>
                    {format(day, 'd')}
                  </span>
                </div>

                <div className="space-y-1 z-10 relative max-h-[50px] overflow-y-auto no-scrollbar">
                  {dayHolidays.map((holiday: any) => (
                    <div 
                      key={holiday._id}
                      title={holiday.description || holiday.name}
                      className={`
                        text-[9px] leading-tight font-semibold px-1.5 py-0.5 rounded border truncate cursor-help
                        ${getHolidayColor(holiday.type)}
                      `}
                    >
                      {holiday.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
