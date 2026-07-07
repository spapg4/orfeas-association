import React, { useState, useEffect } from 'react';
import { api } from '../api';

const getSubscriptionStatus = (member) => {
  if (member.deleted_at) {
    const deletedAt = new Date(member.deleted_at);
    return { label: 'Διεγραμμένο', code: 'deleted', date: deletedAt };
  }
  if (member.paid_status !== 'Paid' || !member.subscription_expires_at) return { label: 'Απλήρωτη', code: 'unpaid' };
  const expiresAt = new Date(member.subscription_expires_at);
  const now = new Date();
  if (expiresAt < now) return { label: 'Έληξε', code: 'expired', date: expiresAt };
  return { label: 'Ενεργή', code: 'active', date: expiresAt };
};

const printTable = (title, headers, rows) => {
  const printWindow = window.open('', '_blank');
  
  const headersHtml = headers.map(h => `<th>${h}</th>`).join('');
  const rowsHtml = rows.map(row => `
    <tr>
      ${row.map(cell => `<td>${cell}</td>`).join('')}
    </tr>
  `).join('');
  
  const html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
          body {
            font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif;
            color: #1e293b;
            padding: 40px;
            background: #fff;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #b45309;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            color: #7f1d1d;
            font-size: 24px;
            font-family: 'Georgia', serif;
          }
          .header p {
            margin: 5px 0 0 0;
            color: #64748b;
            font-size: 14px;
          }
          .meta {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #64748b;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            background-color: #f8fafc;
            color: #475569;
            font-weight: 600;
            text-align: left;
            padding: 12px 10px;
            border-bottom: 2px solid #e2e8f0;
            font-size: 13px;
          }
          td {
            padding: 12px 10px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 13px;
            color: #334155;
          }
          tr:nth-child(even) {
            background-color: rgba(248, 250, 252, 0.5);
          }
          .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: bold;
          }
          .status-active { background-color: #dcfce7; color: #166534; }
          .status-expired { background-color: #ffedd5; color: #9a3412; }
          .status-unpaid { background-color: #fee2e2; color: #991b1b; }
          .status-deleted { background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
          .footer {
            text-align: center;
            margin-top: 50px;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
            padding-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Μορφωτικός & Εξωραϊστικός Σύλλογος "Ο ΟΡΦΕΑΣ"</h1>
          <p>Μεγάλου Ελευθεροχωρίου Ελασσόνας | Έτος Ίδρυσης 1982</p>
        </div>
        
        <div class="meta">
          <span><strong>Αναφορά:</strong> ${title}</span>
          <span><strong>Ημερομηνία Εξαγωγής:</strong> ${new Date().toLocaleDateString('el-GR')}</span>
        </div>
        
        <table>
          <thead>
            <tr>
              ${headersHtml}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Εξαγωγή από το σύστημα διαχείρισης Μ.Ε.Σ. Ορφέας. Όλα τα δικαιώματα διατηρούνται.</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
};

export default function AdminPanel({ isAdminLoggedIn, setIsAdminLoggedIn, onSettingsUpdate }) {
  // Login State
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard Sub-tabs: 'activities' | 'members' | 'finances'
  const [activeSubTab, setActiveSubTab] = useState('activities');

  // Backend Data States
  const [activities, setActivities] = useState([]);
  const [members, setMembers] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // CRUD Activity States
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState({ id: null, title: '', content: '', image_url: '' });
  const [activityModalLoading, setActivityModalLoading] = useState(false);
  const [activityImageFile, setActivityImageFile] = useState(null);

  // Member Detail modal
  const [selectedMember, setSelectedMember] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editMemberData, setEditMemberData] = useState({});
  const [editMemberLoading, setEditMemberLoading] = useState(false);

  // Settings & Homepage
  const [settings, setSettings] = useState({});
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [heroImageFile, setHeroImageFile] = useState(null);
  const [slideshowImages, setSlideshowImages] = useState([]);
  const [isSlideshowUploading, setIsSlideshowUploading] = useState(false);

  // Payment Confirmation Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentModalMember, setPaymentModalMember] = useState(null);
  const [paymentModalExpiresAt, setPaymentModalExpiresAt] = useState('');
  const [isPaymentConfirmLoading, setIsPaymentConfirmLoading] = useState(false);

  useEffect(() => {
    if (isAdminLoggedIn) {
      loadDashboardData();
    }
  }, [isAdminLoggedIn]);

  const loadDashboardData = async () => {
    try {
      setLoadingData(true);
      setActionError('');
      const [actData, memData, settingsData, slideshowData] = await Promise.all([
        api.getActivities(),
        api.getMembers(),
        api.getSettings(),
        api.getSlideshowImages()
      ]);
      setActivities(actData);
      setMembers(memData);
      setSettings(settingsData);
      setSlideshowImages(slideshowData || []);
    } catch (err) {
      console.error(err);
      setActionError('Αποτυχία συγχρονισμού δεδομένων από τον διακομιστή.');
    } finally {
      setLoadingData(false);
    }
  };

  // Handle Admin Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!usernameInput || !passwordInput) {
      setLoginError('Παρακαλώ συμπληρώστε όλα τα πεδία.');
      return;
    }
    setLoginLoading(true);
    try {
      const data = await api.login(usernameInput, passwordInput);
      localStorage.setItem('orfeas_admin_token', data.token);
      setIsAdminLoggedIn(true);
      setUsernameInput('');
      setPasswordInput('');
    } catch (err) {
      setLoginError(err.message || 'Λανθασμένα στοιχεία σύνδεσης.');
    } finally {
      setLoginLoading(false);
    }
  };

  // ==========================================
  // ACTIVITIES CRUD FUNCTIONS
  // ==========================================
  const openActivityCreate = () => {
    setCurrentActivity({ id: null, title: '', content: '', image_url: '' });
    setActivityImageFile(null);
    setIsActivityModalOpen(true);
  };

  const openActivityEdit = (act) => {
    setCurrentActivity({ id: act.id, title: act.title, content: act.content, image_url: act.image_url || '' });
    setActivityImageFile(null);
    setIsActivityModalOpen(true);
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    if (!currentActivity.title || !currentActivity.content) {
      setActionError('Τίτλος και Περιεχόμενο είναι υποχρεωτικά.');
      return;
    }

    setActivityModalLoading(true);
    try {
      let finalActivity = { ...currentActivity };
      if (activityImageFile) {
        const { url } = await api.uploadImage(activityImageFile);
        finalActivity.image_url = url;
      }

      if (currentActivity.id) {
        // Edit Mode
        await api.updateActivity(currentActivity.id, finalActivity);
        setActionSuccess('Η ανακοίνωση επικαιροποιήθηκε επιτυχώς.');
      } else {
        // Create Mode
        await api.createActivity(finalActivity);
        setActionSuccess('Η νέα ανακοίνωση δημοσιεύθηκε επιτυχώς.');
      }
      setActivityImageFile(null);
      setIsActivityModalOpen(false);
      loadDashboardData();
    } catch (err) {
      setActionError(err.message || 'Αποτυχία αποθήκευσης ανακοίνωσης.');
    } finally {
      setActivityModalLoading(false);
    }
  };

  const handleDeleteActivity = async (id) => {
    if (!window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την ανακοίνωση;')) return;
    setActionError('');
    setActionSuccess('');
    try {
      await api.deleteActivity(id);
      setActionSuccess('Η ανακοίνωση διαγράφηκε επιτυχώς.');
      loadDashboardData();
    } catch (err) {
      setActionError(err.message || 'Αποτυχία διαγραφής ανακοίνωσης.');
    }
  };

  // ==========================================
  // MEMBERS STATUS MANAGEMENT FUNCTIONS
  // ==========================================
  const handleUpdateMemberStatus = async (id, status) => {
    setActionError('');
    setActionSuccess('');
    try {
      await api.updateMemberStatus(id, status);
      const msg = status === 'Approved' ? 'Ο χρήστης εγκρίθηκε.' : 'Ο χρήστης απορρίφθηκε.';
      setActionSuccess(msg);
      loadDashboardData();
      if (selectedMember && selectedMember.id === id) {
        setSelectedMember(prev => ({ ...prev, status }));
      }
    } catch (err) {
      setActionError(err.message || 'Αποτυχία ενημέρωσης κατάστασης.');
    }
  };

  const handleTogglePaidStatus = async (id, currentPaidStatus, subStatusCode) => {
    setActionError('');
    setActionSuccess('');
    
    let newPaidStatus = 'Paid';
    if (subStatusCode === 'expired') {
      newPaidStatus = 'Paid';
    } else if (currentPaidStatus === 'Paid') {
      newPaidStatus = 'Unpaid';
    }

    if (newPaidStatus === 'Paid') {
      const member = members.find(m => m.id === id);
      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      const formattedDate = oneYearLater.toISOString().split('T')[0];

      setPaymentModalMember(member);
      setPaymentModalExpiresAt(formattedDate);
      setIsPaymentModalOpen(true);
      return;
    }

    try {
      const updatedMember = await api.updateMemberPaidStatus(id, newPaidStatus);
      setActionSuccess('Ενημέρωση κατάστασης πληρωμής επιτυχής.');
      loadDashboardData();
      if (selectedMember && selectedMember.id === id) {
        setSelectedMember(prev => ({ ...prev, paid_status: updatedMember.paid_status, subscription_expires_at: updatedMember.subscription_expires_at }));
      }
    } catch (err) {
      setActionError(err.message || 'Αποτυχία ενημέρωσης πληρωμής.');
    }
  };

  const handleConfirmPaymentWithDate = async (e) => {
    e.preventDefault();
    if (!paymentModalMember) return;

    setActionError('');
    setActionSuccess('');
    setIsPaymentConfirmLoading(true);
    try {
      const updatedMember = await api.updateMemberPaidStatus(
        paymentModalMember.id, 
        'Paid', 
        paymentModalExpiresAt
      );
      setActionSuccess(`Η πληρωμή της συνδρομής για τον/την ${paymentModalMember.fullname} εγκρίθηκε με ημερομηνία λήξης: ${new Date(paymentModalExpiresAt).toLocaleDateString('el-GR')}.`);
      setIsPaymentModalOpen(false);
      setPaymentModalMember(null);
      loadDashboardData();
      if (selectedMember && selectedMember.id === paymentModalMember.id) {
        setSelectedMember(prev => ({ ...prev, paid_status: updatedMember.paid_status, subscription_expires_at: updatedMember.subscription_expires_at }));
      }
    } catch (err) {
      setActionError(err.message || 'Αποτυχία ενημέρωσης πληρωμής.');
    } finally {
      setIsPaymentConfirmLoading(false);
    }
  };

  const handleDeleteMember = async (id) => {
    if (!window.confirm('Προσοχή! Η διαγραφή θα αφαιρέσει οριστικά το μέλος από τη βάση δεδομένων. Συνέχεια;')) return;
    setActionError('');
    setActionSuccess('');
    try {
      await api.deleteMember(id);
      setActionSuccess('Το μέλος διαγράφηκε οριστικά.');
      setSelectedMember(null);
      loadDashboardData();
    } catch (err) {
      setActionError(err.message || 'Αποτυχία διαγραφής μέλους.');
    }
  };

  const handleExportMembersPDF = () => {
    const activeMembers = members.filter(m => !m.deleted_at);
    const headers = ['Ονοματεπώνυμο', 'Όνομα Πατρός', 'Τηλέφωνο', 'Email', 'Διεύθυνση', 'Κατάσταση'];
    const rows = activeMembers.map(m => [
      m.fullname,
      m.father_name,
      m.phone,
      m.email,
      m.address,
      m.status === 'Approved' ? 'Εγκεκριμένο' : m.status === 'Rejected' ? 'Απορρίφθηκε' : 'Εκκρεμεί'
    ]);
    printTable('Κατάσταση Αιτήσεων & Μελών', headers, rows);
  };

  const handleExportFinancesPDF = () => {
    const headers = ['Ονοματεπώνυμο', 'Τηλέφωνο', 'Απόδειξη Πληρωμής', 'Κατάσταση Συνδρομής', 'Λήξη/Διαγραφή'];
    const rows = members.map(m => {
      const st = getSubscriptionStatus(m);
      let dateStr = '-';
      if (st.date) {
        dateStr = st.date.toLocaleDateString('el-GR');
      }
      const badgeHtml = `<span class="status-badge status-${st.code}">${st.label}</span>`;
      return [
        m.fullname,
        m.phone,
        m.payment_proof_url ? 'Υποβλήθηκε' : 'Δεν υποβλήθηκε',
        badgeHtml,
        dateStr
      ];
    });
    printTable('Κατάσταση Συνδρομών & Πληρωμών', headers, rows);
  };

  const handleUpdateMemberDetails = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    setEditMemberLoading(true);
    try {
      const updated = await api.updateMemberDetails(selectedMember.id, editMemberData);
      setActionSuccess('Τα στοιχεία του μέλους ενημερώθηκαν επιτυχώς.');
      setSelectedMember({ ...selectedMember, ...updated });
      setIsEditMode(false);
      loadDashboardData();
    } catch (err) {
      setActionError(err.message || 'Αποτυχία ενημέρωσης στοιχείων.');
    } finally {
      setEditMemberLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    setIsSettingsSaving(true);
    try {
      let updatedSettings = { ...settings };
      if (heroImageFile) {
        const { url } = await api.uploadImage(heroImageFile);
        updatedSettings.hero_image_url = url;
        setSettings(updatedSettings);
      }
      await api.updateSettings(updatedSettings);
      setActionSuccess('Οι ρυθμίσεις αποθηκεύτηκαν επιτυχώς.');
      setHeroImageFile(null);
      loadDashboardData();
      if (onSettingsUpdate) onSettingsUpdate();
    } catch (err) {
      setActionError(err.message || 'Αποτυχία αποθήκευσης ρυθμίσεων.');
    } finally {
      setIsSettingsSaving(false);
    }
  };

  const handleSlideshowUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setActionError('');
    setActionSuccess('');
    setIsSlideshowUploading(true);
    try {
      await api.uploadSlideshowImage(file);
      setActionSuccess('Η εικόνα προστέθηκε επιτυχώς στο slideshow.');
      loadDashboardData();
    } catch (err) {
      setActionError(err.message || 'Αποτυχία ανεβάσματος εικόνας.');
    } finally {
      setIsSlideshowUploading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleSlideshowDelete = async (imgUrl) => {
    if (!window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την εικόνα από το slideshow;')) return;

    setActionError('');
    setActionSuccess('');
    try {
      const filename = imgUrl.substring(imgUrl.lastIndexOf('/') + 1);
      await api.deleteSlideshowImage(filename);
      setActionSuccess('Η εικόνα διαγράφηκε επιτυχώς από το slideshow.');
      loadDashboardData();
    } catch (err) {
      setActionError(err.message || 'Αποτυχία διαγραφής εικόνας.');
    }
  };

  // Render Login Card
  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-12 animate-slide-up">
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-cultural-burgundy/10 text-cultural-burgundy rounded-2xl flex items-center justify-center mx-auto border border-cultural-gold/30">
              <i className="fas fa-user-shield text-2xl"></i>
            </div>
            <h2 className="text-2xl font-bold font-serif text-slate-900">Σύνδεση Διαχειριστή</h2>
            <p className="text-slate-500 text-sm">
              Εισάγετε τα στοιχεία σας για να διαχειριστείτε τον ιστότοπο του Συλλόγου.
            </p>
          </div>

          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center space-x-2">
              <i className="fas fa-exclamation-triangle"></i>
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold text-sm">Όνομα Χρήστη (Username)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <i className="fas fa-user"></i>
                </span>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="π.χ. admin"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-cultural-gold focus:bg-white focus:ring-1 focus:ring-cultural-gold rounded-xl pl-10 pr-4 py-3 text-sm transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 font-semibold text-sm">Κωδικός Πρόσβασης (Password)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <i className="fas fa-lock"></i>
                </span>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-cultural-gold focus:bg-white focus:ring-1 focus:ring-cultural-gold rounded-xl pl-10 pr-4 py-3 text-sm transition-all outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 disabled:bg-slate-400 transform hover:-translate-y-0.5"
            >
              {loginLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt text-cultural-gold"></i>
                  <span>Σύνδεση</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render Dashboard
  return (
    <div className="space-y-8 animate-slide-up">
      {/* Top dashboard menu bar */}
      <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-cultural-gold/10 flex items-center justify-center text-cultural-gold">
            <i className="fas fa-chart-line text-xl"></i>
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg font-serif">Πίνακας Ελέγχου</h2>
            <p className="text-xs text-slate-500">Διαχείριση περιεχομένου, μελών και οικονομικών</p>
          </div>
        </div>

        {/* Dashboard Subtabs selection */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubTab('activities')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeSubTab === 'activities'
                ? 'bg-cultural-blue text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className="fas fa-bullhorn mr-1.5"></i> Δραστηριότητες
          </button>
          <button
            onClick={() => setActiveSubTab('members')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeSubTab === 'members'
                ? 'bg-cultural-burgundy text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className="fas fa-users-cog mr-1.5"></i> Έγκριση Μελών
          </button>
          <button
            onClick={() => setActiveSubTab('finances')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeSubTab === 'finances'
                ? 'bg-amber-700 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className="fas fa-wallet mr-1.5"></i> Συνδρομές
          </button>
          <button
            onClick={() => setActiveSubTab('homepage')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeSubTab === 'homepage'
                ? 'bg-purple-700 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className="fas fa-home mr-1.5"></i> Αρχική Σελίδα
          </button>
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeSubTab === 'settings'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className="fas fa-cog mr-1.5"></i> Ρυθμίσεις
          </button>
        </div>
      </div>

      {/* Operation logs feedback messages */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-6 py-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <i className="fas fa-check-circle text-emerald-600"></i>
            <span className="text-sm font-medium">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-slate-400 hover:text-slate-600">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <i className="fas fa-exclamation-circle text-red-600"></i>
            <span className="text-sm font-medium">{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="text-slate-400 hover:text-slate-600">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Main Tab Content */}
      {loadingData ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-cultural-gold border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm">Ανάκτηση στοιχείων...</span>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
          
          {/* TAB 1: MANAGE ACTIVITIES */}
          {activeSubTab === 'activities' && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold font-serif text-slate-900">Διαχείριση Δραστηριοτήτων & Ανακοινώσεων</h3>
                <button
                  onClick={openActivityCreate}
                  className="bg-cultural-burgundy hover:bg-cultural-burgundy/95 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center space-x-1.5 shadow-md transition-all"
                >
                  <i className="fas fa-plus"></i>
                  <span>Νέα Δημοσίευση</span>
                </button>
              </div>

              {activities.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-10">Δεν υπάρχουν καταχωρημένες δραστηριότητες.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 rounded-l-xl">Τίτλος</th>
                        <th className="px-6 py-4">Ημερομηνία</th>
                        <th className="px-6 py-4">Φωτογραφία (URL)</th>
                        <th className="px-6 py-4 text-right rounded-r-xl">Ενέργειες</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activities.map((act) => (
                        <tr key={act.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900 max-w-xs truncate">{act.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs">
                            {new Date(act.created_at).toLocaleDateString('el-GR')}
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate text-xs text-slate-400">
                            {act.image_url ? act.image_url : 'Καμία'}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                            <button
                              onClick={() => openActivityEdit(act)}
                              className="text-cultural-blue hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-100"
                              title="Επεξεργασία"
                            >
                              <i className="far fa-edit"></i> Επεξεργασία
                            </button>
                            <button
                              onClick={() => handleDeleteActivity(act.id)}
                              className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-100"
                              title="Διαγραφή"
                            >
                              <i className="far fa-trash-alt"></i> Διαγραφή
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REVIEW MEMBERS */}
          {activeSubTab === 'members' && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-xl font-bold font-serif text-slate-900">Έγκριση Αιτήσεων Νέων Μελών</h3>
                {members.length > 0 && (
                  <button
                    onClick={handleExportMembersPDF}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-all w-max animate-fade-in"
                  >
                    <i className="fas fa-file-pdf text-red-400"></i>
                    <span>Εξαγωγή σε PDF</span>
                  </button>
                )}
              </div>
              {members.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-10">Δεν υπάρχουν εγγεγραμμένα μέλη.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 rounded-l-xl">Ονοματεπώνυμο</th>
                        <th className="px-6 py-4">Όνομα Πατρός</th>
                        <th className="px-6 py-4">Τηλέφωνο</th>
                        <th className="px-6 py-4">Κατάσταση</th>
                        <th className="px-6 py-4 text-right rounded-r-xl">Ενέργειες</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {members.filter(m => !m.deleted_at).map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedMember(m)}
                              className="font-bold text-slate-900 hover:underline hover:text-cultural-burgundy text-left"
                            >
                              {m.fullname}
                            </button>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-xs text-slate-400 mt-0.5">
                              <span>{m.email}</span>
                              <span className="hidden sm:inline text-slate-300">•</span>
                              <span>Εγγραφή: {new Date(m.created_at).toLocaleDateString('el-GR')}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">{m.father_name}</td>
                          <td className="px-6 py-4 text-xs font-mono">{m.phone}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              m.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                              m.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {m.status === 'Approved' ? 'Εγκεκριμένο' :
                               m.status === 'Rejected' ? 'Απορρίφθηκε' : 'Εκκρεμεί'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                            {m.status !== 'Approved' && (
                              <button
                                onClick={() => handleUpdateMemberStatus(m.id, 'Approved')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm"
                              >
                                <i className="fas fa-check mr-1"></i> Έγκριση
                              </button>
                            )}
                            {m.status !== 'Rejected' && (
                              <button
                                onClick={() => handleUpdateMemberStatus(m.id, 'Rejected')}
                                className="bg-red-100 hover:bg-red-200 text-red-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                              >
                                <i className="fas fa-times mr-1"></i> Απόρριψη
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedMember(m)}
                              className="text-slate-500 hover:bg-slate-100 px-2 py-1.5 rounded-lg text-xs"
                              title="Προβολή στοιχείων"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FINANCIAL OVERVIEW */}
          {activeSubTab === 'finances' && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-xl font-bold font-serif text-slate-900">Έλεγχος Συνδρομών & Πληρωμών</h3>
                {members.length > 0 && (
                  <button
                    onClick={handleExportFinancesPDF}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-all w-max animate-fade-in"
                  >
                    <i className="fas fa-file-pdf text-red-400"></i>
                    <span>Εξαγωγή σε PDF</span>
                  </button>
                )}
              </div>
              {members.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-10">Δεν υπάρχουν εγγεγραμμένα μέλη για συνδρομή.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 rounded-l-xl">Μέλος</th>
                        <th className="px-6 py-4">Αποδεικτικό Πληρωμής</th>
                        <th className="px-6 py-4">Κατάσταση Συνδρομής</th>
                        <th className="px-6 py-4 text-right rounded-r-xl">Ενέργειες</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {members.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-900 block">{m.fullname}</span>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-xs text-slate-400 mt-0.5">
                              <span>{m.email}</span>
                              <span className="hidden sm:inline text-slate-300">•</span>
                              <span>Εγγραφή: {new Date(m.created_at).toLocaleDateString('el-GR')}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {m.payment_proof_url ? (
                              <a
                                href={m.payment_proof_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-cultural-blue hover:text-cultural-burgundy font-semibold text-xs flex items-center space-x-1.5"
                              >
                                <i className="fas fa-file-alt text-lg"></i>
                                <span>Προβολή Αποδεικτικού</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 text-xs italic">
                                <i className="fas fa-times-circle mr-1"></i> Δεν υποβλήθηκε
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(() => {
                              const st = getSubscriptionStatus(m);
                              return (
                                <div className="flex flex-col space-y-1">
                                  <span className={`w-max px-2.5 py-1 rounded-full text-xs font-bold ${
                                    st.code === 'active' ? 'bg-emerald-100 text-emerald-800' :
                                    st.code === 'expired' ? 'bg-orange-100 text-orange-800' :
                                    st.code === 'deleted' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {st.label}
                                  </span>
                                  {st.date && (
                                    <span className="text-[10px] text-slate-500">
                                      {st.code === 'expired' ? 'Έληξε: ' : st.code === 'deleted' ? 'Διαγράφηκε: ' : 'Λήγει: '} 
                                      {st.date.toLocaleDateString('el-GR')}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            {(() => {
                              const subStatus = getSubscriptionStatus(m);
                              const isActive = subStatus.code === 'active';
                              const isExpired = subStatus.code === 'expired';
                              const isDeleted = subStatus.code === 'deleted';
                              
                              if (isDeleted) {
                                return (
                                  <span className="text-xs text-slate-400 italic">Διαγραμμένο Μέλος</span>
                                );
                              }

                              if (isActive) {
                                return (
                                  <button
                                    disabled={true}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed flex items-center space-x-1.5 inline-flex"
                                    title="Δεν μπορείτε να ακυρώσετε ενεργή συνδρομή μέχρι να λήξει"
                                  >
                                    <i className="fas fa-lock text-[10px]"></i>
                                    <span>Συνδρομή Εξοφλήθηκε</span>
                                  </button>
                                );
                              }
                              
                              return (
                                <button
                                  onClick={() => handleTogglePaidStatus(m.id, m.paid_status, subStatus.code)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center space-x-1.5 inline-flex ${
                                    isExpired
                                      ? 'text-amber-700 bg-amber-50 border-amber-100 hover:bg-amber-100'
                                      : 'text-emerald-700 bg-emerald-50 border-emerald-100 hover:bg-emerald-100'
                                  }`}
                                >
                                  <i className="fas fa-check"></i>
                                  <span>{isExpired ? 'Ανανέωση Συνδρομής' : 'Πληρωμή Συνδρομής'}</span>
                                </button>
                              );
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HOMEPAGE SETTINGS */}
          {activeSubTab === 'homepage' && (
            <div className="p-6 sm:p-8 space-y-6">
              <h3 className="text-xl font-bold font-serif text-slate-900">Περιεχόμενα Αρχικής Σελίδας</h3>
              <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
                
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                  <h4 className="font-semibold text-slate-800 text-sm uppercase tracking-wider mb-2">Κείμενα & Τίτλοι</h4>
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-semibold text-sm">Κεντρικός Τίτλος</label>
                    <input type="text" value={settings.hero_title || ''} onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })} className="w-full bg-white border border-slate-200 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2 text-sm outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-semibold text-sm">Υπότιτλος</label>
                    <textarea rows="3" value={settings.hero_subtitle || ''} onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })} className="w-full bg-white border border-slate-200 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2 text-sm outline-none resize-none"></textarea>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                  <h4 className="font-semibold text-slate-800 text-sm uppercase tracking-wider mb-2">Κείμενα Ιστορίας</h4>
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-semibold text-sm">Παράγραφος 1</label>
                    <textarea rows="4" value={settings.about_text_1 || ''} onChange={(e) => setSettings({ ...settings, about_text_1: e.target.value })} className="w-full bg-white border border-slate-200 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2 text-sm outline-none resize-none"></textarea>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-semibold text-sm">Παράγραφος 2</label>
                    <textarea rows="4" value={settings.about_text_2 || ''} onChange={(e) => setSettings({ ...settings, about_text_2: e.target.value })} className="w-full bg-white border border-slate-200 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2 text-sm outline-none resize-none"></textarea>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                  <h4 className="font-semibold text-slate-800 text-sm uppercase tracking-wider mb-2">Κύρια Χαρακτηριστικά (Highlights)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-slate-700 font-semibold text-sm block">Τίτλος 1</label>
                      <input type="text" value={settings.highlight_1_title || ''} onChange={(e) => setSettings({ ...settings, highlight_1_title: e.target.value })} className="w-full bg-white border border-slate-200 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2 text-sm outline-none" />
                      <label className="text-slate-700 font-semibold text-sm mt-2 block">Κείμενο 1</label>
                      <textarea rows="3" value={settings.highlight_1_text || ''} onChange={(e) => setSettings({ ...settings, highlight_1_text: e.target.value })} className="w-full bg-white border border-slate-200 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2 text-sm outline-none resize-none"></textarea>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-700 font-semibold text-sm block">Τίτλος 2</label>
                      <input type="text" value={settings.highlight_2_title || ''} onChange={(e) => setSettings({ ...settings, highlight_2_title: e.target.value })} className="w-full bg-white border border-slate-200 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2 text-sm outline-none" />
                      <label className="text-slate-700 font-semibold text-sm mt-2 block">Κείμενο 2</label>
                      <textarea rows="3" value={settings.highlight_2_text || ''} onChange={(e) => setSettings({ ...settings, highlight_2_text: e.target.value })} className="w-full bg-white border border-slate-200 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2 text-sm outline-none resize-none"></textarea>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-700 font-semibold text-sm block">Τίτλος 3</label>
                      <input type="text" value={settings.highlight_3_title || ''} onChange={(e) => setSettings({ ...settings, highlight_3_title: e.target.value })} className="w-full bg-white border border-slate-200 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2 text-sm outline-none" />
                      <label className="text-slate-700 font-semibold text-sm mt-2 block">Κείμενο 3</label>
                      <textarea rows="3" value={settings.highlight_3_text || ''} onChange={(e) => setSettings({ ...settings, highlight_3_text: e.target.value })} className="w-full bg-white border border-slate-200 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2 text-sm outline-none resize-none"></textarea>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                  <h4 className="font-semibold text-slate-800 text-sm uppercase tracking-wider mb-2">Στατιστικά Ιστορίας</h4>
                  <div className="max-w-xs space-y-1.5">
                    <label className="text-slate-700 font-semibold text-sm">Έτος Ίδρυσης</label>
                    <input type="text" value={settings.stat_year || ''} onChange={(e) => setSettings({ ...settings, stat_year: e.target.value })} className="w-full bg-white border border-slate-200 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2 text-sm outline-none" />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                  <h4 className="font-semibold text-slate-800 text-sm uppercase tracking-wider mb-2">Slideshow Αρχικής Σελίδας</h4>
                  
                  {/* Grid showing existing slideshow images */}
                  {slideshowImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {slideshowImages.map((imgUrl, index) => (
                        <div key={imgUrl} className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm aspect-video bg-slate-100">
                          <img src={imgUrl} alt={`Slide ${index}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleSlideshowDelete(imgUrl)}
                            className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg p-1.5 text-xs shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            title="Διαγραφή εικόνας"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">Δεν υπάρχουν εικόνες στο slideshow. Θα χρησιμοποιηθεί η προεπιλεγμένη εικόνα φόντου παρακάτω.</p>
                  )}

                  {/* Add Image to Slideshow */}
                  <div className="pt-2">
                    <label className="text-slate-700 font-semibold text-sm block mb-1">Προσθήκη Εικόνας στο Slideshow</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSlideshowUpload}
                        disabled={isSlideshowUploading}
                        className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                      />
                      {isSlideshowUploading && <div className="w-4 h-4 border-2 border-purple-700 border-t-transparent rounded-full animate-spin"></div>}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                  <h4 className="font-semibold text-slate-800 text-sm uppercase tracking-wider mb-2">Προεπιλεγμένη Εικόνα (Fallback)</h4>
                  <div className="space-y-2">
                    <div className="text-sm text-slate-500 mb-2 flex items-center space-x-2">
                      <i className="fas fa-image text-slate-400"></i>
                      <span>Τρέχουσα: <a href={settings.hero_image_url} target="_blank" rel="noreferrer" className="text-cultural-blue hover:underline">Προβολή Εικόνας</a></span>
                    </div>
                    <input type="file" accept="image/*" onChange={(e) => setHeroImageFile(e.target.files[0])} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cultural-burgundy/10 file:text-cultural-burgundy hover:file:bg-cultural-burgundy/20" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="submit" disabled={isSettingsSaving} className="bg-cultural-burgundy hover:bg-cultural-burgundy/95 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-md transition-all flex items-center space-x-1.5">
                    {isSettingsSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><i className="fas fa-save"></i><span>Αποθήκευση Αλλαγών</span></>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeSubTab === 'settings' && (
            <div className="p-6 sm:p-8 space-y-6">
              <h3 className="text-xl font-bold font-serif text-slate-900">Ρυθμίσεις Συστήματος</h3>
              <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                  <h4 className="font-semibold text-slate-800 text-sm uppercase tracking-wider mb-2">Στοιχεία Τραπεζικού Λογαριασμού (IBAN)</h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-semibold text-sm">Τράπεζα</label>
                    <input
                      type="text"
                      value={settings.payment_bank || ''}
                      onChange={(e) => setSettings({ ...settings, payment_bank: e.target.value })}
                      className="w-full bg-white border border-slate-200 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2.5 text-sm transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-semibold text-sm">Δικαιούχος</label>
                    <input
                      type="text"
                      value={settings.payment_beneficiary || ''}
                      onChange={(e) => setSettings({ ...settings, payment_beneficiary: e.target.value })}
                      className="w-full bg-white border border-slate-200 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2.5 text-sm transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-semibold text-sm">IBAN</label>
                    <input
                      type="text"
                      value={settings.payment_iban || ''}
                      onChange={(e) => setSettings({ ...settings, payment_iban: e.target.value })}
                      className="w-full bg-white border border-slate-200 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2.5 text-sm font-mono transition-all outline-none"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-semibold text-sm">Ποσό Εγγραφής (€)</label>
                    <input
                      type="text"
                      value={settings.payment_fee || ''}
                      onChange={(e) => setSettings({ ...settings, payment_fee: e.target.value })}
                      className="w-full bg-white border border-slate-200 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2.5 text-sm transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                  <h4 className="font-semibold text-slate-800 text-sm uppercase tracking-wider mb-2">Στοιχεία Υποσέλιδου (Footer)</h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-semibold text-sm">Κείμενο "Μ.Ε.Σ. ΟΡΦΕΑΣ" (Info)</label>
                    <textarea
                      rows="3"
                      value={settings.footer_about_text || ''}
                      onChange={(e) => setSettings({ ...settings, footer_about_text: e.target.value })}
                      className="w-full bg-white border border-slate-200 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2.5 text-sm transition-all outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-semibold text-sm">Διεύθυνση</label>
                    <input
                      type="text"
                      value={settings.footer_address || ''}
                      onChange={(e) => setSettings({ ...settings, footer_address: e.target.value })}
                      className="w-full bg-white border border-slate-200 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2.5 text-sm transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-semibold text-sm">Email Επικοινωνίας</label>
                    <input
                      type="email"
                      value={settings.footer_email || ''}
                      onChange={(e) => setSettings({ ...settings, footer_email: e.target.value })}
                      className="w-full bg-white border border-slate-200 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2.5 text-sm transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-semibold text-sm">Τηλέφωνο Επικοινωνίας</label>
                    <input
                      type="text"
                      value={settings.footer_phone || ''}
                      onChange={(e) => setSettings({ ...settings, footer_phone: e.target.value })}
                      className="w-full bg-white border border-slate-200 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2.5 text-sm transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSettingsSaving}
                    className="bg-cultural-burgundy hover:bg-cultural-burgundy/95 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-md transition-all flex items-center space-x-1.5"
                  >
                    {isSettingsSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <i className="fas fa-save"></i>
                        <span>Αποθήκευση Ρυθμίσεων</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}

      {/* CRUD Activity Edit/Create Modal Dialog */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <form 
            onSubmit={handleActivitySubmit}
            className="bg-white rounded-3xl overflow-hidden max-w-xl w-full shadow-2xl border border-slate-200/50 flex flex-col animate-fade-in"
          >
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-cultural-gold/20">
              <h4 className="font-bold font-serif text-lg text-cultural-gold">
                {currentActivity.id ? 'Επεξεργασία Ανακοίνωσης' : 'Νέα Ανακοίνωση'}
              </h4>
              <button 
                type="button"
                onClick={() => setIsActivityModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-700 font-semibold text-sm">Τίτλος *</label>
                <input
                  type="text"
                  value={currentActivity.title}
                  onChange={(e) => setCurrentActivity({ ...currentActivity, title: e.target.value })}
                  placeholder="Εισάγετε τον τίτλο της ανακοίνωσης"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-cultural-gold focus:bg-white focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2.5 text-sm transition-all outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-semibold text-sm">Περιεχόμενο *</label>
                <textarea
                  rows="6"
                  value={currentActivity.content}
                  onChange={(e) => setCurrentActivity({ ...currentActivity, content: e.target.value })}
                  placeholder="Γράψτε το κείμενο της ανακοίνωσης..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-cultural-gold focus:bg-white focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2.5 text-sm transition-all outline-none resize-none"
                  required
                ></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-semibold text-sm">Φωτογραφία Δημοσίευσης (Προαιρετικό)</label>
                {currentActivity.image_url && (
                  <div className="text-xs text-slate-500 mb-2 flex items-center space-x-2">
                    <i className="fas fa-image text-slate-400"></i>
                    <span>Τρέχουσα: <a href={currentActivity.image_url} target="_blank" rel="noreferrer" className="text-cultural-blue hover:underline">Προβολή Εικόνας</a></span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setActivityImageFile(e.target.files[0])}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cultural-burgundy/10 file:text-cultural-burgundy hover:file:bg-cultural-burgundy/20"
                />
                <span className="text-xs text-slate-400 block pt-1">
                  Επιλέξτε μια εικόνα από τον υπολογιστή σας. Αν μείνει κενό, θα διατηρηθεί η τρέχουσα (σε επεξεργασία) ή θα χρησιμοποιηθεί το λογότυπο του Συλλόγου.
                </span>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsActivityModalOpen(false)}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-xl text-sm transition-all"
              >
                Ακύρωση
              </button>
              <button
                type="submit"
                disabled={activityModalLoading}
                className="bg-cultural-burgundy hover:bg-cultural-burgundy/95 text-white font-semibold px-5 py-2 rounded-xl text-sm shadow-md transition-all flex items-center space-x-1.5"
              >
                {activityModalLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    <span>Αποθήκευση</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Member Details Modal Overlay */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-3xl overflow-hidden max-w-xl w-full shadow-2xl border border-slate-200/50 flex flex-col animate-fade-in relative">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-cultural-gold/20">
              <h4 className="font-bold font-serif text-lg text-cultural-gold">
                Στοιχεία Αίτησης Μέλους
              </h4>
              <button 
                onClick={() => setSelectedMember(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-slate-600">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <span className="font-bold text-slate-950 text-lg">{selectedMember.fullname}</span>
                <div className="flex items-center space-x-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    selectedMember.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                    selectedMember.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedMember.status === 'Approved' ? 'Εγκεκριμένο' :
                     selectedMember.status === 'Rejected' ? 'Απορρίφθηκε' : 'Εκκρεμεί'}
                  </span>
                  {!isEditMode && (
                    <button onClick={() => { setIsEditMode(true); setEditMemberData({ fullname: selectedMember.fullname, father_name: selectedMember.father_name, phone: selectedMember.phone, email: selectedMember.email, address: selectedMember.address }); }} className="text-cultural-blue hover:text-cultural-blue/80 text-xs font-semibold">
                      <i className="fas fa-edit mr-1"></i>Επεξεργασία
                    </button>
                  )}
                </div>
              </div>

              {isEditMode ? (
                <form onSubmit={handleUpdateMemberDetails} className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Ονοματεπώνυμο</label>
                      <input type="text" value={editMemberData.fullname || ''} onChange={(e) => setEditMemberData({...editMemberData, fullname: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold outline-none" required />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Όνομα Πατρός</label>
                      <input type="text" value={editMemberData.father_name || ''} onChange={(e) => setEditMemberData({...editMemberData, father_name: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold outline-none" required />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Τηλέφωνο</label>
                      <input type="text" value={editMemberData.phone || ''} onChange={(e) => setEditMemberData({...editMemberData, phone: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold outline-none" required />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Email</label>
                      <input type="email" value={editMemberData.email || ''} onChange={(e) => setEditMemberData({...editMemberData, email: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold outline-none" required />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Διεύθυνση</label>
                      <input type="text" value={editMemberData.address || ''} onChange={(e) => setEditMemberData({...editMemberData, address: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold outline-none" required />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button type="button" onClick={() => setIsEditMode(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Ακύρωση</button>
                    <button type="submit" disabled={editMemberLoading} className="px-4 py-2 text-xs font-semibold text-white bg-cultural-burgundy hover:bg-cultural-burgundy/90 rounded-lg flex items-center">
                      {editMemberLoading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5"></div> : <i className="fas fa-save mr-1.5"></i>}
                      Αποθήκευση
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-400 block">Όνομα Πατρός</span>
                    <span className="font-semibold text-slate-900">{selectedMember.father_name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Τηλέφωνο</span>
                    <span className="font-semibold text-slate-900 font-mono">{selectedMember.phone}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-slate-400 block">Email</span>
                    <span className="font-semibold text-slate-900">{selectedMember.email}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-slate-400 block">Διεύθυνση Κατοικίας</span>
                    <span className="font-semibold text-slate-900">{selectedMember.address}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Κατάσταση Συνδρομής</span>
                    {(() => {
                      const st = getSubscriptionStatus(selectedMember);
                      return (
                        <div className="flex flex-col">
                          <span className={`font-semibold ${
                            st.code === 'active' ? 'text-emerald-600' : 
                            st.code === 'expired' ? 'text-orange-600' : 'text-red-500'
                          }`}>
                            {st.label}
                          </span>
                          {st.date && (
                            <span className="text-[11px] text-slate-500">
                              ({st.date.toLocaleDateString('el-GR')})
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Ημερομηνία Αίτησης</span>
                    <span className="font-semibold text-slate-900">
                      {new Date(selectedMember.created_at).toLocaleString('el-GR')}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-xs text-slate-400 block">Αποδεικτικό Κατάθεσης</span>
                {selectedMember.payment_proof_url ? (
                  <div className="flex items-center space-x-3">
                    <a
                      href={selectedMember.payment_proof_url}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-cultural-blue hover:bg-cultural-blue/90 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition-colors shadow-sm"
                    >
                      <i className="fas fa-file-download"></i>
                      <span>Προβολή / Λήψη Αρχείου</span>
                    </a>
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs italic">Δεν έχει μεταφορτωθεί αποδεικτικό έγγραφο.</span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-wrap justify-between gap-2">
              <button
                onClick={() => handleDeleteMember(selectedMember.id)}
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 font-semibold px-4 py-2 rounded-xl text-xs transition-all flex items-center space-x-1.5"
              >
                <i className="far fa-trash-alt"></i>
                <span>Οριστική Διαγραφή</span>
              </button>
              
              <div className="flex space-x-2">
                {selectedMember.status !== 'Approved' && (
                  <button
                    onClick={() => handleUpdateMemberStatus(selectedMember.id, 'Approved')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all shadow-sm"
                  >
                    Έγκριση
                  </button>
                )}
                {selectedMember.status !== 'Rejected' && (
                  <button
                    onClick={() => handleUpdateMemberStatus(selectedMember.id, 'Rejected')}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs transition-all"
                  >
                    Απόρριψη
                  </button>
                )}
                <button
                  onClick={() => setSelectedMember(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all"
                >
                  Κλείσιμο
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Payment Confirmation with Date Modal Overlay */}
      {isPaymentModalOpen && paymentModalMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl border border-slate-200/50 flex flex-col animate-fade-in">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-cultural-gold/20">
              <h4 className="font-bold font-serif text-base text-cultural-gold flex items-center space-x-2">
                <i className="fas fa-lock text-sm"></i>
                <span>Επιβεβαίωση Πληρωμής & Λήξης</span>
              </h4>
              <button 
                onClick={() => { setIsPaymentModalOpen(false); setPaymentModalMember(null); }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <i className="fas fa-times text-base"></i>
              </button>
            </div>

            <form onSubmit={handleConfirmPaymentWithDate}>
              <div className="p-6 space-y-4">
                <p className="text-slate-700 text-sm font-semibold text-center leading-relaxed">
                  Είστε σίγουρος ότι έχει εξοφληθεί η συνδρομή για τον/την <span className="text-cultural-burgundy font-bold">{paymentModalMember.fullname}</span>;;
                </p>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                  <label className="text-slate-700 font-semibold text-xs uppercase tracking-wider block">Ημερομηνία Λήξης Συνδρομής</label>
                  <input
                    type="date"
                    required
                    value={paymentModalExpiresAt}
                    onChange={(e) => setPaymentModalExpiresAt(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-cultural-gold focus:ring-1 focus:ring-cultural-gold rounded-xl px-4 py-2.5 text-sm transition-all outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    * Προεπιλογή: 1 έτος από σήμερα. Μπορείτε να επιλέξετε οποιαδήποτε άλλη ημερομηνία.
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setIsPaymentModalOpen(false); setPaymentModalMember(null); }}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs transition-all"
                >
                  Ακύρωση
                </button>
                <button
                  type="submit"
                  disabled={isPaymentConfirmLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5"
                >
                  {isPaymentConfirmLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <i className="fas fa-check"></i>
                      <span>Επιβεβαίωση Πληρωμής</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
