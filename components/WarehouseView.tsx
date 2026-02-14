
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { InventoryItem, Transaction, UserRole, TransactionType, WorkShift, ItemCondition } from '../types';
import { generatePdfReport } from '../services/pdfService';

interface WarehouseViewProps {
  items: InventoryItem[];
  transactions: Transaction[];
  theme: 'light' | 'dark';
  t: (key: string) => string;
  targetLocation: string;
  titleKey: string;
  onAddTransaction: (transaction: Transaction) => void;
  user: { name: string; role: UserRole };
}

type OutputReason = 'KELUAR_SINGLES' | 'KELUAR_NUGGET' | 'KELUAR_UTAMA' | 'REPAIR' | 'PEMUSNAHAN' | 'OTHER';
type InputSource = 'SUPPLIER' | 'RETUR_SINGLES' | 'RETUR_NUGGET' | 'DARI_UTAMA' | 'OTHER_IN';
type TransactionFlow = 'IN' | 'OUT';

const WarehouseView: React.FC<WarehouseViewProps> = ({ 
  items, transactions, theme, t, targetLocation, titleKey, onAddTransaction, user 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemHistory, setSelectedItemHistory] = useState<InventoryItem | null>(null);
  
  // Transaction Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState<InventoryItem | null>(null);
  const [showDestructionModal, setShowDestructionModal] = useState<InventoryItem | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const itemDropdownRef = useRef<HTMLDivElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [transactionFlow, setTransactionFlow] = useState<TransactionFlow>('OUT');
  const [outputReason, setOutputReason] = useState<OutputReason>('KELUAR_UTAMA');
  const [inputSource, setInputSource] = useState<InputSource>('DARI_UTAMA');
  const [customReason, setCustomReason] = useState('');

  const [formData, setFormData] = useState<Partial<Transaction>>({
    itemId: '',
    type: 'SHIFT',
    quantity: 1,
    workShift: 'SHIFT_1',
    itemCondition: 'GOOD',
    fromLocation: targetLocation,
    toLocation: 'Gudang Utama',
    notes: '',
  });

  const [returnFormData, setReturnFormData] = useState({
    quantity: 1,
    toLocation: 'Gudang Utama',
    notes: 'Barang kembali dari perbaikan'
  });

  const [destructionFormData, setDestructionFormData] = useState({
    quantity: 1,
    notes: 'Barang telah dimusnahkan secara permanen'
  });

  // Handle clicks outside the searchable dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (itemDropdownRef.current && !itemDropdownRef.current.contains(event.target as Node)) {
        setIsItemDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync reason selection with form data based on flow and current location
  useEffect(() => {
    let fromLoc = targetLocation;
    let toLoc = '';
    let type: TransactionType = 'SHIFT';
    let defaultNotes = '';

    if (transactionFlow === 'IN') {
      switch (inputSource) {
        case 'SUPPLIER':
          fromLoc = 'Supplier / Pusat';
          type = 'IN';
          defaultNotes = `Penerimaan barang baru dari Supplier di ${targetLocation}`;
          break;
        case 'RETUR_SINGLES':
          fromLoc = 'Gudang Singles';
          type = 'SHIFT';
          toLoc = targetLocation;
          defaultNotes = `Retur barang dari Gudang Singles ke ${targetLocation}`;
          break;
        case 'RETUR_NUGGET':
          fromLoc = 'Gudang Nugget';
          type = 'SHIFT';
          toLoc = targetLocation;
          defaultNotes = `Retur barang dari Gudang Nugget ke ${targetLocation}`;
          break;
        case 'DARI_UTAMA':
          fromLoc = 'Gudang Utama';
          type = 'SHIFT';
          toLoc = targetLocation;
          defaultNotes = `Penerimaan mutasi dari Gudang Utama ke ${targetLocation}`;
          break;
        case 'OTHER_IN':
          fromLoc = 'Lainnya';
          type = 'IN';
          defaultNotes = customReason || `Penerimaan Lainnya di ${targetLocation}`;
          break;
      }
    } else {
      // OUT FLOW
      fromLoc = targetLocation;
      switch (outputReason) {
        case 'KELUAR_SINGLES':
          type = 'SHIFT';
          toLoc = 'Gudang Singles';
          defaultNotes = `Mutasi barang dari ${targetLocation} ke Gudang Singles`;
          break;
        case 'KELUAR_NUGGET':
          type = 'SHIFT';
          toLoc = 'Gudang Nugget';
          defaultNotes = `Mutasi barang dari ${targetLocation} ke Gudang Nugget`;
          break;
        case 'KELUAR_UTAMA':
          type = 'SHIFT';
          toLoc = 'Gudang Utama';
          defaultNotes = `Mutasi balik dari ${targetLocation} ke Gudang Utama`;
          break;
        case 'REPAIR':
          type = 'SHIFT';
          toLoc = 'Repair';
          defaultNotes = `Kirim barang dari ${targetLocation} ke Repair`;
          break;
        case 'PEMUSNAHAN':
          type = 'SHIFT';
          toLoc = 'Pemusnahan';
          defaultNotes = `Kirim barang dari ${targetLocation} ke Pemusnahan`;
          break;
        case 'OTHER':
          type = 'OUT';
          toLoc = '';
          defaultNotes = customReason || `Pengeluaran barang dari ${targetLocation}`;
          break;
      }
    }

    setFormData(prev => ({ 
      ...prev, 
      type, 
      fromLocation: fromLoc, 
      toLocation: type === 'SHIFT' ? toLoc : undefined, 
      notes: defaultNotes 
    }));
  }, [transactionFlow, outputReason, inputSource, customReason, targetLocation]);

  // Catalog generation based on Master Data
  const catalogItems = useMemo(() => {
    const unique = new Map<string, InventoryItem>();
    items.forEach(item => {
      const key = `${item.name}-${item.size}`;
      if (!unique.has(key)) {
        unique.set(key, item);
      }
    });
    
    return Array.from(unique.values()).map(def => {
      const existingInTarget = items.find(i => i.name === def.name && i.size === def.size && i.location === targetLocation);
      
      const totalIn = transactions
        .filter(tr => tr.itemName === def.name && 
                     (items.find(i => i.id === tr.itemId)?.size === def.size) && 
                     ((tr.type === 'IN' && (activeLocation(tr, items) === targetLocation)) || 
                      (tr.type === 'SHIFT' && tr.toLocation === targetLocation)))
        .reduce((sum, tr) => sum + tr.quantity, 0);

      return {
        ...def,
        id: existingInTarget ? existingInTarget.id : def.id,
        expectedQty: existingInTarget ? existingInTarget.expectedQty : 0,
        location: targetLocation,
        totalIn: totalIn
      };
    });
  }, [items, transactions, targetLocation]);

  const activeLocation = (tr: Transaction, allItems: InventoryItem[]) => {
    const item = allItems.find(i => i.id === tr.itemId);
    return item?.location;
  };

  const filteredCatalog = useMemo(() => {
    if (!searchTerm) return catalogItems;
    const searchLower = searchTerm.toLowerCase();
    return catalogItems.filter(item => 
      item.name.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower) ||
      item.size.toLowerCase().includes(searchLower)
    );
  }, [catalogItems, searchTerm]);

  const handleExportPdf = () => {
    const headers = ["Nama Item", "Kategori", "Size", "Satuan", "Total Inbound", `Stok ${targetLocation}`];
    const data = filteredCatalog.map(i => [
      i.name,
      i.category,
      i.size,
      i.unit,
      i.totalIn.toString(),
      i.expectedQty.toString()
    ]);

    generatePdfReport({
      title: `LAPORAN INVENTARIS: ${targetLocation.toUpperCase()}`,
      subtitle: `Daftar katalog barang dan status stok di lokasi ${targetLocation}`,
      userName: user.name,
      headers,
      data,
      fileName: `Warehouse_${targetLocation.replace(/\s/g, '_')}_Report`
    });
  };

  const handleSaveTransaction = () => {
    setErrorMsg(null);
    if (!formData.itemId || !formData.quantity || formData.quantity <= 0) {
      setErrorMsg("Mohon masukkan barang dan jumlah yang valid.");
      return;
    }

    const itemDef = items.find(i => i.id === formData.itemId);
    if (!itemDef) return;

    // Validation: Check for negative stock if moving OUT of targetLocation
    if (transactionFlow === 'OUT') {
      const warehouseItem = catalogItems.find(i => i.name === itemDef.name && i.size === itemDef.size);
      const availableStock = warehouseItem ? warehouseItem.expectedQty : 0;
      
      if (availableStock < formData.quantity) {
        setErrorMsg(`Stok tidak mencukupi di ${targetLocation}. Tersedia: ${availableStock}.`);
        return;
      }
    }

    const existingInTarget = items.find(i => i.name === itemDef.name && i.size === itemDef.size && i.location === targetLocation);
    const finalNotes = (transactionFlow === 'OUT' && outputReason === 'OTHER') || (transactionFlow === 'IN' && inputSource === 'OTHER_IN') ? customReason : formData.notes;

    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      itemId: existingInTarget ? existingInTarget.id : itemDef.id, 
      itemName: itemDef.name,
      type: formData.type as TransactionType,
      quantity: formData.quantity!,
      workShift: formData.workShift as WorkShift,
      itemCondition: formData.itemCondition as ItemCondition,
      fromLocation: formData.fromLocation || targetLocation,
      toLocation: formData.type === 'SHIFT' ? formData.toLocation : undefined,
      notes: finalNotes,
      date: new Date().toISOString(),
      performedBy: user.name,
    };

    onAddTransaction(newTransaction);
    resetAddForm();
  };

  const handleConfirmReturn = () => {
    if (!showReturnModal) return;
    
    if (returnFormData.quantity > showReturnModal.expectedQty) {
      alert("Jumlah yang kembali tidak boleh lebih dari jumlah yang sedang diperbaiki.");
      return;
    }

    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      itemId: showReturnModal.id,
      itemName: showReturnModal.name,
      type: 'SHIFT',
      quantity: returnFormData.quantity,
      workShift: 'ADMIN',
      itemCondition: 'GOOD',
      fromLocation: 'Repair',
      toLocation: returnFormData.toLocation,
      notes: returnFormData.notes,
      date: new Date().toISOString(),
      performedBy: user.name,
    };

    onAddTransaction(newTransaction);
    setShowReturnModal(null);
    setReturnFormData({ quantity: 1, toLocation: 'Gudang Utama', notes: 'Barang kembali dari perbaikan' });
  };

  const handleConfirmDestruction = () => {
    if (!showDestructionModal) return;

    if (destructionFormData.quantity > showDestructionModal.expectedQty) {
      alert("Jumlah yang dimusnahkan tidak boleh lebih dari stok yang ada di lokasi pemusnahan.");
      return;
    }

    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      itemId: showDestructionModal.id,
      itemName: showDestructionModal.name,
      type: 'OUT',
      quantity: destructionFormData.quantity,
      workShift: 'ADMIN',
      itemCondition: 'DAMAGED',
      fromLocation: 'Pemusnahan',
      notes: destructionFormData.notes,
      date: new Date().toISOString(),
      performedBy: user.name,
    };

    onAddTransaction(newTransaction);
    setShowDestructionModal(null);
    setDestructionFormData({ quantity: 1, notes: 'Barang telah dimusnahkan secara permanen' });
  };

  const resetAddForm = () => {
    setTransactionFlow('OUT');
    setFormData({ itemId: '', type: 'SHIFT', quantity: 1, workShift: 'SHIFT_1', itemCondition: 'GOOD', fromLocation: targetLocation, toLocation: 'Gudang Utama', notes: '' });
    setItemSearchQuery('');
    setOutputReason(targetLocation === 'Gudang Utama' ? 'KELUAR_SINGLES' : 'KELUAR_UTAMA');
    setInputSource(targetLocation === 'Gudang Utama' ? 'SUPPLIER' : 'DARI_UTAMA');
    setCustomReason('');
    setShowAddModal(false);
    setErrorMsg(null);
  };

  const selectItemForTransaction = (item: InventoryItem) => {
    setFormData({ ...formData, itemId: item.id });
    setItemSearchQuery(`${item.name} (${item.size})`);
    setIsItemDropdownOpen(false);
    setErrorMsg(null);
  };

  const selectedItemTransactions = useMemo(() => {
    if (!selectedItemHistory) return [];
    return transactions
      .filter(tr => tr.itemName === selectedItemHistory.name && 
                   (tr.type === 'IN' || tr.type === 'OUT' || tr.toLocation === targetLocation || tr.fromLocation === targetLocation))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedItemHistory, transactions, targetLocation]);

  const cardClass = `p-8 rounded-3xl shadow-sm border transition-all ${
    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
  }`;

  const inputClass = `pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all ${
    theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;

  const modalInputClass = `w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
    theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;

  const selectClass = `w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer ${
    theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;

  const dropdownMenuClass = `absolute z-[110] left-0 right-0 mt-2 max-h-60 overflow-y-auto rounded-2xl border shadow-2xl animate-fadeIn ${
    theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
  }`;

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-800';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className={`text-3xl font-extrabold ${textPrimary}`}>{t(titleKey)}</h2>
          <p className={textSecondary}>Manajemen stok {targetLocation} berpatokan pada Master Data.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
          <button 
            onClick={handleExportPdf}
            className="flex items-center justify-center space-x-2 bg-rose-600/10 text-rose-600 border border-rose-600/20 px-5 py-2.5 rounded-2xl font-bold transition-all active:scale-95 w-full sm:w-auto text-[10px] uppercase tracking-widest"
          >
            <i className="fas fa-file-pdf"></i>
            <span>Export PDF</span>
          </button>
          <div className="relative w-full sm:w-auto">
            <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            <input 
              type="text" 
              placeholder={t('searchItems')}
              className={`${inputClass} w-full sm:w-64`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 transition-all active:scale-95 w-full sm:w-auto"
          >
            <i className="fas fa-plus"></i>
            <span>Transaksi Baru</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-8">
            <h3 className={`text-xl font-bold ${textPrimary}`}>
              <i className="fas fa-boxes-packing mr-3 text-indigo-500"></i>
              Katalog Barang ({targetLocation})
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
                  <th className="px-4 py-4 text-center">Inbound</th>
                  <th className="px-4 py-4 text-center">Stok {targetLocation}</th>
                  <th className="px-4 py-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-gray-100'}`}>
                {filteredCatalog.map(item => (
                  <tr key={`${item.name}-${item.size}`} className={`group transition-colors ${theme === 'dark' ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
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
                      <span className={`font-mono font-bold ${item.totalIn > 0 ? 'text-green-500' : 'text-slate-400 opacity-30'}`}>
                        {item.totalIn > 0 ? `+${item.totalIn}` : '0'}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-center">
                       <span className={`font-black text-lg ${item.expectedQty > 0 ? 'text-indigo-600' : 'text-slate-400 opacity-20'}`}>
                         {item.expectedQty}
                       </span>
                    </td>
                    <td className="px-4 py-5 text-right">
                      <div className="flex justify-end items-center space-x-2">
                        {targetLocation === 'Repair' && item.expectedQty > 0 && (
                          <button 
                            onClick={() => setShowReturnModal(item)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-all text-[10px] font-bold uppercase tracking-tighter"
                            title="Konfirmasi Kembali"
                          >
                            <i className="fas fa-undo"></i>
                            <span>Kembali</span>
                          </button>
                        )}
                        {targetLocation === 'Pemusnahan' && item.expectedQty > 0 && (
                          <button 
                            onClick={() => setShowDestructionModal(item)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all text-[10px] font-bold uppercase tracking-tighter"
                            title="Konfirmasi Pemusnahan"
                          >
                            <i className="fas fa-fire"></i>
                            <span>Musnahkan</span>
                          </button>
                        )}
                        <button 
                          onClick={() => setSelectedItemHistory(item)}
                          className="p-2 text-indigo-500 hover:bg-indigo-500 hover:text-white rounded-lg transition-all md:opacity-0 group-hover:opacity-100"
                          title="Lihat Histori"
                        >
                          <i className="fas fa-history text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCatalog.length === 0 && (
            <div className="py-24 text-center opacity-30">
              <i className="fas fa-magnifying-glass text-6xl mb-4"></i>
              <p className="text-sm font-bold">Barang tidak ditemukan di Master Data.</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-visible ${theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
              <h3 className="text-xl font-bold">Transaksi Baru ({targetLocation})</h3>
              <button onClick={resetAddForm} className="opacity-60 hover:opacity-100 transition-opacity"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="p-8 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-xl flex items-center animate-bounce">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Alur Transaksi</label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button 
                    type="button"
                    onClick={() => {
                      setTransactionFlow('IN');
                      setInputSource(targetLocation === 'Gudang Utama' ? 'SUPPLIER' : 'DARI_UTAMA');
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${transactionFlow === 'IN' ? 'bg-green-600 text-white shadow-sm' : 'text-slate-500'}`}
                  >
                    Barang Masuk (Inbound)
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setTransactionFlow('OUT');
                      setOutputReason(targetLocation === 'Gudang Utama' ? 'KELUAR_SINGLES' : 'KELUAR_UTAMA');
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${transactionFlow === 'OUT' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}
                  >
                    Kirim / Keluar (Outbound)
                  </button>
                </div>
              </div>

              <div className="space-y-1 relative" ref={itemDropdownRef}>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Pilih Barang Katalog</label>
                <div className="relative">
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input 
                    type="text"
                    className={`${modalInputClass} pl-11`}
                    placeholder="Ketik nama barang..."
                    value={itemSearchQuery}
                    onChange={(e) => {
                      setItemSearchQuery(e.target.value);
                      setIsItemDropdownOpen(true);
                      if (formData.itemId) setFormData({ ...formData, itemId: '' });
                    }}
                    onFocus={() => setIsItemDropdownOpen(true)}
                  />
                  {formData.itemId && (
                    <i className="fas fa-check-circle absolute right-4 top-1/2 -translate-y-1/2 text-green-500"></i>
                  )}
                </div>
                
                {isItemDropdownOpen && (
                  <div className={dropdownMenuClass}>
                    {catalogItems.filter(item => 
                      item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
                      item.size.toLowerCase().includes(itemSearchQuery.toLowerCase())
                    ).length > 0 ? (
                      catalogItems.filter(item => 
                        item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
                        item.size.toLowerCase().includes(itemSearchQuery.toLowerCase())
                      ).map((item) => (
                        <button
                          key={`${item.name}-${item.size}`}
                          type="button"
                          className={`w-full text-left px-5 py-3 text-sm transition-colors border-b last:border-0 ${
                            theme === 'dark' 
                              ? 'border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white' 
                              : 'border-gray-50 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                          }`}
                          onClick={() => selectItemForTransaction(item)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold">{item.name}</span>
                            <span className="text-[8px] bg-slate-500/20 text-slate-500 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Master</span>
                          </div>
                          <div className="text-[10px] uppercase tracking-widest opacity-60 flex justify-between">
                            <span>{item.category} • {item.size}</span>
                            <span className="text-indigo-500 font-black">Stok {targetLocation}: {item.expectedQty} {item.unit}</span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-5 py-8 text-center text-slate-500">
                        <i className="fas fa-box-open mb-2 block text-xl opacity-20"></i>
                        <span className="text-xs">Barang tidak ditemukan di Master Data.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Kondisi Barang</label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, itemCondition: 'GOOD'})}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.itemCondition === 'GOOD' ? 'bg-green-500 text-white shadow-sm' : 'text-slate-500'}`}
                  >
                    Layak
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, itemCondition: 'DAMAGED'})}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.itemCondition === 'DAMAGED' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500'}`}
                  >
                    Tidak Layak
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  {transactionFlow === 'IN' ? 'Sumber / Asal Barang' : 'Tujuan / Jenis Transaksi'}
                </label>
                <div className="relative">
                  {transactionFlow === 'IN' ? (
                    <select 
                      className={selectClass} 
                      value={inputSource} 
                      onChange={e => setInputSource(e.target.value as InputSource)}
                    >
                      <option value="DARI_UTAMA">Dari Gudang Utama</option>
                      {targetLocation === 'Gudang Utama' && (
                        <>
                          <option value="SUPPLIER">Penerimaan Supplier</option>
                          <option value="RETUR_SINGLES">Retur dari Singles</option>
                          <option value="RETUR_NUGGET">Retur dari Nugget</option>
                        </>
                      )}
                      <option value="OTHER_IN">Lainnya / Masuk Umum</option>
                    </select>
                  ) : (
                    <select 
                      className={selectClass} 
                      value={outputReason} 
                      onChange={e => setOutputReason(e.target.value as OutputReason)}
                    >
                      <option value="KELUAR_UTAMA">Ke Gudang Utama</option>
                      {targetLocation === 'Gudang Utama' && (
                        <>
                          <option value="KELUAR_SINGLES">Kirim ke Singles</option>
                          <option value="KELUAR_NUGGET">Kirim ke Nugget</option>
                        </>
                      )}
                      <option value="REPAIR">Kirim ke Repair</option>
                      <option value="PEMUSNAHAN">Kirim ke Pemusnahan</option>
                      <option value="OTHER">Pengeluaran / Lainnya</option>
                    </select>
                  )}
                  <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                </div>
              </div>

              {((transactionFlow === 'IN' && inputSource === 'OTHER_IN') || (transactionFlow === 'OUT' && outputReason === 'OTHER')) && (
                 <div className="space-y-1 animate-fadeIn">
                   <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Keterangan Khusus</label>
                   <input 
                     type="text" 
                     className={modalInputClass} 
                     placeholder="Tulis alasan khusus..."
                     value={customReason} 
                     onChange={e => setCustomReason(e.target.value)}
                   />
                 </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('quantity')}</label>
                  <input 
                    type="number" 
                    className={modalInputClass} 
                    value={formData.quantity} 
                    onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('workShift')}</label>
                  <div className="relative">
                    <select className={selectClass} value={formData.workShift} onChange={e => setFormData({...formData, workShift: e.target.value as WorkShift})}>
                      <option value="SHIFT_1">{t('shift1')}</option>
                      <option value="SHIFT_2">{t('shift2')}</option>
                      <option value="SHIFT_3">{t('shift3')}</option>
                      <option value="ADMIN">{t('adminShift')}</option>
                    </select>
                    <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('notes')}</label>
                <textarea 
                  className={`${modalInputClass} h-20 resize-none`} 
                  placeholder="Keterangan tambahan..."
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                />
              </div>

              <div className="flex space-x-3 pt-6">
                <button onClick={resetAddForm} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border ${theme === 'dark' ? 'border-slate-800 text-slate-500 hover:bg-slate-800' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>{t('cancel')}</button>
                <button onClick={handleSaveTransaction} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-95">{t('saveItem')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className="bg-green-600 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Konfirmasi Kembali</h3>
                <p className="text-xs opacity-80">{showReturnModal.name}</p>
              </div>
              <button onClick={() => setShowReturnModal(null)} className="opacity-60 hover:opacity-100 transition-opacity"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="p-8 space-y-4">
               <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Jumlah yang Kembali (Maks: {showReturnModal.expectedQty})</label>
                <input 
                  type="number" 
                  className={modalInputClass} 
                  value={returnFormData.quantity} 
                  onChange={e => setReturnFormData({...returnFormData, quantity: parseInt(e.target.value) || 0})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Tujuan Pengembalian</label>
                <div className="relative">
                  <select 
                    className={selectClass} 
                    value={returnFormData.toLocation} 
                    onChange={e => setReturnFormData({...returnFormData, toLocation: e.target.value})}
                  >
                    <option value="Gudang Utama">Gudang Utama</option>
                    <option value="Gudang Singles">Gudang Singles</option>
                    <option value="Gudang Nugget">Gudang Nugget</option>
                  </select>
                  <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Keterangan</label>
                <textarea 
                  className={`${modalInputClass} h-20 resize-none`} 
                  value={returnFormData.notes} 
                  onChange={e => setReturnFormData({...returnFormData, notes: e.target.value})} 
                />
              </div>
              <div className="flex space-x-3 pt-6">
                <button onClick={() => setShowReturnModal(null)} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border ${theme === 'dark' ? 'border-slate-800 text-slate-500 hover:bg-slate-800' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>Batal</button>
                <button onClick={handleConfirmReturn} className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-green-700 shadow-xl shadow-green-600/20 active:scale-95">Simpan & Kembalikan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDestructionModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className="bg-red-600 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Konfirmasi Pemusnahan</h3>
                <p className="text-xs opacity-80">{showDestructionModal.name}</p>
              </div>
              <button onClick={() => setShowDestructionModal(null)} className="opacity-60 hover:opacity-100 transition-opacity"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="p-8 space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <p className="text-xs text-red-600 font-bold flex items-center">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  Tindakan ini permanen. Stok akan dihapus dari sistem.
                </p>
              </div>
               <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Jumlah yang Dimusnahkan (Maks: {showDestructionModal.expectedQty})</label>
                <input 
                  type="number" 
                  className={modalInputClass} 
                  value={destructionFormData.quantity} 
                  onChange={e => setDestructionFormData({...destructionFormData, quantity: parseInt(e.target.value) || 0})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Keterangan / Alasan</label>
                <textarea 
                  className={`${modalInputClass} h-20 resize-none`} 
                  placeholder="Misal: Barang terbakar, kadaluarsa, dll."
                  value={destructionFormData.notes} 
                  onChange={e => setDestructionFormData({...destructionFormData, notes: e.target.value})} 
                />
              </div>
              <div className="flex space-x-3 pt-6">
                <button onClick={() => setShowDestructionModal(null)} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border ${theme === 'dark' ? 'border-slate-800 text-slate-500 hover:bg-slate-800' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>Batal</button>
                <button onClick={handleConfirmDestruction} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 shadow-xl shadow-red-600/20 active:scale-95">Konfirmasi Pemusnahan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedItemHistory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'}`}>
            <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{selectedItemHistory.name}</h3>
                <p className="text-xs opacity-70 uppercase tracking-widest font-black">Histori Transaksi {targetLocation}</p>
              </div>
              <button onClick={() => setSelectedItemHistory(null)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-8 max-h-[70vh] overflow-y-auto">
              {selectedItemTransactions.length > 0 ? (
                <table className="w-full text-left">
                  <thead className={`uppercase text-[10px] font-black tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>
                    <tr>
                      <th className="pb-4 px-2">Tanggal</th>
                      <th className="pb-4 px-2">Jenis</th>
                      <th className="pb-4 px-2">Jumlah</th>
                      <th className="pb-4 px-2">Kondisi</th>
                      <th className="pb-4 px-2">Shift</th>
                      <th className="pb-4 px-2">Keterangan</th>
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
                            'bg-indigo-50 text-white'
                          }`}>
                            {tr.type}
                          </span>
                        </td>
                        <td className={`py-4 px-2 font-bold ${tr.type === 'IN' ? 'text-green-500' : 'text-red-500'}`}>
                          {tr.type === 'IN' ? '+' : '-'}{tr.quantity}
                        </td>
                        <td className="py-4 px-2">
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                             tr.itemCondition === 'DAMAGED' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                           }`}>
                             {tr.itemCondition === 'DAMAGED' ? 'Rsk' : 'Lyk'}
                           </span>
                        </td>
                        <td className="py-4 px-2 font-bold text-xs opacity-60">{tr.workShift}</td>
                        <td className="py-4 px-2 text-[10px] text-slate-400 italic">
                          {tr.type === 'SHIFT' ? `${tr.fromLocation} → ${tr.toLocation}` : (tr.notes || 'Transaksi Umum')}
                        </td>
                        <td className="py-4 px-2">
                           <span className="font-bold text-xs text-indigo-500 opacity-80">{tr.performedBy}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-20 text-center opacity-40">
                  <i className="fas fa-history text-5xl mb-4"></i>
                  <p>Tidak ada histori transaksi tercatat untuk item ini di {targetLocation}.</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-500/10 flex justify-end">
               <button onClick={() => setSelectedItemHistory(null)} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseView;
