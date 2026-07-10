import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [liveNotice, setLiveNotice] = useState('');
  const [selectedDetailEvent, setSelectedDetailEvent] = useState(null);

  // Load events and listen to SSE Stream
  useEffect(() => {
    // 1. Fetch initial events
    const loadEvents = async () => {
      try {
        const data = await api.getCalendarEvents();
        setEvents(data);
      } catch (err) {
        console.error('Error loading calendar events:', err.message);
      }
    };
    loadEvents();

    // 2. Open Server-Sent Events stream
    const streamUrl = api.getCalendarStreamUrl();
    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (e) => {
      try {
        const { action, event } = JSON.parse(e.data);
        console.log('Received SSE calendar update:', action, event);

        setEvents((prevEvents) => {
          let updated = [...prevEvents];
          if (action === 'create') {
            updated.push(event);
            showLiveNotice('Προστέθηκε νέα εκδήλωση στο ημερολόγιο!');
          } else if (action === 'update') {
            updated = updated.map((item) => (item.id === event.id ? event : item));
            showLiveNotice('Μια εκδήλωση στο ημερολόγιο μόλις ενημερώθηκε!');
          } else if (action === 'delete') {
            updated = updated.filter((item) => item.id !== event.id);
            showLiveNotice('Μια εκδήλωση αφαιρέθηκε από το ημερολόγιο.');
          }
          // Sort by date and time
          return updated.sort((a, b) => {
            const dateDiff = a.event_date.localeCompare(b.event_date);
            if (dateDiff !== 0) return dateDiff;
            return a.event_time.localeCompare(b.event_time);
          });
        });
      } catch (err) {
        console.error('Error parsing SSE event data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('SSE connection warning/error. Reconnecting...', err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const showLiveNotice = (msg) => {
    setLiveNotice(msg);
    setTimeout(() => {
      setLiveNotice('');
    }, 4000);
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
    'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
  ];

  const dayNames = ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'];

  // Days in month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDaysInMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];

  // Previous month padding days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevDaysInMonth - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, prevDaysInMonth - i)
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i)
    });
  }

  // Next month padding days (grid of 42 cells total)
  const remainingCells = 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i)
    });
  }

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };

  const formatDateKey = (date) => {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getEventsForDate = (date) => {
    const key = formatDateKey(date);
    return events.filter(e => e.event_date === key);
  };

  const selectedDateKey = formatDateKey(selectedDate);
  const selectedDateEvents = events.filter(e => e.event_date === selectedDateKey);

  return (
    <section className="bg-white rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden mt-12 relative animate-fade-in">
      {/* Live notification banner */}
      {liveNotice && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-cultural-burgundy text-white px-5 py-2.5 rounded-full shadow-lg border border-cultural-gold/30 text-xs font-semibold flex items-center space-x-2 animate-bounce">
          <span className="w-2 h-2 bg-cultural-gold rounded-full animate-ping"></span>
          <span>{liveNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 text-white px-8 py-6 flex flex-col sm:flex-row items-center justify-between border-b border-cultural-gold/20 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cultural-gold/10 flex items-center justify-center border border-cultural-gold/30 text-cultural-gold text-lg">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl tracking-tight text-cultural-gold">
              Live Ημερολόγιο Συλλόγου
            </h3>
            <p className="text-xs text-slate-400">
              Ενημερώνεται σε πραγματικό χρόνο για όλες τις εκδηλώσεις και πρόβες
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/50">
          <button 
            onClick={() => navigateMonth(-1)}
            className="w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 flex items-center justify-center transition-colors"
          >
            <i className="fas fa-chevron-left text-sm"></i>
          </button>
          <span className="text-sm font-semibold px-4 min-w-[120px] text-center text-cultural-gold font-serif">
            {monthNames[month]} {year}
          </span>
          <button 
            onClick={() => navigateMonth(1)}
            className="w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 flex items-center justify-center transition-colors"
          >
            <i className="fas fa-chevron-right text-sm"></i>
          </button>
        </div>
      </div>

      {/* Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        
        {/* Left Side: Calendar Grid (8 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-8">
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-400 mb-4 uppercase tracking-wider">
            {dayNames.map(d => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell, idx) => {
              const dateEvents = getEventsForDate(cell.date);
              const isToday = formatDateKey(new Date()) === formatDateKey(cell.date);
              const isSelected = formatDateKey(selectedDate) === formatDateKey(cell.date);
              const hasEvents = dateEvents.length > 0;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(cell.date)}
                  className={`aspect-square p-1.5 rounded-2xl flex flex-col items-center justify-between transition-all border outline-none relative group ${
                    !cell.isCurrentMonth ? 'text-slate-300 bg-slate-50/20 border-transparent pointer-events-none' :
                    isSelected ? 'bg-cultural-burgundy text-white border-cultural-burgundy shadow-md shadow-cultural-burgundy/20' :
                    hasEvents ? 'bg-cultural-gold/10 text-slate-900 border-cultural-gold/40 font-bold shadow-sm hover:bg-cultural-gold/20' :
                    isToday ? 'bg-cultural-blue/10 text-cultural-blue border-cultural-blue/30 font-bold hover:bg-cultural-blue/20' :
                    'bg-slate-50/50 hover:bg-slate-100/70 border-slate-200/40 text-slate-700'
                  }`}
                >
                  <span className={`text-sm self-start ml-1 mt-0.5 ${
                    isSelected ? 'text-white font-bold' :
                    hasEvents ? 'text-cultural-burgundy font-black text-[15px]' :
                    'text-slate-700 font-semibold'
                  }`}>{cell.day}</span>
                  
                  {/* Event indicators */}
                  {hasEvents && (
                    <div className="flex space-x-1 mb-1 justify-center w-full">
                      {dateEvents.slice(0, 3).map((e, index) => (
                        <span 
                          key={index} 
                          className={`w-2 h-2 rounded-full ${
                            isSelected ? 'bg-white' : 'bg-cultural-gold'
                          }`}
                        ></span>
                      ))}
                    </div>
                  )}

                  {/* Micro-hover badge */}
                  {hasEvents && !isSelected && (
                    <span className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-cultural-gold text-slate-950 font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center scale-75">
                      {dateEvents.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Day Details & Event Roster (5 cols) */}
        <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-50/50 flex flex-col justify-between min-h-[380px]">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 mb-5">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Πρόγραμμα Ημέρας
              </span>
              <span className="text-sm font-bold text-slate-800 font-serif">
                {selectedDate.toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>

            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <div className="text-3xl text-slate-300">
                    <i className="fas fa-calendar-day"></i>
                  </div>
                  <p className="text-xs font-medium">Δεν υπάρχουν εκδηλώσεις ή πρόβες για αυτή την ημέρα.</p>
                </div>
              ) : (
                selectedDateEvents.map((e) => (
                  <div 
                    key={e.id} 
                    className="bg-white rounded-2xl p-4 border border-slate-200/50 shadow-sm space-y-2.5 relative overflow-hidden group hover:shadow-md transition-shadow"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-cultural-gold"></div>
                    
                    <div className="flex justify-between items-start pl-1">
                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-cultural-burgundy transition-colors">
                        {e.title}
                      </h4>
                      <span className="bg-slate-100 text-slate-700 font-semibold text-[11px] px-2 py-0.5 rounded-md font-mono">
                        {e.event_time}
                      </span>
                    </div>

                    {e.description && (
                      <div className="pl-1">
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 whitespace-pre-line font-light">
                          {e.description}
                        </p>
                        {e.description.length > 80 || e.description.split('\n').length > 2 ? (
                          <button
                            onClick={() => setSelectedDetailEvent(e)}
                            className="text-[10px] font-bold text-cultural-burgundy hover:text-cultural-burgundy/80 flex items-center space-x-1 mt-1 focus:outline-none"
                          >
                            <span>Πληροφορίες</span>
                            <i className="fas fa-arrow-right text-[8px]"></i>
                          </button>
                        ) : null}
                      </div>
                    )}

                    {e.location && (
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 pl-1 pt-1 border-t border-slate-50">
                        <i className="fas fa-map-marker-alt text-cultural-gold"></i>
                        <span>{e.location}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-150 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cultural-gold animate-pulse"></span>
              <span>Προσεχείς Εκδηλώσεις</span>
            </div>
            <span>Σύνολο: {events.length}</span>
          </div>
        </div>
      </div>

      {/* Event Details Modal Dialog */}
      {selectedDetailEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl border border-slate-200/50 flex flex-col animate-fade-in text-slate-600 text-sm">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-cultural-gold/20">
              <h4 className="font-bold font-serif text-base text-cultural-gold flex items-center space-x-2">
                <i className="fas fa-info-circle"></i>
                <span>Λεπτομέρειες Εκδήλωσης</span>
              </h4>
              <button 
                onClick={() => setSelectedDetailEvent(null)}
                className="text-slate-400 hover:text-white transition-colors focus:outline-none"
              >
                <i className="fas fa-times text-base"></i>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-lg text-slate-900 leading-snug">
                  {selectedDetailEvent.title}
                </h3>
                <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold">
                  <span className="bg-cultural-gold/10 text-cultural-gold border border-cultural-gold/25 px-2 py-0.5 rounded font-mono">
                    {selectedDetailEvent.event_time}
                  </span>
                  <span>•</span>
                  <span>{new Date(selectedDetailEvent.event_date).toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
              </div>

              {selectedDetailEvent.location && (
                <div className="flex items-start space-x-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <i className="fas fa-map-marker-alt text-cultural-gold mt-0.5"></i>
                  <div>
                    <span className="font-semibold block text-slate-700">Τοποθεσία</span>
                    <span>{selectedDetailEvent.location}</span>
                  </div>
                </div>
              )}

              {selectedDetailEvent.description && (
                <div className="space-y-1.5 pt-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-400 block">Περιγραφή / Σημειώσεις</span>
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line font-light bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    {selectedDetailEvent.description}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDetailEvent(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all focus:outline-none shadow-sm"
              >
                Κλείσιμο
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
