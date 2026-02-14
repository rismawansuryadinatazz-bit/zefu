import React, { useState } from 'react';
import { SheetConfig, UserRole, User } from '../types';

interface AdminSettingsProps {
  config: SheetConfig;
  onSave: (config: SheetConfig) => void;
  onSync: () => void;
  onPull: () => void;
  theme: 'light' | 'dark';
  t: (key: string) => string;
  user: User;
  users: User[];
  onAddUser: (u: User) => void;
  onDeleteUser: (id: string) => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ 
  config, onSave, onSync, onPull, theme, t, user, users, onAddUser, onDeleteUser 
}) => {
  const [url, setUrl] = useState(config.scriptUrl);
  const [autoSync, setAutoSync] = useState(config.autoSync);
  const [pullLock, setPullLock] = useState(config.pullLock || false);
  const [showCode, setShowCode] = useState(false);

  const appsScriptCode = `function doGet(e) { ... }`; // Truncated for brevity

  const handleSave = () => {
    onSave({ scriptUrl: url, isConnected: url.length > 10, autoSync, pullLock });
    alert("Konfigurasi Berhasil Disimpan!");
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    alert("KODE SKRIP DISALIN!");
  };

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-800';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-gray-500';
  const cardClass = `p-6 rounded-3xl shadow-sm border transition-all ${
    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
  }`;

  const inputClass = `w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
    theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <header>
        <h2 className={`text-2xl font-black ${textPrimary}`}>Konfigurasi Sistem</h2>
        <p className={textSecondary}>Kelola integrasi cloud dan parameter keamanan database.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${cardClass} lg:col-span-2`}>
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-600/20">
              <i className="fab fa-google-drive"></i>
            </div>
            <h3 className={`text-lg font-bold ${textPrimary}`}>Google Sheets Database</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="scriptUrl" className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Web App URL</label>
              <input 
                id="scriptUrl"
                name="scriptUrl"
                type="text" 
                placeholder="https://script.google.com/macros/s/..."
                className={inputClass}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            
            <button onClick={handleSave} className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
              SIMPAN PERUBAHAN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;