import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.anchorview.app',
  appName: 'AnchorView',
  webDir: '.next',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    Camera: {
      saveToGallery: true,
      quality: 100,
    },
  },
};

export default config;
