import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scan2source.app',
  appName: 'GoodScan',
  webDir: 'dist',
  server: {
    allowNavigation: [
      'goodscan.shop',
      '*.openfoodfacts.org',
      'world.openfoodfacts.org',
    ],
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    Camera: {
      presentationStyle: 'fullscreen'
    }
  }
};

export default config;
