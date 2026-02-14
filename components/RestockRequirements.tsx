
import React, { useMemo, useState } from 'react';
import { InventoryItem, UserRole, Transaction } from '../types';
import { generatePdfReport } from '../services/pdfService';

interface RestockRequirementsProps {
  items: InventoryItem[];
  theme: 'light' | 'dark';
  t: (key: string) => string;
  onAddTransaction: (tr: Transaction) => void;
  user: { name: string; role: UserRole };
}

type WarehouseFilter = 'Gudang Singles' | 'Gudang Nugget';
type Period = '1D' | '1W' | '1M';

const RestockRequirements: React.FC<RestockRequirementsProps> = ({ items, theme, t, onAddTransaction, user }) => {
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseFilter>('Gudang Singles');
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('1W');
  const [searchTerm, setSearchTerm] = useState('');
  const [manualQuantities, setManualQuantities] = useState<Record<string, string>>({});

  const getDays = (p: Period) => {
    switch(p) {
      case '1D': return 1;
      case '1W': return 7;
      case '1M': return 30;
      default: return 7;
    }
  };

  const masterCatalog = useMemo(() => {
    const uniqueDefs = new Map<string, InventoryItem>();
    items.forEach(item => {
      const key = `${item.name}-${item.size}`;
      if (!uniqueDefs.has(key) || item.location === 'Gudang Utama') {
        uniqueDefs.set(key, item);
      }
    });

    return Array.from(uniqueDefs.values()).map(def => {
      const targetItem = items.find(i => 
        i.name === def.name && 
        i.size === def.size && 
        i.location === selectedWarehouse
      );

      return {
        ...def,
        id: targetItem ? targetItem.id : def.id,
        expectedQty: targetItem ? targetItem.expectedQty : 0,
        location: selectedWarehouse
      };
    });
  }, [items, selectedWarehouse]);

  const filteredCatalog = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return masterCatalog.filter(i => 
      i.name.toLowerCase().includes(lower) || 
      i.category.toLowerCase().includes(lower) ||
      i.size.toLowerCase().includes(lower)
    );
  }, [masterCatalog, searchTerm]);

  const calculateRequirement = (item: InventoryItem) => {
    const days = getDays(selectedPeriod);
    // Formula: (Usage * Days) * 2
    return Math.ceil((item.dailyUsage || 0) * days * 2);
  };

  const handleManualQtyChange = (itemId: string, val: string) => {
    setManualQuantities(prev => ({ ...prev, [itemId]: val }));
  };

  const processTransaction = (item: InventoryItem, amount: number) => {
    const newTr: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      itemId: item.id,
      itemName: item.name,
      type: 'SHIFT',
      quantity: amount,
      workShift: 'ADMIN',
      itemCondition: 'GOOD',
      fromLocation: 'Gudang Utama',
      toLocation: selectedWarehouse,
      notes: `Restock Otomatis (Periode: ${selectedPeriod} x2). Target aman terpenuhi.`,
      date: new Date().toISOString(),
      performedBy: user.name,
    };
    onAddTransaction(newTr);
  };

  const handleQuickRestock = (item: InventoryItem) => {
    const target = calculateRequirement(item);
    const suggested = Math.max(target - item.expectedQty, 0);
    const manualVal = parseInt(manualQuantities[item.id] || "0");
    const finalAmount = manualVal > 0 ? manualVal : suggested;

    if (finalAmount <= 0) return;
    processTransaction(item, finalAmount);
    setManualQuantities(prev => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  };

  const handleExportPdf = () => {
    const headers = ["Barang", "Size", "Stok Sekarang", "Kebutuhan (x2)", "Status"];
    const data = filteredCatalog.map(item => {
      const target = calculateRequirement(item);
      const status = item.expectedQty === 0 ? "KOSONG" : item.expectedQty < (target / 2) ? "KRITIS" : "AMAN";
      return [item.name, item.size, item.expectedQty.toString(), target.toString(), status];
    });

    generatePdfReport({
      title: `RENCANA KEBUTUHAN STOK: ${selectedWarehouse.toUpperCase()}`,
      subtitle: `Periode: ${selectedPeriod} | Safety Factor: x2`,
      userName: user.name,
      headers,
      data,
      fileName: `Restock_${selectedWarehouse.replace(/\s/g, '_')}`
    });
  };

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-800';
  const cardClass = `p-8 rounded-3xl shadow-sm border transition-all ${
    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
  }`;

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h2 className={`text-3xl font-extrabold ${textPrimary}`}>Kebutuhan Dua Gedung</h2>
          <p className="text-slate-500">Kalkulasi stok aman Singles & Nugget dengan faktor pengali x2.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl shadow-inner border border-slate-300 dark:border-slate-700">
            {(['1D', '1W', '1M'] as Period[]).map(p => (
              <button 
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedPeriod === p ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
              >
                {p === '1D' ? '1 Hari' : p === '1W' ? '1 Minggu' : '1 Bulan'}
              </button>
            ))}
          </div>

          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl shadow-inner border border-slate-300 dark:border-slate-700">
            <button 
              onClick={() => setSelectedWarehouse('Gudang Singles')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedWarehouse === 'Gudang Singles' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
            >
              Singles
            </button>
            <button 
              onClick={() => setSelectedWarehouse('Gudang Nugget')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedWarehouse === 'Gudang Nugget' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
            >
              Nugget
            </button>
          </div>
        </div>
      </header>

      <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-2xl flex items-center space-x-4">
        <div className="bg-indigo-600 p-3 rounded-xl text-white"><i className="fas fa-info-circle"></i></div>
        <p className="text-xs font-bold text-indigo-600">
          Target Stok Aman = (Pemakaian Harian × Jumlah Hari Periode) × 2.
        </p>
      </div>

      <div className={cardClass}>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Cari item..."
              className={`w-full pl-11 pr-4 py-3 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200'}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleExportPdf}
            className="flex items-center space-x-2 bg-rose-600 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-rose-600/20 active:scale-95 transition-all text-xs uppercase"
          >
            <i className="fas fa-file-pdf"></i>
            <span>Download Laporan Kebutuhan</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={`uppercase text-[10px] font-black tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>
              <tr>
                <th className="px-4 py-4">Item (Master)</th>
                <th className="px-4 py-4 text-center">Stok {selectedWarehouse.split(' ')[1]}</th>
                <th className="px-4 py-4 text-center">Target (x2)</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-4 py-4 text-center">Input Manual</th>
                <th className="px-4 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-gray-100'}`}>
              {filteredCatalog.map(item => {
                const target = calculateRequirement(item);
                const gap = Math.max(target - item.expectedQty, 0);
                return (
                  <tr key={`${item.name}-${item.size}`} className={`group transition-colors ${theme === 'dark' ? 'hover:bg-slate-800/30' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-5">
                      <p className="font-bold text-sm">{item.name}</p>
                      <p className="text-[10px] opacity-50 uppercase font-black">{item.size} • Use: {item.dailyUsage}/day</p>
                    </td>
                    <td className="px-4 py-5 text-center font-black text-sm">{item.expectedQty}</td>
                    <td className="px-4 py-5 text-center font-black text-indigo-500 text-sm">{target}</td>
                    <td className="px-4 py-5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${item.expectedQty < (target/2) ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                        {item.expectedQty < (target/2) ? 'Kritis' : 'Aman'}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <input 
                        type="number" 
                        placeholder={gap > 0 ? gap.toString() : '0'}
                        className={`w-20 px-2 py-1.5 rounded-lg border text-xs font-bold text-center ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-100 border-gray-200'}`}
                        value={manualQuantities[item.id] || ''}
                        onChange={(e) => handleManualQtyChange(item.id, e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-5 text-right">
                      <button 
                        onClick={() => handleQuickRestock(item)}
                        className={`p-2 rounded-xl transition-all ${gap > 0 || manualQuantities[item.id] ? 'bg-indigo-600 text-white shadow-lg active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                      >
                        <i className="fas fa-truck-ramp-box"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RestockRequirements;
