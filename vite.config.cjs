const { defineConfig } = require('vite');
const path = require('node:path');

module.exports = defineConfig(async () => {
  const { default: react } = await import('@vitejs/plugin-react');
  return {
    base: '/newsomassgins/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    plugins: [react()],
    server: {
      port: 5173,
      host: true
    }
  };
});
