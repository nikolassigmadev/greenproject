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
  // NOTE: the android block that used to sit here permitted plaintext HTTP
  // resources inside an HTTPS WebView. Everything this app calls is HTTPS, so
  // it bought nothing and gave away the guarantee that page content can't be
  // read or rewritten in transit. Play reads it as a safety signal too.
  // Deleted rather than set to false — absent is the default, and the literal
  // flag name is kept out of this file so an audit grep returns a clean zero.
  plugins: {
    Camera: {
      presentationStyle: 'fullscreen'
    }
  }
};

export default config;
