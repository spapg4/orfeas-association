const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:5000/api' : '/api';

// Helper to get authorization header
const getAuthHeader = () => {
  const token = localStorage.getItem('orfeas_admin_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const api = {
  // Authentication
  login: async (username, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Αποτυχία σύνδεσης');
    return data;
  },

  verifyToken: async () => {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Ληγμένο session');
    return await res.json();
  },

  // Activities CRUD
  getActivities: async () => {
    const res = await fetch(`${API_BASE}/activities`);
    if (!res.ok) throw new Error('Αποτυχία φόρτωσης δραστηριοτήτων');
    return await res.json();
  },

  createActivity: async (activity) => {
    const res = await fetch(`${API_BASE}/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(activity)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Αποτυχία δημιουργίας δραστηριότητας');
    return data;
  },

  updateActivity: async (id, activity) => {
    const res = await fetch(`${API_BASE}/activities/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(activity)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Αποτυχία ενημέρωσης δραστηριότητας');
    return data;
  },

  deleteActivity: async (id) => {
    const res = await fetch(`${API_BASE}/activities/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Αποτυχία διαγραφής δραστηριότητας');
    return data;
  },

  // Member Registration & Management
  registerMember: async (formData) => {
    // Form data must be a FormData object to support file upload
    const res = await fetch(`${API_BASE}/members`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Αποτυχία εγγραφής μέλους');
    return data;
  },

  getMembers: async () => {
    const res = await fetch(`${API_BASE}/members`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Αποτυχία φόρτωσης μελών');
    return await res.json();
  },

  updateMemberStatus: async (id, status) => {
    const res = await fetch(`${API_BASE}/members/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Αποτυχία ενημέρωσης κατάστασης');
    return data;
  },

  updateMemberPaidStatus: async (id, paid_status, subscription_expires_at) => {
    const res = await fetch(`${API_BASE}/members/${id}/paid`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ paid_status, subscription_expires_at })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Αποτυχία ενημέρωσης πληρωμής');
    return data;
  },

  deleteMember: async (id) => {
    const res = await fetch(`${API_BASE}/members/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Αποτυχία διαγραφής μέλους');
    return data;
  },

  updateMemberDetails: async (id, details) => {
    const res = await fetch(`${API_BASE}/members/${id}/details`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(details)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Αποτυχία ενημέρωσης στοιχείων');
    return data;
  },

  // Settings Management
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Αποτυχία φόρτωσης ρυθμίσεων');
    return await res.json();
  },

  updateSettings: async (settingsObj) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(settingsObj)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Αποτυχία ενημέρωσης ρυθμίσεων');
    return data;
  },

  // Upload a generic image
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        ...getAuthHeader()
      },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Αποτυχία μεταφόρτωσης εικόνας');
    return data;
  },

  // Slideshow Management
  getSlideshowImages: async () => {
    const res = await fetch(`${API_BASE}/settings/slideshow`);
    if (!res.ok) throw new Error('Αποτυχία φόρτωσης εικόνων slideshow');
    return await res.json();
  },

  uploadSlideshowImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${API_BASE}/settings/slideshow`, {
      method: 'POST',
      headers: {
        ...getAuthHeader()
      },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Αποτυχία μεταφόρτωσης εικόνας στο slideshow');
    return data;
  },

  deleteSlideshowImage: async (filename) => {
    const res = await fetch(`${API_BASE}/settings/slideshow/${filename}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader()
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Αποτυχία διαγραφής εικόνας από το slideshow');
    return data;
  },

  // Calendar Events
  getCalendarEvents: async () => {
    const res = await fetch(`${API_BASE}/calendar`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Αποτυχία λήψης ημερολογίου');
    return data;
  },

  createCalendarEvent: async (eventData) => {
    const res = await fetch(`${API_BASE}/calendar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(eventData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Αποτυχία δημιουργίας συμβάντος');
    return data;
  },

  updateCalendarEvent: async (id, eventData) => {
    const res = await fetch(`${API_BASE}/calendar/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(eventData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Αποτυχία ενημέρωσης συμβάντος');
    return data;
  },

  deleteCalendarEvent: async (id) => {
    const res = await fetch(`${API_BASE}/calendar/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader()
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Αποτυχία διαγραφής συμβάντος');
    return data;
  },

  getCalendarStreamUrl: () => {
    // Return relative stream URL or absolute for localhost
    if (API_BASE.startsWith('/')) {
      return '/api/calendar/stream';
    }
    return `${API_BASE}/calendar/stream`;
  },

  // Articles API Calls
  getArticles: async () => {
    const res = await fetch(`${API_BASE}/articles`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Αποτυχία λήψης άρθρων');
    return data;
  },

  createArticle: async (articleData) => {
    const res = await fetch(`${API_BASE}/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(articleData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Αποτυχία υποβολής άρθρου');
    return data;
  },

  getAdminArticles: async () => {
    const res = await fetch(`${API_BASE}/admin/articles`, {
      headers: { ...getAuthHeader() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Αποτυχία λήψης άρθρων διαχείρισης');
    return data;
  },

  updateArticleStatus: async (id, status) => {
    const res = await fetch(`${API_BASE}/admin/articles/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Αποτυχία ενημέρωσης κατάστασης άρθρου');
    return data;
  },

  deleteArticle: async (id) => {
    const res = await fetch(`${API_BASE}/admin/articles/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Αποτυχία διαγραφής άρθρου');
    return data;
  }
};
