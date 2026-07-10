import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function SocialFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Local storage likes dictionary: { postId: boolean }
  const [userLikes, setUserLikes] = useState({});
  // Mock counts to add to the likes for simulation: { postId: number }
  const [mockLikesCount, setMockLikesCount] = useState({});
  const [activeShareMenu, setActiveShareMenu] = useState(null);

  // Close share dropdowns on clicking outside
  useEffect(() => {
    const handleDocumentClick = () => setActiveShareMenu(null);
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  useEffect(() => {
    fetchPosts();
    // Load local storage likes
    try {
      const storedLikes = localStorage.getItem('orfeas_user_feed_likes');
      if (storedLikes) {
        setUserLikes(JSON.parse(storedLikes));
      }
      
      const storedCounts = localStorage.getItem('orfeas_feed_likes_counts');
      if (storedCounts) {
        setMockLikesCount(JSON.parse(storedCounts));
      }
    } catch (e) {
      console.error('Error loading likes state:', e);
    }
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await api.getActivities();
      // Sort posts by date descending (latest first)
      const sorted = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setPosts(sorted);
      setError('');
    } catch (err) {
      console.error('Error loading social feed:', err);
      setError('Αποτυχία φόρτωσης ροής νέων.');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeClick = (postId) => {
    const isLiked = !!userLikes[postId];
    const newLikes = { ...userLikes, [postId]: !isLiked };
    setUserLikes(newLikes);
    localStorage.setItem('orfeas_user_feed_likes', JSON.stringify(newLikes));

    // Update count simulation starting from 0
    const currentMockCount = mockLikesCount[postId] !== undefined ? mockLikesCount[postId] : 0;
    const newCount = isLiked ? currentMockCount - 1 : currentMockCount + 1;
    const newCounts = { ...mockLikesCount, [postId]: newCount };
    setMockLikesCount(newCounts);
    localStorage.setItem('orfeas_feed_likes_counts', JSON.stringify(newCounts));
  };

  const handleShareToggle = (postId, e) => {
    e.stopPropagation();
    setActiveShareMenu(activeShareMenu === postId ? null : postId);
  };

  const getLikesCount = (postId) => {
    if (mockLikesCount[postId] !== undefined) {
      return mockLikesCount[postId];
    }
    return 0;
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
    <div className="max-w-2xl mx-auto mt-16 space-y-8 animate-fade-in">
      
      {/* Title section */}
      <div className="text-center space-y-3 mb-10">
        <span className="text-cultural-burgundy text-xs font-extrabold uppercase tracking-widest px-3.5 py-1 bg-cultural-burgundy/10 rounded-full">
          ΡΟΗ ΔΡΑΣΕΩΝ & ΑΝΑΚΟΙΝΩΣΕΩΝ
        </span>
        <h3 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
          Τα Νέα του «Ορφέα»
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Δείτε φωτογραφίες, σύντομα νέα και ενημερώσεις απευθείας από το Διοικητικό Συμβούλιο του Συλλόγου.
        </p>
      </div>

      {/* States */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-10 h-10 border-3 border-cultural-burgundy border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 text-xs font-semibold">Φόρτωση ροής νέων...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 text-red-700 px-6 py-4 rounded-2xl text-center text-xs shadow-sm">
          <span>{error}</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/60 shadow-sm">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-3">
            <i className="fas fa-rss text-lg"></i>
          </div>
          <h4 className="font-bold text-slate-800 text-sm">Δεν υπάρχουν ακόμη δημοσιεύσεις</h4>
          <p className="text-slate-500 mt-1 text-xs">
            Όταν προστεθούν νέες ανακοινώσεις από τον διαχειριστή, θα εμφανιστούν εδώ.
          </p>
        </div>
      ) : (
        /* Timeline Feed */
        <div className="space-y-6">
          {posts.map((post) => {
            const isLiked = !!userLikes[post.id];
            const likesCount = getLikesCount(post.id);

            return (
              <article 
                key={post.id} 
                className="bg-white rounded-3xl border border-slate-200/60 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
              >
                
                {/* Author Header */}
                <div className="p-4 sm:p-5 flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    {/* Lyre Avatar logo */}
                    <div className="w-10 h-10 rounded-full bg-cultural-gold/15 flex items-center justify-center border border-cultural-gold/25 text-cultural-gold">
                      <i className="fas fa-music text-sm"></i>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                        <span>Μ.Ε.Σ. "ΟΡΦΕΑΣ"</span>
                        <span className="bg-cultural-burgundy/10 text-cultural-burgundy text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider scale-95">
                          ΔΣ
                        </span>
                      </h4>
                      <span className="text-[11px] text-slate-400 font-semibold block">
                        {formatDate(post.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Settings dot decorative */}
                  <button className="text-slate-300 hover:text-slate-600 transition-colors">
                    <i className="fas fa-ellipsis-h"></i>
                  </button>
                </div>

                {/* Text Content */}
                <div className="px-5 pb-4 text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                  {post.content}
                </div>

                {/* Main Post Image */}
                {post.image_url && (
                  <div className="relative overflow-hidden bg-slate-50 border-y border-slate-100 max-h-[460px] flex items-center justify-center">
                    <img 
                      src={post.image_url} 
                      alt={post.title} 
                      className="w-full h-full object-cover select-none pointer-events-none"
                    />
                  </div>
                )}

                {/* Footer Reactions & Toolbar */}
                <div className="px-5 py-3.5 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
                  <div className="flex items-center space-x-4">
                    
                    {/* Like button */}
                    <button 
                      onClick={() => handleLikeClick(post.id)}
                      className={`flex items-center space-x-1.5 text-xs font-bold transition-all focus:outline-none ${
                        isLiked 
                          ? 'text-red-500 scale-105' 
                          : 'text-slate-500 hover:text-red-500'
                      }`}
                    >
                      <i className={`${isLiked ? 'fas' : 'far'} fa-heart text-base transition-transform active:scale-125`}></i>
                      <span>{likesCount} Likes</span>
                    </button>

                    {/* Share button */}
                    <div className="relative">
                      <button 
                        onClick={(e) => handleShareToggle(post.id, e)}
                        className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-cultural-blue font-bold focus:outline-none transition-colors"
                      >
                        <i className="far fa-share-square text-base"></i>
                        <span>Κοινοποίηση</span>
                      </button>

                      {/* Share Dropdown Menu */}
                      {activeShareMenu === post.id && (
                        <div 
                          className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-slate-200/60 rounded-xl shadow-lg py-1.5 z-20 animate-fade-in text-slate-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              const shareUrl = `${window.location.origin}/#activities`;
                              navigator.clipboard.writeText(shareUrl);
                              alert('Ο σύνδεσμος αντιγράφηκε στο πρόχειρο!');
                              setActiveShareMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center space-x-2 transition-colors focus:outline-none"
                          >
                            <i className="fas fa-link text-slate-400 text-sm"></i>
                            <span>Αντιγραφή Συνδέσμου</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const shareUrl = `${window.location.origin}/#activities`;
                              const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                              window.open(fbShareUrl, '_blank', 'width=600,height=400');
                              setActiveShareMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center space-x-2 transition-colors focus:outline-none"
                          >
                            <i className="fab fa-facebook text-blue-600 text-sm"></i>
                            <span className="font-semibold text-blue-600">Κοινοποίηση στο FB</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Decorative badge */}
                  <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-semibold">
                    <i className="fas fa-check-circle text-cultural-blue"></i>
                    <span>Επίσημο Κανάλι</span>
                  </div>
                </div>

              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
