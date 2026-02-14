import React from 'react';

interface QuickGuideProps {
  theme: 'light' | 'dark';
}

const QuickGuide: React.FC<QuickGuideProps> = ({ theme }) => {
  const cardClass = `p-8 rounded-3xl border transition-all ${
    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100 shadow-sm'
  }`;

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header>
        <h2 className={`text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Sistem & Alur Kerja</h2>
        <p className="text-slate-500">Panduan standar operasional sistem Stock Pro 2026.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className={cardClass}>
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl">
              <i className="fas fa-route"></i>
            </div>
            <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>Alur Barang</h3>
          </div>
          <ul className="space-y-4 text-sm text-slate-500">
            <li className="flex items-start">
              <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-[10px] mt-0.5 mr-3 shrink-0">1</span>
              <p><b>Penerimaan:</b> Barang dari supplier masuk melalui Gudang Utama via menu Logistik.</p>
            </li>
            <li className="flex items-start">
              <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-[10px] mt-0.5 mr-3 shrink-0">2</span>
              <p><b>Mutasi:</b> Leader mendistribusikan barang dari Utama ke Gudang Singles atau Nugget.</p>
            </li>
            <li className="flex items-start">
              <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-[10px] mt-0.5 mr-3 shrink-0">3</span>
              <p><b>Maintenance:</b> Barang rusak dikirim ke <b>Repair Center</b> untuk diperbaiki atau <b>Pemusnahan</b> jika tidak layak.</p>
            </li>
          </ul>
        </div>

        <div className={cardClass}>
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white text-xl">
              <i className="fas fa-user-shield"></i>
            </div>
            <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>Hak Akses</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-500">
            <div className="p-4 rounded-2xl bg-slate-500/5 border border-slate-500/10">
              <p className="font-bold text-indigo-500 mb-1">Admin / Leader</p>
              <p className="text-xs">Kontrol penuh cloud, manajemen user, restock otomatis, dan penghapusan data master.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-500/5 border border-slate-500/10">
              <p className="font-bold text-teal-600 mb-1">Staff / Operasional</p>
              <p className="text-xs">Input stok opname, melakukan mutasi barang antar gudang, dan mencetak laporan audit.</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`${cardClass} bg-indigo-600 text-white border-none shadow-xl shadow-indigo-600/20`}>
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          <div className="text-6xl opacity-20">
            <i className="fas fa-cloud-bolt"></i>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-black mb-2 tracking-tight">Koneksi Cloud & Keamanan</h3>
            <p className="text-sm opacity-80 leading-relaxed mb-6">Sistem ini menggunakan sinkronisasi hybrid. Data disimpan di memori browser (offline-first) dan dicadangkan ke Google Sheets setiap kali ada perubahan. Jika koneksi terputus, Anda tetap bisa bekerja dan sinkronisasi akan dilanjutkan saat online.</p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Auto-Sync Active</div>
              <div className="bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase">AES Encryption Mode</div>
              <div className="bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Audit Log Enabled</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickGuide;