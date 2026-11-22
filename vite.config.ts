import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'reload-room-bus',
      handleHotUpdate({ modules, server }) {
        if (!modules.some((module) => module.url === '/src/lib/roomBus.ts')) return;
        // The bus owns listeners and connections for the lifetime of the page.
        server.ws.send({ type: 'full-reload', path: '*' });
        return [];
      },
    },
  ],
  server: {
    port: 3000,
    host: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
    dedupe: ['react', 'react-dom'],
  },
});
