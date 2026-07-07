import React, { useState } from 'react';

export default function Header({ activeTab, setActiveTab, isAdminLoggedIn, handleLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Αρχική & Ιστορία', icon: 'fa-home' },
    { id: 'activities', label: 'Δραστηριότητες', icon: 'fa-bullhorn' },
    { id: 'register', label: 'Εγγραφή Μέλους', icon: 'fa-user-plus' },
    { id: 'admin', label: isAdminLoggedIn ? 'Πίνακας Ελέγχου' : 'Σύνδεση Διαχειριστή', icon: 'fa-user-shield' }
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 text-white shadow-xl backdrop-blur-md border-b border-cultural-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleTabClick('home')}>
            {/* Custom SVG logo representing a cultural lyre / Orpheus harp */}
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cultural-burgundy to-cultural-blue rounded-xl flex items-center justify-center border border-cultural-gold/50 shadow-lg shadow-cultural-gold/10 hover:rotate-6 transition-transform duration-300">
              <svg className="w-7 h-7 text-cultural-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
                <line x1="9" y1="10" x2="21" y2="8" />
              </svg>
            </div>
            <div className="hidden md:block">
              <span className="text-xs uppercase tracking-widest text-cultural-gold font-semibold block">Μορφωτικός & Εξωραϊστικός Σύλλογος</span>
              <span className="text-base font-bold font-serif tracking-tight text-white hover:text-cultural-gold transition-colors duration-300">"Ορφέας" Μεγάλου Ελευθεροχωρίου</span>
            </div>
            <div className="block md:hidden">
              <span className="text-xs uppercase tracking-widest text-cultural-gold font-semibold block">Σύλλογος "Ορφέας"</span>
              <span className="text-sm font-bold font-serif text-white">Μ. Ελευθεροχωρίου</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium tracking-wide transition-all duration-300 ${
                  activeTab === item.id
                    ? 'bg-cultural-burgundy text-white border-b-2 border-cultural-gold shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <i className={`fas ${item.icon} text-cultural-gold`}></i>
                <span>{item.label}</span>
              </button>
            ))}
            {isAdminLoggedIn && (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-all duration-300"
                title="Αποσύνδεση"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span className="hidden xl:inline">Έξοδος</span>
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center space-x-2">
            {isAdminLoggedIn && (
              <button
                onClick={handleLogout}
                className="p-2 text-red-400 hover:text-red-300 transition-all"
                title="Αποσύνδεση"
              >
                <i className="fas fa-sign-out-alt text-lg"></i>
              </button>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition-colors"
            >
              <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <div
        className={`lg:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-screen opacity-100 py-4 border-t border-slate-800' : 'max-h-0 opacity-0 overflow-hidden'
        } bg-slate-900 px-4`}
      >
        <div className="space-y-1 pb-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-base font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-cultural-burgundy text-white border-l-4 border-cultural-gold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <i className={`fas ${item.icon} text-cultural-gold w-5`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
