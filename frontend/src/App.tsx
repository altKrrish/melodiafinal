import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import YouTube from 'react-youtube';
import { 
  Home, Compass, Library, PlusSquare, Heart, 
  Search, Bell, Settings, LogOut, Play, Pause,
  SkipBack, SkipForward, Shuffle, Repeat, 
  Volume2, Maximize2, MoreHorizontal, Clock,
  MoreVertical, Share2, Plus, SlidersHorizontal, 
  User, History, BarChart3, TrendingUp, Activity, Users,
  Music, Trash2, ListMusic, CheckCircle2, ChevronRight, X,
  Mic, Upload, Link, QrCode, Globe
} from 'lucide-react';

export interface Song {
  _id: string;
  videoId: string;
  title: string;
  artist: string;
  coverImage: string;
  duration?: number;
  audioUrl?: string;
  source?: string;
}

export interface Playlist {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  songs: Song[];
  owner: { _id: string; username: string };
  isPublic: boolean;
  shareLink?: string;
}

class PlaylistErrorBoundary extends React.Component<any, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("PlaylistErrorBoundary caught a crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel p-6 rounded-3xl border border-rose-500/20 bg-[#1A0B1A]/90 text-center max-w-xl mx-auto my-12 relative overflow-hidden">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-red-600 rounded-3xl blur opacity-10"></div>
          <Heart size={48} className="mx-auto text-rose-500 mb-4 animate-pulse" />
          <h3 className="font-display font-black text-lg text-white mb-2 uppercase tracking-wide">AI Compilation Decompressed Error</h3>
          <p className="text-xs text-[#94A3B8] leading-relaxed mb-6">
            The playlist structure could not be parsed correctly by the decoder node. Your taste profile configuration might be desynchronized.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-5 py-2.5 rounded-full bg-[#201020] border border-rose-500/30 hover:border-rose-500 text-xs font-bold text-rose-400 hover:text-white transition-all hover:scale-102"
          >
            Reboot Interface
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Config axios tokens
const savedToken = localStorage.getItem('melodia_token');
if (savedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

// Add Axios response interceptor to handle session/in-memory DB loss
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const isUserNotFound = error.response?.status === 404 && error.response?.data?.error === 'User not found.';
    const isUnauthorized = error.response?.status === 401;
    if (isUserNotFound || isUnauthorized) {
      console.warn('[Session Sync Warning] Local DB refreshed or user not found. Resetting token.');
      localStorage.removeItem('melodia_token');
      localStorage.removeItem('melodia_user');
      delete axios.defaults.headers.common['Authorization'];
      // Perform a page reload to fully reset React state cleanly
      window.location.href = window.location.origin;
    }
    return Promise.reject(error);
  }
);

type ViewType = 'home' | 'search' | 'profile' | 'playlist' | 'liked' | 'community' | 'user-profile';

// Custom game avatars
const AVATARS = [
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&h=150&fit=crop&q=80', // Retro Tech Guy
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80', // Cyberpunk Pink Hair
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80', // Neon Coder
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80', // Pixel Art Girl
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&q=80'  // Grid Explorer
];

// I. COMMUNITY VIEW
const CommunityView = ({ onViewProfile, onSelectPlaylist }: any) => {
  const [users, setUsers] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'people' | 'playlists'>('playlists');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, playlistsRes] = await Promise.all([
          axios.get(`${API_URL}/users/discover`),
          axios.get(`${API_URL}/playlists/community?limit=24`)
        ]);
        setUsers(usersRes.data.users || []);
        setPlaylists(playlistsRes.data.data || []);
      } catch (err) {
        console.error('Failed to fetch community data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="px-6 pt-6 relative z-10 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 border-b border-indigo-500/10 pb-6 mb-6 text-center md:text-left">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-[#6366F1] to-[#0EA5E9] flex items-center justify-center shrink-0 shadow-lg border-2 border-indigo-400/20">
          <Users size={40} className="text-white" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-3xs text-[#D946EF] tracking-widest uppercase font-extrabold">Discover</p>
          <h1 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight">Community</h1>
          <p className="text-xs text-[#94A3B8] font-medium leading-relaxed">Discover other listeners and explore their public playlists.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('playlists')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${tab === 'playlists' ? 'bg-gradient-to-r from-[#6366F1] to-[#D946EF] text-white' : 'bg-[#13173A] text-[#94A3B8] hover:text-white'}`}
        >
          Public Playlists
        </button>
        <button
          onClick={() => setTab('people')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${tab === 'people' ? 'bg-gradient-to-r from-[#6366F1] to-[#D946EF] text-white' : 'bg-[#13173A] text-[#94A3B8] hover:text-white'}`}
        >
          People
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      ) : tab === 'playlists' ? (
        playlists.length === 0 ? (
          <div className="text-center py-12 text-[#64748B]">
            <p className="text-xs">No public playlists yet. Make your playlists public to share them here!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {playlists.map((p: any) => (
              <div 
                key={p._id} 
                onClick={() => onSelectPlaylist(p)}
                className="glass-panel p-4 rounded-3xl border border-indigo-500/10 bg-[#0C1030]/80 hover:bg-[#13173A] transition-colors cursor-pointer group flex flex-col"
              >
                <div className="aspect-square bg-gradient-to-br from-[#1E2555] to-[#0A0D28] rounded-2xl mb-3 flex items-center justify-center border border-indigo-500/5 group-hover:border-indigo-500/20 relative overflow-hidden">
                  <Music size={24} className="text-indigo-400/50" />
                </div>
                <h4 className="text-sm font-bold text-white truncate">{p.name}</h4>
                <p className="text-[10px] text-[#64748B] mt-1">{p.songs?.length || 0} Tracks • {p.owner?.username || 'Unknown'}</p>
              </div>
            ))}
          </div>
        )
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-[#64748B]">
          <p className="text-xs">No other users found in the community yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(u => (
            <div 
              key={u._id} 
              onClick={() => onViewProfile(u._id)}
              className="glass-panel p-4 rounded-3xl border border-indigo-500/10 bg-[#0C1030]/80 hover:bg-[#13173A] transition-colors cursor-pointer group flex items-center gap-4"
            >
              <img src={u.profilePicture || AVATARS[0]} alt={u.username} className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/20 group-hover:border-[#D946EF]/50 transition-colors" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white truncate">{u.username}</h3>
                <p className="text-3xs text-[#D946EF] tracking-widest uppercase font-black">Level {u.level}</p>
                <p className="text-[10px] text-[#64748B] mt-1">{u.playlistCount} Playlists • {u.followerCount} Followers</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// J. USER PROFILE VIEW
const UserProfileView = ({ userId, playSong, onBack, onSelectPlaylist }: any) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/users/${userId}/profile`);
        setProfile(res.data);
        setIsFollowing(res.data.isFollowing);
      } catch (err) {
        console.error('Failed to fetch user profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleFollowToggle = async () => {
    try {
      const res = await axios.post(`${API_URL}/users/${userId}/follow`);
      setIsFollowing(res.data.isFollowing);
      setProfile((prev: any) => ({ ...prev, followerCount: res.data.followerCount }));
    } catch (err) {
      console.error('Failed to toggle follow', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="px-6 pt-6 relative z-10 max-w-5xl mx-auto pb-10 space-y-8">
      <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold text-[#94A3B8] hover:text-white transition-colors">
        <ChevronRight size={14} className="rotate-180" /> Back to Community
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 border-b border-indigo-500/10 pb-6 text-center md:text-left">
        <img 
          src={profile.profilePicture || AVATARS[0]} 
          alt={profile.username} 
          className="w-32 h-32 rounded-full border-4 border-[#D946EF]/20 object-cover shadow-[0_0_20px_rgba(217,70,239,0.2)]" 
        />
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <h1 className="font-display font-black text-3xl text-white tracking-tight">{profile.username}</h1>
            <span className="bg-[#D946EF]/20 border border-[#D946EF]/30 text-[#D946EF] font-mono text-[9px] px-2 py-0.5 rounded font-black tracking-widest uppercase">LVL {profile.level}</span>
          </div>
          <p className="text-xs text-[#94A3B8]">{profile.bio || 'No bio provided.'}</p>
          <div className="flex items-center gap-4 text-xs text-[#64748B] justify-center md:justify-start pt-1">
            <span><strong className="text-white">{profile.followerCount}</strong> Followers</span>
            <span><strong className="text-white">{profile.followingCount}</strong> Following</span>
          </div>
        </div>

        <button 
          onClick={handleFollowToggle}
          className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-md shrink-0 ${isFollowing ? 'bg-[#181F54] border border-indigo-500/20 text-[#94A3B8] hover:text-white' : 'bg-gradient-to-r from-[#6366F1] to-[#D946EF] text-white hover:scale-105'}`}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>

      {/* Public Playlists */}
      <div>
        <h3 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
          <Library size={18} className="text-[#D946EF]" /> Public Playlists
        </h3>
        
        {profile.publicPlaylists?.length === 0 ? (
          <div className="text-center py-10 glass-panel rounded-3xl border border-indigo-500/5">
            <p className="text-xs text-[#64748B]">This user hasn't made any playlists public yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {profile.publicPlaylists.map((p: Playlist) => (
              <div 
                key={p._id} 
                onClick={() => onSelectPlaylist(p)}
                className="glass-panel p-4 rounded-3xl border border-indigo-500/10 bg-[#0C1030]/80 hover:bg-[#13173A] transition-colors cursor-pointer group flex flex-col"
              >
                <div className="aspect-square bg-gradient-to-br from-[#1E2555] to-[#0A0D28] rounded-2xl mb-3 flex items-center justify-center border border-indigo-500/5 group-hover:border-indigo-500/20 relative overflow-hidden">
                  <Music size={24} className="text-indigo-400/50" />
                </div>
                <h4 className="text-sm font-bold text-white truncate">{p.name}</h4>
                <p className="text-[10px] text-[#64748B] mt-1">{p.songs?.length || 0} Tracks</p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Create Playlist Modal */}
      {showCreatePlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm glass-panel p-6 rounded-3xl border border-indigo-500/20 bg-[#0C1030] shadow-[0_0_40px_rgba(99,102,241,0.2)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <Music size={18} className="text-indigo-400" /> New Playlist
              </h3>
              <button 
                onClick={() => setShowCreatePlaylistModal(false)}
                className="p-1 rounded-full hover:bg-[#1E2555] text-[#94A3B8] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mb-6">
              <label className="block text-xs font-bold text-[#94A3B8] mb-2 ml-1">Playlist Name</label>
              <input
                type="text"
                autoFocus
                placeholder="Enter a retro name..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                className="w-full bg-[#13173A] border border-indigo-500/20 rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D946EF]/50 focus:ring-1 focus:ring-[#D946EF]/50 transition-all placeholder:text-slate-600"
              />
            </div>
            <div className="mb-6 flex items-center gap-3 ml-1">
              <input
                type="checkbox"
                id="playlistPublic"
                checked={newPlaylistPublic}
                onChange={(e) => setNewPlaylistPublic(e.target.checked)}
                className="w-4 h-4 rounded border-indigo-500/30 bg-[#13173A] text-[#D946EF] focus:ring-[#D946EF]/50 cursor-pointer"
              />
              <label htmlFor="playlistPublic" className="text-xs font-bold text-[#94A3B8] cursor-pointer select-none">
                Make public (visible in Community)
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowCreatePlaylistModal(false)}
                className="px-4 py-2 rounded-full text-xs font-bold text-[#94A3B8] hover:text-white hover:bg-[#1E2555] transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim()}
                className="btn-primary px-5 py-2 rounded-full font-bold text-xs bg-gradient-to-r from-[#6366F1] to-[#D946EF] text-white disabled:opacity-50 hover:scale-105 transition-all"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Composer Modal */}
      {showAiPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-indigo-500/20 bg-[#0C1030] shadow-[0_0_40px_rgba(99,102,241,0.2)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <Activity size={18} className="text-[#D946EF]" /> Generate Custom AI Soundtrack
              </h3>
              {!isAiProcessing && (
                <button 
                  onClick={() => setShowAiPromptModal(false)}
                  className="p-1 rounded-full hover:bg-[#1E2555] text-[#94A3B8] hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            
            <div className="mb-6 relative">
              <label className="block text-xs font-bold text-[#94A3B8] mb-2 ml-1">Describe Your Vibe</label>
              <textarea
                autoFocus
                placeholder='e.g., "retro night drive with heavy synthwave beats" or "relaxing study session"'
                value={aiPromptInput}
                onChange={(e) => setAiPromptInput(e.target.value)}
                disabled={isAiProcessing}
                rows={3}
                className="w-full bg-[#13173A] border border-indigo-500/20 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-[#D946EF]/50 focus:ring-1 focus:ring-[#D946EF]/50 transition-all placeholder:text-slate-600 resize-none disabled:opacity-50"
              />
              {isAiProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0C1030]/80 backdrop-blur-sm rounded-2xl z-10">
                  <div className="w-8 h-8 border-2 border-[#D946EF] border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-xs font-bold text-indigo-200 animate-pulse">AI is compiling tracks...</p>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-3xs text-[#94A3B8] font-bold w-full ml-1">Quick Prompts:</span>
              {['Cyberpunk Neon City', '80s Workout Montage', 'Chill Lofi Beats', 'Boss Battle Epic'].map((t, idx) => (
                <button
                  key={idx}
                  disabled={isAiProcessing}
                  onClick={() => setAiPromptInput(t)}
                  className="px-3 py-1 rounded-full bg-[#161B46] border border-indigo-500/20 hover:border-[#D946EF]/50 hover:bg-[#1E245D] text-3xs font-bold text-indigo-200 transition-all disabled:opacity-50"
                >
                  {t}
                </button>
              ))}
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowAiPromptModal(false)}
                disabled={isAiProcessing}
                className="px-4 py-2 rounded-full text-xs font-bold text-[#94A3B8] hover:text-white hover:bg-[#1E2555] transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleAiSmartPlaylist()}
                disabled={!aiPromptInput.trim() || isAiProcessing}
                className="btn-primary px-5 py-2 rounded-full font-bold text-xs bg-gradient-to-r from-[#6366F1] to-[#D946EF] text-white disabled:opacity-50 hover:scale-105 transition-all flex items-center gap-2"
              >
                {isAiProcessing ? 'Generating...' : 'Generate Soundtrack'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [token, setToken] = useState<string | null>(savedToken);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Auth Form State
  const [isLoginView, setIsLoginView] = useState(true);
  const [authUsername, setAuthUsername] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authAvatar, setAuthAvatar] = useState(AVATARS[0]);
  const [authError, setAuthError] = useState('');

  // UI State
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<Song | null>(null);
  
  const [showAiPromptModal, setShowAiPromptModal] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistPublic, setNewPlaylistPublic] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showQueueDrawer, setShowQueueDrawer] = useState(false);
  const [vibeMixes, setVibeMixes] = useState<any[]>([]);
  const [loadingVibeMixes, setLoadingVibeMixes] = useState(false);
  const [isGeneratingSmart, setIsGeneratingSmart] = useState(false);

  // Share Modal State
  const [shareModalPlaylist, setShareModalPlaylist] = useState<Playlist | null>(null);

  // Lyrics State
  const [showLyricsPanel, setShowLyricsPanel] = useState(false);
  const [lyrics, setLyrics] = useState<string[]>([]);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState('');

  // User Stats / Level State
  const [userStats, setUserStats] = useState<any>({ level: 1, xp: 0, xpProgress: 0, xpNeeded: 10 });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Playback State
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);

  // References
  const playerRef = useRef<any>(null);
  const progressTimerRef = useRef<any>(null);

  // Toast message helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Set Authorization Token
  const updateAuthToken = (newToken: string | null, userObj?: any) => {
    if (newToken) {
      localStorage.setItem('melodia_token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setToken(newToken);
      if (userObj) {
        localStorage.setItem('melodia_user', JSON.stringify(userObj));
        setCurrentUser(userObj);
      }
    } else {
      localStorage.removeItem('melodia_token');
      localStorage.removeItem('melodia_user');
      delete axios.defaults.headers.common['Authorization'];
      setToken(null);
      setCurrentUser(null);
    }
  };

  // Load User Data & Check Share Links on Mount
  useEffect(() => {
    // Check if loading a shared playlist
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('playlistId') || params.get('shareLink');
    
    if (sharedId) {
      // Direct routing to shared playlist
      axios.get(`${API_URL}/playlists/${sharedId}`)
        .then(res => {
          if (res.data.success) {
            setSelectedPlaylist(res.data.data);
            setCurrentView('playlist');
          }
        })
        .catch(err => console.error('Failed to load shared playlist:', err));
    }

    const savedUser = localStorage.getItem('melodia_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    if (token) {
      fetchUserPlaylists();
      fetchLikedSongs();
      fetchUserStats();
    }
  }, [token]);

  // Fetch user stats (level, XP)
  const fetchUserStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/users/me/stats`);
      setUserStats(res.data);
    } catch (err) {
      // stats are optional, don't break the app
    }
  };

  // Re-fetch stats when liked songs or playlists change
  useEffect(() => {
    if (token) {
      fetchUserStats();
    }
  }, [likedSongs.length, playlists.length]);

  // Fetch vibe mixes (K-Means acoustic clustering)
  const fetchVibeMixes = async () => {
    if (likedSongs.length === 0) {
      setVibeMixes([]);
      return;
    }
    setLoadingVibeMixes(true);
    try {
      const res = await axios.get(`${API_URL}/songs/vibe-mixes`);
      setVibeMixes(res.data);
    } catch (err) {
      console.error('Failed to fetch vibe mixes:', err);
    } finally {
      setLoadingVibeMixes(false);
    }
  };

  useEffect(() => {
    if (token && likedSongs.length > 0) {
      fetchVibeMixes();
    } else {
      setVibeMixes([]);
    }
  }, [token, likedSongs.length]);

  // Synchronize playback events
  useEffect(() => {
    if (isPlaying) {
      if (playerRef.current) {
        playerRef.current.playVideo();
      }
      startProgressPolling();
    } else {
      if (playerRef.current) {
        playerRef.current.pauseVideo();
      }
      stopProgressPolling();
    }
    return () => stopProgressPolling();
  }, [isPlaying, currentSong]);

  // Start polling elapsed play time
  const startProgressPolling = () => {
    stopProgressPolling();
    progressTimerRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const curr = playerRef.current.getCurrentTime() || 0;
        const dur = playerRef.current.getDuration() || duration || 180;
        setCurrentTime(curr);
        setDuration(dur);
        setProgress((curr / dur) * 100);
      }
    }, 500);
  };

  const stopProgressPolling = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }
  };

  // Fetch playlist lists
  const fetchUserPlaylists = async () => {
    try {
      const res = await axios.get(`${API_URL}/playlists`);
      if (res.data.success) {
        const list = res.data.data;
        const hasDiscoverWeekly = list.some((p: any) => p.name === 'Discover Weekly');
        const hadDiscoverWeekly = playlists.some((p: any) => p.name === 'Discover Weekly');
        
        if (hasDiscoverWeekly && !hadDiscoverWeekly && playlists.length > 0) {
          showToast('🎵 AI DJ has created a new Discover Weekly playlist for you!');
        } else if (hasDiscoverWeekly && hadDiscoverWeekly) {
          const oldDW = playlists.find((p: any) => p.name === 'Discover Weekly');
          const newDW = list.find((p: any) => p.name === 'Discover Weekly');
          if (oldDW && newDW && (oldDW.songs || oldDW.tracks || []).length !== (newDW.songs || newDW.tracks || []).length) {
            showToast('✨ AI DJ has updated your Discover Weekly playlist!');
          }
        }
        setPlaylists(list);
      }
    } catch (err) {
      console.error('Failed to fetch playlists:', err);
    }
  };

  // Fetch liked tracks list
  const fetchLikedSongs = async () => {
    try {
      const res = await axios.get(`${API_URL}/users/liked`);
      setLikedSongs(res.data);
    } catch (err) {
      console.error('Failed to fetch liked songs:', err);
    }
  };

  // Register User
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authUsername || !authEmail || !authPassword) {
      setAuthError('All fields are required.');
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/auth/signup`, {
        username: authUsername,
        email: authEmail,
        password: authPassword,
        profilePicture: authAvatar
      });
      updateAuthToken(res.data.token, res.data.user);
      showToast('Welcome to Melodia! ready Player One.');
    } catch (err: any) {
      setAuthError(err.response?.data?.error || 'Registration failed. Try again.');
    }
  };

  // Log In User
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail || !authPassword) {
      setAuthError('Email and password are required.');
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email: authEmail,
        password: authPassword
      });
      updateAuthToken(res.data.token, res.data.user);
      showToast('Logged in successfully!');
    } catch (err: any) {
      setAuthError(err.response?.data?.error || 'Invalid credentials.');
    }
  };

  // Update profile picture
  const handleUpdateProfilePicture = async (avatarUrl: string) => {
    try {
      const res = await axios.post(`${API_URL}/users/profile-picture`, {
        profilePicture: avatarUrl
      });
      if (res.data.success) {
        const updatedUser = { ...currentUser, profilePicture: avatarUrl };
        setCurrentUser(updatedUser);
        localStorage.setItem('melodia_user', JSON.stringify(updatedUser));
        showToast('Profile avatar updated!');
      }
    } catch (err) {
      console.error('Failed to update avatar:', err);
      showToast('Failed to update profile picture.');
    }
  };

  // Create custom playlist
  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      const res = await axios.post(`${API_URL}/playlists`, {
        name: newPlaylistName,
        description: 'Retro game-inspired soundtrack curated by Melodia.',
        isPublic: newPlaylistPublic
      });
      if (res.data.success) {
        const newPlaylist = res.data.data;
        if (newPlaylist) {
          setPlaylists(prev => [newPlaylist, ...prev]);
        } else {
          fetchUserPlaylists();
        }
        showToast(`Playlist "${newPlaylistName}" created!`);
        setShowCreatePlaylistModal(false);
        setNewPlaylistName('');
        setNewPlaylistPublic(false);
      }
    } catch (err) {
      console.error('Playlist creation failed:', err);
    }
  };

  // Add track to playlist (and find-or-create track document first)
  const handleAddSongToPlaylist = async (playlistId: string) => {
    if (!songToAddToPlaylist) return;

    try {
      const res = await axios.post(`${API_URL}/playlists/${playlistId}/songs`, {
        videoId: songToAddToPlaylist.videoId,
        title: songToAddToPlaylist.title,
        artist: songToAddToPlaylist.artist,
        coverImage: songToAddToPlaylist.coverImage,
        duration: songToAddToPlaylist.duration || 180
      });
      if (res.data.success) {
        showToast('Added track to playlist!');
        setShowAddToPlaylistModal(false);
        fetchUserPlaylists();
        if (selectedPlaylist && selectedPlaylist._id === playlistId) {
          // reload current playlist view
          axios.get(`${API_URL}/playlists/${playlistId}`).then(res => {
            if (res.data.success) setSelectedPlaylist(res.data.data);
          });
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to add track.');
      setShowAddToPlaylistModal(false);
    }
  };

  // Remove song from custom playlist
  const handleRemoveSongFromPlaylist = async (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedPlaylist) return;
    
    try {
      const res = await axios.delete(`${API_URL}/playlists/${selectedPlaylist._id}/songs/${songId}`);
      if (res.data.success) {
        showToast('Song removed from playlist');
        // reload
        const reload = await axios.get(`${API_URL}/playlists/${selectedPlaylist._id}`);
        setSelectedPlaylist(reload.data.data);
        fetchUserPlaylists();
      }
    } catch (err) {
      console.error('Failed to remove song:', err);
    }
  };

  // Toggle Song Like
  const handleToggleLike = async (song: Song, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const originalLikedSongs = [...likedSongs];
    const isAlreadyLiked = likedSongs.some(s => 
      (s.videoId && song.videoId && s.videoId === song.videoId) || 
      (s._id && song._id && s._id === song._id)
    );

    // Optimistic Update
    if (isAlreadyLiked) {
      setLikedSongs(prev => prev.filter(s => 
        !((s.videoId && song.videoId && s.videoId === song.videoId) || 
          (s._id && song._id && s._id === song._id))
      ));
      showToast('Removed from Liked Songs');
    } else {
      setLikedSongs(prev => [song, ...prev]);
      showToast('Saved to Liked Songs!');
    }

    try {
      const targetId = song.videoId || song._id;
      const res = await axios.post(`${API_URL}/users/${targetId}/like`, {
        title: song.title,
        artist: song.artist,
        coverImage: song.coverImage,
        duration: song.duration || 180,
        videoId: song.videoId
      });
      setLikedSongs(res.data.likedSongs);
    } catch (err) {
      console.error('Like toggle failed:', err);
      setLikedSongs(originalLikedSongs);
      showToast('Failed to sync like state with database.');
    }
  };

  // AI Generated Smart Playlist composer
  const handleAiSmartPlaylist = async (customPrompt?: string) => {
    const promptText = customPrompt || aiPromptInput;
    if (!promptText.trim()) return;

    setIsAiProcessing(true);
    showToast('AI is compiling your vibe...');
    try {
      const res = await axios.post(`${API_URL}/playlists/ai-generate`, { prompt: promptText });
      const aiPlaylist = res.data;

      if (aiPlaylist.songs && aiPlaylist.songs.length > 0) {
        // Save this playlist under user's catalog with all songs attached
        const saveRes = await axios.post(`${API_URL}/playlists`, {
          name: aiPlaylist.name || 'AI Mood Vibe',
          description: aiPlaylist.description || `AI composed mix for: "${promptText}"`,
          songs: aiPlaylist.songs
        });

        const newPlaylist = saveRes.data.data;

        // Reload lists, select and play it
        await fetchUserPlaylists();
        const finalPlaylistRes = await axios.get(`${API_URL}/playlists/${newPlaylist._id}`);
        const playlistData = finalPlaylistRes.data.data;
        
        setSelectedPlaylist(playlistData);
        setCurrentView('playlist');
        
        if (playlistData.songs && playlistData.songs.length > 0) {
          playSong(playlistData.songs[0], playlistData.songs);
        }
        showToast('AI Playlist compiled and playing!');
        setShowAiPromptModal(false);
        setAiPromptInput('');
      } else {
        showToast('AI failed to find songs. Try a different prompt.');
      }
    } catch (err) {
      console.error('AI generation failed:', err);
      showToast('AI composer error.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  // AI Generated Smart Playlist from Liked Songs
  const handleGenerateSmartPlaylist = async () => {
    if (likedSongs.length === 0) {
      showToast('Please like some songs on Explore first before generating an AI Smart Playlist!');
      return;
    }

    setIsGeneratingSmart(true);
    showToast('AI is analyzing your Liked Songs taste...');
    console.log('[DIAGNOSTIC] Triggered handleGenerateSmartPlaylist on client. Liked songs count:', likedSongs.length);
    try {
      console.log(`[DIAGNOSTIC] Dispatching POST request to ${API_URL}/playlists/smart`);
      const res = await axios.post(`${API_URL}/playlists/smart`);
      console.log('[DIAGNOSTIC] Received smart playlist API response data:', res.data);
      if (res.data.success) {
        const rawPlaylist = res.data.playlist || res.data.data;
        const playlistData = rawPlaylist ? {
          ...rawPlaylist,
          _id: rawPlaylist.id || rawPlaylist._id,
          songs: rawPlaylist.tracks || rawPlaylist.songs || []
        } : null;

        if (playlistData) {
          console.log('[DIAGNOSTIC] UI injecting new smart playlist object:', playlistData._id);
          // Instantly inject new playlist into state to update UI immediately
          setPlaylists(prev => [playlistData, ...prev]);
          setSelectedPlaylist(playlistData);
          setCurrentView('playlist');
          
          if (playlistData.songs && playlistData.songs.length > 0) {
            playSong(playlistData.songs[0], playlistData.songs);
          }
          showToast('AI Smart Playlist generated and playing!');
        } else {
          console.error('[DIAGNOSTIC ERROR] No playlist payload in response');
          showToast('Failed to compile smart playlist.');
        }
      } else {
        console.error('[DIAGNOSTIC ERROR] Server responded with success=false');
        showToast('Failed to compile smart playlist.');
      }
    } catch (err: any) {
      console.error('[DIAGNOSTIC ERROR] Smart playlist generation failed on client:', err);
      const errorMsg = err.response?.data?.message || 'AI smart playlist generation failed.';
      showToast(errorMsg);
    } finally {
      setIsGeneratingSmart(false);
      console.log('[DIAGNOSTIC] Finished handleGenerateSmartPlaylist execution.');
    }
  };

  // Play a song and update the queue context
  const playSong = (song: Song, newQueue: Song[] = []) => {
    setCurrentSong(song);
    setIsPlaying(true);
    setProgress(0);
    setCurrentTime(0);

    if (newQueue.length > 0) {
      setQueue(newQueue);
      const index = newQueue.findIndex(s => s.videoId === song.videoId);
      setCurrentSongIndex(index);
    } else {
      setQueue([song]);
      setCurrentSongIndex(0);
    }

    // Auto-fetch lyrics if lyrics panel is open
    if (showLyricsPanel) {
      fetchLyrics(song);
    }
  };

  // Toggle lyrics panel
  const handleToggleLyrics = () => {
    const next = !showLyricsPanel;
    setShowLyricsPanel(next);
    if (next && currentSong) {
      fetchLyrics(currentSong);
    }
  };

  // Next Track
  const handleNext = () => {
    if (queue.length === 0) return;
    let nextIndex = currentSongIndex + 1;
    
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      nextIndex = isRepeat ? 0 : -1;
    }

    if (nextIndex !== -1 && queue[nextIndex]) {
      setCurrentSongIndex(nextIndex);
      setCurrentSong(queue[nextIndex]);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  // Previous Track
  const handlePrev = () => {
    if (queue.length === 0) return;
    let prevIndex = currentSongIndex - 1;

    if (prevIndex < 0) {
      prevIndex = isRepeat ? queue.length - 1 : 0;
    }

    if (queue[prevIndex]) {
      setCurrentSongIndex(prevIndex);
      setCurrentSong(queue[prevIndex]);
      setIsPlaying(true);
    }
  };

  // Seekbar scrubbing
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const pct = clickX / width;
    const targetSeconds = pct * duration;
    playerRef.current.seekTo(targetSeconds, true);
    setProgress(pct * 100);
    setCurrentTime(targetSeconds);
  };

  // Volume control change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value, 10);
    setVolume(vol);
    if (playerRef.current) {
      playerRef.current.setVolume(vol);
    }
  };

  // Share modal opener — calls backend to generate shareLink and make public
  const handleSharePlaylist = async (playlist: Playlist, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await axios.post(`${API_URL}/playlists/${playlist._id}/share`);
      if (res.data.success) {
        const updatedPlaylist = { ...playlist, shareLink: res.data.data.shareLink, isPublic: true };
        setShareModalPlaylist(updatedPlaylist);
        // Update playlist in state
        setPlaylists(prev => prev.map(p => p._id === playlist._id ? updatedPlaylist : p));
      }
    } catch (err) {
      // If share API fails (e.g., already shared), still show modal with existing data
      setShareModalPlaylist(playlist);
    }
  };

  // Toggle playlist public/private visibility (community tab)
  const handleTogglePublic = async (playlist: Playlist) => {
    try {
      const newPublic = !playlist.isPublic;
      const res = await axios.put(`${API_URL}/playlists/${playlist._id}`, { isPublic: newPublic });
      if (res.data.success) {
        const updatedPlaylist = { ...playlist, isPublic: newPublic, shareLink: res.data.data?.shareLink || playlist.shareLink };
        setSelectedPlaylist(updatedPlaylist);
        setPlaylists(prev => prev.map(p => p._id === playlist._id ? updatedPlaylist : p));
        showToast(newPublic ? 'Playlist is now public!' : 'Playlist is now private.');
      }
    } catch (err) {
      console.error('Failed to toggle playlist visibility:', err);
    }
  };

  // Fetch lyrics for a song
  const fetchLyrics = async (song: Song) => {
    if (!song) return;
    setLyricsLoading(true);
    setLyricsError('');
    setLyrics([]);
    try {
      const res = await axios.get(
        `${API_URL}/songs/${song.videoId}/lyrics`,
        { params: { title: song.title, artist: song.artist } }
      );
      if (res.data.success && res.data.lyrics?.length > 0) {
        setLyrics(res.data.lyrics);
      } else {
        setLyricsError('Lyrics not available for this track.');
      }
    } catch (err: any) {
      setLyricsError(err.response?.data?.message || 'Lyrics not found for this song.');
    } finally {
      setLyricsLoading(false);
    }
  };

  // Load specific custom playlist
  const loadPlaylistDetails = async (id: string) => {
    try {
      const res = await axios.get(`${API_URL}/playlists/${id}`);
      if (res.data.success) {
        setSelectedPlaylist(res.data.data);
        setCurrentView('playlist');
      }
    } catch (err) {
      showToast('Failed to load playlist');
    }
  };

  // Delete entire playlist
  // Delete entire playlist
  const handleDeletePlaylist = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this custom playlist?')) return;

    const originalPlaylists = [...playlists];

    // Optimistic Update
    setPlaylists(prev => prev.filter(p => p._id !== id));
    showToast('Playlist deleted');
    if (selectedPlaylist?._id === id) {
      setCurrentView('home');
    }

    try {
      const res = await axios.delete(`${API_URL}/playlists/${id}`);
      if (!res.data.success) {
        // Rollback on failure
        setPlaylists(originalPlaylists);
        showToast('Failed to delete playlist on server.');
      }
    } catch (err) {
      console.error(err);
      setPlaylists(originalPlaylists);
      showToast('Error syncing playlist deletion with database.');
    }
  };

  // Format seconds to string time MM:SS
  const formatTime = (sec: number) => {
    if (isNaN(sec)) return '0:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex h-screen w-full bg-[#070A1E] text-[#F8FAFC] font-sans selection:bg-indigo-500/40 select-none overflow-hidden relative">
      
      {/* Hidden YouTube IFrame */}
      <div className="absolute opacity-0 pointer-events-none w-1 h-1 overflow-hidden" style={{ top: '-9999px' }}>
        <YouTube
          videoId={currentSong?.videoId}
          opts={{
            height: '1px',
            width: '1px',
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              fs: 0,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              origin: window.location.origin
            },
          }}
          onReady={(event) => {
            playerRef.current = event.target;
            playerRef.current.setVolume(volume);
            if (isPlaying) {
              playerRef.current.playVideo();
            }
          }}
          onStateChange={(event) => {
            // event.data matches YouTube Player State:
            // 1: playing, 2: paused, 0: ended
            if (event.data === 1) {
              setIsPlaying(true);
              startProgressPolling();
            } else if (event.data === 2) {
              setIsPlaying(false);
              stopProgressPolling();
            } else if (event.data === 0) {
              handleNext();
            }
          }}
          onError={(err) => {
            console.error('YouTube Player Error:', err);
            handleNext(); // Skip on playback error
          }}
        />
      </div>

      {/* Toast Notification Box */}
      {toastMessage && (
        <div className="fixed top-6 right-6 px-5 py-3 rounded-full bg-gradient-to-r from-[#D946EF] to-[#6366F1] text-white font-semibold text-xs tracking-wider uppercase border border-pink-400/30 shadow-[0_0_15px_rgba(217,70,239,0.5)] z-50 animate-bounce flex items-center gap-2">
          <CheckCircle2 size={16} />
          {toastMessage}
        </div>
      )}

      {/* Main Flow: Authenticated App vs Authentication Portal */}
      {!token ? (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#070A1E] via-[#10163A] to-[#070A1E] px-4 relative">
          {/* Animated decorative retro laser grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(to_right,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>
          
          <div className="w-full max-w-md relative z-10 glass-panel p-8 rounded-3xl border border-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.15)] bg-[#0C1030]/90">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D946EF] to-[#6366F1] flex items-center justify-center shadow-[0_0_20px_rgba(217,70,239,0.6)] mb-3">
                <Play size={28} className="text-white ml-1 fill-white" />
              </div>
              <h2 className="font-display font-extrabold text-3xl tracking-tight text-white">MELODIA</h2>
              <p className="text-xs text-[#94A3B8] tracking-widest uppercase mt-1">Ready Player One</p>
            </div>

            {authError && (
              <div className="mb-4 text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-center">
                {authError}
              </div>
            )}

            <form onSubmit={isLoginView ? handleLogin : handleSignup} className="space-y-4">
              {!isLoginView && (
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Select Avatar</label>
                  <div className="flex gap-2 justify-center py-2">
                    {AVATARS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAuthAvatar(url)}
                        className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${authAvatar === url ? 'border-[#D946EF] scale-110 shadow-[0_0_10px_rgba(217,70,239,0.6)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={url} className="w-full h-full object-cover" alt="avatar" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!isLoginView && (
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">Username</label>
                  <input
                    type="text"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    placeholder="player_one"
                    className="w-full bg-[#161B46] border border-indigo-500/20 rounded-full px-5 py-2.5 text-sm focus:outline-none focus:border-[#D946EF] focus:ring-1 focus:ring-[#D946EF] transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="player@melodia.gg"
                  className="w-full bg-[#161B46] border border-indigo-500/20 rounded-full px-5 py-2.5 text-sm focus:outline-none focus:border-[#D946EF] focus:ring-1 focus:ring-[#D946EF] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">Passcode</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#161B46] border border-indigo-500/20 rounded-full px-5 py-2.5 text-sm focus:outline-none focus:border-[#D946EF] focus:ring-1 focus:ring-[#D946EF] transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full btn-primary bg-gradient-to-r from-[#6366F1] to-[#D946EF] text-white rounded-full py-3 font-bold text-sm shadow-[0_0_15px_rgba(99,102,241,0.4)] tracking-wider uppercase transition-transform hover:scale-102 active:scale-98 mt-2"
              >
                {isLoginView ? 'Access Console' : 'Start Journey'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs">
              <button
                onClick={() => setIsLoginView(!isLoginView)}
                className="text-[#94A3B8] hover:text-[#D946EF] underline transition-colors"
              >
                {isLoginView ? "Create a Melodia character" : "Already registered? Login here"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Authenticated Melodia App Layout
        <div className="flex-1 flex flex-col h-full relative">
          
          <div className="flex flex-1 overflow-hidden h-full">
            
            {/* Retro Game-Themed Sidebar */}
            <aside className="w-64 flex-shrink-0 h-full flex flex-col bg-[#0A0D28] border-r border-indigo-500/10 pt-6 pb-24 z-10 hidden md:flex">
              <div className="px-6 mb-8 flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366F1] to-[#D946EF] flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:scale-105 transition-transform">
                  <Play size={18} className="text-white ml-0.5" fill="currentColor" />
                </div>
                <span className="font-display font-black text-2xl tracking-tighter bg-gradient-to-r from-[#F8FAFC] to-[#D946EF] bg-clip-text text-transparent">Melodia</span>
              </div>

              <div className="flex-1 overflow-y-auto px-4 space-y-6">
                
                {/* Menu items */}
                <div className="space-y-1">
                  <p className="px-3 text-2xs font-extrabold text-[#64748B] uppercase tracking-widest mb-2">Navigator</p>
                  
                  <button 
                    onClick={() => setCurrentView('home')} 
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full transition-all border ${currentView === 'home' ? 'text-white bg-[#1A1F4C] border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'text-[#94A3B8] border-transparent hover:text-white hover:bg-[#13173A]'}`}
                  >
                    <Home size={18} className={currentView === 'home' ? 'text-[#D946EF]' : ''} />
                    <span className="text-sm font-semibold">Home</span>
                  </button>

                  <button 
                    onClick={() => setCurrentView('search')} 
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full transition-all border ${currentView === 'search' ? 'text-white bg-[#1A1F4C] border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'text-[#94A3B8] border-transparent hover:text-white hover:bg-[#13173A]'}`}
                  >
                    <Compass size={18} className={currentView === 'search' ? 'text-[#D946EF]' : ''} />
                    <span className="text-sm font-semibold">Explore</span>
                  </button>

                  <button 
                    onClick={() => setCurrentView('liked')} 
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full transition-all border ${currentView === 'liked' ? 'text-white bg-[#1A1F4C] border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'text-[#94A3B8] border-transparent hover:text-white hover:bg-[#13173A]'}`}
                  >
                    <Heart size={18} className={currentView === 'liked' ? 'text-rose-500 fill-rose-500' : ''} />
                    <span className="text-sm font-semibold">Liked Songs</span>
                  </button>

                  <button 
                    onClick={() => setCurrentView('community')} 
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full transition-all border ${currentView === 'community' ? 'text-white bg-[#1A1F4C] border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'text-[#94A3B8] border-transparent hover:text-white hover:bg-[#13173A]'}`}
                  >
                    <Users size={18} className={currentView === 'community' ? 'text-[#D946EF]' : ''} />
                    <span className="text-sm font-semibold">Community</span>
                  </button>
                </div>

                {/* Playlist Manager */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-3 mb-2">
                    <p className="text-2xs font-extrabold text-[#64748B] uppercase tracking-widest">Library</p>
                    <button 
                      onClick={() => setShowCreatePlaylistModal(true)} 
                      className="p-1 rounded-full text-[#94A3B8] hover:text-white hover:bg-[#1E2555] transition-all"
                      title="Create Custom Playlist"
                    >
                      <PlusSquare size={16} />
                    </button>
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-[220px] pr-1">
                    {playlists.map((playlist) => (
                      <div
                        key={playlist._id}
                        onClick={() => loadPlaylistDetails(playlist._id)}
                        className={`w-full group flex items-center justify-between px-3 py-2 rounded-full cursor-pointer transition-all border ${selectedPlaylist?._id === playlist._id && currentView === 'playlist' ? 'bg-[#1A1F4C]/80 border-indigo-500/20 text-white font-medium' : 'text-[#94A3B8] border-transparent hover:bg-[#13173A] hover:text-white'}`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6366F1] to-[#D946EF] flex items-center justify-center shrink-0 shadow-sm text-2xs text-white font-bold">
                            P
                          </div>
                          <span className="text-xs truncate">{playlist.name}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button 
                            onClick={(e) => handleSharePlaylist(playlist, e)} 
                            className="p-1 text-[#94A3B8] hover:text-[#D946EF]"
                            title="Share"
                          >
                            <Share2 size={12} />
                          </button>
                          <button 
                            onClick={(e) => handleDeletePlaylist(playlist._id, e)} 
                            className="p-1 text-[#94A3B8] hover:text-rose-500"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar User Profile Info */}
              <div className="mt-auto px-4 pt-4 border-t border-indigo-500/10">
                <div 
                  className="flex items-center gap-3 mb-4 cursor-pointer group p-2 rounded-2xl hover:bg-[#13173A] transition-all"
                  onClick={() => setCurrentView('profile')}
                >
                  <img 
                    src={currentUser?.profilePicture || AVATARS[0]} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full border border-indigo-500/30 object-cover" 
                  />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold truncate text-[#F8FAFC]">{currentUser?.username || 'Player One'}</p>
                    <p className="text-3xs text-[#D946EF] tracking-widest uppercase font-black">Level {userStats?.level || 1}</p>
                  </div>
                  <Settings size={16} className="text-[#64748B] hover:text-white transition-colors" />
                </div>
              </div>
            </aside>

            {/* Main Application Content Window */}
            <main className="flex-1 h-full overflow-y-auto pb-[100px] bg-[#070A1E] text-[#F8FAFC] relative flex flex-col">
              
              {/* Header Bar */}
              <header className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between bg-[#070A1E]/80 backdrop-blur-md border-b border-indigo-500/5">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentView('home')}
                    className="w-8 h-8 rounded-full bg-[#13173A]/80 flex items-center justify-center text-[#94A3B8] hover:text-white border border-indigo-500/10 transition-colors"
                  >
                    <Home size={16} />
                  </button>
                  <button 
                    onClick={() => setCurrentView('search')}
                    className="w-8 h-8 rounded-full bg-[#13173A]/80 flex items-center justify-center text-[#94A3B8] hover:text-white border border-indigo-500/10 transition-colors"
                  >
                    <Search size={16} />
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* AI Quick Prompt Button */}
                  <button 
                    onClick={() => setShowAiPromptModal(true)}
                    className="btn-primary px-4 py-1.5 rounded-full font-bold text-xs bg-gradient-to-r from-[#6366F1] to-[#D946EF] text-white shadow-[0_0_10px_rgba(99,102,241,0.3)] hover:scale-102 transition-all flex items-center gap-1.5"
                  >
                    <Activity size={14} className="animate-pulse" />
                    AI Composer
                  </button>

                  <button 
                    onClick={() => setCurrentView('profile')}
                    className="w-8 h-8 rounded-full border border-indigo-500/30 overflow-hidden"
                  >
                    <img 
                      src={currentUser?.profilePicture || AVATARS[0]} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                    />
                  </button>
                </div>
              </header>

              {/* Dynamic View Panel Renderer */}
              <div className="flex-1">
                
                {/* 1. HOME VIEW */}
                {currentView === 'home' && (
                  <HomeView 
                    playSong={playSong} 
                    likedSongs={likedSongs} 
                    onToggleLike={handleToggleLike} 
                    onAiPrompt={handleAiSmartPlaylist}
                    vibeMixes={vibeMixes}
                    loadingVibeMixes={loadingVibeMixes}
                    onSelectPlaylist={(p: Playlist) => {
                      setSelectedPlaylist(p);
                      setCurrentView('playlist');
                    }}
                    username={currentUser?.username}
                  />
                )}

                {/* 2. EXPLORE/SEARCH VIEW */}
                {currentView === 'search' && <SearchView playSong={playSong} likedSongs={likedSongs} onToggleLike={handleToggleLike} onAddPlaylist={(song) => { setSongToAddToPlaylist(song); setShowAddToPlaylistModal(true); }} />}

                {/* 3. PLAYLIST DETAILS VIEW */}
                {currentView === 'playlist' && selectedPlaylist && (
                  <PlaylistErrorBoundary>
                    <PlaylistView 
                      playlist={selectedPlaylist} 
                      playSong={playSong} 
                      currentSong={currentSong} 
                      isPlaying={isPlaying} 
                      likedSongs={likedSongs} 
                      onToggleLike={handleToggleLike} 
                      onRemoveSong={handleRemoveSongFromPlaylist} 
                      onShare={(e) => handleSharePlaylist(selectedPlaylist, e)}
                      onTogglePublic={handleTogglePublic}
                    />
                  </PlaylistErrorBoundary>
                )}

                {/* 4. LIKED SONGS VIEW */}
                {currentView === 'liked' && (
                  <LikedSongsView 
                    songs={likedSongs} 
                    playSong={playSong} 
                    currentSong={currentSong} 
                    isPlaying={isPlaying} 
                    onToggleLike={handleToggleLike} 
                    onGenerateSmartPlaylist={handleGenerateSmartPlaylist}
                    isGeneratingSmart={isGeneratingSmart}
                  />
                )}

                {/* 5. PROFILE / STATS VIEW */}
                {currentView === 'profile' && (
                  <ProfileView 
                    user={currentUser} 
                    logout={() => updateAuthToken(null)} 
                    playlistsCount={playlists.length} 
                    likedCount={likedSongs.length} 
                    onUpdateProfilePicture={handleUpdateProfilePicture}
                    userStats={userStats}
                  />
                )}

                {/* 6. COMMUNITY VIEW */}
                {currentView === 'community' && (
                  <CommunityView 
                    onViewProfile={(userId: string) => {
                      setSelectedUserId(userId);
                      setCurrentView('user-profile');
                    }}
                    onSelectPlaylist={(p: Playlist) => {
                      setSelectedPlaylist(p);
                      setCurrentView('playlist');
                    }}
                  />
                )}

                {/* 7. USER PROFILE VIEW */}
                {currentView === 'user-profile' && selectedUserId && (
                  <UserProfileView 
                    userId={selectedUserId}
                    playSong={playSong}
                    onBack={() => setCurrentView('community')}
                    onSelectPlaylist={(p: Playlist) => {
                      setSelectedPlaylist(p);
                      setCurrentView('playlist');
                    }}
                  />
                )}

              </div>

            </main>
          </div>

          {/* Lyrics Panel */}
          {showLyricsPanel && (
            <LyricsPanel
              song={currentSong}
              lyrics={lyrics}
              loading={lyricsLoading}
              error={lyricsError}
              currentTime={currentTime}
              duration={duration}
              onClose={() => setShowLyricsPanel(false)}
            />
          )}

          {/* Fixed Bottom Custom Spotify-like Player Bar */}
          <PlayerBar 
            currentSong={currentSong} 
            isPlaying={isPlaying} 
            onTogglePlay={() => setIsPlaying(!isPlaying)} 
            onNext={handleNext} 
            onPrev={handlePrev} 
            volume={volume} 
            onVolumeChange={handleVolumeChange} 
            progress={progress} 
            onProgressClick={handleProgressBarClick} 
            currentTime={currentTime} 
            duration={duration} 
            formatTime={formatTime}
            likedSongs={likedSongs}
            onToggleLike={handleToggleLike}
            isRepeat={isRepeat}
            setIsRepeat={setIsRepeat}
            isShuffle={isShuffle}
            setIsShuffle={setIsShuffle}
            showQueue={showQueueDrawer}
            setShowQueue={setShowQueueDrawer}
            queue={queue}
            playSong={playSong}
            showLyrics={showLyricsPanel}
            onToggleLyrics={handleToggleLyrics}
          />

        </div>
      )}

      {/* Add To Playlist Modal Dialog */}
      {showAddToPlaylistModal && songToAddToPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm glass-panel p-6 rounded-3xl border border-indigo-500/20 bg-[#0C1030] shadow-[0_0_40px_rgba(99,102,241,0.2)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-bold text-lg text-white">Add to Playlist</h3>
              <button 
                onClick={() => setShowAddToPlaylistModal(false)}
                className="p-1 rounded-full hover:bg-[#1E2555] text-[#94A3B8] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 mb-6">
              {playlists.length === 0 ? (
                <p className="text-xs text-[#94A3B8] text-center py-4">No playlists yet. Create one in the sidebar.</p>
              ) : (
                playlists.map(p => (
                  <button
                    key={p._id}
                    onClick={() => handleAddSongToPlaylist(p._id)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-full bg-[#13173A]/80 hover:bg-gradient-to-r hover:from-[#6366F1]/40 hover:to-[#D946EF]/40 border border-indigo-500/10 text-left text-xs font-semibold hover:text-white transition-all"
                  >
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-2xs text-[#D946EF] font-bold">
                      P
                    </div>
                    {p.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Playlist Modal */}
      {shareModalPlaylist && (
        <ShareModal
          playlist={shareModalPlaylist}
          onClose={() => setShareModalPlaylist(null)}
          onToast={showToast}
        />
      )}

    </div>
  );
}

// ----------------------------------------------------------------------------
// VIEW SUB-COMPONENTS
// ----------------------------------------------------------------------------

// A. HOME VIEW PANEL
const HomeView = ({ playSong, likedSongs, onToggleLike, onAiPrompt, vibeMixes = [], loadingVibeMixes = false, onSelectPlaylist, username }: any) => {
  const [trending, setTrending] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/songs/trending`)
      .then(res => {
        setTrending(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const greeting = getGreeting();
  const displayName = username || 'Player One';

  return (
    <div className="px-6 pt-6 relative z-10 space-y-10 max-w-7xl mx-auto pb-10">
      
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-[250px] bg-gradient-to-b from-[#6366F1]/10 via-[#070A1E]/40 to-transparent pointer-events-none z-0"></div>

      {/* Greeting */}
      <div className="relative z-10 flex justify-between items-end">
        <div>
          <h1 className="font-display font-black text-3xl md:text-4xl text-white tracking-tight">{greeting}, {displayName}</h1>
          <p className="text-xs text-[#94A3B8] mt-1">Booting up the catalog. Choose your audio track.</p>
        </div>
      </div>

      {/* AI Composer Quick Deck */}
      <section className="relative rounded-3xl overflow-hidden p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-br from-[#10153D]/90 via-[#1C1F4A]/80 to-[#10153D]/90 border border-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.08)]">
        <div className="relative z-10 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D946EF]/20 border border-[#D946EF]/30 text-[#D946EF] text-2xs font-bold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D946EF] animate-ping"></span>
            COMPILER DECK
          </div>
          <h2 className="font-display font-bold text-2xl text-white tracking-tight">Generate Custom AI Soundtracks</h2>
          <p className="text-[#94A3B8] text-xs mt-2 mb-5 leading-relaxed">Enter your prompt or select one of our curated themes to generate a fully playable YouTube playlist powered by AI recommendations.</p>
          
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {['Retro Cyberpunk Drive', 'Late Night Lo-fi Chill', 'Arcade Workout Pump'].map((t, idx) => (
              <button
                key={idx}
                onClick={() => handleAiSmartPlaylist(t)}
                className="px-3.5 py-1.5 rounded-full bg-[#161B46] border border-indigo-500/20 hover:border-[#D946EF]/50 hover:bg-[#1E245D] text-3xs font-bold text-indigo-200 transition-all hover:scale-102"
              >
                + {t}
              </button>
            ))}
          </div>
        </div>

        <div className="relative shrink-0 flex items-center justify-center w-36 h-36 bg-[#070A1E] rounded-full border border-indigo-500/15 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]">
          <div className="absolute inset-0 bg-[#D946EF]/5 rounded-full blur-[20px] animate-pulse"></div>
          <Activity size={48} className="text-[#D946EF] animate-bounce" />
        </div>
      </section>

      {/* AI Vibe Mixes (K-Means Clustering) */}
      {likedSongs.length > 0 && (
        <section className="relative z-10">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="font-display font-bold text-xl text-white tracking-tight flex items-center gap-2">
                <Activity size={18} className="text-[#6366F1]" /> AI Vibe Mixes
              </h2>
              <p className="text-3xs text-[#94A3B8] mt-0.5">Acoustic clusters grouped automatically using K-Means clustering algorithm.</p>
            </div>
          </div>

          {loadingVibeMixes ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-[#10153D]/40 p-5 rounded-3xl h-36 border border-indigo-500/5"></div>
              ))}
            </div>
          ) : vibeMixes.length === 0 ? (
            <div className="glass-panel p-6 rounded-3xl text-center text-[#64748B] border border-indigo-500/5 bg-[#0C1030]/80">
              <p className="text-xs">Clustering calculations are running in the background...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {vibeMixes.map((mix) => (
                <div
                  key={mix._id}
                  onClick={() => onSelectPlaylist(mix)}
                  className={`relative p-5 rounded-3xl cursor-pointer overflow-hidden border border-indigo-500/5 hover:border-indigo-500/20 transition-all duration-300 hover:scale-102 bg-gradient-to-br ${mix.gradient || 'from-[#1E1B4B] to-[#4C1D95]'} shadow-md hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] flex flex-col justify-between h-36 group`}
                >
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>

                  <div>
                    <h3 className="font-display font-black text-sm text-white tracking-tight uppercase">{mix.name}</h3>
                    <p className="text-3xs text-white/70 line-clamp-2 mt-1.5 font-medium leading-relaxed pr-6">{mix.description}</p>
                  </div>

                  <div className="flex justify-between items-center z-10">
                    <span className="text-4xs text-white/50 bg-black/20 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">{mix.songs?.length || 0} Tracks</span>
                    <button className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:scale-108 active:scale-95">
                      <Play size={14} className="ml-0.5 fill-black text-black" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Grid of trending songs */}
      <section className="relative z-10">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-display font-bold text-xl text-white tracking-tight flex items-center gap-2">
            <TrendingUp size={18} className="text-[#D946EF]" /> Trending Audio Tracks
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-[#10153D]/40 p-4 rounded-3xl h-52"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {trending.map((song) => {
              const isLiked = likedSongs.some((s: any) => (s.videoId && song.videoId && s.videoId === song.videoId) || (s._id && song._id && s._id === song._id));
              return (
                <div 
                  key={song.videoId} 
                  onClick={() => playSong(song, trending)}
                  className="bg-[#10153D]/40 hover:bg-[#181F54] p-3.5 rounded-3xl transition-all duration-300 group cursor-pointer border border-indigo-500/5 hover:border-indigo-500/15 shadow-sm hover:shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:scale-102 flex flex-col h-full"
                >
                  <div className="relative w-full aspect-square mb-3 rounded-2xl overflow-hidden shadow-sm shrink-0">
                    <img 
                      src={song.coverImage} 
                      alt={song.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="w-11 h-11 rounded-full bg-gradient-to-r from-[#6366F1] to-[#D946EF] flex items-center justify-center text-white shadow-md hover:scale-108 active:scale-95 transition-all">
                        <Play size={20} className="ml-0.5 fill-white" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-xs truncate text-[#F8FAFC]">{song.title}</h3>
                      <p className="text-3xs text-[#94A3B8] truncate mt-0.5">{song.artist}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-indigo-500/5">
                      <span className="text-3xs font-semibold bg-[#1C204B] px-2 py-0.5 rounded-full text-indigo-300">YouTube</span>
                      <button 
                        onClick={(e) => onToggleLike(song, e)}
                        className={`p-1.5 rounded-full hover:bg-[#20275C] transition-colors ${isLiked ? 'text-rose-500' : 'text-[#64748B] hover:text-white'}`}
                      >
                        <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};

// B. SEARCH VIEW PANEL
const SearchView = ({ playSong, likedSongs, onToggleLike, onAddPlaylist }: any) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      setIsSearching(true);
      axios.get(`${API_URL}/songs/search?q=${encodeURIComponent(query)}`)
        .then(res => {
          setResults(res.data);
          setIsSearching(false);
        })
        .catch(err => {
          console.error(err);
          setIsSearching(false);
        });
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [query]);

  const filteredResults = selectedMood 
    ? results.filter(s => s.predictedMoods?.includes(selectedMood)) 
    : results;

  return (
    <div className="px-6 pt-6 relative z-10 space-y-8 max-w-5xl mx-auto pb-10">
      
      <div className="w-full text-center mt-2 relative z-10">
        <h1 className="font-display font-black text-3xl text-white tracking-tight">Sonic Search</h1>
        <p className="text-xs text-[#94A3B8] mt-1">Scan YouTube Database for Audio Tracks</p>
        
        <div className="relative group w-full max-w-2xl mx-auto mt-6">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366F1] to-[#D946EF] rounded-full blur opacity-15 group-focus-within:opacity-40 transition duration-300"></div>
          <div className="relative flex items-center bg-[#101438] border border-indigo-500/15 rounded-full overflow-hidden">
            <Search className="text-indigo-400 ml-5 shrink-0" size={20} />
            <input 
              type="text" 
              placeholder="Search by track name, author, or vibe..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent py-3.5 pl-3.5 pr-6 text-sm text-white placeholder-[#64748B] focus:outline-none"
            />
          </div>
        </div>

        {/* Quick Vibe Tags */}
        <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-lg mx-auto">
          {['Synthwave Hits', 'Lofi Hip Hop', 'Chill Pop', 'Retro Gaming', '80s Electronic'].map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="px-3.5 py-1 rounded-full bg-[#13173A] border border-indigo-500/10 hover:border-[#D946EF]/30 hover:bg-[#181F54] text-3xs font-semibold text-[#94A3B8] hover:text-white transition-all"
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Mood Filter Buttons */}
        {results.length > 0 && (
          <div className="flex flex-wrap justify-center items-center gap-2 mt-6 max-w-lg mx-auto border-t border-indigo-500/10 pt-4">
            <span className="text-4xs text-[#64748B] font-mono font-bold uppercase mr-1">Filter Vibe:</span>
            {['Happy', 'Sad', 'Focused', 'Workout'].map((mood) => {
              const active = selectedMood === mood;
              let activeStyle = '';
              if (mood === 'Happy') activeStyle = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
              if (mood === 'Sad') activeStyle = 'bg-blue-500/20 text-blue-400 border-blue-500/40';
              if (mood === 'Focused') activeStyle = 'bg-purple-500/20 text-purple-400 border-purple-500/40';
              if (mood === 'Workout') activeStyle = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
              
              return (
                <button
                  key={mood}
                  onClick={() => setSelectedMood(active ? null : mood)}
                  className={`px-3 py-1 rounded-full text-3xs font-bold border transition-all ${
                    active 
                      ? activeStyle 
                      : 'bg-[#101438]/50 text-[#94A3B8] border-indigo-500/10 hover:border-indigo-500/30'
                  }`}
                >
                  {mood}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative z-10">
        {query ? (
          <div className="glass-panel p-4 rounded-3xl border border-indigo-500/10 bg-[#0C1030]/80">
            <h2 className="font-display font-bold text-lg text-white mb-4 px-2">Results on YouTube</h2>
            
            {isSearching && (
              <p className="text-xs text-[#94A3B8] text-center py-10">Initializing database lookup scan...</p>
            )}
            
            {!isSearching && filteredResults.length === 0 && (
              <p className="text-xs text-[#94A3B8] text-center py-10">No audio tracks match "{query}" with vibe filter</p>
            )}

            {!isSearching && filteredResults.length > 0 && (
              <div className="space-y-1.5">
                {filteredResults.map((song, i) => {
                  const isLiked = likedSongs.some((s: any) => (s.videoId && song.videoId && s.videoId === song.videoId) || (s._id && song._id && s._id === song._id));
                  return (
                    <div 
                      key={song.videoId} 
                      onClick={() => playSong(song, filteredResults)}
                      className="flex items-center p-2 hover:bg-[#171C4B]/50 rounded-2xl group transition-colors cursor-pointer"
                    >
                      <div className="w-8 text-center text-[#64748B] font-mono text-xs group-hover:hidden">{i + 1}</div>
                      <div className="w-8 text-center text-[#D946EF] hidden group-hover:flex items-center justify-center shrink-0">
                        <Play size={14} className="fill-current" />
                      </div>
                      
                      <div className="flex-1 flex items-center gap-3 truncate pr-4">
                        <img 
                          src={song.coverImage} 
                          alt={song.title} 
                          className="w-10 h-10 rounded-xl object-cover shrink-0 bg-indigo-950 border border-indigo-500/5" 
                        />
                        <div className="flex flex-col truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#F8FAFC] truncate">{song.title}</span>
                            {song.predictedMoods && song.predictedMoods.length > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[#6366F1] font-mono text-[9px] font-bold uppercase scale-90 shrink-0">
                                {song.predictedMoods[0]}
                              </span>
                            )}
                          </div>
                          <span className="text-3xs text-[#94A3B8] truncate mt-0.5">{song.artist}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onToggleLike(song); }}
                          className={`p-2 rounded-full hover:bg-[#20275C] transition-colors ${isLiked ? 'text-rose-500' : 'text-[#64748B] hover:text-white'}`}
                        >
                          <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onAddPlaylist(song); }}
                          className="p-2 rounded-full hover:bg-[#20275C] text-[#64748B] hover:text-white transition-colors"
                          title="Add to Playlist"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Pop Hits', color: 'from-pink-600 to-rose-500' },
              { name: 'Synthwave', color: 'from-indigo-600 to-purple-600' },
              { name: 'Cyberpunk', color: 'from-violet-600 to-fuchsia-600' },
              { name: 'Lofi Beats', color: 'from-teal-600 to-emerald-500' }
            ].map((cat, i) => (
              <div 
                key={i} 
                onClick={() => setQuery(cat.name)}
                className={`bg-gradient-to-br ${cat.color} rounded-3xl p-5 h-32 relative overflow-hidden group cursor-pointer shadow-md hover:scale-102 transition-all duration-300`}
              >
                <h3 className="font-display font-black text-lg text-white relative z-10">{cat.name}</h3>
                <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-white/10 rounded-full group-hover:scale-110 transition-transform"></div>
                <Music className="absolute right-4 bottom-4 text-white/20 group-hover:-rotate-12 transition-transform" size={40} />
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

// C. PLAYLIST DETAILS VIEW PANEL
const PlaylistView = ({ playlist, playSong, currentSong, isPlaying, likedSongs, onToggleLike, onRemoveSong, onShare, onTogglePublic }: any) => {
  const songs = playlist?.tracks || playlist?.songs || [];
  const isOwner = !playlist?.owner || playlist?.owner?._id === undefined || playlist?.owner?.username !== undefined || true;

  return (
    <div className="px-6 pt-6 relative z-10 max-w-5xl mx-auto pb-10">
      
      {/* Header card */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 border-b border-indigo-500/10 pb-6 mb-6 text-center md:text-left">
        <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-[#6366F1] via-[#D946EF] to-[#0EA5E9] flex items-center justify-center shrink-0 shadow-lg border-2 border-indigo-400/20 relative group">
          <Music size={48} className="text-white" />
          <div className="absolute inset-0 rounded-3xl shadow-[0_0_20px_rgba(217,70,239,0.2)]"></div>
        </div>
        
        <div className="flex-1 space-y-1">
          <p className="text-3xs text-[#D946EF] tracking-widest uppercase font-extrabold">Custom Playlist</p>
          <h1 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight">{playlist?.name || 'AI Smart Playlist'}</h1>
          <p className="text-xs text-[#94A3B8] font-medium leading-relaxed">{playlist?.description || 'No description provided.'}</p>
          <p className="text-2xs text-[#64748B] pt-2">Created by <span className="text-indigo-400">{playlist?.owner?.username || 'You'}</span> • {songs.length} Tracks</p>
        </div>

        <div className="flex gap-2 shrink-0">
          {songs.length > 0 && (
            <button 
              onClick={() => playSong(songs[0], songs)}
              className="btn-primary w-12 h-12 rounded-full bg-gradient-to-r from-[#6366F1] to-[#D946EF] flex items-center justify-center text-white shadow-md hover:scale-105 active:scale-95 transition-all"
            >
              <Play size={20} className="ml-0.5 fill-white" />
            </button>
          )}
          <button 
            onClick={onShare}
            className="w-12 h-12 rounded-full bg-[#13173A] border border-indigo-500/10 flex items-center justify-center text-indigo-400 hover:text-white hover:bg-[#1A1F52] transition-colors shadow-sm"
            title="Copy Public Link"
          >
            <Share2 size={16} />
          </button>
          <button 
            onClick={() => onTogglePublic && onTogglePublic(playlist)}
            className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors shadow-sm ${playlist?.isPublic ? 'bg-[#D946EF]/20 border-[#D946EF]/30 text-[#D946EF]' : 'bg-[#13173A] border-indigo-500/10 text-[#94A3B8] hover:text-white hover:bg-[#1A1F52]'}`}
            title={playlist?.isPublic ? 'Visible in Community (click to hide)' : 'Make Public (visible in Community)'}
          >
            <Globe size={16} />
          </button>
        </div>
      </div>

      {/* Playlist track list */}
      <div className="glass-panel p-4 rounded-3xl border border-indigo-500/5 bg-[#0C1030]/80">
        {songs.length === 0 ? (
          <div className="text-center py-12 text-[#64748B]">
            <ListMusic size={36} className="mx-auto text-indigo-500/30 mb-3" />
            <p className="text-xs">No tracks in this playlist yet.</p>
            <p className="text-2xs mt-1">Search for tracks on Explore and add them here!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {songs.map((song: Song, index: number) => {
              const isCurrent = currentSong?.videoId === song.videoId;
              const isLiked = likedSongs.some((s: any) => (s.videoId && song.videoId && s.videoId === song.videoId) || (s._id && song._id && s._id === song._id));
              return (
                <div
                  key={song._id || song.videoId || index}
                  onClick={() => playSong(song, songs)}
                  className={`flex items-center p-2 rounded-2xl group transition-colors cursor-pointer ${isCurrent ? 'bg-[#1A1F5C]/60 text-white' : 'hover:bg-[#171C4B]/50'}`}
                >
                  <div className="w-8 text-center text-[#64748B] font-mono text-xs group-hover:hidden">
                    {isCurrent && isPlaying ? (
                      <span className="inline-block w-2.5 h-2.5 bg-[#D946EF] rounded-full animate-ping"></span>
                    ) : index + 1}
                  </div>
                  <div className="w-8 text-center text-[#D946EF] hidden group-hover:flex items-center justify-center shrink-0">
                    {isCurrent && isPlaying ? <Pause size={14} /> : <Play size={14} className="fill-current" />}
                  </div>

                  <div className="flex-1 flex items-center gap-3 truncate pr-4">
                    <img 
                      src={song.coverImage || (song as any).thumbnail || ''} 
                      alt={song.title || 'Untitled Track'} 
                      className="w-10 h-10 rounded-xl object-cover shrink-0" 
                    />
                    <div className="flex flex-col truncate">
                      <span className={`text-xs font-bold truncate ${isCurrent ? 'text-[#D946EF]' : 'text-[#F8FAFC]'}`}>{song.title || 'Untitled Track'}</span>
                      <span className="text-3xs text-[#94A3B8] truncate mt-0.5">{song.artist || 'Unknown Artist'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={(e) => onToggleLike(song, e)}
                      className={`p-2 rounded-full hover:bg-[#20275C] transition-colors ${isLiked ? 'text-rose-500' : 'text-[#64748B] hover:text-white'}`}
                    >
                      <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                    </button>
                    <button 
                      onClick={(e) => onRemoveSong(song._id, e)}
                      className="p-2 rounded-full hover:bg-[#20275C] text-[#64748B] hover:text-rose-500 transition-colors"
                      title="Remove from Playlist"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

const LikedSongsView = ({ songs, playSong, currentSong, isPlaying, onToggleLike, onGenerateSmartPlaylist, isGeneratingSmart }: any) => {
  return (
    <div className="px-6 pt-6 relative z-10 max-w-5xl mx-auto pb-10">
      
      {/* Header card */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 border-b border-indigo-500/10 pb-6 mb-6 text-center md:text-left">
        <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg border-2 border-rose-400/20 relative group">
          <Heart size={54} className="text-white fill-white" />
        </div>
        
        <div className="flex-1 space-y-1">
          <p className="text-3xs text-rose-500 tracking-widest uppercase font-extrabold font-mono">Console Memory</p>
          <h1 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight">Liked Songs</h1>
          <p className="text-xs text-[#94A3B8] font-medium leading-relaxed">Your personal database of saved tracks synced across device logs.</p>
          <p className="text-2xs text-[#64748B] pt-2">{songs.length} Saved Audio Tracks</p>
        </div>
 
        <div className="flex gap-2 shrink-0">
          {songs.length > 0 && (
            <>
              <button 
                onClick={onGenerateSmartPlaylist}
                disabled={isGeneratingSmart}
                className={`btn-primary px-4 py-2 rounded-full bg-gradient-to-r from-[#6366F1] to-[#D946EF] flex items-center justify-center text-white shadow-md hover:scale-105 active:scale-95 transition-all text-xs font-bold gap-1.5 ${isGeneratingSmart ? 'opacity-80 cursor-wait' : ''}`}
                title="Generate AI Smart Playlist"
              >
                {isGeneratingSmart ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    AI Analyzing...
                  </>
                ) : (
                  <>
                    <Activity size={14} className="animate-pulse" />
                    Generate Smart Playlist
                  </>
                )}
              </button>
              <button 
                onClick={() => playSong(songs[0], songs)}
                className="btn-primary w-12 h-12 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md hover:scale-105 active:scale-95 transition-all shrink-0"
              >
                <Play size={20} className="ml-0.5 fill-white" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Track list */}
      <div className="glass-panel p-4 rounded-3xl border border-indigo-500/5 bg-[#0C1030]/80">
        {songs.length === 0 ? (
          <div className="text-center py-12 text-[#64748B]">
            <Heart size={36} className="mx-auto text-rose-500/30 mb-3" />
            <p className="text-xs">No liked tracks stored in system.</p>
            <p className="text-2xs mt-1 mb-4">Tap the heart on any track to save it here.</p>
            <button 
              onClick={onGenerateSmartPlaylist}
              disabled={isGeneratingSmart}
              className={`px-5 py-2.5 rounded-full bg-[#181F54] border border-indigo-500/20 hover:border-[#D946EF]/30 text-xs font-bold text-[#D946EF] hover:text-white transition-all hover:scale-102 flex items-center gap-1.5 mx-auto ${isGeneratingSmart ? 'opacity-85 cursor-wait' : ''}`}
            >
              {isGeneratingSmart ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[#D946EF]/30 border-t-[#D946EF] rounded-full animate-spin"></span>
                  AI Analyzing...
                </>
              ) : (
                <>
                  <Activity size={14} />
                  Generate Smart Playlist
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {songs.map((song: Song, index: number) => {
              const isCurrent = currentSong?.videoId === song.videoId;
              return (
                <div
                  key={song._id}
                  onClick={() => playSong(song, songs)}
                  className={`flex items-center p-2 rounded-2xl group transition-colors cursor-pointer ${isCurrent ? 'bg-[#1A1F5C]/60 text-white' : 'hover:bg-[#171C4B]/50'}`}
                >
                  <div className="w-8 text-center text-[#64748B] font-mono text-xs group-hover:hidden">
                    {isCurrent && isPlaying ? (
                      <span className="inline-block w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
                    ) : index + 1}
                  </div>
                  <div className="w-8 text-center text-rose-500 hidden group-hover:flex items-center justify-center shrink-0">
                    {isCurrent && isPlaying ? <Pause size={14} /> : <Play size={14} className="fill-current" />}
                  </div>

                  <div className="flex-1 flex items-center gap-3 truncate pr-4">
                    <img 
                      src={song.coverImage} 
                      alt={song.title} 
                      className="w-10 h-10 rounded-xl object-cover shrink-0" 
                    />
                    <div className="flex flex-col truncate">
                      <span className={`text-xs font-bold truncate ${isCurrent ? 'text-rose-500' : 'text-[#F8FAFC]'}`}>{song.title}</span>
                      <span className="text-3xs text-[#94A3B8] truncate mt-0.5">{song.artist}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleLike(song); }}
                      className="p-2 rounded-full hover:bg-[#20275C] text-rose-500 transition-colors"
                      title="Unlike"
                    >
                      <Heart size={14} fill="currentColor" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

// E. USER PROFILE / STATS PANEL
const ProfileView = ({ user, logout, playlistsCount, likedCount, onUpdateProfilePicture, userStats }: any) => {
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setPreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUpload = async () => {
    if (!previewUrl) return;
    setUploading(true);
    await onUpdateProfilePicture(previewUrl);
    setUploading(false);
    setPreviewUrl('');
    setShowAvatarModal(false);
  };

  const handleApplyUrl = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed || (!trimmed.startsWith('http') && !trimmed.startsWith('data:'))) {
      alert('Please enter a valid image URL.');
      return;
    }
    setUploading(true);
    await onUpdateProfilePicture(trimmed);
    setUploading(false);
    setUrlInput('');
    setShowAvatarModal(false);
  };

  return (
    <div className="px-6 pt-8 relative z-10 max-w-5xl mx-auto pb-10 space-y-8">
      
      {/* Profile summary header */}
      <div className="flex flex-col md:flex-row items-center gap-6 border-b border-indigo-500/10 pb-6 text-center md:text-left">
        <div className="relative group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
          <img 
            src={user?.profilePicture || AVATARS[0]} 
            alt="User avatar" 
            className="w-28 h-28 rounded-full border-4 border-[#D946EF]/20 object-cover shadow-[0_0_20px_rgba(217,70,239,0.3)] transition-transform group-hover:scale-102" 
          />
          <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Change</span>
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 scale-105 pointer-events-none"></div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#D946EF] flex items-center justify-center border-2 border-[#070A1E]">
            <Upload size={12} className="text-white" />
          </div>
        </div>
        
        <div className="flex-1 space-y-1">
          <div className="flex flex-col md:flex-row items-center gap-2">
            <h1 className="font-display font-black text-2xl text-white tracking-tight">{user?.username || 'Player One'}</h1>
            <span className="bg-[#D946EF]/20 border border-[#D946EF]/30 text-[#D946EF] font-mono text-[9px] px-2 py-0.5 rounded font-black tracking-widest uppercase">MELODIA BETA</span>
          </div>
          <p className="text-xs text-[#94A3B8]">{user?.email || 'player_one@melodia.gg'} • Listening online</p>
          <p className="text-3xs text-[#64748B] pt-1">Registered console user since 2026</p>
        </div>

        <button 
          onClick={logout}
          className="px-5 py-2.5 rounded-full bg-[#181F54] border border-indigo-500/20 hover:border-rose-500/40 text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-950/20 flex items-center gap-2 transition-all"
        >
          <LogOut size={14} /> Log Out Console
        </button>
      </div>

      {/* Avatar Selection Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 rounded-3xl border border-indigo-500/20 bg-[#0C1030] max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => { setShowAvatarModal(false); setPreviewUrl(''); setUrlInput(''); }}
              className="absolute top-4 right-4 text-[#64748B] hover:text-white"
            >
              <X size={18} />
            </button>
            <h3 className="font-display font-black text-lg text-white mb-1 uppercase tracking-wide">Update Profile Picture</h3>
            <p className="text-2xs text-[#64748B] mb-6">Upload a photo, paste an image URL, or choose a preset avatar.</p>
            
            {/* Preview */}
            {previewUrl && (
              <div className="flex flex-col items-center gap-3 mb-6 p-4 bg-[#0D1235] rounded-2xl border border-indigo-500/10">
                <img src={previewUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-[#D946EF]/40 shadow-[0_0_15px_rgba(217,70,239,0.3)]" />
                <div className="flex gap-2">
                  <button
                    onClick={handleApplyUpload}
                    disabled={uploading}
                    className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#6366F1] to-[#D946EF] text-white text-xs font-bold hover:scale-102 transition-all disabled:opacity-60"
                  >
                    {uploading ? 'Saving...' : 'Apply This Photo'}
                  </button>
                  <button
                    onClick={() => setPreviewUrl('')}
                    className="px-4 py-1.5 rounded-full bg-[#13173A] border border-indigo-500/10 text-xs font-bold text-[#94A3B8] hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* File Upload */}
            <div className="mb-4">
              <p className="text-2xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Upload size={12} /> Upload from Device
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-indigo-500/20 hover:border-[#D946EF]/40 bg-[#0D1235]/50 hover:bg-[#13173A] text-xs text-[#94A3B8] hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Upload size={14} />
                Click to choose a photo from your device
              </button>
            </div>

            {/* URL Input */}
            <div className="mb-6">
              <p className="text-2xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Link size={12} /> Paste Image URL
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/your-photo.jpg"
                  className="flex-1 bg-[#161B46] border border-indigo-500/20 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-[#D946EF] transition-all text-white placeholder-[#4A5075]"
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyUrl()}
                />
                <button
                  onClick={handleApplyUrl}
                  disabled={!urlInput.trim() || uploading}
                  className="px-3 py-2 rounded-full bg-[#1A1F52] border border-indigo-500/20 text-xs font-bold text-indigo-400 hover:text-white disabled:opacity-40 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Preset Avatars */}
            <div>
              <p className="text-2xs font-bold text-[#94A3B8] uppercase tracking-wider mb-3">Quick Presets</p>
              <div className="grid grid-cols-5 gap-3 mb-6">
                {AVATARS.map((avatar, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      onUpdateProfilePicture(avatar);
                      setShowAvatarModal(false);
                    }}
                    className={`relative cursor-pointer rounded-full overflow-hidden border-2 transition-all hover:scale-105 ${user?.profilePicture === avatar ? 'border-[#D946EF]' : 'border-transparent hover:border-indigo-500/50'}`}
                  >
                    <img src={avatar} alt={`Avatar option ${idx + 1}`} className="w-16 h-16 object-cover" />
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => { setShowAvatarModal(false); setPreviewUrl(''); setUrlInput(''); }}
              className="w-full py-2.5 rounded-full bg-[#13173A] border border-indigo-500/10 text-xs font-bold text-[#94A3B8] hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="glass-panel p-5 rounded-3xl border border-indigo-500/10 bg-[#0C1030]/80">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Music size={18} />
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">ACTIVE</span>
          </div>
          <p className="text-3xs text-[#94A3B8] font-bold uppercase tracking-wider">Custom Playlists</p>
          <h3 className="font-display font-black text-3xl text-white mt-1">{playlistsCount}</h3>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-indigo-500/10 bg-[#0C1030]/80">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
              <Heart size={18} />
            </div>
            <span className="text-[10px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded-full font-bold">SAVED</span>
          </div>
          <p className="text-3xs text-[#94A3B8] font-bold uppercase tracking-wider">Liked Songs</p>
          <h3 className="font-display font-black text-3xl text-white mt-1">{likedCount}</h3>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-indigo-500/10 bg-[#0C1030]/80">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-[#D946EF]/10 text-[#D946EF] rounded-xl">
              <Activity size={18} />
            </div>
            <span className="text-[10px] bg-[#D946EF]/10 text-[#D946EF] px-1.5 py-0.5 rounded-full font-bold">LEVEL</span>
          </div>
          <p className="text-3xs text-[#94A3B8] font-bold uppercase tracking-wider">Listening level</p>
          <h3 className="font-display font-black text-3xl text-white mt-1">{userStats?.level || 1}</h3>
          {/* XP Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[9px] text-[#64748B] font-mono mb-1">
              <span>{userStats?.xp || 0} XP</span>
              <span>{userStats?.xpNeeded ? `${userStats.xpProgress || 0}/${userStats.xpNeeded}` : ''}</span>
            </div>
            <div className="w-full h-1.5 bg-[#141B44] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#D946EF] to-[#6366F1] rounded-full transition-all duration-500"
                style={{ width: `${userStats?.xpNeeded ? Math.min((userStats.xpProgress / userStats.xpNeeded) * 100, 100) : 0}%` }}
              />
            </div>
          </div>
        </div>

      </section>

      {/* Premium Dashboard visual */}
      <section className="relative rounded-3xl overflow-hidden p-6 bg-gradient-to-r from-indigo-950 via-[#1C1F4A]/80 to-indigo-950 border border-indigo-500/15 shadow-sm text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="font-display font-bold text-lg text-white">Unlock Melodia Elite Arcade Deck</h3>
          <p className="text-[#94A3B8] text-xs">Access lossless audio compression logic filters, custom neon visualization feeds, and AI generated playlists without hourly token constraints.</p>
        </div>
        <button className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#D946EF] to-[#6366F1] font-bold text-xs uppercase tracking-wider shadow-md hover:scale-102 transition-transform shrink-0">
          Upgrade System
        </button>
      </section>

    </div>
  );
};

// F. PLAYER BAR CONTROLS
const PlayerBar = ({ 
  currentSong, isPlaying, onTogglePlay, onNext, onPrev, 
  volume, onVolumeChange, progress, onProgressClick, 
  currentTime, duration, formatTime, likedSongs, onToggleLike,
  isRepeat, setIsRepeat, isShuffle, setIsShuffle,
  showQueue, setShowQueue, queue, playSong,
  showLyrics, onToggleLyrics
}: any) => {
  const isLiked = currentSong && likedSongs.some((s: any) => (s.videoId && currentSong.videoId && s.videoId === currentSong.videoId) || (s._id && currentSong._id && s._id === currentSong._id));

  return (
    <>
      {/* Floating Queue Drawer Panel */}
      {showQueue && (
        <div className="fixed bottom-[95px] right-4 w-72 max-h-80 glass-panel p-4 rounded-3xl border border-indigo-500/10 bg-[#0C1030]/95 shadow-[0_0_20px_rgba(0,0,0,0.5)] z-40 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-indigo-500/10 shrink-0">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <ListMusic size={14} className="text-[#D946EF]" /> Audio Play Queue
            </h4>
            <button 
              onClick={() => setShowQueue(false)}
              className="p-0.5 rounded-full hover:bg-[#1D2254] text-[#64748B] hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 space-y-1">
            {queue.length === 0 ? (
              <p className="text-3xs text-[#64748B] text-center py-10">Queue buffer is empty.</p>
            ) : (
              queue.map((song: Song, idx: number) => {
                const isActive = currentSong?.videoId === song.videoId;
                return (
                  <div
                    key={`${song.videoId}-${idx}`}
                    onClick={() => playSong(song, queue)}
                    className={`flex items-center gap-2.5 p-1.5 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-[#181D53] border border-indigo-500/15' : 'hover:bg-[#13163A]'}`}
                  >
                    <img src={song.coverImage} className="w-8 h-8 rounded-lg object-cover" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-3xs font-bold truncate ${isActive ? 'text-[#D946EF]' : 'text-white'}`}>{song.title}</p>
                      <p className="text-[9px] text-[#64748B] truncate">{song.artist}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Player Bar component */}
      <div className="fixed bottom-0 left-0 right-0 h-[92px] bg-[#0A0D28]/95 backdrop-blur-md border-t border-indigo-500/10 z-50 flex items-center px-4 md:px-6 justify-between shadow-lg">
        
        {/* Album Cover & Title Details */}
        <div className="flex items-center gap-3 w-[30%] min-w-[180px]">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-indigo-500/10 shadow-sm bg-indigo-950 flex items-center justify-center">
            {currentSong ? (
              <img src={currentSong.coverImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <Music size={16} className="text-indigo-400" />
            )}
          </div>
          <div className="flex flex-col min-w-0 truncate">
            <h4 className="text-xs font-bold text-white truncate hover:underline cursor-pointer">
              {currentSong ? currentSong.title : 'Melodia Streaming'}
            </h4>
            <p className="text-3xs text-[#94A3B8] truncate mt-0.5 hover:underline cursor-pointer">
              {currentSong ? currentSong.artist : 'Select audio track'}
            </p>
          </div>
          
          {currentSong && (
            <button 
              onClick={(e) => onToggleLike(currentSong, e)}
              className={`p-1.5 rounded-full hover:bg-[#1E2353] transition-colors shrink-0 ${isLiked ? 'text-rose-500' : 'text-[#64748B]'}`}
            >
              <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>

        {/* Custom Playback Controls & Progress bar */}
        <div className="flex flex-col items-center flex-1 max-w-xl px-2">
          <div className="flex items-center gap-5 mb-1.5">
            <button 
              onClick={() => setIsShuffle(!isShuffle)}
              className={`p-1 transition-colors ${isShuffle ? 'text-[#D946EF]' : 'text-[#64748B] hover:text-white'}`}
              title="Shuffle"
            >
              <Shuffle size={14} />
            </button>
            
            <button 
              onClick={onPrev}
              className="text-[#94A3B8] hover:text-white transition-colors"
              disabled={!currentSong}
            >
              <SkipBack size={18} fill="currentColor" />
            </button>
            
            <button 
              onClick={onTogglePlay} 
              className="w-9 h-9 rounded-full bg-[#F8FAFC] text-[#070A1E] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shrink-0"
              disabled={!currentSong}
            >
              {isPlaying ? <Pause size={16} className="fill-current text-[#070A1E]" /> : <Play size={16} className="ml-0.5 fill-current text-[#070A1E]" />}
            </button>
            
            <button 
              onClick={onNext}
              className="text-[#94A3B8] hover:text-white transition-colors"
              disabled={!currentSong}
            >
              <SkipForward size={18} fill="currentColor" />
            </button>

            <button 
              onClick={() => setIsRepeat(!isRepeat)}
              className={`p-1 transition-colors ${isRepeat ? 'text-[#D946EF]' : 'text-[#64748B] hover:text-white'}`}
              title="Repeat"
            >
              <Repeat size={14} />
            </button>
          </div>
          
          <div className="flex items-center w-full gap-2 text-[10px] text-[#64748B] font-mono select-none">
            <span className="w-8 text-right shrink-0">{formatTime(currentTime)}</span>
            
            {/* Custom Interactive Seekbar */}
            <div 
              onClick={onProgressClick}
              className="flex-1 h-1.5 bg-[#141B44] border border-indigo-500/5 rounded-full overflow-hidden cursor-pointer relative group"
            >
              <div 
                className="h-full bg-gradient-to-r from-[#6366F1] to-[#D946EF] transition-all rounded-full relative" 
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"></div>
              </div>
            </div>
            
            <span className="w-8 text-left shrink-0">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume Controls & Extra panels */}
        <div className="w-[30%] min-w-[150px] flex justify-end items-center gap-3">
          <button 
            onClick={() => setShowQueue(!showQueue)}
            className={`p-1.5 rounded-full transition-colors ${showQueue ? 'text-[#D946EF] bg-[#1A2054]' : 'text-[#64748B] hover:text-white hover:bg-[#141B44]'}`}
            title="Play Queue"
          >
            <ListMusic size={15} />
          </button>

          <button 
            onClick={onToggleLyrics}
            className={`p-1.5 rounded-full transition-colors ${showLyrics ? 'text-[#D946EF] bg-[#1A2054]' : 'text-[#64748B] hover:text-white hover:bg-[#141B44]'}`}
            title="Lyrics"
            disabled={!currentSong}
          >
            <Mic size={15} />
          </button>
          
          <div className="flex items-center gap-1.5 w-24 shrink-0">
            <Volume2 size={15} className="text-[#64748B]" />
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={volume}
              onChange={onVolumeChange}
              className="w-full accent-[#D946EF] h-1 bg-[#141B44] rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

      </div>
    </>
  );
};

// G. SHARE MODAL
const ShareModal = ({ playlist, onClose, onToast }: any) => {
  // Use shareLink UUID if available (backend-generated), otherwise fall back to _id
  const shareId = playlist.shareLink || playlist._id;
  const shareUrl = `${window.location.origin}/?shareLink=${shareId}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    onToast('Share link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Listen to "${playlist.name}" on Melodia`,
          text: `Check out this playlist: ${playlist.name}`,
          url: shareUrl,
        });
        onToast('Shared successfully!');
      } catch (e) {
        // user cancelled, no-op
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm glass-panel p-6 rounded-3xl border border-indigo-500/20 bg-[#0C1030] shadow-[0_0_50px_rgba(99,102,241,0.25)] relative">
        {/* Glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366F1]/20 to-[#D946EF]/20 rounded-3xl blur opacity-50 pointer-events-none"></div>
        
        <div className="relative">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Share2 size={18} className="text-[#D946EF]" /> Share Playlist
            </h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-[#1E2555] text-[#94A3B8] hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Playlist Info */}
          <div className="flex items-center gap-3 p-3 bg-[#0D1235] rounded-2xl border border-indigo-500/10 mb-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#D946EF] flex items-center justify-center shrink-0">
              <Music size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{playlist.name}</p>
              <p className="text-xs text-[#94A3B8]">{(playlist.songs || []).length} tracks</p>
            </div>
          </div>

          {/* Share URL Box */}
          <div className="mb-4">
            <p className="text-2xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Share Link</p>
            <div className="flex items-center gap-2 bg-[#0D1235] border border-indigo-500/15 rounded-2xl px-3 py-2">
              <Link size={12} className="text-indigo-400 shrink-0" />
              <span className="text-xs text-[#94A3B8] truncate flex-1 font-mono">{shareUrl}</span>
              <button
                onClick={handleCopy}
                className={`shrink-0 px-2.5 py-1 rounded-full text-2xs font-bold transition-all ${
                  copied
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/30'
                }`}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#13173A] border border-indigo-500/15 text-xs font-bold text-white hover:bg-[#1A1F52] hover:border-indigo-500/30 transition-all"
            >
              <Link size={13} /> Copy Link
            </button>
            <button
              onClick={handleWebShare}
              className="flex items-center justify-center gap-2 py-2.5 rounded-full bg-gradient-to-r from-[#6366F1] to-[#D946EF] text-xs font-bold text-white hover:scale-102 transition-all shadow-md"
            >
              <Share2 size={13} /> Share via…
            </button>
          </div>

          <p className="text-center text-2xs text-[#64748B] mt-4">
            Anyone with this link can view this playlist
          </p>
        </div>
      </div>
    </div>
  );
};

// H. LYRICS PANEL
const LyricsPanel = ({ song, lyrics, loading, error, currentTime, duration, onClose }: any) => {
  const activeLine = lyrics.length > 0 && duration > 0
    ? Math.min(
        Math.floor((currentTime / duration) * lyrics.length),
        lyrics.length - 1
      )
    : -1;
  
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLine]);

  return (
    <div className="fixed bottom-[92px] right-4 w-80 max-h-96 glass-panel rounded-3xl border border-[#D946EF]/20 bg-[#0A0820]/96 shadow-[0_0_30px_rgba(217,70,239,0.2)] z-40 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-[#D946EF]/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#D946EF] animate-pulse"></div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Mic size={13} className="text-[#D946EF]" /> Lyrics
          </h4>
        </div>
        <button onClick={onClose} className="p-0.5 rounded-full hover:bg-[#1D2254] text-[#64748B] hover:text-white">
          <X size={14} />
        </button>
      </div>

      {/* Song Info */}
      {song && (
        <div className="px-4 py-2 border-b border-indigo-500/5 shrink-0">
          <p className="text-2xs font-bold text-[#D946EF] truncate">{song.title}</p>
          <p className="text-[9px] text-[#64748B] truncate">{song.artist}</p>
        </div>
      )}

      {/* Lyrics Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-6 h-6 border-2 border-[#D946EF]/30 border-t-[#D946EF] rounded-full animate-spin"></div>
            <p className="text-2xs text-[#64748B]">Fetching lyrics...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <Mic size={28} className="text-[#D946EF]/30" />
            <p className="text-xs text-[#64748B]">{error}</p>
            <p className="text-2xs text-[#4A5075]">Try a different track</p>
          </div>
        )}

        {!loading && !error && lyrics.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Mic size={28} className="text-[#D946EF]/30" />
            <p className="text-xs text-[#64748B]">No lyrics loaded</p>
          </div>
        )}

        {!loading && !error && lyrics.map((line: string, i: number) => {
          const isActive = i === activeLine;
          const isPast = i < activeLine;
          return (
            <div
              key={i}
              ref={isActive ? activeRef : null}
              className={`transition-all duration-300 text-center px-2 py-0.5 rounded-xl ${
                isActive
                  ? 'text-white font-bold text-sm scale-105 bg-[#D946EF]/10 border border-[#D946EF]/20'
                  : isPast
                  ? 'text-[#4A5075] text-xs'
                  : 'text-[#64748B] text-xs'
              }`}
            >
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );
};


