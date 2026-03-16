import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scan2source.app',
  appName: 'Scan2Source',
  webDir: 'dist',
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
