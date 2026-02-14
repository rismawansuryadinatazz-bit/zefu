import React, { useState } from 'react';
import { SheetConfig, UserRole, User } from '../types';

interface AdminSettingsProps {
  config: SheetConfig;
  onSave: (config: SheetConfig) => void;
  onSync: () => void;
  onPull: () => void;
  theme: 'light' | 'dark';
  t: (key: string) => string;
  user: User;
  users: User[];
  onAddUser: (u: User) => void;
  onDeleteUser: (id: string) => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ 
  config, onSave, onSync, onPull, theme, t, user, users, onAddUser, onDeleteUser 
}) => {
  const [url, setUrl] = useState(config.scriptUrl);
  const [autoSync, setAutoSync] = useState(config.autoSync);
  const [pullLock, setPullLock] = useState(config.pullLock || false);
  const [showCode, setShowCode] = useState(false);

  const appsScriptCode = `function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Inventory");
  if (!sheet) {
    sheet = ss.insertSheet("Inventory");
    sheet.appendRow(["id", "name", "category", "size", "expectedQty", "actualQty", "minStockThreshold", "dailyUsage", "unit", "location", "usageType", "status", "condition", "lastUpdated", "updatedBy", "notes"]);
  }
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) { obj[headers[j]] = data[i][j]; }
    result.push(obj);
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var params = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName("Logs");
  if (!logSheet) {
    logSheet = ss.insertSheet("Logs");
    logSheet.appendRow(["Timestamp", "User", "Role", "Activity", "Details"]);
  }
  if (params.log) {
    logSheet.appendRow([params.log.timestamp, params.log.user, params.log.role, params.log.activity, params.log.details]);
  }
  var invSheet = ss.getSheetByName("Inventory");
  if (!invSheet) invSheet = ss.insertSheet("Inventory");
  if (params.action === 'sync') {
    invSheet.clear();
    var headers = ["id", "name", "category", "size", "expectedQty", "actualQty", "minStockThreshold", "dailyUsage", "unit", "location", "usageType", "status", "condition", "lastUpdated", "updatedBy", "notes"];
    invSheet.appendRow(headers);
    if (params.payload && params.payload.length > 0) {
      params.payload.forEach(function(item) {
        var row = headers.map(function(h) { return item[h] || ""; });
        invSheet.appendRow(row);
      });
    }
  }
  return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
}`;

  const handleSave = () => {
    onSave({ scriptUrl: url, isConnected: url.length > 10, autoSync, pullLock });
    alert("Konfigurasi Berhasil Disimpan!");
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    alert("KODE SKRIP DISALIN!");
  };

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-800';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-gray-500';
  const cardClass = `p-6 rounded-3xl shadow-sm border transition-all ${
    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'
  }`;

  const inputClass = `w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
    theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <header>
        <h2 className={`text-2xl font-black ${textPrimary}`}>Konfigurasi Sistem</h2>
        <p className={textSecondary}>Kelola integrasi cloud dan parameter keamanan database.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${cardClass} lg:col-span-2`}>
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-600/20">
              <i className="fab fa-google-drive"></i>
            </div>
            <h3 className={`text-lg font-bold ${textPrimary}`}>Google Sheets Database</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Web App URL</label>
              <input 
                type="text" 
                placeholder="https://script.google.com/macros/s/..."
                className={inputClass}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-slate-500/5 rounded-2xl border border-slate-500/10">
                <span className="text-xs font-bold">Auto-Sync</span>
                <button onClick={() => setAutoSync(!autoSync)} className={`w-10 h-5 rounded-full relative transition-all ${autoSync ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoSync ? 'left-6' : 'left-1'}`}></div>
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-500/5 rounded-2xl border border-slate-500/10">
                <span className="text-xs font-bold">Safety Lock</span>
                <button onClick={() => setPullLock(!pullLock)} className={`w-10 h-5 rounded-full relative transition-all ${pullLock ? 'bg-rose-600' : 'bg-slate-400'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${pullLock ? 'left-6' : 'left-1'}`}></div>
                </button>
              </div>
            </div>

            <button onClick={handleSave} className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
              SIMPAN PERUBAHAN
            </button>
          </div>
        </div>

        <div className={cardClass}>
           <h3 className={`text-lg font-bold mb-4 ${textPrimary}`}>Info Sistem</h3>
           <div className="space-y-3">
             <div className="flex justify-between items-center text-[10px] font-bold">
               <span className="text-slate-500">DATABASE STATUS</span>
               <span className={config.isConnected ? 'text-green-500' : 'text-rose-500'}>{config.isConnected ? 'CONNECTED' : 'OFFLINE'}</span>
             </div>
             <div className="flex justify-between items-center text-[10px] font-bold">
               <span className="text-slate-500">VERSION</span>
               <span className="text-indigo-500">2.0.0 PRO</span>
             </div>
             <div className="pt-4 border-t border-slate-500/10">
               <p className="text-[10px] text-slate-500 leading-relaxed italic">
                 Siap dideploy ke GitHub Pages dengan Vite Pro Upgrade.
               </p>
             </div>
           </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex items-center space-x-4">
             <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl">
               <i className="fas fa-terminal text-indigo-500"></i>
             </div>
             <div>
               <h4 className={`font-bold text-sm ${textPrimary}`}>Apps Script Bridge</h4>
               <p className="text-[10px] text-slate-500">Integrasi database Google Sheets untuk sinkronisasi cloud.</p>
             </div>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <button 
              onClick={() => setShowCode(!showCode)}
              className="px-4 py-2 bg-slate-500/10 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-500/20 transition-all"
            >
              {showCode ? 'Tutup' : 'Lihat Skrip'}
            </button>
            <button 
              onClick={handleCopyCode}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
            >
              Salin Kode
            </button>
          </div>
        </div>

        {showCode && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-950 text-indigo-400 font-mono text-[10px] leading-relaxed overflow-x-auto border border-white/5 animate-fadeIn">
            {appsScriptCode}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;