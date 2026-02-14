import React, { useState } from 'react';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (username: string, password: string, role: UserRole) => void;
  theme: 'light' | 'dark';
  lang: 'en' | 'id';
  setLang: (l: 'en' | 'id') => void;
  setTheme: (t: 'light' | 'dark') => void;
  t: (key: string) => string;
  error?: string | null;
  setError: (e: string | null) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, theme, lang, setLang, setTheme, t, error, setError }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole) {
      onLogin(username, password, selectedRole);
    }
  };

  const handleBack = () => {
    setSelectedRole(null);
    setError(null);
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'indigo';
      case UserRole.LEADER: return 'teal';
      case UserRole.STAFF: return 'slate';
      default: return 'indigo';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return t('adminCategory');
      case UserRole.LEADER: return t('leaderCategory');
      case UserRole.STAFF: return t('staffCategory');
      default: return '';
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-700 ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full blur-[160px] opacity-20 transition-all duration-1000 ${
          selectedRole === UserRole.ADMIN ? 'bg-indigo-500' : 
          selectedRole === UserRole.LEADER ? 'bg-teal-500' : 
          'bg-slate-500'
        }`}></div>
      </div>

      <div className={`w-full max-w-xl relative z-10 transition-all duration-500 ${theme === 'dark' ? 'bg-slate-900/40' : 'bg-white/80'} backdrop-blur-3xl rounded-[3rem] shadow-2xl border ${theme === 'dark' ? 'border-white/5' : 'border-black/5'} overflow-hidden`}>
        <div className="p-8 sm:p-14">
          <header className="text-center mb-12">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl shadow-2xl transition-all duration-500 mb-8 transform hover:scale-110 ${
              selectedRole ? `bg-${getRoleColor(selectedRole)}-600` : 'bg-indigo-600'
            }`}>
              <i className={`fas ${selectedRole === UserRole.ADMIN ? 'fa-shield-halved' : selectedRole === UserRole.LEADER ? 'fa-user-tie' : 'fa-boxes-stacked'} text-4xl text-white`}></i>
            </div>
            <h1 className={`text-4xl font-black tracking-tight mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t('loginTitle')}</h1>
            <p className={`text-sm font-semibold opacity-60 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{t('loginSub')}</p>
          </header>

          {!selectedRole ? (
            <div className="space-y-6 animate-slideUp">
              <h2 className={`text-xs font-black uppercase tracking-[0.3em] text-center mb-8 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                {t('selectCategory')}
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { role: UserRole.ADMIN, icon: 'fa-shield-halved', title: t('adminCategory'), desc: 'Full System Access', color: 'indigo' },
                  { role: UserRole.LEADER, icon: 'fa-user-tie', title: t('leaderCategory'), desc: 'Operational Control', color: 'teal' },
                  { role: UserRole.STAFF, icon: 'fa-user', title: t('staffCategory'), desc: 'Inventory Operations', color: 'slate' }
                ].map((item) => (
                  <button 
                    key={item.role}
                    onClick={() => setSelectedRole(item.role)}
                    className={`group flex items-center p-6 rounded-3xl border-2 transition-all text-left ${
                      theme === 'dark' 
                        ? `bg-slate-800/50 border-white/5 hover:border-indigo-500/50 hover:bg-slate-800` 
                        : `bg-white border-black/5 hover:border-indigo-500/50 hover:bg-indigo-50/50`
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all group-hover:scale-110 ${
                      theme === 'dark' ? `bg-indigo-500/10 text-indigo-400` : `bg-indigo-100 text-indigo-600`
                    }`}>
                      <i className={`fas ${item.icon}`}></i>
                    </div>
                    <div className="ml-5 flex-1">
                      <p className={`font-black text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.title}</p>
                      <p className={`text-xs font-bold opacity-50 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{item.desc}</p>
                    </div>
                    <i className="fas fa-chevron-right opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all text-indigo-500"></i>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <button 
                  type="button" 
                  onClick={handleBack}
                  className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-500 transition-colors"
                >
                  <i className="fas fa-arrow-left mr-2"></i> {lang === 'id' ? 'Ganti Kategori' : 'Change Category'}
                </button>
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                  theme === 'dark' ? 'bg-white/5 text-slate-400' : 'bg-black/5 text-slate-600'
                }`}>
                  {getRoleLabel(selectedRole)}
                </span>
              </div>

              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center space-x-3 text-rose-500 animate-shake">
                  <i className="fas fa-circle-exclamation"></i>
                  <span className="text-xs font-bold uppercase tracking-wider">{error}</span>
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="username" className={`block text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t('username')}</label>
                  <div className="relative group">
                    <i className={`fas fa-id-badge absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-slate-600 group-focus-within:text-indigo-400' : 'text-slate-300 group-focus-within:text-indigo-500'}`}></i>
                    <input 
                      id="username"
                      name="username"
                      type="text" 
                      autoFocus
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full pl-14 pr-6 py-5 rounded-[1.5rem] border-2 outline-none transition-all ${
                        theme === 'dark' 
                          ? 'bg-slate-800/50 border-white/5 text-white focus:bg-slate-800 focus:border-indigo-500' 
                          : 'bg-slate-100 border-transparent text-slate-900 focus:bg-white focus:border-indigo-500'
                      }`}
                      placeholder="ID Number / Username"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className={`block text-[10px] font-black uppercase tracking-[0.2em] ml-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t('password')}</label>
                  <div className="relative group">
                    <i className={`fas fa-key absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-slate-600 group-focus-within:text-indigo-400' : 'text-slate-300 group-focus-within:text-indigo-500'}`}></i>
                    <input 
                      id="password"
                      name="password"
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-14 pr-6 py-5 rounded-[1.5rem] border-2 outline-none transition-all ${
                        theme === 'dark' 
                          ? 'bg-slate-800/50 border-white/5 text-white focus:bg-slate-800 focus:border-indigo-500' 
                          : 'bg-slate-100 border-transparent text-slate-900 focus:bg-white focus:border-indigo-500'
                      }`}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-4 pt-4">
                <button 
                  type="submit"
                  className={`w-full text-white font-black uppercase tracking-[0.1em] text-sm py-5 rounded-[1.5rem] shadow-2xl transition-all transform active:scale-95 hover:-translate-y-1 ${
                    selectedRole === UserRole.ADMIN ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30' : 
                    selectedRole === UserRole.LEADER ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/30' : 
                    'bg-slate-700 hover:bg-slate-800 shadow-slate-600/30'
                  }`}
                >
                  <i className="fas fa-lock-open mr-2"></i>
                  {t('signIn')}
                </button>
              </div>
            </form>
          )}

          <div className="mt-14 pt-8 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
            <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-2xl">
              <button onClick={() => setLang('id')} className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${lang === 'id' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-indigo-500'}`}>ID</button>
              <button onClick={() => setLang('en')} className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${lang === 'en' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-indigo-500'}`}>EN</button>
            </div>
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-white/5 text-indigo-400' : 'bg-black/5 text-slate-600'}`}
            >
              <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'} text-xl`}></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;