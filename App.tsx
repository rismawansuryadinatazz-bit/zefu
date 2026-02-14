import React, { useState, useEffect, useRef, useMemo } from 'react';
import { InventoryItem, User, UserRole, SheetConfig, Transaction } from './types';
import { INITIAL_DATA } from './constants';
import { translations, Lang } from './i18n';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import InventoryTable from './components/InventoryTable';
import AdminSettings from './components/AdminSettings';
import MasterData from './components/MasterData';
import Transactions from './components/Transactions';
import WarehouseView from './components/WarehouseView';
import RestockRequirements from './components/RestockRequirements';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import QuickGuide from './components/QuickGuide'; // New Guide component
import { syncToGoogleSheets, fetchFromGoogleSheets, logCloudActivity } from './services/sheetService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_DATA);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('stock_active_tab') || 'dashboard');
  
  const [sheetConfig, setSheetConfig] = useState<SheetConfig>(() => {
    const saved = localStorage.getItem('sheet_config');
    return saved ? JSON.parse(saved) : { scriptUrl: '', isConnected: false, autoSync: false, pullLock: false };
  });

  const [notif, setNotif] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<Lang>('id');
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  
  const isInitialMount = useRef(true);

  const lowStockCount = useMemo(() => {
    return items.filter(i => i.expectedQty <= i.minStockThreshold).length;
  }, [items]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const scriptFromUrl = urlParams.get('script');
    
    if (scriptFromUrl) {
      setSheetConfig(prev => {
        const next = { ...prev, scriptUrl: scriptFromUrl, isConnected: true, autoSync: true };
        localStorage.setItem('sheet_config', JSON.stringify(next));
        return next;
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const savedItems = localStorage.getItem('stock_items');
    if (savedItems) setItems(JSON.parse(savedItems));
    
    const savedTransactions = localStorage.getItem('stock_transactions');
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    
    const savedTheme = localStorage.getItem('stock_theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme || 'light');
    
    const savedLang = localStorage.getItem('stock_lang') as Lang;
    if (savedLang) setLang(savedLang || 'id');

    const savedUser = localStorage.getItem('stock_current_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedUsers = localStorage.getItem('stock_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      const defaultLeader: User = { 
        id: '1', 
        name: 'Default Leader', 
        username: 'admin', 
        password: 'admin123', 
        role: UserRole.LEADER, 
        email: 'leader@stockmaster.com' 
      };
      setUsers([defaultLeader]);
      localStorage.setItem('stock_users', JSON.stringify([defaultLeader]));
    }
  }, []);

  const loadFromCloud = async (url: string, force: boolean = false) => {
    if (!url || !user) return;
    
    if (sheetConfig.pullLock && !force) return;

    setIsLoadingCloud(true);
    try {
      const cloudData = await fetchFromGoogleSheets(url);
      
      if (cloudData && Array.isArray(cloudData) && cloudData.length > 0) {
        setItems(cloudData);
        setLastSyncedAt(new Date());
        await logCloudActivity(url, user, 'PULL (Tarik Data)', 'Data berhasil diperbarui ke Web App');
        if (force) showNotif('success', 'Data berhasil diperbarui dari Cloud.');
      } else if (cloudData && cloudData.length === 0 && items.length > 0) {
        await logCloudActivity(url, user, 'PULL (Gagal/Protected)', 'Mencoba pull data kosong, diblokir oleh Safety Lock');
        if (force) showNotif('error', 'Cloud kosong. Data Web App diamankan dari penghapusan.');
      }
    } catch (e) {
      await logCloudActivity(url, user, 'PULL (Error)', 'Kesalahan koneksi saat pengambilan data');
      if (force) showNotif('error', 'Gagal terhubung ke Cloud.');
    } finally {
      setIsLoadingCloud(false);
    }
  };

  useEffect(() => { localStorage.setItem('stock_items', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('stock_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('stock_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('stock_lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('stock_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('sheet_config', JSON.stringify(sheetConfig)); }, [sheetConfig]);
  useEffect(() => { localStorage.setItem('stock_active_tab', activeTab); }, [activeTab]);
  useEffect(() => { 
    if (user) localStorage.setItem('stock_current_user', JSON.stringify(user));
    else localStorage.removeItem('stock_current_user');
  }, [user]);

  useEffect(() => {
    if (sheetConfig.isConnected && sheetConfig.scriptUrl && !sheetConfig.pullLock) {
      const intervalId = setInterval(() => {
        if (!isLoadingCloud) loadFromCloud(sheetConfig.scriptUrl);
      }, 60000);
      return () => clearInterval(intervalId);
    }
  }, [sheetConfig.isConnected, sheetConfig.scriptUrl, sheetConfig.pullLock, isLoadingCloud, user]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (sheetConfig.autoSync && sheetConfig.scriptUrl && sheetConfig.isConnected && user) {
      const timeoutId = setTimeout(() => {
        syncToGoogleSheets(sheetConfig.scriptUrl, items, user).then(success => {
           if (success) setLastSyncedAt(new Date());
        });
      }, 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [items, sheetConfig.autoSync, sheetConfig.scriptUrl, sheetConfig.isConnected, user]);

  const t = (key: string): string => translations[lang][key as keyof typeof translations['en']] || key;

  const handleLogin = (un: string, pw: string, role: UserRole) => {
    const foundUser = users.find(u => u.username === un && u.password === pw);
    if (foundUser && foundUser.role === role) {
      setUser(foundUser);
      setLoginError(null);
    } else {
      setLoginError(t('invalidLogin'));
    }
  };

  const showNotif = (type: 'success' | 'error', message: string) => {
    setNotif({ type, message });
    setTimeout(() => setNotif(null), 3000);
  };

  const handleUpdateItem = (updatedItem: InventoryItem) => {
    setItems(prev => prev.map(item => item.id === updatedItem.id ? { ...updatedItem, lastUpdated: new Date().toISOString().split('T')[0] } : item));
    showNotif('success', `Data barang telah diperbarui.`);
  };

  const handleAddTransaction = (newTr: Transaction) => {
    setItems(prevItems => {
      const itemDef = prevItems.find(i => i.id === newTr.itemId || i.name === newTr.itemName);
      if (!itemDef) return prevItems;
      let nextItems = [...prevItems];
      const sourceLoc = newTr.fromLocation || 'Gudang Utama';
      const sourceIdx = nextItems.findIndex(i => (i.id === newTr.itemId || i.name === itemDef.name) && i.location === sourceLoc);
      
      if (sourceIdx !== -1) {
        nextItems[sourceIdx] = { 
          ...nextItems[sourceIdx], 
          expectedQty: nextItems[sourceIdx].expectedQty + (newTr.type === 'IN' ? newTr.quantity : -newTr.quantity),
          lastUpdated: new Date().toISOString().split('T')[0],
          updatedBy: user?.name || 'System'
        };
      }
      
      if (newTr.type === 'SHIFT' && newTr.toLocation) {
        const destIdx = nextItems.findIndex(i => i.name === itemDef.name && i.size === itemDef.size && i.location === newTr.toLocation);
        if (destIdx !== -1) {
          nextItems[destIdx] = { ...nextItems[destIdx], expectedQty: nextItems[destIdx].expectedQty + newTr.quantity };
        } else {
          nextItems.push({ ...itemDef, id: Math.random().toString(36).substr(2, 9), location: newTr.toLocation, expectedQty: newTr.quantity, actualQty: 0 });
        }
      }
      return nextItems;
    });
    setTransactions(prev => [...prev, newTr]);
    showNotif('success', `Aktivitas stok berhasil dicatat.`);
  };

  const handleForceSync = async () => {
    if (!sheetConfig.scriptUrl || !user) {
      showNotif('error', 'Konfigurasi Cloud belum lengkap.');
      return;
    }
    const success = await syncToGoogleSheets(sheetConfig.scriptUrl, items, user);
    if (success) {
      showNotif('success', 'Berhasil sinkronisasi data ke Cloud.');
      setLastSyncedAt(new Date());
    } else {
      showNotif('error', 'Gagal terhubung ke server Cloud.');
    }
  };

  if (!user) {
    return (
      <Login 
        onLogin={handleLogin} theme={theme} lang={lang} 
        setLang={setLang} setTheme={setTheme} t={t}
        error={loginError} setError={setLoginError}
      />
    );
  }

  return (
    <Layout 
      user={user} onLogout={() => setUser(null)} 
      activeTab={activeTab} setActiveTab={setActiveTab} 
      theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} t={t} 
      lowStockCount={lowStockCount}
      isCloudConnected={sheetConfig.isConnected}
      isLoadingCloud={isLoadingCloud}
      lastSyncedAt={lastSyncedAt}
      onForceRefresh={() => loadFromCloud(sheetConfig.scriptUrl, true)}
      isPullLocked={sheetConfig.pullLock}
    >
      {notif && (
        <div className={`fixed top-4 right-4 z-[200] px-8 py-4 rounded-[1.5rem] shadow-2xl text-white font-black flex items-center space-x-4 transform transition-all animate-bounce ${notif.type === 'success' ? 'bg-green-600' : 'bg-rose-600'}`}>
          <i className={`fas ${notif.type === 'success' ? 'fa-shield-check' : 'fa-triangle-exclamation'} text-xl`}></i>
          <span>{notif.message}</span>
        </div>
      )}
      
      {activeTab === 'dashboard' && <Dashboard items={items} theme={theme} t={t} userName={user.name} />}
      {activeTab === 'transactions' && <Transactions items={items} transactions={transactions} onAddTransaction={handleAddTransaction} onUpdateTransaction={() => {}} onDeleteTransaction={() => {}} theme={theme} t={t} user={user} />}
      {activeTab === 'inventory' && <InventoryTable items={items} role={user.role} userName={user.name} onUpdate={handleUpdateItem} theme={theme} t={t} />}
      {activeTab === 'restockRequirements' && <RestockRequirements items={items} theme={theme} t={t} onAddTransaction={handleAddTransaction} user={user} />}
      {activeTab === 'guide' && <QuickGuide theme={theme} />}
      
      {activeTab === 'master' && (user.role === UserRole.ADMIN || user.role === UserRole.LEADER) && (
        <MasterData items={items} onAdd={i => setItems(p => [...p, i])} onUpdate={handleUpdateItem} onDelete={id => setItems(p => p.filter(i => i.id !== id))} onAddTransaction={handleAddTransaction} theme={theme} t={t} user={user} />
      )}
      {activeTab === 'userManagement' && (user.role === UserRole.ADMIN || user.role === UserRole.LEADER) && (
        <UserManagement currentUser={user} users={users} onAddUser={u => setUsers(p => [...p, u])} onDeleteUser={id => setUsers(p => p.filter(u => u.id !== id))} theme={theme} t={t} />
      )}
      
      {activeTab === 'settings' && (
        <AdminSettings 
          config={sheetConfig} onSave={setSheetConfig} onSync={handleForceSync} 
          onPull={() => loadFromCloud(sheetConfig.scriptUrl, true)}
          theme={theme} t={t} user={user} users={users}
          onAddUser={u => setUsers(p => [...p, u])} onDeleteUser={id => setUsers(p => p.filter(u => u.id !== id))}
        />
      )}
      
      {['mainWarehouse', 'singlesWarehouse', 'nuggetWarehouse', 'repairView', 'destructionView'].includes(activeTab) && (
        <WarehouseView 
          items={items} transactions={transactions} theme={theme} t={t} 
          targetLocation={activeTab === 'mainWarehouse' ? 'Gudang Utama' : activeTab === 'singlesWarehouse' ? 'Gudang Singles' : activeTab === 'nuggetWarehouse' ? 'Gudang Nugget' : activeTab === 'repairView' ? 'Repair' : 'Pemusnahan'}
          titleKey={activeTab} onAddTransaction={handleAddTransaction} user={user}
        />
      )}
    </Layout>
  );
};

export default App;