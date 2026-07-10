import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function ArticlesList() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create Article Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Selected Article Detail Modal
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const data = await api.getArticles();
      setArticles(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Αποτυχία φόρτωσης άρθρων. Παρακαλώ δοκιμάστε ξανά αργότερα.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setSubmitError('Τα πεδία Τίτλος και Περιεχόμενο είναι υποχρεωτικά.');
      return;
    }

    setSubmitLoading(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      await api.createArticle({
        title: title.trim(),
        content: content.trim(),
        author: author.trim() !== '' ? author.trim() : 'Ανώνυμος'
      });
      setSubmitSuccess(true);
      setTitle('');
      setAuthor('');
      setContent('');
      // Auto close after 3 seconds
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(false);
      }, 3500);
    } catch (err) {
      setSubmitError(err.message || 'Αποτυχία υποβολής άρθρου.');
    } finally {
      setSubmitLoading(false);
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
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-slate-900 text-white p-8 sm:p-10 rounded-3xl border border-cultural-gold/20 shadow-xl relative overflow-hidden">
        {/* Background gradient decorative element */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-cultural-gold/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="space-y-2 max-w-xl">
          <span className="text-cultural-gold text-xs font-bold uppercase tracking-widest px-3 py-1 bg-cultural-gold/10 rounded-full border border-cultural-gold/20">
            ΒΗΜΑ ΣΥΝΕΙΣΦΟΡΑΣ
          </span>
          <h2 className="text-3xl font-bold font-serif tracking-tight text-white mt-2">
            Άρθρα & Λαογραφία
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Διαβάστε κείμενα των μελών μας ή γράψτε και μοιραστείτε το δικό σας άρθρο για την ιστορία, τα έθιμα και τον πολιτισμό του τόπου μας.
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setSubmitSuccess(false);
            setSubmitError('');
          }}
          className="bg-cultural-gold hover:bg-cultural-gold/90 text-slate-950 font-bold px-6 py-3.5 rounded-xl text-sm flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg shadow-cultural-gold/10 self-start md:self-center shrink-0"
        >
          <i className="fas fa-feather-alt text-base"></i>
          <span>Δημιουργία Άρθρου</span>
        </button>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-12 h-12 border-4 border-cultural-gold border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium text-sm">Φόρτωση άρθρων...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center shadow-sm max-w-md mx-auto text-sm">
          <i className="fas fa-exclamation-circle text-2xl mb-2 block"></i>
          <span>{error}</span>
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-slate-200/60 shadow-sm max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <i className="fas fa-book-open text-2xl"></i>
          </div>
          <h3 className="font-bold text-slate-800 text-base">Δεν υπάρχουν δημοσιευμένα άρθρα</h3>
          <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">
            Γίνετε ο πρώτος που θα συνεισφέρει! Πατήστε το κουμπί «Δημιουργία Άρθρου» για να γράψετε το πρώτο άρθρο.
          </p>
        </div>
      ) : (
        /* Grid of Articles */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <article 
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/60 hover:border-cultural-gold/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group shadow-sm"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span className="flex items-center space-x-1.5">
                    <i className="far fa-user text-cultural-gold/80"></i>
                    <span className="truncate max-w-[120px]">{article.author}</span>
                  </span>
                  <span>{formatDate(article.created_at)}</span>
                </div>
                
                <h3 className="font-serif font-bold text-lg text-slate-900 group-hover:text-cultural-burgundy transition-colors line-clamp-2">
                  {article.title}
                </h3>
                
                <p className="text-slate-600 text-sm leading-relaxed line-clamp-4 font-light">
                  {article.content}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-cultural-burgundy">
                <span>ΔΙΑΒΑΣΤΕ ΠΕΡΙΣΣΟΤΕΡΑ</span>
                <i className="fas fa-chevron-right transform group-hover:translate-x-1 transition-transform"></i>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* --- MODAL 1: Create Article Form Dialog --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <form 
            onSubmit={handleCreateSubmit}
            className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl border border-slate-200/50 flex flex-col animate-fade-in"
          >
            <div className="bg-slate-900 text-white px-6 py-4.5 flex items-center justify-between border-b border-cultural-gold/20">
              <h4 className="font-bold font-serif text-lg text-cultural-gold flex items-center space-x-2">
                <i className="fas fa-pen-nib"></i>
                <span>Συγγραφή Νέου Άρθρου</span>
              </h4>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors focus:outline-none"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-5 text-sm text-slate-600">
              {submitSuccess ? (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-6 rounded-2xl text-center space-y-2 animate-fade-in">
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-xl animate-bounce">
                    <i className="fas fa-check"></i>
                  </div>
                  <h5 className="font-bold text-base">Επιτυχής Υποβολή!</h5>
                  <p className="text-xs leading-relaxed max-w-sm mx-auto">
                    Το άρθρο σας υποβλήθηκε επιτυχώς και θα εμφανιστεί στη σελίδα μόλις εγκριθεί από τον διαχειριστή του Συλλόγου. Ευχαριστούμε για τη συνεισφορά σας!
                  </p>
                </div>
              ) : (
                <>
                  {submitError && (
                    <div className="bg-red-50 border border-red-100 text-red-700 p-3.5 rounded-xl text-xs">
                      {submitError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-700 font-semibold text-xs uppercase tracking-wider block">Τίτλος Άρθρου *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="π.χ. Η Ιστορία του Νερόμυλου"
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        className="w-full border border-slate-200 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2.5 text-sm transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-700 font-semibold text-xs uppercase tracking-wider block">Όνομα Συντάκτη / Ψευδώνυμο</label>
                      <input 
                        type="text" 
                        placeholder="π.χ. Γεώργιος Παπαδόπουλος"
                        value={author} 
                        onChange={(e) => setAuthor(e.target.value)} 
                        className="w-full border border-slate-200 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2.5 text-sm transition-all outline-none"
                      />
                      <span className="text-[10px] text-slate-400 block">* Αφήστε κενό για ανώνυμη υποβολή.</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-semibold text-xs uppercase tracking-wider block">Περιεχόμενο Άρθρου *</label>
                    <textarea 
                      rows="8"
                      required
                      placeholder="Γράψτε εδώ το άρθρο σας..."
                      value={content} 
                      onChange={(e) => setContent(e.target.value)} 
                      className="w-full border border-slate-200 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2.5 text-sm transition-all outline-none resize-none font-light leading-relaxed"
                    />
                  </div>
                </>
              )}
            </div>

            {!submitSuccess && (
              <div className="bg-slate-50 px-6 py-4.5 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-5 py-2.5 rounded-xl text-xs transition-all focus:outline-none"
                >
                  Ακύρωση
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="bg-cultural-burgundy hover:bg-cultural-burgundy/95 text-white font-semibold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5 focus:outline-none"
                >
                  {submitLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      <span>Υποβολή Άρθρου</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* --- MODAL 2: View Selected Article Overlay --- */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl border border-slate-200/50 flex flex-col animate-fade-in">
            <div className="bg-slate-900 text-white px-6 py-4.5 flex items-center justify-between border-b border-cultural-gold/20">
              <h4 className="font-bold font-serif text-base text-cultural-gold">
                Προβολή Άρθρου
              </h4>
              <button 
                onClick={() => setSelectedArticle(null)}
                className="text-slate-400 hover:text-white transition-colors focus:outline-none"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-semibold border-b border-slate-100 pb-3">
                  <span className="flex items-center space-x-1">
                    <i className="far fa-user text-cultural-gold/80"></i>
                    <span className="text-slate-600 font-bold">{selectedArticle.author}</span>
                  </span>
                  <span>•</span>
                  <span>{formatDate(selectedArticle.created_at)}</span>
                </div>
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-slate-900 pt-2 leading-snug">
                  {selectedArticle.title}
                </h3>
              </div>

              <p className="text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line font-light">
                {selectedArticle.content}
              </p>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedArticle(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all focus:outline-none shadow-sm"
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
