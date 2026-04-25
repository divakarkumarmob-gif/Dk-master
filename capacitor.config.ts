import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neetpreppro.app',
  appName: 'NEET Prep Pro',
  webDir: 'client/dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
