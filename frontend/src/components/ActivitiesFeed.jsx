import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function ActivitiesFeed() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await api.getActivities();
      setActivities(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Αποτυχία φόρτωσης δραστηριοτήτων. Παρακαλώ δοκιμάστε ξανά αργότερα.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString('el-GR', options);
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-12 animate-slide-up">
      {/* Title section */}
      <div className="text-center space-y-4">
        <span className="text-cultural-gold text-sm font-bold uppercase tracking-widest px-3 py-1 bg-cultural-gold/10 rounded-full">
          Τα Νέα Μας
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold font-serif text-slate-900">
          Δραστηριότητες & Ανακοινώσεις
        </h2>
        <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
          Μάθετε πρώτοι για τις επερχόμενες εκδηλώσεις, τις συνελεύσεις, τις εθελοντικές δράσεις και τα νέα του Συλλόγου μας.
        </p>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-cultural-gold border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium text-sm">Φόρτωση ανακοινώσεων...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center shadow-sm">
          <i className="fas fa-exclamation-circle text-2xl mb-2 block"></i>
          <span>{error}</span>
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-md max-w-lg mx-auto">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
            <i className="fas fa-bullhorn text-2xl"></i>
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Δεν υπάρχουν ανακοινώσεις</h3>
          <p className="text-slate-500 mt-2 text-sm">
            Δεν έχουν δημοσιευθεί ακόμη δραστηριότητες από τον διαχειριστή. Δοκιμάστε να επιστρέψετε αργότερα!
          </p>
        </div>
      ) : (
        /* Grid of Activities Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activities.map((activity) => (
            <article 
              key={activity.id} 
              className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
              onClick={() => setSelectedActivity(activity)}
            >
              {/* Card Image or fallback banner */}
              <div className="relative h-56 overflow-hidden bg-slate-100">
                {activity.image_url ? (
                  <img
                    src={activity.image_url}
                    alt={activity.title}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-900 via-cultural-blue to-cultural-burgundy flex flex-col items-center justify-center p-6 text-center text-white/95">
                    <svg className="w-10 h-10 text-cultural-gold/80 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                    <span className="text-xs uppercase tracking-widest text-cultural-gold/90 font-semibold font-serif">
                      Ορφέας
                    </span>
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-sm text-cultural-gold text-xs font-bold px-3 py-1 rounded-full border border-cultural-gold/20">
                  {formatDate(activity.created_at)}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex flex-col flex-grow space-y-3">
                <h3 className="font-bold text-xl text-slate-900 font-serif line-clamp-2 hover:text-cultural-burgundy transition-colors duration-200">
                  {activity.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed line-clamp-4 flex-grow">
                  {activity.content}
                </p>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-cultural-burgundy uppercase tracking-wider">
                  <span>Διαβάστε Περισσότερα</span>
                  <i className="fas fa-arrow-right transform group-hover:translate-x-1 transition-transform"></i>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Detail Modal Dialog */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl border border-slate-200/50 flex flex-col animate-fade-in relative max-h-[90vh]">
            
            {/* Modal Image Header or Gradient Header */}
            <div className="relative h-64 sm:h-80 bg-slate-900 flex-shrink-0">
              {selectedActivity.image_url ? (
                <img
                  src={selectedActivity.image_url}
                  alt={selectedActivity.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-950 via-cultural-blue to-cultural-burgundy flex items-center justify-center">
                  <svg className="w-16 h-16 text-cultural-gold/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
              )}
              {/* Close Button */}
              <button 
                onClick={() => setSelectedActivity(null)}
                className="absolute top-4 right-4 bg-slate-950/70 hover:bg-slate-950 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors border border-white/20"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-4">
              <span className="text-cultural-gold text-xs font-semibold uppercase tracking-wider block">
                <i className="far fa-calendar-alt mr-1"></i> {formatDate(selectedActivity.created_at)}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-serif text-slate-900 leading-tight">
                {selectedActivity.title}
              </h3>
              <p className="text-slate-700 text-base leading-relaxed whitespace-pre-line text-justify pt-2">
                {selectedActivity.content}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end flex-shrink-0">
              <button
                onClick={() => setSelectedActivity(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                Κλείσιμο
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
