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
  // android.allowMixedContent was set here. It does exactly one thing: permit
  // plaintext HTTP resources to load inside an HTTPS WebView. Every endpoint
  // this app touches — goodscan.shop, Open Food Facts — is HTTPS already, so it
  // bought nothing and gave away the guarantee that nothing in the page can be
  // read or rewritten in transit on a hostile network. Play also reads it as a
  // safety signal. Removed rather than set to false: absent is the default.
  plugins: {
    Camera: {
      presentationStyle: 'fullscreen'
    }
  }
};

export default config;
