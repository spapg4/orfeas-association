import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function Hero({ onRegisterClick }) {
  const [settings, setSettings] = useState({
    hero_title: 'Μορφωτικός & Εξωραϊστικός Σύλλογος "Ο ΟΡΦΕΑΣ"',
    hero_subtitle: 'Μεγάλου Ελευθεροχωρίου Ελασσόνας. Διατηρώντας τις παραδόσεις, καλλιεργώντας τον πολιτισμό και ομορφαίνοντας τον τόπο μας για τις επόμενες γενιές.',
    hero_image_url: '/hero-banner.jpg',
    about_text_1: 'Ο Μορφωτικός και Εξωραϊστικός Σύλλογος «Ορφέας» Μεγάλου Ελευθεροχωρίου Ελασσόνας ιδρύθηκε με σκοπό να αποτελέσει τον συνδετικό κρίκο των απανταχού Ελευθεροχωριτών και να κρατήσει ζωντανή την πολιτιστική ταυτότητα του τόπου μας.',
    about_text_2: 'Μέσα από τις ποικίλες δραστηριότητές μας ο Σύλλογος επιδιώκει να αναβαθμίσει την ποιότητα ζωής στο χωριό και να προσφέρει δημιουργικά ερεθίσματα στους νέους μας.',
    stat_year: '1982',
    stat_members: '500+',
    stat_actions: '20+',
    highlight_1_title: 'Πολιτιστική Κληρονομιά',
    highlight_1_text: 'Διατήρηση και διάδοση των παραδοσιακών χορών, εθίμων, τραγουδιών και της πλούσιας ιστορίας του Μεγάλου Ελευθεροχωρίου.',
    highlight_2_title: 'Εξωραϊστικές Δράσεις',
    highlight_2_text: 'Συνεχής φροντίδα για την ανάπλαση, τον καθαρισμό και την αισθητική αναβάθμιση των κοινόχρηστων χώρων του χωριού μας.',
    highlight_3_title: 'Κοινωνική Αλληλεγγύη',
    highlight_3_text: 'Δημιουργία ισχυρών δεσμών μεταξύ των συγχωριανών μας, υποστήριξη της νεολαίας και διοργάνωση φιλανθρωπικών εκδηλώσεων.'
  });

  const [slideshowImages, setSlideshowImages] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    api.getSettings().then(data => {
      if (data) setSettings(data);
    }).catch(err => console.error("Could not load homepage settings", err));

    api.getSlideshowImages().then(images => {
      if (images && images.length > 0) {
        setSlideshowImages(images);
      }
    }).catch(err => console.error("Could not load slideshow images", err));
  }, []);

  useEffect(() => {
    if (slideshowImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % slideshowImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slideshowImages]);

  return (
    <div className="space-y-16 animate-slide-up">
      {/* Visual Hero Banner Section */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-cultural-gold/20 h-[460px]">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent z-10"></div>
        
        {slideshowImages.length > 0 ? (
          slideshowImages.map((imgUrl, idx) => (
            <img
              key={imgUrl}
              src={imgUrl}
              alt={`Δραστηριότητα ${idx}`}
              className={`absolute inset-0 w-full h-[460px] object-cover object-center transform hover:scale-105 transition-opacity duration-1000 ease-in-out ${
                idx === currentSlideIndex ? 'opacity-100 z-0' : 'opacity-0 z-0'
              }`}
            />
          ))
        ) : (
          <img
            src={settings.hero_image_url}
            alt="Ηρωική Εικόνα"
            className="absolute inset-0 w-full h-[460px] object-cover object-center transform hover:scale-105 transition-transform duration-700 z-0"
          />
        )}

        <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12 z-20 text-white">
          <span className="inline-block bg-cultural-gold/90 text-slate-950 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            Καλώς Ήλθατε
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-serif tracking-tight leading-tight text-shadow-premium whitespace-pre-line">
            {settings.hero_title}
          </h1>
          <p className="mt-4 text-slate-200 text-base sm:text-lg max-w-2xl font-light whitespace-pre-line">
            {settings.hero_subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={onRegisterClick}
              className="bg-cultural-burgundy hover:bg-cultural-burgundy/95 text-white font-medium px-6 py-3 rounded-xl shadow-lg border border-cultural-gold/30 flex items-center space-x-2 transform hover:-translate-y-0.5 transition-all duration-300"
            >
              <i className="fas fa-user-plus text-cultural-gold"></i>
              <span>Γίνετε Μέλος</span>
            </button>
            <a
              href="#history"
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-3 rounded-xl shadow-lg backdrop-blur-sm border border-white/20 flex items-center space-x-2 transform hover:-translate-y-0.5 transition-all duration-300"
            >
              <i className="fas fa-book-open text-cultural-gold"></i>
              <span>Η Ιστορία μας</span>
            </a>
          </div>
        </div>
      </div>

      {/* Quick Stats / Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-cultural-burgundy/10 flex items-center justify-center text-cultural-burgundy flex-shrink-0">
            <i className="fas fa-university text-xl"></i>
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">{settings.highlight_1_title}</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {settings.highlight_1_text}
            </p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-cultural-blue/10 flex items-center justify-center text-cultural-blue flex-shrink-0">
            <i className="fas fa-paint-brush text-xl"></i>
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">{settings.highlight_2_title}</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {settings.highlight_2_text}
            </p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-cultural-gold/10 flex items-center justify-center text-cultural-gold flex-shrink-0">
            <i className="fas fa-users text-xl"></i>
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">{settings.highlight_3_title}</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {settings.highlight_3_text}
            </p>
          </div>
        </div>
      </div>

      {/* History and Mission Section */}
      <section id="history" className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cultural-gold/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cultural-burgundy/5 rounded-full blur-3xl -z-10"></div>
        
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold font-serif text-slate-900 relative inline-block pb-3">
            Η Ιστορία & Η Αποστολή μας
            <span className="absolute bottom-0 left-1/4 right-1/4 h-[3px] bg-cultural-gold rounded-full"></span>
          </h2>
          <p className="text-slate-600 text-base leading-relaxed text-justify whitespace-pre-line">
            {settings.about_text_1}
          </p>
          <p className="text-slate-600 text-base leading-relaxed text-justify whitespace-pre-line">
            {settings.about_text_2}
          </p>
          
          <div className="pt-6 border-t border-slate-100 flex justify-center text-slate-500 text-sm">
            <div className="flex flex-col items-center text-center">
              <span className="font-serif text-4xl font-extrabold text-cultural-burgundy">{settings.stat_year}</span>
              <span className="mt-1 font-medium tracking-wide uppercase text-xs text-slate-400">Έτος Ίδρυσης</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
