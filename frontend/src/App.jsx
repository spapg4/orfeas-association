import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ActivitiesFeed from './components/ActivitiesFeed';
import RegistrationForm from './components/RegistrationForm';
import AdminPanel from './components/AdminPanel';
import Calendar from './components/Calendar';
import { api } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [settings, setSettings] = useState({});

  // Check admin session and load settings on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('orfeas_admin_token');
      if (token) {
        try {
          await api.verifyToken();
          setIsAdminLoggedIn(true);
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          localStorage.removeItem('orfeas_admin_token');
          setIsAdminLoggedIn(false);
        }
      }
    };
    checkSession();

    api.getSettings().then(data => {
      if (data) setSettings(data);
    }).catch(err => console.error("Could not load footer settings", err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('orfeas_admin_token');
    setIsAdminLoggedIn(false);
    setActiveTab('home');
  };

  return (
    <div className="flex flex-col min-h-screen bg-cultural-cream">
      {/* Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdminLoggedIn={isAdminLoggedIn}
        handleLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeTab === 'home' && (
          <>
            <Hero onRegisterClick={() => setActiveTab('register')} />
            <Calendar />
          </>
        )}
        
        {activeTab === 'activities' && (
          <ActivitiesFeed />
        )}
        
        {activeTab === 'register' && (
          <RegistrationForm />
        )}
        
        {activeTab === 'admin' && (
          <AdminPanel 
            isAdminLoggedIn={isAdminLoggedIn} 
            setIsAdminLoggedIn={setIsAdminLoggedIn} 
            onSettingsUpdate={async () => {
              const data = await api.getSettings();
              if (data) setSettings(data);
            }}
          />
        )}
      </main>

      {/* Premium Heritage Footer */}
      <footer className="bg-slate-900 border-t border-cultural-gold/20 text-slate-400 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
            {/* Column 1: Info */}
            <div className="space-y-4">
              <h4 className="text-white font-bold font-serif text-lg tracking-tight">
                Μ.Ε.Σ. <span className="text-cultural-gold">"ΟΡΦΕΑΣ"</span>
              </h4>
              <p className="text-sm leading-relaxed max-w-xs whitespace-pre-line">
                {settings.footer_about_text || 'Μορφωτικός & Εξωραϊστικός Σύλλογος Μεγάλου Ελευθεροχωρίου Ελασσόνας. Ιδρύθηκε το 1982 με σκοπό την προώθηση του πολιτισμού και τον εξωραϊσμό του τόπου μας.'}
              </p>
            </div>
            
            {/* Column 2: Quick Links */}
            <div className="space-y-4">
              <h4 className="text-white font-bold font-serif text-lg tracking-tight">
                Γρήγοροι Σύνδεσμοι
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => setActiveTab('home')} className="hover:text-cultural-gold transition-colors">
                    Αρχική & Ιστορία
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('activities')} className="hover:text-cultural-gold transition-colors">
                    Δραστηριότητες & Νέα
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('register')} className="hover:text-cultural-gold transition-colors">
                    Εγγραφή & Συνδρομές
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('admin')} className="hover:text-cultural-gold transition-colors">
                    Διαχείριση
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact */}
            <div className="space-y-4">
              <h4 className="text-white font-bold font-serif text-lg tracking-tight">
                Επικοινωνία
              </h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center space-x-2">
                  <i className="fas fa-map-marker-alt text-cultural-gold"></i>
                  <span className="whitespace-pre-line">{settings.footer_address || 'Μεγάλο Ελευθεροχώρι Ελασσόνας, Τ.Κ. 40200'}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <i className="fas fa-envelope text-cultural-gold"></i>
                  <span className="whitespace-pre-line">{settings.footer_email || 'orfeas.meg.elefth@gmail.com'}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <i className="fas fa-phone-alt text-cultural-gold"></i>
                  <span className="whitespace-pre-line">{settings.footer_phone || '+30 24930 XXXXX'}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>
              &copy; {new Date().getFullYear()} Μ.Ε.Σ. Ορφέας Μεγάλου Ελευθεροχωρίου. Όλα τα δικαιώματα διατηρούνται.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-cultural-gold"><i className="fab fa-facebook text-lg"></i></a>
              <a href="#" className="hover:text-cultural-gold"><i className="fab fa-youtube text-lg"></i></a>
              <a href="#" className="hover:text-cultural-gold"><i className="fab fa-instagram text-lg"></i></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
