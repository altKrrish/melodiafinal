import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export interface Song {
  _id: string;
  title: string;
  artist: string;
  album?: string;
  coverImage: string;
  audioUrl: string;
  duration?: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
import { 
  Home, Compass, Library, PlusSquare, Heart, 
  Search, Bell, Settings, LogOut, Play, 
  SkipBack, SkipForward, Shuffle, Repeat, 
  Volume2, Maximize2, MoreHorizontal, Clock,
  MoreVertical, Share2, Plus, SlidersHorizontal, 
  User, History, BarChart3, TrendingUp, Activity, Users
} from 'lucide-react';

type ViewType = 'home' | 'search' | 'profile';

const Sidebar = ({ currentView, setView }: { currentView: ViewType, setView: (v: ViewType) => void }) => (
  <nav className="w-64 flex-shrink-0 h-full flex flex-col bg-[#0A0E27] border-r border-[rgba(255,255,255,0.05)] pt-6 pb-24 z-10 hidden md:flex">
    <div className="px-6 mb-8 flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:scale-105 transition-transform">
        <Play size={16} className="text-white ml-0.5" fill="currentColor" />
      </div>
      <span className="font-display font-bold text-xl tracking-tight">Melodia</span>
    </div>

    <div className="px-3 mb-6">
      <div 
        className={`relative group cursor-pointer ${currentView === 'search' ? 'text-accent-primary' : ''}`}
        onClick={() => setView('search')}
      >
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${currentView === 'search' ? 'text-accent-primary' : 'text-text-tertiary group-focus-within:text-accent-primary'}`} />
        <input 
          type="text" 
          placeholder="Search..." 
          className="w-full bg-bg-light/50 border border-[rgba(255,255,255,0.05)] rounded-md py-2 pl-9 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/50 transition-all cursor-pointer pointer-events-none"
          readOnly
        />
      </div>
    </div>

    <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 space-y-6">
      <div className="space-y-1">
        <p className="px-3 text-xs font-semibold text-text-tertiary mb-2 uppercase tracking-wider">Menu</p>
        <button 
          onClick={() => setView('home')} 
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors border-l-2 ${currentView === 'home' ? 'text-text-primary bg-bg-light/40 border-accent-primary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-light/20 border-transparent'}`}
        >
          <Home size={18} />
          <span className="text-sm font-medium">Home</span>
        </button>
        <button 
          onClick={() => setView('search')} 
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors border-l-2 ${currentView === 'search' ? 'text-text-primary bg-bg-light/40 border-accent-primary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-light/20 border-transparent'}`}
        >
          <Compass size={18} />
          <span className="text-sm font-medium">Explore</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-light/20 rounded-md transition-colors border-l-2 border-transparent">
          <Library size={18} />
          <span className="text-sm font-medium">Your Library</span>
        </button>
      </div>

      <div className="space-y-1">
        <p className="px-3 text-xs font-semibold text-text-tertiary mb-2 uppercase tracking-wider">Playlists</p>
        <button className="w-full flex items-center gap-3 px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-light/20 rounded-md transition-colors">
          <PlusSquare size={18} className="text-text-secondary" />
          <span className="text-sm font-medium">Create Playlist</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-light/20 rounded-md transition-colors">
          <Heart size={18} className="text-accent-tertiary" />
          <span className="text-sm font-medium">Liked Songs</span>
        </button>
      </div>

      <div className="mt-4 px-3">
        <div className="h-px w-full bg-[rgba(255,255,255,0.05)] mb-4"></div>
        <div className="space-y-3">
          {['Cyberpunk Vibes', 'Deep Focus 2026', 'Synthwave Classics', 'Morning Coffee'].map((playlist, i) => (
            <a key={i} href="#" className="block text-sm text-text-secondary hover:text-text-primary truncate transition-colors">
              {playlist}
            </a>
          ))}
        </div>
      </div>
    </div>
    
    <div className="mt-auto px-6 pt-4 border-t border-[rgba(255,255,255,0.05)]">
      <div 
        className="flex items-center gap-3 mb-4 cursor-pointer group"
        onClick={() => setView('profile')}
      >
        <div className="relative">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" alt="Profile" className={`w-10 h-10 rounded-full border object-cover transition-colors ${currentView === 'profile' ? 'border-accent-primary' : 'border-[rgba(255,255,255,0.1)] group-hover:border-[rgba(255,255,255,0.3)]'}`} />
          {currentView === 'profile' && <div className="absolute inset-0 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] pointer-events-none"></div>}
        </div>
        <div className="flex-1 overflow-hidden">
          <p className={`text-sm font-semibold truncate transition-colors ${currentView === 'profile' ? 'text-white' : 'text-text-primary group-hover:text-white'}`}>Alex Chen</p>
          <p className="text-xs text-text-tertiary truncate">Premium</p>
        </div>
        <Settings size={16} className="text-text-tertiary hover:text-text-primary transition-colors" />
      </div>
    </div>
  </nav>
);

const Player = ({ currentSong, isPlaying, onTogglePlay }: { currentSong: Song | null, isPlaying: boolean, onTogglePlay: () => void }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.play();
      else audioRef.current.pause();
    }
  }, [isPlaying, currentSong]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress((audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[90px] glass-panel z-50 border-t border-[rgba(255,255,255,0.08)] flex items-center px-4 md:px-6 justify-between transition-all duration-300">
      {currentSong && <audio ref={audioRef} src={currentSong.audioUrl} onTimeUpdate={handleTimeUpdate} onEnded={() => onTogglePlay()} />}
      
      <div className="flex items-center gap-4 w-[30%] min-w-[200px]">
        <div className="relative group w-14 h-14 rounded-md overflow-hidden shadow-level-2 shrink-0 bg-bg-light/20">
          {currentSong?.coverImage && <img src={currentSong.coverImage} alt="Album Cover" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
            <Maximize2 size={16} className="text-white" />
          </div>
        </div>
        <div className="flex flex-col truncate">
          <h4 className="text-sm font-semibold text-text-primary truncate hover:underline cursor-pointer">{currentSong?.title || 'Select a song'}</h4>
          <p className="text-xs text-text-tertiary truncate hover:underline cursor-pointer">{currentSong?.artist || 'Artist'}</p>
        </div>
      <Heart size={18} className="text-text-tertiary hover:text-text-primary ml-2 cursor-pointer shrink-0" />
    </div>

    <div className="flex flex-col items-center flex-1 max-w-2xl px-4">
      <div className="flex items-center gap-6 mb-2">
        <Shuffle size={16} className="text-text-tertiary hover:text-text-primary cursor-pointer transition-colors" />
        <SkipBack size={20} className="text-text-secondary hover:text-text-primary cursor-pointer transition-colors" />
        <button onClick={onTogglePlay} className="w-10 h-10 rounded-full bg-text-primary text-bg-deep flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-level-1">
          {isPlaying ? <div className="w-3 h-3 bg-bg-deep rounded-sm"></div> : <Play size={20} className="ml-1" fill="currentColor" />}
        </button>
        <SkipForward size={20} className="text-text-secondary hover:text-text-primary cursor-pointer transition-colors" />
        <Repeat size={16} className="text-text-tertiary hover:text-text-primary cursor-pointer transition-colors" />
      </div>
      <div className="flex items-center w-full gap-3 text-xs text-text-tertiary font-mono">
        <span>0:00</span>
        <div className="flex-1 h-1.5 bg-bg-light rounded-full overflow-hidden cursor-pointer group">
          <div className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary relative group-hover:bg-accent-primary transition-colors" style={{ width: `${progress}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"></div>
          </div>
        </div>
        <span>3:00</span>
      </div>
    </div>

    <div className="w-[30%] min-w-[150px] flex justify-end items-center gap-4">
      <ListMusicIcon className="text-text-tertiary hover:text-text-primary cursor-pointer w-4 h-4" />
      <MonitorSpeakerIcon className="text-text-tertiary hover:text-text-primary cursor-pointer w-4 h-4" />
      <div className="flex items-center gap-2 w-24">
        <Volume2 size={16} className="text-text-tertiary" />
        <div className="flex-1 h-1 bg-bg-light rounded-full cursor-pointer group">
          <div className="h-full bg-text-secondary w-2/3 group-hover:bg-accent-primary rounded-full transition-colors relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ListMusicIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15V6"/><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/></svg>
);

const MonitorSpeakerIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5.5 20H8"/><path d="M17 9h.01"/><rect width="10" height="16" x="12" y="4" rx="2"/><path d="M8 6H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4"/><circle cx="17" cy="15" r="1"/></svg>
);

const TopHeader = ({ setView }: { setView: (v: ViewType) => void }) => (
  <header className="sticky top-0 z-20 px-8 py-4 flex items-center justify-between glass-panel border-b-0 shadow-sm transition-all">
    <div className="flex gap-2">
      <button className="w-8 h-8 rounded-full bg-bg-light/80 flex items-center justify-center text-text-secondary hover:text-white transition-colors">
        <SkipBack size={16} />
      </button>
      <button className="w-8 h-8 rounded-full bg-bg-light/80 flex items-center justify-center text-text-secondary hover:text-white transition-colors">
        <SkipForward size={16} />
      </button>
    </div>
    <div className="flex items-center gap-4">
      <button className="hidden md:flex px-4 py-1.5 rounded-full border border-text-secondary/30 text-sm font-semibold hover:border-text-primary transition-colors">
        Explore Premium
      </button>
      <button className="w-8 h-8 rounded-full bg-bg-light/80 flex items-center justify-center text-text-primary hover:scale-105 transition-transform relative">
        <Bell size={16} />
        <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-accent-tertiary rounded-full"></span>
      </button>
      {/* Mobile profile trigger */}
      <button 
        className="w-8 h-8 rounded-full overflow-hidden border border-text-secondary/30 md:hidden block"
        onClick={() => setView('profile')}
      >
        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" alt="Profile" className="w-full h-full object-cover" />
      </button>
    </div>
  </header>
);

