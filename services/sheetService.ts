
import { InventoryItem, User } from "../types";

/**
 * Sinkronisasi data ke Google Sheets (POST)
 * Termasuk pengiriman log aktivitas
 */
export const syncToGoogleSheets = async (url: string, data: InventoryItem[], user: User): Promise<boolean> => {
  if (!url) return false;
  
  try {
    const payload = {
      action: 'sync',
      payload: data,
      log: {
        user: user.name,
        role: user.role,
        timestamp: new Date().toLocaleString(),
        activity: 'PUSH (Kirim Data)',
        details: `Sinkronisasi ${data.length} item`
      }
    };

    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    return true;
  } catch (error) {
    console.error("Gagal Sinkron ke Cloud:", error);
    return false;
  }
};

/**
 * Mencatat log aktivitas tanpa melakukan sinkronisasi data (misal saat Pull)
 */
export const logCloudActivity = async (url: string, user: User, activity: string, details: string): Promise<void> => {
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'log_only',
        log: {
          user: user.name,
          role: user.role,
          timestamp: new Date().toLocaleString(),
          activity,
          details
        }
      })
    });
  } catch (e) {
    console.error("Gagal mencatat log:", e);
  }
};

/**
 * Mengambil data terbaru dari Google Sheets (GET)
 */
export const fetchFromGoogleSheets = async (url: string): Promise<InventoryItem[] | null> => {
  if (!url) return null;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Gagal mengambil data dari server");
    
    const result = await response.json();
    
    if (Array.isArray(result)) {
      return result.map(item => ({
        ...item,
        expectedQty: Number(item.expectedQty) || 0,
        actualQty: Number(item.actualQty) || 0,
        minStockThreshold: Number(item.minStockThreshold) || 0,
        dailyUsage: Number(item.dailyUsage) || 0
      })) as InventoryItem[];
    }
    return null;
  } catch (error) {
    console.error("Gagal Ambil Data Cloud:", error);
    return null;
  }
};
