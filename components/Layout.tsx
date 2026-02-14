import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Lang } from '../i18n';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  lowStockCount: number;
  isCloudConnected?: boolean;
  isLoadingCloud?: boolean;
  lastSyncedAt?: Date | null;
  onForceRefresh?: () => void;
  isPullLocked?: boolean; 
}

interface NavGroupProps {
  title: string;
  icon: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  theme: 'light' | 'dark';
  badgeCount?: number;
}

const NavGroup: React.FC<NavGroupProps> = ({ title, icon, isOpen, onToggle, children, theme, badgeCount }) => {
  return (
    <div className="mb-2">
      <button 
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
          theme === 'dark' ? 'hover:bg-slate-800/50 text-slate-400' : 'hover:bg-indigo-50 text-slate-500'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <i className={`fas ${icon} w-5 text-center text-indigo-500`}></i>
            {badgeCount && badgeCount > 0 && !isOpen && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
            )}
          </div>
          <span className="font-bold text-[11px] uppercase tracking-wider">{title}</span>
        </div>
        <div className="flex items-center space-x-2">
          {badgeCount && badgeCount > 0 && (
             <span className="text-[9px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded-full">
               {badgeCount}
             </span>
          )}
          <i className={`fas fa-chevron-down text-[9px] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[800px] mt-1' : 'max-h-0'}`}>
        <div className="pl-3 space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ 
  children, user, onLogout, activeTab, setActiveTab, 
  theme, setTheme, lang, setLang, t, lowStockCount,
  isCloudConnected, isLoadingCloud, lastSyncedAt, onForceRefresh,
  isPullLocked
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    core: true,
    warehouses: true,
    maintenance: true,
    planning: false,
    system: false,
    guide: true
  });

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const navItemClass = (id: string) => `w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all text-sm ${
    activeTab === id 
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 font-bold translate-x-1' 
      : 'text-slate-500 hover:bg-indigo-500/10 hover:text-indigo-500'
  }`;

  const sidebarContent = (
    <div className="p-6 flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-slate-900/95 backdrop-blur-md">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-2.5 rounded-2xl shadow-xl shadow-indigo-500/20">
            <i className="fas fa-soap text-xl text-white"></i>
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-white leading-tight">STOCK PRO</h1>
            <p className="text-[8px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-0.5 opacity-80">© SURYADINATA 2026</p>
          </div>
        </div>
        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-white/50 hover:text-white p-2">
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <nav className="flex-1 space-y-2">
        <NavGroup title="Monitoring" icon="fa-chart-pie" isOpen={openGroups.core} onToggle={() => toggleGroup('core')} theme={theme} badgeCount={lowStockCount}>
          <button onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} className={navItemClass('dashboard')}>
            <div className="flex items-center space-x-3">
              <i className="fas fa-grid-2 text-[10px] w-4"></i>
              <span>{t('dashboard')}</span>
            </div>
          </button>
          <button onClick={() => { setActiveTab('transactions'); setIsMobileMenuOpen(false); }} className={navItemClass('transactions')}>
            <div className="flex items-center space-x-3">
              <i className="fas fa-history text-[10px] w-4"></i>
              <span>{t('transactions')}</span>
            </div>
          </button>
        </NavGroup>

        <NavGroup title="Logistik" icon="fa-warehouse" isOpen={openGroups.warehouses} onToggle={() => toggleGroup('warehouses')} theme={theme}>
          <button onClick={() => { setActiveTab('mainWarehouse'); setIsMobileMenuOpen(false); }} className={navItemClass('mainWarehouse')}>
            <div className="flex items-center space-x-3">
              <i className="fas fa-building text-[10px] w-4"></i>
              <span>Gudang Utama</span>
            </div>
          </button>
          <button onClick={() => { setActiveTab('singlesWarehouse'); setIsMobileMenuOpen(false); }} className={navItemClass('singlesWarehouse')}>
            <div className="flex items-center space-x-3">
              <i className="fas fa-box-open text-[10px] w-4"></i>
              <span>Gudang Singles</span>
            </div>
          </button>
          <button onClick={() => { setActiveTab('nuggetWarehouse'); setIsMobileMenuOpen(false); }} className={navItemClass('nuggetWarehouse')}>
            <div className="flex items-center space-x-3">
              <i className="fas fa-box-archive text-[10px] w-4"></i>
              <span>Gudang Nugget</span>
            </div>
          </button>
        </NavGroup>

        <NavGroup title="Maintenance" icon="fa-tools" isOpen={openGroups.maintenance} onToggle={() => toggleGroup('maintenance')} theme={theme}>
          <button onClick={() => { setActiveTab('repairView'); setIsMobileMenuOpen(false); }} className={navItemClass('repairView')}>
            <div className="flex items-center space-x-3">
              <i className="fas fa-wrench text-[10px] w-4"></i>
              <span>Repair Center</span>
            </div>
          </button>
          <button onClick={() => { setActiveTab('destructionView'); setIsMobileMenuOpen(false); }} className={navItemClass('destructionView')}>
            <div className="flex items-center space-x-3">
              <i className="fas fa-fire text-[10px] w-4"></i>
              <span>Pemusnahan</span>
            </div>
          </button>
        </NavGroup>

        <NavGroup title="Perencanaan" icon="fa-calendar-check" isOpen={openGroups.planning} onToggle={() => toggleGroup('planning')} theme={theme}>
          <button onClick={() => { setActiveTab('restockRequirements'); setIsMobileMenuOpen(false); }} className={navItemClass('restockRequirements')}>
            <div className="flex items-center space-x-3">
              <i className="fas fa-calculator text-[10px] w-4"></i>
              <span>Kebutuhan Stok</span>
            </div>
          </button>
        </NavGroup>

        <NavGroup title="Informasi" icon="fa-circle-info" isOpen={openGroups.guide} onToggle={() => toggleGroup('guide')} theme={theme}>
          <button onClick={() => { setActiveTab('guide'); setIsMobileMenuOpen(false); }} className={navItemClass('guide')}>
            <div className="flex items-center space-x-3">
              <i className="fas fa-book-open text-[10px] w-4"></i>
              <span>Quick Guide</span>
            </div>
          </button>
        </NavGroup>

        {(user.role === UserRole.ADMIN || user.role === UserRole.LEADER) && (
          <NavGroup title="Manajemen" icon="fa-shield-halved" isOpen={openGroups.system} onToggle={() => toggleGroup('system')} theme={theme}>
            <button onClick={() => { setActiveTab('master'); setIsMobileMenuOpen(false); }} className={navItemClass('master')}>
              <div className="flex items-center space-x-3">
                <i className="fas fa-database text-[10px] w-4"></i>
                <span>Master Data</span>
              </div>
            </button>
            <button onClick={() => { setActiveTab('userManagement'); setIsMobileMenuOpen(false); }} className={navItemClass('userManagement')}>
              <div className="flex items-center space-x-3">
                <i className="fas fa-users-cog text-[10px] w-4"></i>
                <span>Manajemen User</span>
              </div>
            </button>
            <button onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} className={navItemClass('settings')}>
              <div className="flex items-center space-x-3">
                <i className="fas fa-cloud-arrow-up text-[10px] w-4"></i>
                <span>Cloud & Safety</span>
              </div>
            </button>
          </NavGroup>
        )}
      </nav>

      <div className="mt-auto pt-8 border-t border-white/5">
        <div className="flex items-center space-x-3 mb-6 bg-white/5 p-3 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20">{user.name.charAt(0)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{user.name}</p>
            <p className="text-[9px] text-indigo-400 uppercase font-black tracking-widest">{user.role}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
           <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="flex items-center justify-center p-3 bg-white/5 text-white/70 hover:text-white rounded-xl transition-all">
             <i className={`fas ${theme === 'light' ? 'fa-sun' : 'fa-moon'} text-xs`}></i>
           </button>
           <button onClick={onLogout} className="flex items-center justify-center p-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all">
             <i className="fas fa-power-off text-xs"></i>
           </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col md:flex-row min-h-screen transition-all duration-500 ${theme === 'dark' ? 'bg-[#020617] text-slate-100' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white z-40 border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20"><i className="fas fa-soap text-white"></i></div>
          <span className="font-black text-sm tracking-tight uppercase">STOCK PRO</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-xl text-white/70 hover:text-white transition-colors"><i className="fas fa-bars-staggered"></i></button>
      </div>

      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex w-72 flex-shrink-0 flex-col z-30 border-r border-white/5 bg-slate-900`}>
        {sidebarContent}
      </aside>

      {/* Sidebar - Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[150] flex">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
          <aside className="relative w-72 max-w-[85%] bg-slate-900 flex flex-col h-full animate-slideRight shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto max-h-screen custom-scrollbar relative">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
        
        {/* Footer info at bottom right */}
        <div className="fixed bottom-4 right-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hidden md:block opacity-50 pointer-events-none">
          SYSTEM BUILT BY SURYADINATA • 2026
        </div>
      </main>

      <style>{`
        @keyframes slideRight { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .animate-slideRight { animation: slideRight 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default Layout;