const HomeView = ({ onPlaySong }: { onPlaySong: (song: Song) => void }) => {
  const [trending, setTrending] = useState<Song[]>([]);

  useEffect(() => {
    axios.get(`${API_URL}/songs/trending`)
      .then(res => setTrending(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
  <>
    <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-accent-primary/20 via-bg-deep/80 to-bg-deep pointer-events-none z-0"></div>
    <div className="px-8 pt-8 relative z-10 space-y-12 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section>
        <h1 className="font-display font-bold text-4xl mb-6 text-text-primary tracking-tight">
          Good Evening
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Synthwave 2026', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop' },
            { title: 'Liked Songs', img: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?w=200&h=200&fit=crop', isGradient: true },
            { title: 'Deep Focus', img: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&h=200&fit=crop' },
            { title: 'Daily Mix 1', img: 'https://images.unsplash.com/photo-1621252179022-721db5928d32?w=200&h=200&fit=crop' },
            { title: 'Discover Weekly', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop' },
            { title: 'Midnight City', img: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=200&h=200&fit=crop' }
          ].map((item, i) => (
            <div key={i} className="flex items-center bg-bg-light/40 hover:bg-bg-light/80 rounded-md overflow-hidden cursor-pointer transition-colors group shadow-sm">
              <div className="w-16 h-16 flex-shrink-0 relative">
                {item.isGradient ? (
                  <div className="w-full h-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                    <Heart size={24} className="text-white" />
                  </div>
                ) : (
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover shadow-inner" />
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="flex-1 px-4 font-semibold text-sm truncate">{item.title}</div>
              <div className="px-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                <button className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center text-white shadow-level-2 hover:scale-105 transition-transform">
                  <Play size={18} className="ml-1" fill="currentColor" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Made For You Section */}
      <section>
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-2xl tracking-tight text-text-primary hover:underline cursor-pointer">Made For Alex</h2>
            <p className="text-sm text-text-tertiary mt-1">AI-curated based on your recent vibes.</p>
          </div>
          <a href="#" className="text-xs font-bold text-text-tertiary hover:text-text-primary uppercase tracking-wider transition-colors">Show all</a>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {[
            { title: 'Neon Pulse', desc: 'High energy synthetic beats.', img: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&h=400&fit=crop' },
            { title: 'Ethereal Space', desc: 'Drift through ambient soundscapes.', img: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=400&fit=crop' },
            { title: 'Cybernetic Flow', desc: 'Rhythmic patterns for coding.', img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=400&fit=crop' },
            { title: 'Midnight Drive', desc: 'Late night cruising anthems.', img: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?w=400&h=400&fit=crop' },
            { title: 'Acoustic Chill', desc: 'Unplugged and relaxed.', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop' },
            { title: 'Lo-Fi Study', desc: 'Beats to relax/study to.', img: 'https://images.unsplash.com/photo-1516280440502-140683a30eb6?w=400&h=400&fit=crop' },
          ].map((item, i) => (
            <div key={i} className="bg-[#131B3A]/60 hover:bg-[#1A2847] p-4 rounded-xl transition-colors duration-300 group cursor-pointer border border-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.08)] shadow-sm hover:shadow-level-2">
              <div className="relative w-full aspect-square mb-4 rounded-md overflow-hidden shadow-level-1">
                <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute bottom-2 right-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <button className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center text-white shadow-level-2 hover:scale-105 hover:bg-accent-secondary transition-all">
                    <Play size={18} className="ml-1" fill="currentColor" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-sm mb-1 truncate text-text-primary">{item.title}</h3>
              <p className="text-xs text-text-tertiary line-clamp-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Smart Playlist Generator Teaser */}
      <section className="relative rounded-2xl overflow-hidden glass-panel border-[rgba(255,255,255,0.1)] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-br from-accent-primary/10 to-transparent">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/20 text-accent-primary text-xs font-bold mb-4 border border-accent-primary/30">
            <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse"></span>
            AI COMPOSER
          </div>
          <h2 className="font-display font-bold text-3xl mb-3 text-white">Generate Your Next Vibe</h2>
          <p className="text-text-secondary mb-6 text-sm leading-relaxed">Select your mood, pick a few genres, and let our AI curate the perfect seamless playlist for your exact moment.</p>
          <button className="btn-primary px-6 py-3 rounded-full font-semibold text-sm inline-flex items-center gap-2 shadow-level-2">
            <Plus size={18} />
            Create Smart Playlist
          </button>
        </div>
        <div className="relative z-10 w-full md:w-auto flex justify-center">
          <div className="relative w-64 h-64">
            <div className="absolute inset-0 bg-accent-secondary/20 rounded-full blur-[50px] animate-pulse"></div>
            <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop" alt="Abstract AI" className="w-48 h-48 rounded-full object-cover relative z-10 mx-auto shadow-level-3 border-4 border-bg-deep animate-[spin_20s_linear_infinite]" />
            <div className="absolute top-4 -left-4 glass-dark px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 shadow-level-2 z-20">
              <div className="w-1.5 h-1.5 bg-color-success rounded-full"></div> + Ethereal
            </div>
            <div className="absolute bottom-8 -right-4 glass-dark px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 shadow-level-2 z-20">
              <div className="w-1.5 h-1.5 bg-accent-tertiary rounded-full"></div> 120 BPM
            </div>
          </div>
        </div>
      </section>

      {/* Trending Tracks (List View) */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-display font-bold text-2xl tracking-tight text-text-primary hover:underline cursor-pointer">Trending Now</h2>
        </div>
        <div className="flex flex-col w-full">
          {/* Header */}
          <div className="flex items-center px-4 py-2 text-xs font-medium text-text-tertiary border-b border-[rgba(255,255,255,0.05)] uppercase tracking-wider mb-2">
            <div className="w-8 text-center">#</div>
            <div className="flex-1">Title</div>
            <div className="w-1/4 hidden md:block">Album</div>
            <div className="w-1/6 hidden lg:block">Date Added</div>
            <div className="w-16 flex justify-end mr-4"><Clock size={16} /></div>
          </div>
          
          {/* List Items */}
          {trending.map((song, i) => (
            <div key={song._id} onClick={() => onPlaySong(song)} className="flex items-center px-4 py-2 hover:bg-bg-light/40 rounded-md group transition-colors cursor-pointer">
              <div className="w-8 text-center text-text-tertiary group-hover:hidden">{i + 1}</div>
              <div className="w-8 text-center text-text-primary hidden group-hover:flex items-center justify-center">
                <Play size={16} fill="currentColor" />
              </div>
              
              <div className="flex-1 flex items-center gap-3">
                <img src={song.coverImage} alt={song.title} className="w-10 h-10 rounded shadow-sm object-cover bg-bg-light" />
                <div className="flex flex-col truncate pr-4">
                  <span className="text-sm font-semibold text-text-primary truncate">{song.title}</span>
                  <span className="text-xs text-text-secondary hover:text-text-primary hover:underline truncate transition-colors">{song.artist}</span>
                </div>
              </div>
              
              <div className="w-1/4 hidden md:flex text-sm text-text-secondary hover:text-text-primary hover:underline truncate transition-colors pr-4">
                {song.album || 'Single'}
              </div>
              
              <div className="w-1/6 hidden lg:flex text-sm text-text-secondary truncate">
                Today
              </div>
              
              <div className="w-16 flex justify-end items-center gap-4 text-sm text-text-secondary font-mono">
                <Heart size={16} className="opacity-0 group-hover:opacity-100 hover:text-text-primary transition-all text-text-tertiary" />
                <span>3:00</span>
                <MoreHorizontal size={16} className="opacity-0 group-hover:opacity-100 hover:text-text-primary transition-all text-text-tertiary" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  </>
  );
};

const SearchView = ({ onPlaySong }: { onPlaySong: (song: Song) => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      setIsSearching(true);
      axios.get(`${API_URL}/songs/search?q=${query}`)
        .then(res => setResults(res.data))
        .catch(err => console.error(err))
        .finally(() => setIsSearching(false));
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [query]);

  return (
  <>
    <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#131B3A] to-bg-deep pointer-events-none z-0"></div>
    <div className="px-8 pt-8 relative z-10 space-y-10 max-w-7xl mx-auto flex flex-col h-full">
      {/* Search Hero */}
      <div className="w-full max-w-3xl mx-auto text-center mt-4">
        <h1 className="font-display font-bold text-4xl mb-6 text-text-primary tracking-tight">Sonic Search</h1>
        <div className="relative group w-full">
          <div className="absolute -inset-1 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center bg-bg-light/80 glass-panel rounded-xl overflow-hidden shadow-level-2">
            <Search className="text-text-primary ml-6 w-6 h-6" />
            <input 
              type="text" 
              placeholder="Search songs, artists, playlists..." 
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent py-5 pl-4 pr-6 text-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-0"
            />
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <button className="px-4 py-2 rounded-full bg-white text-bg-deep text-sm font-semibold hover:scale-105 transition-transform">All Results</button>
          <button className="px-4 py-2 rounded-full bg-bg-light/60 border border-[rgba(255,255,255,0.05)] text-text-primary text-sm font-medium hover:bg-bg-light transition-colors">Artists</button>
          <button className="px-4 py-2 rounded-full bg-bg-light/60 border border-[rgba(255,255,255,0.05)] text-text-primary text-sm font-medium hover:bg-bg-light transition-colors">Songs</button>
          <button className="px-4 py-2 rounded-full bg-bg-light/60 border border-[rgba(255,255,255,0.05)] text-text-primary text-sm font-medium hover:bg-bg-light transition-colors">Playlists</button>
          <button className="px-4 py-2 rounded-full bg-bg-light/60 border border-[rgba(255,255,255,0.05)] text-text-primary text-sm font-medium hover:bg-bg-light transition-colors flex items-center gap-2">
            <SlidersHorizontal size={14} /> Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full pb-10 flex-1">
        {/* Recent Searches Sidebar */}
        <div className="hidden md:block col-span-1 border-r border-[rgba(255,255,255,0.05)] pr-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-6">
            <History size={16} /> Recent
          </div>
          <div className="space-y-4">
            {['Kavinsky', 'Daft Punk Radio', 'Cyberpunk OST', 'Weekend Playlist'].map((term, i) => (
              <div key={i} className="flex items-center justify-between group cursor-pointer">
                <span className="text-sm text-text-secondary group-hover:text-white transition-colors">{term}</span>
                <Search size={14} className="text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>

        {/* Categories / Results */}
        <div className="col-span-1 md:col-span-3">
          <h2 className="font-display font-bold text-2xl tracking-tight text-text-primary mb-6">{query ? 'Search Results' : 'Browse Categories'}</h2>
          
          {query ? (
             <div className="flex flex-col w-full">
               {isSearching && <p className="text-text-secondary">Searching...</p>}
               {!isSearching && results.length === 0 && <p className="text-text-secondary">No results found for "{query}"</p>}
               {!isSearching && results.map((song, i) => (
                  <div key={song._id} onClick={() => onPlaySong(song)} className="flex items-center px-4 py-2 hover:bg-bg-light/40 rounded-md group transition-colors cursor-pointer">
                    <div className="w-8 text-center text-text-tertiary group-hover:hidden">{i + 1}</div>
                    <div className="w-8 text-center text-text-primary hidden group-hover:flex items-center justify-center">
                      <Play size={16} fill="currentColor" />
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                      <img src={song.coverImage} alt={song.title} className="w-10 h-10 rounded shadow-sm object-cover bg-bg-light" />
                      <div className="flex flex-col truncate pr-4">
                        <span className="text-sm font-semibold text-text-primary truncate">{song.title}</span>
                        <span className="text-xs text-text-secondary hover:text-text-primary hover:underline truncate transition-colors">{song.artist}</span>
                      </div>
                    </div>
                  </div>
               ))}
             </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { name: 'Pop', color: 'bg-pink-600' },
                { name: 'Electronic', color: 'bg-indigo-600' },
                { name: 'Hip-Hop', color: 'bg-orange-600' },
                { name: 'Rock', color: 'bg-red-600' },
                { name: 'Jazz', color: 'bg-teal-600' },
                { name: 'Classical', color: 'bg-emerald-600' },
                { name: 'R&B', color: 'bg-cyan-600' },
                { name: 'Focus', color: 'bg-purple-600' },
              ].map((cat, i) => (
                <div key={i} className={`${cat.color} rounded-xl p-4 h-32 relative overflow-hidden group cursor-pointer shadow-sm hover:shadow-level-2 transition-shadow`}>
                  <h3 className="font-display font-bold text-xl text-white relative z-10">{cat.name}</h3>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-110 transition-transform"></div>
                  {/* Decorative element mimicking rotated album cover */}
                  <div className="absolute right-0 bottom-0 w-16 h-16 bg-black/20 rotate-[25deg] translate-x-2 translate-y-2 rounded shadow-md group-hover:rotate-[20deg] group-hover:scale-105 transition-transform"></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </>
  );
};

const ProfileView = () => (
  <>
    <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-accent-primary/30 via-bg-deep/80 to-bg-deep pointer-events-none z-0"></div>
    <div className="px-8 pt-12 relative z-10 space-y-12 max-w-7xl mx-auto flex flex-col h-full w-full">
      
      {/* Profile Hero */}
      <div className="flex flex-col md:flex-row items-end gap-8 border-b border-[rgba(255,255,255,0.05)] pb-10">
        <div className="relative group cursor-pointer">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop" alt="Alex Chen" className="w-40 h-40 rounded-full border-4 border-bg-deep object-cover shadow-level-3 relative z-10" />
          <div className="absolute inset-0 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.6)] animate-pulse pointer-events-none z-0"></div>
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20">
            <span className="text-white text-xs font-bold tracking-wider">EDIT</span>
          </div>
        </div>
        
        <div className="flex-1 w-full text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
            <h1 className="font-display font-bold text-5xl tracking-tight text-white">Alex Chen</h1>
            <span className="inline-flex items-center justify-center bg-accent-primary/20 text-accent-primary text-xs font-bold px-2 py-1.5 rounded w-20 mx-auto md:mx-0">
              PREMIUM
            </span>
          </div>
          <p className="text-text-secondary text-lg mb-6">Vibing to Synthwave & Deep Focus • 34 Public Playlists</p>
          
          <div className="flex justify-center md:justify-start gap-8 text-sm font-semibold">
            <div className="flex flex-col md:flex-row gap-1 md:gap-2 items-center cursor-pointer hover:text-white transition-colors">
              <span className="text-white text-xl md:text-sm">1.2K</span> 
              <span className="text-text-tertiary">Followers</span>
            </div>
            <div className="flex flex-col md:flex-row gap-1 md:gap-2 items-center cursor-pointer hover:text-white transition-colors">
              <span className="text-white text-xl md:text-sm">438</span> 
              <span className="text-text-tertiary">Following</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-end">
          <button className="btn-primary px-6 py-2 rounded-full font-semibold text-sm shadow-level-2 w-full md:w-auto">
            Share Profile
          </button>
          <button className="w-10 h-10 rounded-full bg-bg-light/60 border border-[rgba(255,255,255,0.05)] flex items-center justify-center text-text-primary hover:bg-bg-light transition-colors">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Your Sonic Identity (Stats Dashboard) */}
      <section>
        <h2 className="font-display font-bold text-2xl tracking-tight text-white mb-6 flex items-center gap-2">
          <Activity className="text-accent-primary" /> Your Sonic Identity
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Total Hours */}
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:shadow-level-2 transition-all cursor-pointer">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-accent-primary/10 rounded-full blur-[30px] group-hover:bg-accent-primary/20 transition-colors"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-bg-light/80 rounded-lg">
                <Clock size={20} className="text-accent-primary" />
              </div>
              <div className="flex items-center gap-1 text-color-success text-sm font-bold bg-color-success/10 px-2 py-1 rounded">
                <TrendingUp size={14} /> 12%
              </div>
            </div>
            <p className="text-text-tertiary text-sm font-medium mb-1">Total Listening Time</p>
            <div className="flex items-baseline gap-2">
              <h3 className="font-display font-bold text-4xl text-white">482</h3>
              <span className="text-text-secondary font-semibold">hours</span>
            </div>
            <p className="text-xs text-text-tertiary mt-4">Top 5% of listeners this month</p>
          </div>

          {/* Card 2: Top Genres */}
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:shadow-level-2 transition-all cursor-pointer">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-accent-secondary/10 rounded-full blur-[30px] group-hover:bg-accent-secondary/20 transition-colors"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-2 bg-bg-light/80 rounded-lg">
                <BarChart3 size={20} className="text-accent-secondary" />
              </div>
            </div>
            <p className="text-text-tertiary text-sm font-medium mb-4">Genre Distribution</p>
            <div className="space-y-3">
              {[
                { name: 'Electronic', pct: '45%', color: 'bg-accent-secondary' },
                { name: 'Synthwave', pct: '30%', color: 'bg-accent-primary' },
                { name: 'Lo-Fi', pct: '15%', color: 'bg-accent-tertiary' },
              ].map((g, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-20">{g.name}</span>
                  <div className="flex-1 h-2 bg-bg-deep rounded-full overflow-hidden">
                    <div className={`h-full ${g.color} rounded-full`} style={{ width: g.pct }}></div>
                  </div>
                  <span className="text-xs text-text-tertiary w-8 text-right">{g.pct}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Top Artists */}
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:shadow-level-2 transition-all cursor-pointer">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-accent-tertiary/10 rounded-full blur-[30px] group-hover:bg-accent-tertiary/20 transition-colors"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-bg-light/80 rounded-lg">
                <Users size={20} className="text-accent-tertiary" />
              </div>
            </div>
            <p className="text-text-tertiary text-sm font-medium mb-4">Most Played Artists</p>
            <div className="flex items-center gap-[-10px] relative">
              {[
                'https://images.unsplash.com/photo-1520423465871-0866049020b7?w=100&h=100&fit=crop',
                'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?w=100&h=100&fit=crop',
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop',
                'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&h=100&fit=crop'
              ].map((img, i) => (
                <div key={i} className="w-12 h-12 rounded-full border-2 border-bg-deep overflow-hidden relative" style={{ left: `-${i * 12}px`, zIndex: 10 - i }}>
                  <img src={img} alt="Artist" className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="w-12 h-12 rounded-full border-2 border-bg-deep bg-bg-light flex items-center justify-center text-xs font-bold relative" style={{ left: `-48px`, zIndex: 0 }}>
                +12
              </div>
            </div>
            <p className="text-xs text-text-tertiary mt-4">Based on last 30 days of listening.</p>
          </div>
        </div>
      </section>

      {/* Public Playlists */}
      <section>
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display font-bold text-2xl tracking-tight text-white cursor-pointer hover:underline">Public Playlists</h2>
          <a href="#" className="text-xs font-bold text-text-tertiary hover:text-white uppercase tracking-wider transition-colors">View All</a>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { title: 'Coding Flow State', count: '142 songs', img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=400&fit=crop' },
            { title: 'Late Night Drive', count: '84 songs', img: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?w=400&h=400&fit=crop' },
            { title: 'Chill Lo-Fi', count: '215 songs', img: 'https://images.unsplash.com/photo-1516280440502-140683a30eb6?w=400&h=400&fit=crop' },
            { title: 'Weekend Vibes', count: '45 songs', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop' },
          ].map((item, i) => (
            <div key={i} className="bg-bg-light/40 hover:bg-[#1A2847] p-4 rounded-xl transition-colors duration-300 group cursor-pointer border border-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.08)] shadow-sm">
              <div className="relative w-full aspect-square mb-4 rounded-md overflow-hidden shadow-level-1">
                <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute bottom-2 right-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <button className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center text-white shadow-level-2 hover:scale-105 hover:bg-accent-secondary transition-all">
                    <Play size={18} className="ml-1" fill="currentColor" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-sm mb-1 truncate text-white">{item.title}</h3>
              <p className="text-xs text-text-tertiary">{item.count}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  </>
);

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlaySong = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const handleTogglePlay = () => {
    if (currentSong) {
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex h-screen w-full bg-bg-deep overflow-hidden font-body selection:bg-accent-primary/30 selection:text-white text-text-primary">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      <main className="flex-1 h-full overflow-y-auto pb-[90px] bg-bg-deep text-text-primary relative flex flex-col">
        {currentView !== 'profile' && <TopHeader setView={setCurrentView} />}
        {currentView === 'profile' && (
           <header className="sticky top-0 z-20 px-8 py-4 flex items-center justify-between glass-panel border-b-0 shadow-sm transition-all bg-bg-deep/50 backdrop-blur-md">
             <div className="flex gap-2">
               <button className="w-8 h-8 rounded-full bg-bg-light/80 flex items-center justify-center text-text-secondary hover:text-white transition-colors" onClick={() => setCurrentView('home')}>
                 <SkipBack size={16} />
               </button>
             </div>
             <div className="flex items-center gap-4">
               <button className="w-8 h-8 rounded-full bg-bg-light/80 flex items-center justify-center text-text-primary hover:scale-105 transition-transform relative">
                 <Bell size={16} />
               </button>
             </div>
           </header>
        )}
        
        {currentView === 'home' && <HomeView onPlaySong={handlePlaySong} />}
        {currentView === 'search' && <SearchView onPlaySong={handlePlaySong} />}
        {currentView === 'profile' && <ProfileView />}
      </main>
      <Player currentSong={currentSong} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} />
    </div>
  );
}
