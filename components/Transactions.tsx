
import React, { useState, useRef, useEffect } from 'react';
import { InventoryItem, Transaction, TransactionType, UserRole, WorkShift, ItemCondition } from '../types';
import { generatePdfReport } from '../services/pdfService';

interface TransactionsProps {
  items: InventoryItem[];
  transactions: Transaction[];
  onAddTransaction: (transaction: Transaction) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  theme: 'light' | 'dark';
  t: (key: string) => string;
  user: { name: string; role: UserRole };
}

const Transactions: React.FC<TransactionsProps> = ({ 
  items, 
  transactions, 
  onAddTransaction, 
  onUpdateTransaction,
  onDeleteTransaction,
  theme, 
  t, 
  user 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Searchable Item Dropdown States
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const itemDropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<Partial<Transaction>>({
    itemId: '',
    type: 'OUT',
    quantity: 1,
    workShift: 'SHIFT_1',
    itemCondition: 'GOOD',
    fromLocation: '',
    toLocation: 'Gudang Utama',
    notes: '',
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

  const filteredItemsForDropdown = items.filter(item => 
    item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
    item.size.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(itemSearchQuery.toLowerCase())
  );

  const filteredTransactions = transactions.filter(tr => 
    tr.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tr.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tr.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tr.workShift.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSave = () => {
    if (!formData.itemId || !formData.quantity || formData.quantity <= 0) return;

    const item = items.find(i => i.id === formData.itemId);
    if (!item) return;

    const baseData = {
      itemId: formData.itemId,
      itemName: item.name,
      type: formData.type as TransactionType,
      quantity: formData.quantity,
      workShift: formData.workShift as WorkShift,
      itemCondition: formData.itemCondition as ItemCondition,
      fromLocation: formData.type === 'SHIFT' ? formData.fromLocation : undefined,
      toLocation: formData.type === 'SHIFT' ? formData.toLocation : undefined,
      notes: formData.notes,
    };

    if (editingId) {
      const updatedTransaction: Transaction = {
        ...transactions.find(tr => tr.id === editingId)!,
        ...baseData,
      } as Transaction;
      onUpdateTransaction(updatedTransaction);
    } else {
      const newTransaction: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        ...baseData,
        date: new Date().toISOString(),
        performedBy: user.name,
      } as Transaction;
      onAddTransaction(newTransaction);
    }
    resetForm();
  };

  const handleEdit = (tr: Transaction) => {
    setEditingId(tr.id);
    const item = items.find(i => i.id === tr.itemId);
    setItemSearchQuery(item ? `${item.name} (${item.size})` : '');
    setFormData({
      itemId: tr.itemId,
      type: tr.type,
      quantity: tr.quantity,
      workShift: tr.workShift,
      itemCondition: tr.itemCondition || 'GOOD',
      fromLocation: tr.fromLocation,
      toLocation: tr.toLocation,
      notes: tr.notes,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ itemId: '', type: 'OUT', quantity: 1, workShift: 'SHIFT_1', itemCondition: 'GOOD', fromLocation: '', toLocation: 'Gudang Utama', notes: '' });
    setItemSearchQuery('');
    setShowModal(false);
    setEditingId(null);
  };

  const selectItem = (item: InventoryItem) => {
    setFormData({ ...formData, itemId: item.id, fromLocation: item.location });
    setItemSearchQuery(`${item.name} (${item.size})`);
    setIsItemDropdownOpen(false);
  };

  const handleExportPdf = () => {
    const headers = ["Tanggal", "Shift", "Barang", "Kondisi", "Tipe", "Qty", "Oleh"];
    const data = filteredTransactions.map(tr => [
      new Date(tr.date).toLocaleString(),
      tr.workShift,
      tr.itemName,
      tr.itemCondition === 'DAMAGED' ? 'Tidak Layak' : 'Layak',
      tr.type,
      tr.quantity.toString(),
      tr.performedBy
    ]);

    generatePdfReport({
      title: "LAPORAN HISTORI TRANSAKSI",
      subtitle: `Catatan mutasi, barang masuk, dan barang keluar (${filteredTransactions.length} rekaman)`,
      userName: user.name,
      headers,
      data,
      fileName: "Transactions_History_Report"
    });
  };

  const cardClass = `p-8 rounded-3xl shadow-sm border transition-all ${
    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
  }`;

  const inputClass = `w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
    theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;

  const selectClass = `w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer ${
    theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;

  const dropdownMenuClass = `absolute z-[60] left-0 right-0 mt-2 max-h-60 overflow-y-auto rounded-2xl border shadow-2xl animate-fadeIn ${
    theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
  }`;

  const getShiftLabel = (shift: WorkShift) => {
    switch (shift) {
      case 'SHIFT_1': return t('shift1');
      case 'SHIFT_2': return t('shift2');
      case 'SHIFT_3': return t('shift3');
      case 'ADMIN': return t('adminShift');
      default: return shift;
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{t('transactions')}</h2>
          <p className="text-slate-500">Log aktivitas mutasi, penambahan, dan pengeluaran barang.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleExportPdf}
            className="flex items-center space-x-2 px-5 py-2.5 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-rose-600/20 active:scale-95 transition-all"
          >
            <i className="fas fa-file-pdf"></i>
            <span>Export PDF</span>
          </button>
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text"
              placeholder={t('searchItems')}
              className={`${inputClass} pl-11 py-2.5 sm:w-64`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className={cardClass}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={`uppercase text-[10px] font-black tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>
              <tr>
                <th className="px-6 py-4">{t('date')}</th>
                <th className="px-6 py-4">{t('workShift')}</th>
                <th className="px-6 py-4">{t('itemName')}</th>
                <th className="px-6 py-4">Kondisi</th>
                <th className="px-6 py-4">{t('type')}</th>
                <th className="px-6 py-4">{t('quantity')}</th>
                <th className="px-6 py-4">{t('performedBy')}</th>
                <th className="px-6 py-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-gray-100'}`}>
              {filteredTransactions.map((tr) => (
                <tr key={tr.id} className={`group ${theme === 'dark' ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4 text-xs font-mono text-slate-500">
                    {new Date(tr.date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
                      {getShiftLabel(tr.workShift)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-gray-800'}`}>{tr.itemName}</p>
                    {tr.type === 'SHIFT' && (
                       <p className="text-[10px] text-slate-400 italic">
                         {tr.fromLocation} <i className="fas fa-arrow-right mx-1"></i> {tr.toLocation}
                       </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      tr.itemCondition === 'DAMAGED' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                    }`}>
                      {tr.itemCondition === 'DAMAGED' ? 'Tidak Layak' : 'Layak'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                      tr.type === 'IN' ? 'bg-green-500/10 text-green-600' : 
                      tr.type === 'OUT' ? 'bg-red-500/10 text-red-600' :
                      'bg-indigo-500/10 text-indigo-600'
                    }`}>
                      {tr.type === 'IN' ? t('stockIn') : tr.type === 'OUT' ? t('stockOut') : t('shifting')}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-bold ${tr.type === 'IN' ? 'text-green-500' : tr.type === 'OUT' ? 'text-red-500' : 'text-indigo-500'}`}>
                    {tr.type === 'IN' ? '+' : tr.type === 'OUT' ? '-' : '⇄'}{tr.quantity}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{tr.performedBy}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(tr)} className="p-2 text-indigo-500 hover:bg-indigo-500 hover:text-white rounded-lg transition-all"><i className="fas fa-edit text-xs"></i></button>
                      {(user.role === UserRole.ADMIN || user.role === UserRole.LEADER) && (
                        <button onClick={() => onDeleteTransaction(tr.id)} className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"><i className="fas fa-trash text-xs"></i></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-visible ${theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
              <h3 className="text-xl font-bold">{editingId ? t('editTransaction') : t('addTransaction')}</h3>
              <button onClick={resetForm} className="opacity-60 hover:opacity-100 transition-opacity"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-1 relative" ref={itemDropdownRef}>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('selectItem')}</label>
                <div className="relative">
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input 
                    type="text"
                    className={`${inputClass} pl-11`}
                    placeholder={t('selectItem')}
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
                    {filteredItemsForDropdown.length > 0 ? (
                      filteredItemsForDropdown.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`w-full text-left px-5 py-3 text-sm transition-colors border-b last:border-0 ${
                            theme === 'dark' 
                              ? 'border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white' 
                              : 'border-gray-50 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                          }`}
                          onClick={() => selectItem(item)}
                        >
                          <div className="font-bold">{item.name}</div>
                          <div className="text-[10px] uppercase tracking-widest opacity-60 flex justify-between">
                            <span>{item.category} • {item.size} • <span className="text-indigo-500">{item.location}</span></span>
                            <span>Stock: {item.expectedQty} {item.unit}</span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-5 py-8 text-center text-slate-500">
                        <i className="fas fa-box-open mb-2 block text-xl opacity-20"></i>
                        <span className="text-xs">No items found matching "{itemSearchQuery}"</span>
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
                    Layak (Good)
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setFormData({...formData, itemCondition: 'DAMAGED', type: 'SHIFT', toLocation: 'Pemusnahan'});
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.itemCondition === 'DAMAGED' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500'}`}
                  >
                    Tidak Layak (Damaged)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('type')}</label>
                  <div className="relative">
                    <select className={selectClass} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}>
                      <option value="IN">{t('stockIn')}</option>
                      <option value="OUT">{t('stockOut')}</option>
                      <option value="SHIFT">{t('shifting')}</option>
                    </select>
                    <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('quantity')}</label>
                  <input type="number" className={inputClass} value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} />
                </div>
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

              {formData.type === 'SHIFT' && (
                <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('fromLocation')}</label>
                    <input className={inputClass} value={formData.fromLocation} onChange={e => setFormData({...formData, fromLocation: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('toLocation')}</label>
                    <div className="relative">
                      <select className={selectClass} value={formData.toLocation} onChange={e => setFormData({...formData, toLocation: e.target.value})}>
                        <option value="Gudang Utama">Gudang Utama</option>
                        <option value="Gudang Singles">Gudang Singles</option>
                        <option value="Gudang Nugget">Gudang Nugget</option>
                        <option value="Repair">Repair</option>
                        <option value="Pemusnahan">Pemusnahan</option>
                      </select>
                      <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('notes')}</label>
                <textarea className={`${inputClass} h-24 resize-none`} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
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

export default Transactions;
