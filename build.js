const { build } = require('vite');
const { resolve } = require('path');

async function buildApp() {
  try {
    console.log('Starting build process...');
    
    await build({
      root: resolve(__dirname, 'frontend'),
      base: '/',
      build: {
        outDir: resolve(__dirname, 'dist'),
        assetsDir: 'assets',
        minify: false,
        sourcemap: false
      }
    });
    
    console.log('Build completed successfully');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildApp(); 