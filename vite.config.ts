/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/api/auth': 'http://localhost:8081',
      '/api/itinerary': 'http://localhost:8082',
      '/api/admin/cruise-area-policy': 'http://localhost:8082',
      '^/api/passengers/[^/]+/folio': 'http://localhost:8084',
      '/api/pos': 'http://localhost:8084',
      '/api/v1/pos': 'http://localhost:8084',
      '/api/admin/pos': 'http://localhost:8084',
      '/api/admin/voyage': 'http://localhost:8084',
      '/api/admin/audit': 'http://localhost:8084',
      '/api/service-recovery': 'http://localhost:8084',
      '^/api/(activities|excursions|operations|passengers|passenger-portal|feedback|v1/tour-providers|v1/shore-excursions)(/|$)': 'http://localhost:8083',
      '/api': 'http://localhost:8080',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 10000,
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        '.github/**',
        '**/node_modules/**',
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
})
