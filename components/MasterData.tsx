
import React, { useState, useRef, useMemo } from 'react';
import { InventoryItem, UserRole, UsageType, Transaction } from '../types';
import { generatePdfReport } from '../services/pdfService';

interface MasterDataProps {
  items: InventoryItem[];
  onAdd: (item: InventoryItem) => void;
  onUpdate: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onAddTransaction: (transaction: Transaction) => void;
  theme: 'light' | 'dark';
  t: (key: string) => string;
  user: { name: string; role: UserRole };
}

const MasterData: React.FC<MasterDataProps> = ({ items, onAdd, onUpdate, onDelete, onAddTransaction, theme, t, user }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [distributionView, setDistributionView] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    category: '',
    size: '',
    unit: '',
    location: 'Gudang Utama',
    usageType: 'REUSABLE',
    minStockThreshold: 10,
    dailyUsage: 1,
  });

  const masterCatalog = useMemo(() => {
    const unique = new Map<string, InventoryItem>();
    items.forEach(item => {
      const key = `${item.name}-${item.size}`;
      if (!unique.has(key) || item.location === 'Gudang Utama') {
        unique.set(key, item);
      }
    });
    return Array.from(unique.values());
  }, [items]);

  const filteredItems = masterCatalog.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.size.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGlobalStats = (masterItem: InventoryItem) => {
    const related = items.filter(i => i.name === masterItem.name && i.size === masterItem.size);
    const totalExpected = related.reduce((sum, i) => sum + i.expectedQty, 0);
    const distribution = related.map(i => ({ location: i.location, qty: i.expectedQty }));
    return { totalExpected, distribution };
  };

  const handleSave = () => {
    if (!formData.name) return;

    if (editingItem) {
      onUpdate({ ...editingItem, ...formData } as InventoryItem);
    } else {
      const newItem: InventoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name!,
        category: formData.category || 'General',
        size: formData.size || '-',
        expectedQty: 0,
        actualQty: 0,
        minStockThreshold: formData.minStockThreshold || 10,
        dailyUsage: formData.dailyUsage || 1,
        unit: formData.unit || 'pcs',
        location: formData.location || 'Gudang Utama',
        usageType: formData.usageType || 'REUSABLE',
        status: 'APPROVED',
        condition: 'GOOD',
        lastUpdated: new Date().toISOString().split('T')[0],
        updatedBy: user.name,
      };
      onAdd(newItem);
    }
    resetForm();
  };

  const handleExportPdf = () => {
    const headers = ["Nama Item", "Kategori", "Size", "Total Global", "Satuan", "Pemakaian/Hari"];
    const data = filteredItems.map(i => {
      const stats = getGlobalStats(i);
      return [
        i.name,
        i.category,
        i.size,
        stats.totalExpected.toString(),
        i.unit,
        i.dailyUsage.toString()
      ];
    });

    generatePdfReport({
      title: "LAPORAN KATALOG MASTER DATA",
      subtitle: `Daftar pusat barang dan distribusi global (${filteredItems.length} item)`,
      userName: user.name,
      headers,
      data,
      fileName: "Master_Data_Report"
    });
  };

  const resetForm = () => {
    setFormData({ name: '', category: '', size: '', unit: '', location: 'Gudang Utama', usageType: 'REUSABLE', minStockThreshold: 10, dailyUsage: 1 });
    setShowAddModal(false);
    setEditingItem(null);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData(item);
    setShowAddModal(true);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n');
      rows.slice(1).forEach(row => {
        const columns = row.split(',').map(c => c.trim());
        if (columns.length >= 2 && columns[0]) {
          const importedUsageType = columns[5]?.toUpperCase() === 'SINGLE_USE' ? 'SINGLE_USE' : 'REUSABLE';
          const newItem: InventoryItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: columns[0],
            category: columns[1] || 'General',
            size: columns[2] || '-',
            unit: columns[3] || 'pcs',
            location: columns[4] || 'Gudang Utama',
            expectedQty: 0,
            actualQty: 0,
            minStockThreshold: parseInt(columns[6]) || 10,
            dailyUsage: parseInt(columns[7]) || 1,
            usageType: importedUsageType as UsageType,
            status: 'APPROVED',
            condition: 'GOOD',
            lastUpdated: new Date().toISOString().split('T')[0],
            updatedBy: 'Import',
          };
          onAdd(newItem);
        }
      });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const cardClass = `p-8 rounded-3xl shadow-sm border transition-all ${
    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
  }`;

  const modalInputClass = `w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
    theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;

  const selectClass = `w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer ${
    theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{t('masterData')}</h2>
          <p className="text-slate-500">Definisi pusat barang dan kontrol distribusi global.</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text"
              placeholder={t('searchItems')}
              className={`${modalInputClass} pl-11 py-2.5 sm:w-64`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={handleExportPdf}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl font-bold transition-all active:scale-95 border ${
                theme === 'dark' ? 'bg-rose-900/20 border-rose-800/50 text-rose-400' : 'bg-rose-50 border-rose-100 text-rose-600'
              }`}
            >
              <i className="fas fa-file-pdf"></i>
              <span className="hidden lg:inline">Cetak Katalog</span>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
            <button 
              onClick={handleImportClick}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl font-bold transition-all active:scale-95 border ${
                theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100'
              }`}
            >
              <i className="fas fa-file-import"></i>
              <span className="hidden lg:inline">{t('importSheet')}</span>
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
            >
              <i className="fas fa-plus"></i>
              <span>{t('addItem')}</span>
            </button>
          </div>
        </div>
      </header>

      <div className={cardClass}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={`uppercase text-[10px] font-black tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>
              <tr>
                <th className="px-6 py-4">{t('itemName')}</th>
                <th className="px-6 py-4">{t('category')}</th>
                <th className="px-6 py-4">{t('size')}</th>
                <th className="px-6 py-4">Total Global</th>
                <th className="px-6 py-4">Distribusi</th>
                <th className="px-6 py-4 text-right">Aksi Sistem</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-gray-100'}`}>
              {filteredItems.map((item) => {
                const stats = getGlobalStats(item);
                return (
                  <tr key={`${item.name}-${item.size}`} className={`group transition-all ${theme === 'dark' ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <p className={`font-bold text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-gray-800'}`}>{item.name}</p>
                      <p className="text-[10px] opacity-50 uppercase font-black tracking-tighter">Usage: {item.dailyUsage} {item.unit}/day</p>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className="bg-slate-500/10 text-slate-500 px-2 py-1 rounded-md uppercase font-black tracking-tighter">{item.category}</span>
                    </td>
                    <td className={`px-6 py-4 font-mono text-xs font-bold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>{item.size}</td>
                    <td className="px-6 py-4">
                       <span className={`text-sm font-black ${stats.totalExpected > 0 ? 'text-indigo-500' : 'text-slate-300'}`}>
                         {stats.totalExpected} <span className="text-[10px] uppercase font-black opacity-40">{item.unit}</span>
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setDistributionView(item)}
                        className="flex -space-x-2 cursor-pointer hover:scale-110 transition-transform"
                      >
                        {stats.distribution.slice(0, 3).map((d, idx) => (
                          <div key={idx} className={`w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-black text-white ${
                            d.location === 'Gudang Utama' ? 'bg-blue-500' : d.location.includes('Singles') ? 'bg-indigo-500' : 'bg-amber-500'
                          }`} title={`${d.location}: ${d.qty}`}>
                            {d.location.charAt(0)}
                          </div>
                        ))}
                        {stats.distribution.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-500">+</div>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(item)} 
                          className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest px-2 py-1"
                        >
                          {t('editMaster')}
                        </button>
                        
                        {(user.role === UserRole.ADMIN || user.role === UserRole.LEADER) && (
                          <button 
                            onClick={() => { if(window.confirm('Hapus master data ini?')) onDelete(item.id); }} 
                            className="text-[10px] font-black text-red-500 hover:text-red-700 transition-colors uppercase tracking-widest px-2 py-1"
                          >
                            {t('deleteMaster')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Distribution Modal */}
      {distributionView && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
            <div className="bg-indigo-600 p-8 text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <i className="fas fa-network-wired text-9xl"></i>
              </div>
              <h3 className="text-2xl font-black mb-1">{distributionView.name}</h3>
              <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70">Status Distribusi Global • {distributionView.size}</p>
              <button 
                onClick={() => setDistributionView(null)} 
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-center">
                  <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Total Stok Sistem</p>
                  <p className="text-2xl font-black text-indigo-600">{getGlobalStats(distributionView).totalExpected} <span className="text-xs opacity-50">{distributionView.unit}</span></p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-500/5 border border-slate-500/10 text-center">
                  <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Total Lokasi</p>
                  <p className="text-2xl font-black text-slate-700 dark:text-slate-300">{getGlobalStats(distributionView).distribution.length}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Rincian Per Lokasi</p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {getGlobalStats(distributionView).distribution.map((d, i) => (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                          d.location === 'Gudang Utama' ? 'bg-blue-600' : 'bg-indigo-600'
                        }`}>
                          <i className="fas fa-warehouse text-sm"></i>
                        </div>
                        <span className="font-bold text-sm">{d.location}</span>
                      </div>
                      <span className="font-black text-indigo-600">{d.qty} <span className="text-[10px] opacity-40">{distributionView.unit}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-500/10 flex justify-end">
               <button 
                 onClick={() => setDistributionView(null)}
                 className="px-8 py-3 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-indigo-700 transition-all active:scale-95"
               >
                 Selesai
               </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
              <h3 className="text-xl font-bold">{editingItem ? t('editItem') : t('addItem')}</h3>
              <button onClick={resetForm} className="opacity-60 hover:opacity-100 transition-opacity"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('itemName')}</label>
                <input className={modalInputClass} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('category')}</label>
                  <input className={modalInputClass} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('location')}</label>
                  <input className={modalInputClass} value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('size')}</label>
                  <input className={modalInputClass} value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('unit')}</label>
                  <input className={modalInputClass} value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('minThreshold')}</label>
                  <input type="number" className={modalInputClass} value={formData.minStockThreshold} onChange={e => setFormData({...formData, minStockThreshold: parseInt(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Usage/Day</label>
                  <input type="number" className={modalInputClass} value={formData.dailyUsage} onChange={e => setFormData({...formData, dailyUsage: parseInt(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('usageType')}</label>
                  <div className="relative">
                    <select className={selectClass} value={formData.usageType} onChange={e => setFormData({...formData, usageType: e.target.value as UsageType})}>
                      <option value="SINGLE_USE">{t('singleUse')}</option>
                      <option value="REUSABLE">{t('reusable')}</option>
                    </select>
                    <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 pt-6">
                <button onClick={resetForm} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border ${theme === 'dark' ? 'border-slate-800 text-slate-500 hover:bg-slate-800' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>{t('cancel')}</button>
                <button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-95">{t('saveItem')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterData;
