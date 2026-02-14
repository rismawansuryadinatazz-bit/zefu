
import React, { useState } from 'react';
import { InventoryItem, UserRole } from '../types';
import { generatePdfReport } from '../services/pdfService';

interface InventoryTableProps {
  items: InventoryItem[];
  role: UserRole;
  userName: string;
  onUpdate: (item: InventoryItem) => void;
  onDelete?: (id: string) => void;
  theme: 'light' | 'dark';
  t: (key: string) => string;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ items, role, userName, onUpdate, onDelete, theme, t }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<InventoryItem>>({});

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.size && item.size.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))];

  const handleStartEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const handleSaveEdit = () => {
    if (editingId && editForm) {
      onUpdate(editForm as InventoryItem);
      setEditingId(null);
    }
  };

  const handleExportPdf = () => {
    const headers = ["Nama Item", "Size", "Ekspektasi", "Aktual", "Selisih", "Status", "Kondisi"];
    const data = filteredItems.map(i => [
      i.name,
      i.size || "-",
      i.expectedQty.toString(),
      i.actualQty.toString(),
      (i.actualQty - i.expectedQty).toString(),
      i.status,
      i.condition
    ]);

    generatePdfReport({
      title: "LAPORAN AUDIT STOK OPNAME",
      subtitle: `Daftar audit inventaris gudang (${filteredItems.length} item)`,
      userName,
      headers,
      data,
      fileName: "Audit_Inventory_Report"
    });
  };

  const containerClass = `rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 ${
    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
  }`;

  const headerClass = `p-6 border-b flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 ${
    theme === 'dark' ? 'border-slate-800 bg-slate-900/50' : 'border-gray-50 bg-white'
  }`;

  const inputClass = `pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all ${
    theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;

  const selectClass = `border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
    theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;

  return (
    <div className={containerClass}>
      <div className={headerClass}>
        <div className="flex items-center space-x-4">
          <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{t('inventoryStatus')}</h3>
          <button 
            onClick={handleExportPdf}
            className="flex items-center space-x-2 px-3 py-1.5 bg-rose-600/10 text-rose-600 rounded-xl font-black text-[10px] uppercase hover:bg-rose-600 hover:text-white transition-all"
          >
            <i className="fas fa-file-pdf"></i>
            <span>Export PDF</span>
          </button>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input 
              type="text" 
              placeholder={t('searchItems')}
              className={`${inputClass} w-full sm:w-64`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className={selectClass}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className={`uppercase text-[10px] font-black tracking-widest ${
            theme === 'dark' ? 'bg-slate-800/50 text-slate-500' : 'bg-gray-50 text-gray-400'
          }`}>
            <tr>
              <th className="px-6 py-5">{t('itemDetails')}</th>
              <th className="px-6 py-5">{t('size')}</th>
              <th className="px-6 py-5">{t('expected')}</th>
              <th className="px-6 py-5">{t('actual')}</th>
              <th className="px-6 py-5">{t('status')}</th>
              <th className="px-6 py-5">{t('condition')}</th>
              <th className="px-6 py-5 text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className={`divide-y text-sm ${theme === 'dark' ? 'divide-slate-800' : 'divide-gray-100'}`}>
            {filteredItems.map(item => (
              <tr key={item.id} className={`transition-colors group ${theme === 'dark' ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
                <td className="px-6 py-4">
                  <div>
                    <p className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-gray-800'}`}>{item.name}</p>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter">{item.category}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold ${theme === 'dark' ? 'bg-slate-800 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    {item.size}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>{item.expectedQty}</span> <span className="text-[10px] opacity-60 uppercase font-black">{item.unit}</span>
                </td>
                <td className="px-6 py-4">
                  {editingId === item.id ? (
                    <input 
                      type="number" 
                      className={`w-20 px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
                        theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300'
                      }`}
                      value={editForm.actualQty}
                      onChange={(e) => setEditForm({ ...editForm, actualQty: parseInt(e.target.value) || 0 })}
                    />
                  ) : (
                    <span className={`text-base font-black px-2 py-0.5 rounded-lg ${
                      item.actualQty !== item.expectedQty 
                        ? 'bg-red-500/10 text-red-500' 
                        : 'bg-green-500/10 text-green-500'
                    }`}>
                      {item.actualQty}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                    item.status === 'APPROVED' ? 'bg-green-500/20 text-green-500' :
                    item.status === 'PENDING' ? 'bg-amber-500/20 text-amber-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                   <span className={`flex items-center space-x-2 font-bold text-xs ${
                     item.condition === 'GOOD' ? 'text-green-500' : 'text-amber-500'
                   }`}>
                     <i className={`fas ${item.condition === 'GOOD' ? 'fa-circle-check' : 'fa-triangle-exclamation'} text-[10px]`}></i>
                     <span className="uppercase tracking-tight">{item.condition}</span>
                   </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {editingId === item.id ? (
                    <div className="flex justify-end space-x-2">
                      <button onClick={handleSaveEdit} className="text-green-500 hover:text-green-400 font-black text-xs uppercase tracking-widest">SAVE</button>
                      <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-400 font-black text-xs uppercase tracking-widest">CANCEL</button>
                    </div>
                  ) : (
                    <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleStartEdit(item)} 
                        className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all"
                        title="Edit Count"
                      >
                        <i className="fas fa-edit text-xs"></i>
                      </button>
                      {role === UserRole.ADMIN && (
                         <button 
                           onClick={() => onDelete?.(item.id)}
                           className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                           title="Delete Item"
                         >
                           <i className="fas fa-trash text-xs"></i>
                         </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredItems.length === 0 && (
        <div className="p-16 text-center">
          <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 ${
            theme === 'dark' ? 'bg-slate-800' : 'bg-gray-50'
          }`}>
             <i className="fas fa-magnifying-glass text-3xl opacity-20"></i>
          </div>
          <p className={theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}>No inventory records matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default InventoryTable;
