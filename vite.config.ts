
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';
  import tailwindcss from '@tailwindcss/vite';
  import path from 'path';

  export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        'vaul@1.1.2': 'vaul',
        'sonner@2.0.3': 'sonner',
        'recharts@2.15.2': 'recharts',
        'react-hook-form@7.55.0': 'react-hook-form',
        'figma:asset/f7a82df86318124ff123f2ed47d1d72b6f21da43.png': path.resolve(__dirname, './src/assets/f7a82df86318124ff123f2ed47d1d72b6f21da43.png'),
        'figma:asset/ef2e50ad7a151d7b9c86737646c4bf1acd9e7285.png': path.resolve(__dirname, './src/assets/ef2e50ad7a151d7b9c86737646c4bf1acd9e7285.png'),
        '@jsr/supabase__supabase-js@2.49.8': '@jsr/supabase__supabase-js',
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
    },
    server: {
      port: 3000,
      open: true,
    },
  });