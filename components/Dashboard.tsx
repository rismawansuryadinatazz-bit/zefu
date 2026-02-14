import React, { useMemo } from 'react';
import { InventoryItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generatePdfReport } from '../services/pdfService';

interface DashboardProps {
  items: InventoryItem[];
  theme: 'light' | 'dark';
  t: (key: string) => string;
  userName: string;
}

const Dashboard: React.FC<DashboardProps> = ({ items, theme, t, userName }) => {
  const stats = useMemo(() => {
    const total = items.length;
    const missing = items.filter(i => i.actualQty < i.expectedQty).length;
    const damaged = items.filter(i => i.condition !== 'GOOD').length;
    const pending = items.filter(i => i.status === 'PENDING').length;
    const mainWhseCount = items.filter(i => i.location === 'Gudang Utama').length;
    return { total, missing, damaged, pending, mainWhseCount };
  }, [items]);

  const lowStockItems = useMemo(() => {
    return items
      .filter(item => item.expectedQty <= item.minStockThreshold)
      .sort((a, b) => (a.expectedQty / a.minStockThreshold) - (b.expectedQty / b.minStockThreshold))
      .slice(0, 10);
  }, [items]);

  const chartData = useMemo(() => {
    return items.slice(0, 10).map(item => ({
      name: item.name,
      expected: item.expectedQty,
      actual: item.actualQty,
    }));
  }, [items]);

  const handleExportPdf = () => {
    const headers = ["Metrik", "Nilai", "Keterangan"];
    const data = [
      ["Total Barang", stats.total.toString(), "Jumlah seluruh item di sistem"],
      ["Gudang Utama", stats.mainWhseCount.toString(), "Stok tersedia di gudang pusat"],
      ["Selisih Stok", stats.missing.toString(), "Item dengan jumlah aktual < ekspektasi"],
      ["Persetujuan Pending", stats.pending.toString(), "Perlu ditinjau"],
      ["Barang Rusak", stats.damaged.toString(), "Kondisi tidak layak"]
    ];

    generatePdfReport({
      title: "LAPORAN RINGKASAN OPERASIONAL",
      subtitle: "Status inventaris dan performa stok opname real-time.",
      userName,
      headers,
      data,
      fileName: "Dashboard_Report"
    });
  };

  const cardClass = `p-6 rounded-2xl shadow-sm border transition-all ${
    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
  }`;

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-800';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className="space-y-8 pb-10">
      <header className="flex justify-between items-start">
        <div>
          <h2 className={`text-3xl font-extrabold ${textPrimary}`}>{t('operationalOverview')}</h2>
          <p className={textSecondary}>{t('realTimePerformance')}</p>
        </div>
        <button 
          onClick={handleExportPdf}
          className="flex items-center space-x-2 px-6 py-3 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-rose-600/20 active:scale-95 transition-all"
        >
          <i className="fas fa-file-pdf"></i>
          <span>Cetak Ringkasan</span>
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: t('totalItems'), value: stats.total, icon: 'fa-boxes', color: 'bg-indigo-600 shadow-indigo-600/20' },
          { label: t('mainWarehouseStock'), value: stats.mainWhseCount, icon: 'fa-warehouse', color: 'bg-blue-500 shadow-blue-500/20' },
          { label: t('discrepancies'), value: stats.missing, icon: 'fa-exclamation-triangle', color: 'bg-red-500 shadow-red-500/20' },
          { label: t('pendingApproval'), value: stats.pending, icon: 'fa-clock', color: 'bg-amber-500 shadow-amber-500/20' },
          { label: t('damagedGoods'), value: stats.damaged, icon: 'fa-heart-broken', color: 'bg-rose-500 shadow-rose-500/20' },
        ].map((stat, i) => (
          <div key={i} className={cardClass}>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className={`${stat.color} text-white p-3 rounded-xl shadow-lg mb-1`}>
                <i className={`fas ${stat.icon} text-lg`}></i>
              </div>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary}`}>{stat.label}</p>
                <p className={`text-2xl font-black ${textPrimary}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Discrepancy Chart */}
        <div className={`lg:col-span-2 ${cardClass}`}>
          <h3 className={`text-lg font-bold mb-8 flex items-center ${textPrimary}`}>
            <i className="fas fa-chart-bar mr-3 text-indigo-500"></i>
            Analisis Selisih Stok (Top 10)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} 
                />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 11 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 11 }}
                />
                <Tooltip 
                  cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f8fafc' }}
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    color: theme === 'dark' ? '#f1f5f9' : '#1e293b'
                  }}
                />
                <Bar dataKey="expected" fill={theme === 'dark' ? '#334155' : '#e2e8f0'} radius={[6, 6, 0, 0]} name="System Qty" />
                <Bar dataKey="actual" fill="#6366f1" radius={[6, 6, 0, 0]} name="Actual Qty" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="space-y-8">
          <div className={`${cardClass} border-rose-500/20 bg-rose-500/5`}>
            <h3 className={`text-sm font-black uppercase tracking-widest mb-4 flex items-center ${theme === 'dark' ? 'text-rose-400' : 'text-rose-600'}`}>
              <i className="fas fa-bell mr-2 animate-bounce"></i>
              {t('criticalAlerts')}
            </h3>
            <div className="space-y-3">
              {lowStockItems.length > 0 ? (
                lowStockItems.map(item => (
                  <div key={item.id} className={`p-3 rounded-xl border flex justify-between items-center ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                    <div>
                      <p className={`font-bold text-xs ${textPrimary}`}>{item.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{item.location} • {item.size}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-rose-500">{item.expectedQty} <span className="text-[8px] opacity-40 uppercase">{item.unit}</span></p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Min: {item.minStockThreshold}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center opacity-30 italic text-xs">Semua stok terpenuhi.</div>
              )}
            </div>
            {lowStockItems.length > 0 && (
              <p className="mt-4 text-[10px] text-center font-bold text-slate-400">
                {t('itemsToRestock')}
              </p>
            )}
          </div>

          <div className={`${cardClass} bg-indigo-600 text-white border-none shadow-xl shadow-indigo-600/20`}>
             <i className="fas fa-info-circle text-2xl mb-4"></i>
             <h4 className="font-bold text-sm mb-2">Tips Manajemen</h4>
             <p className="text-[10px] leading-relaxed opacity-80">Lakukan stok opname secara rutin setiap akhir shift untuk menjaga akurasi data antara fisik dan sistem.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;