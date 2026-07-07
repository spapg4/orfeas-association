import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    fullname: '',
    father_name: '',
    phone: '',
    email: '',
    address: '',
    gdpr_consent: false
  });
  const [paymentProof, setPaymentProof] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Settings for Bank Info & Fee
  const [settings, setSettings] = useState({
    payment_bank: 'Φόρτωση...',
    payment_beneficiary: 'Φόρτωση...',
    payment_iban: '',
    payment_fee: '20' // default fallback
  });

  useEffect(() => {
    // Fetch global settings dynamically for the registration page
    api.getSettings().then(data => {
      if (data) {
        setSettings(data);
      }
    }).catch(err => console.error("Could not load settings", err));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (!formData.fullname || !formData.father_name || !formData.phone || !formData.email || !formData.address) {
      setError('Όλα τα πεδία της αίτησης είναι υποχρεωτικά.');
      return;
    }

    if (!formData.gdpr_consent) {
      setError('Πρέπει να συμφωνήσετε με την επεξεργασία των δεδομένων σας (GDPR) για να συνεχίσετε.');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('fullname', formData.fullname);
      data.append('father_name', formData.father_name);
      data.append('phone', formData.phone);
      data.append('email', formData.email);
      data.append('address', formData.address);
      data.append('gdpr_consent', formData.gdpr_consent);
      
      if (paymentProof) {
        data.append('payment_proof', paymentProof);
      }

      await api.registerMember(data);
      setSuccess('Η αίτηση εγγραφής σας υποβλήθηκε επιτυχώς! Το Διοικητικό Συμβούλιο θα ελέγξει τα στοιχεία σας και θα εγκρίνει την εγγραφή σας σύντομα.');
      // Reset form
      setFormData({
        fullname: '',
        father_name: '',
        phone: '',
        email: '',
        address: '',
        gdpr_consent: false
      });
      setPaymentProof(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Αποτυχία υποβολής αίτησης. Παρακαλώ ελέγξτε τα στοιχεία σας.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start animate-slide-up">
      
      {/* Left Column: Financial Contribution & Bank Details info */}
      <div className="lg:col-span-5 space-y-8">
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 space-y-6">
          <span className="text-cultural-burgundy text-xs font-bold uppercase tracking-widest px-3 py-1 bg-cultural-burgundy/10 rounded-full">
            Ετήσια Συνδρομή
          </span>
          <h2 className="text-2xl font-bold font-serif text-slate-900 leading-snug">
            Συνεισφορά & Συνδρομή Μέλους
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Η ετήσια συνδρομή για τα μέλη του Συλλόγου μας είναι <span className="font-bold text-cultural-burgundy">{settings.payment_fee}€</span>. Η συνδρομή σας στηρίζει άμεσα τη συντήρηση του χωριού, τις πολιτιστικές εκδηλώσεις, το χορευτικό τμήμα και τις δραστηριότητες της νεολαίας.
          </p>

          {/* IBAN Box */}
          <div className="bg-cultural-cream/50 rounded-2xl p-6 border border-cultural-gold/20 space-y-4">
            <h3 className="text-slate-800 font-bold text-sm tracking-wide uppercase flex items-center space-x-2">
              <i className="fas fa-university text-cultural-gold"></i>
              <span>Τραπεζικός Λογαριασμός (IBAN)</span>
            </h3>
            
            <div className="space-y-3 text-xs sm:text-sm text-slate-700">
              <div>
                <span className="text-slate-400 block text-xs">Τράπεζα</span>
                <span className="font-semibold text-slate-900">{settings.payment_bank}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">Δικαιούχος</span>
                <span className="font-semibold text-slate-900">{settings.payment_beneficiary}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">Αριθμός Λογαριασμού (IBAN)</span>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 mt-1 select-all font-mono font-bold text-slate-900 overflow-x-auto">
                  <span>{settings.payment_iban}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(settings.payment_iban);
                      alert('Αντιγράφηκε στο πρόχειρο!');
                    }}
                    className="ml-2 text-cultural-gold hover:text-cultural-burgundy transition-colors flex-shrink-0"
                    title="Αντιγραφή IBAN"
                  >
                    <i className="far fa-copy"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-sm text-blue-800 flex items-start space-x-3">
            <i className="fas fa-info-circle text-lg mt-0.5 text-blue-600 flex-shrink-0"></i>
            <p className="leading-relaxed">
              <strong>Πώς λειτουργεί:</strong> Κάντε την κατάθεση μέσω Web Banking ή σε κατάστημα, κρατήστε το αποδεικτικό κατάθεσης (σε μορφή εικόνας ή PDF) και επισυνάψτε το κατά την υποβολή της διπλανής φόρμας για άμεση επιβεβαίωση της πληρωμής.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Member Registration Form */}
      <div className="lg:col-span-7">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 space-y-6">
          <h2 className="text-2xl font-bold font-serif text-slate-900">
            Αίτηση Εγγραφής Νέου Μέλους
          </h2>
          <p className="text-slate-500 text-sm">
            Παρακαλώ συμπληρώστε τα στοιχεία σας προσεκτικά. Τα πεδία με αστερίσκο (*) είναι υποχρεωτικά.
          </p>

          {/* Success / Error Messages */}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-6 py-4 rounded-xl flex items-start space-x-3 shadow-sm">
              <i className="fas fa-check-circle text-emerald-600 text-xl mt-0.5 flex-shrink-0"></i>
              <span className="text-sm font-medium leading-relaxed">{success}</span>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl flex items-start space-x-3 shadow-sm">
              <i className="fas fa-exclamation-circle text-red-600 text-xl mt-0.5 flex-shrink-0"></i>
              <span className="text-sm font-medium leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold text-sm">Ονοματεπώνυμο *</label>
              <input
                type="text"
                name="fullname"
                value={formData.fullname}
                onChange={handleChange}
                placeholder="π.χ. Ιωάννης Παπαδόπουλος"
                className="w-full bg-slate-50 border border-slate-200 focus:border-cultural-gold focus:bg-white focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-3 text-sm transition-all outline-none"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold text-sm">Όνομα Πατρός *</label>
              <input
                type="text"
                name="father_name"
                value={formData.father_name}
                onChange={handleChange}
                placeholder="π.χ. Γεώργιος"
                className="w-full bg-slate-50 border border-slate-200 focus:border-cultural-gold focus:bg-white focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-3 text-sm transition-all outline-none"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold text-sm">Τηλέφωνο Επικοινωνίας *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="π.χ. 69XXXXXXXX"
                className="w-full bg-slate-50 border border-slate-200 focus:border-cultural-gold focus:bg-white focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-3 text-sm transition-all outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold text-sm">Διεύθυνση Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="π.ex. info@example.gr"
                className="w-full bg-slate-50 border border-slate-200 focus:border-cultural-gold focus:bg-white focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-3 text-sm transition-all outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 font-semibold text-sm">Διεύθυνση Κατοικίας *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Οδός, Αριθμός, Πόλη / Χωριό, Τ.Κ."
              className="w-full bg-slate-50 border border-slate-200 focus:border-cultural-gold focus:bg-white focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-3 text-sm transition-all outline-none"
              required
            />
          </div>

          {/* Payment Proof Upload Field */}
          <div className="space-y-2">
            <label className="text-slate-700 font-semibold text-sm block">Αποδεικτικό Κατάθεσης Συνδρομής (Προαιρετικό)</label>
            <div className="border-2 border-dashed border-slate-200 hover:border-cultural-gold bg-slate-50/50 rounded-2xl p-6 text-center cursor-pointer transition-colors duration-300 relative">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-2">
                <i className="fas fa-cloud-upload-alt text-3xl text-slate-400"></i>
                <div className="text-sm font-medium text-slate-600">
                  {paymentProof ? (
                    <span className="text-cultural-burgundy font-semibold">
                      <i className="fas fa-file-invoice mr-1"></i> {paymentProof.name} ({Math.round(paymentProof.size / 1024)} KB)
                    </span>
                  ) : (
                    <span>Σύρετε ή επιλέξτε αρχείο από τον υπολογιστή σας</span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Επιτρεπτά αρχεία: JPG, PNG, PDF. Μέγιστο μέγεθος: 5MB
                </p>
              </div>
            </div>
          </div>

          {/* GDPR compliance checkbox */}
          <div className="flex items-start space-x-3 pt-2">
            <input
              type="checkbox"
              id="gdpr_consent"
              name="gdpr_consent"
              checked={formData.gdpr_consent}
              onChange={handleChange}
              className="w-5 h-5 rounded border-slate-300 text-cultural-burgundy focus:ring-cultural-burgundy mt-0.5 accent-cultural-burgundy cursor-pointer"
              required
            />
            <label htmlFor="gdpr_consent" className="text-xs text-slate-500 leading-relaxed cursor-pointer select-none">
              Συναινώ στη συλλογή, αποθήκευση και επεξεργασία των προσωπικών μου δεδομένων από τον Σύλλογο αποκλειστικά για σκοπούς επικοινωνίας και διαχείρισης της ιδιότητας μέλους, σύμφωνα με τον Γενικό Κανονισμό Προστασίας Δεδομένων (GDPR). *
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 disabled:bg-slate-400 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Υποβολή Αίτησης...</span>
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane text-cultural-gold"></i>
                <span>Υποβολή Αίτησης Εγγραφής</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
