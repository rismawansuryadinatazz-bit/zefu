import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Menggunakan jalur relatif agar berfungsi di GitHub Pages (username.github.io/repo-name/)
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    emptyOutDir: true,
    sourcemap: false,
    terserOptions: {
      compress: {
        drop_console: true, // Menghapus console.log di produksi untuk keamanan
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Memisahkan library besar ke chunk tersendiri untuk performa
          'react-vendor': ['react', 'react-dom'],
          'viz-vendor': ['recharts'],
          'pdf-vendor': ['jspdf', 'jspdf-autotable']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});