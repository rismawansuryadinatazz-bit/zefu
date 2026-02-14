import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface UserManagementProps {
  currentUser: User;
  users: User[];
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  theme: 'light' | 'dark';
  t: (key: string) => string;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser, users, onAddUser, onDeleteUser, theme, t }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: UserRole.STAFF
  });

  const handleAdd = () => {
    if (!formData.name || !formData.username || !formData.password) {
      alert("Mohon lengkapi seluruh data.");
      return;
    }
    
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      username: formData.username,
      password: formData.password,
      role: formData.role,
      email: `${formData.username}@stockmaster.com`
    };

    onAddUser(newUser);
    setShowAddModal(false);
    setFormData({ name: '', username: '', password: '', role: UserRole.STAFF });
  };

  const cardClass = `p-8 rounded-3xl shadow-sm border transition-all ${
    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
  }`;

  const inputClass = `w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
    theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;

  const canManage = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.LEADER;

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{t('userManagement')}</h2>
          <p className="text-slate-500">Kelola kredensial dan hak akses operasional tim.</p>
        </div>
        {canManage && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
          >
            <i className="fas fa-user-plus"></i>
            <span>Daftar Akun Baru</span>
          </button>
        )}
      </header>

      <div className={cardClass}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={`uppercase text-[10px] font-black tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>
              <tr>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">ID / Username</th>
                <th className="px-6 py-4">Hak Akses</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-gray-100'}`}>
              {users.map((u) => (
                <tr key={u.id} className={`group ${theme === 'dark' ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs ${
                        u.role === UserRole.ADMIN ? 'bg-rose-500' : u.role === UserRole.LEADER ? 'bg-indigo-500' : 'bg-slate-500'
                      }`}>
                        {u.name.charAt(0)}
                      </div>
                      <span className={`font-bold text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-gray-800'}`}>{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-mono bg-slate-500/5 px-2 py-1 rounded-md">{u.username}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                      u.role === UserRole.ADMIN ? 'bg-rose-500/10 text-rose-500' :
                      u.role === UserRole.LEADER ? 'bg-indigo-500/10 text-indigo-500' :
                      'bg-slate-500/10 text-slate-500'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.id !== currentUser.id && (
                      <button 
                        onClick={() => { if(window.confirm('Hapus akun ini secara permanen?')) onDeleteUser(u.id); }}
                        className="p-2 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <i className="fas fa-trash-alt text-xs"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className={`w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/5 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-8 text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10"><i className="fas fa-user-shield text-8xl"></i></div>
              <h3 className="text-2xl font-black mb-1">Registrasi Akun Baru</h3>
              <p className="text-xs opacity-70 uppercase tracking-widest font-black">Oleh: {currentUser.name}</p>
            </div>
            
            <div className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Nama Lengkap</label>
                <input className={inputClass} placeholder="Nama Lengkap User" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Username / ID</label>
                  <input className={inputClass} placeholder="ID Unik" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Kata Sandi</label>
                  <input type="password" className={inputClass} placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Tipe Hak Akses</label>
                <div className="relative">
                  <select 
                    className={`${inputClass} appearance-none cursor-pointer`} 
                    value={formData.role} 
                    onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                  >
                    <option value={UserRole.ADMIN}>Administrator (Full System)</option>
                    <option value={UserRole.LEADER}>Leader (Operational Control)</option>
                    <option value={UserRole.STAFF}>Staff (Operations Only)</option>
                  </select>
                  <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                </div>
              </div>

              <div className="flex space-x-3 pt-6">
                <button 
                  onClick={() => setShowAddModal(false)} 
                  className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border ${theme === 'dark' ? 'border-slate-800 text-slate-500 hover:bg-slate-800' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                >
                  Batal
                </button>
                <button 
                  onClick={handleAdd} 
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
                >
                  Buat Akun
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;