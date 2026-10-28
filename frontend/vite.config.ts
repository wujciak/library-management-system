import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    server: { port: 3000 },
    build: {
        rollupOptions: {
            // libraries change less often than the app, so they get their own cacheable chunks
            output: { manualChunks: { react: ['react', 'react-dom', 'react-router-dom'], mui: ['@mui/material', '@mui/icons-material'] } },
        },
    },
});
