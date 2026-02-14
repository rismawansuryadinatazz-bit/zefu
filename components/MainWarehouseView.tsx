
import React, { useMemo, useState } from 'react';
import { InventoryItem, Transaction, UserRole } from '../types';

interface MainWarehouseViewProps {
  items: InventoryItem[];
  transactions: Transaction[];
  theme: 'light' | 'dark';
  t: (key: string) => string;
}

const MainWarehouseView: React.FC<MainWarehouseViewProps> = ({ items, transactions, theme, t }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemHistory, setSelectedItemHistory] = useState<InventoryItem | null>(null);

  // Filtering items that belong to the "Gudang Utama" as defined in the Master Data
  const warehouseItems = useMemo(() => {
    return items.filter(item => item.location === 'Gudang Utama');
  }, [items]);

  // Aggregating transaction data for items in the Main Warehouse and applying search filter
  const itemStats = useMemo(() => {
    const stats = warehouseItems.map(item => {
      // Direct "Stock In" transactions
      const totalIn = transactions
        .filter(tr => tr.itemId === item.id && tr.type === 'IN')
        .reduce((sum, tr) => sum + tr.quantity, 0);
      
      // Transactions shifted INTO the Main Warehouse from other locations
      const totalShiftedIn = transactions
        .filter(tr => tr.itemId === item.id && tr.type === 'SHIFT' && tr.toLocation === 'Gudang Utama')
        .reduce((sum, tr) => sum + tr.quantity, 0);

      return {
        ...item,
        totalIn: totalIn + totalShiftedIn
      };
    });

    if (!searchTerm) return stats;
    
    const searchLower = searchTerm.toLowerCase();
    return stats.filter(item => 
      item.name.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower) ||
      item.size.toLowerCase().includes(searchLower)
    );
  }, [warehouseItems, transactions, searchTerm]);

  // Get all related transactions for a specific item when viewing history
  const selectedItemTransactions = useMemo(() => {
    if (!selectedItemHistory) return [];
    return transactions
      .filter(tr => tr.itemId === selectedItemHistory.id && 
                   (tr.type === 'IN' || tr.type === 'OUT' || tr.toLocation === 'Gudang Utama' || tr.fromLocation === 'Gudang Utama'))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedItemHistory, transactions]);

  const cardClass = `p-8 rounded-3xl shadow-sm border transition-all ${
    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
  }`;

  const inputClass = `pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all ${
    theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-800';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className={`text-3xl font-extrabold ${textPrimary}`}>{t('mainWarehouse')}</h2>
          <p className={textSecondary}>Tinjauan stok masuk dan data master khusus operasional Gudang Utama.</p>
        </div>
        <div className="relative">
          <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          <input 
            type="text" 
            placeholder={t('searchItems')}
            className={`${inputClass} w-full sm:w-72`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {/* Full-width Inventory Table */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-8">
            <h3 className={`text-xl font-bold ${textPrimary}`}>
              <i className="fas fa-boxes-packing mr-3 text-indigo-500"></i>
              Data Inventaris Gudang Utama
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className={`uppercase text-[10px] font-black tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>
                <tr>
                  <th className="px-4 py-4">{t('itemName')}</th>
                  <th className="px-4 py-4">{t('category')}</th>
                  <th className="px-4 py-4">{t('size')}</th>
                  <th className="px-4 py-4">{t('unit')}</th>
                  <th className="px-4 py-4">{t('usageType')}</th>
                  <th className="px-4 py-4 text-center">{t('totalReceived')}</th>
                  <th className="px-4 py-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-gray-100'}`}>
                {itemStats.map(item => (
                  <tr key={item.id} className={`group transition-colors ${theme === 'dark' ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-5 font-bold">{item.name}</td>
                    <td className="px-4 py-5">
                      <span className="text-[10px] font-black uppercase px-2 py-1 rounded bg-slate-500/10 text-slate-500">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <span className={`font-mono text-xs font-bold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        {item.size}
                      </span>
                    </td>
                    <td className="px-4 py-5 font-bold text-xs uppercase opacity-60">
                      {item.unit}
                    </td>
                    <td className="px-4 py-5">
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${
                        item.usageType === 'SINGLE_USE' ? 'bg-amber-500/10 text-amber-600' : 'bg-green-500/10 text-green-600'
                      }`}>
                        {item.usageType === 'SINGLE_USE' ? t('singleUse') : t('reusable')}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-bold text-green-500 text-sm">+{item.totalIn}</span>
                        <span className="text-[8px] font-black uppercase opacity-40">Total Masuk</span>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-right">
                      <button 
                        onClick={() => setSelectedItemHistory(item)}
                        className="p-2 text-indigo-500 hover:bg-indigo-500 hover:text-white rounded-lg transition-all md:opacity-0 group-hover:opacity-100"
                        title="Lihat Histori"
                      >
                        <i className="fas fa-history text-xs"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {itemStats.length === 0 && (
            <div className="py-24 text-center opacity-30">
              <i className="fas fa-warehouse text-6xl mb-4"></i>
              <p className="text-sm font-bold">Data master tidak ditemukan untuk kriteria ini.</p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction History Overlay Modal */}
      {selectedItemHistory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'}`}>
            <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{selectedItemHistory.name}</h3>
                <p className="text-xs opacity-70 uppercase tracking-widest font-black">Histori Transaksi Gudang Utama</p>
              </div>
              <button 
                onClick={() => setSelectedItemHistory(null)} 
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="p-3 rounded-2xl bg-slate-500/5 border border-slate-500/10">
                  <p className="text-[9px] uppercase font-black opacity-50 tracking-wider mb-1">Kategori</p>
                  <p className="font-bold text-sm">{selectedItemHistory.category}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-500/5 border border-slate-500/10">
                  <p className="text-[9px] uppercase font-black opacity-50 tracking-wider mb-1">Ukuran</p>
                  <p className="font-bold text-sm">{selectedItemHistory.size}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-500/5 border border-slate-500/10">
                  <p className="text-[9px] uppercase font-black opacity-50 tracking-wider mb-1">Satuan</p>
                  <p className="font-bold text-sm">{selectedItemHistory.unit}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-500/5 border border-slate-500/10">
                  <p className="text-[9px] uppercase font-black opacity-50 tracking-wider mb-1">Jenis</p>
                  <p className="font-bold text-sm uppercase text-indigo-500">{selectedItemHistory.usageType === 'SINGLE_USE' ? 'Sekali Pakai' : 'Pakai Ulang'}</p>
                </div>
              </div>

              {selectedItemTransactions.length > 0 ? (
                <table className="w-full text-left">
                  <thead className={`uppercase text-[10px] font-black tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>
                    <tr>
                      <th className="pb-4 px-2">Tanggal</th>
                      <th className="pb-4 px-2">Jenis</th>
                      <th className="pb-4 px-2">Jumlah</th>
                      <th className="pb-4 px-2">Shift</th>
                      <th className="pb-4 px-2">Alur Mutasi</th>
                      <th className="pb-4 px-2">Oleh</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-gray-100'}`}>
                    {selectedItemTransactions.map(tr => (
                      <tr key={tr.id} className="text-sm">
                        <td className="py-4 px-2 text-slate-500 font-mono text-xs">{new Date(tr.date).toLocaleString()}</td>
                        <td className="py-4 px-2">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm ${
                            tr.type === 'IN' ? 'bg-green-500 text-white' : 
                            tr.type === 'OUT' ? 'bg-red-500 text-white' : 
                            'bg-indigo-500 text-white'
                          }`}>
                            {tr.type}
                          </span>
                        </td>
                        <td className={`py-4 px-2 font-bold ${tr.type === 'IN' ? 'text-green-500' : tr.type === 'OUT' ? 'text-red-500' : 'text-indigo-500'}`}>
                          {tr.type === 'IN' ? '+' : tr.type === 'OUT' ? '-' : '⇄'}{tr.quantity}
                        </td>
                        <td className="py-4 px-2 font-bold text-xs opacity-60">{tr.workShift}</td>
                        <td className="py-4 px-2 text-[10px] text-slate-400 italic">
                          {tr.type === 'SHIFT' ? (
                            <span>{tr.fromLocation} → {tr.toLocation}</span>
                          ) : (
                            <span>{tr.type === 'IN' ? 'Langsung Masuk' : 'Keluar/Audit'}</span>
                          )}
                        </td>
                        <td className="py-4 px-2">
                           <div className="flex items-center space-x-1">
                              <i className="fas fa-user-circle text-[10px] opacity-40"></i>
                              <span className="font-bold text-xs text-indigo-500 opacity-80">{tr.performedBy}</span>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-20 text-center opacity-40">
                  <i className="fas fa-history text-5xl mb-4"></i>
                  <p>Tidak ada histori transaksi tercatat.</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-500/10 flex justify-end">
               <button 
                 onClick={() => setSelectedItemHistory(null)}
                 className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all"
               >
                 Tutup
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainWarehouseView;
