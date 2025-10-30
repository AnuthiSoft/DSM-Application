import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dsm.application',
  appName: 'DistNet',
  webDir: 'dist/dsm-application.client',
   server: {
    url: 'https://dsm-application.web.app', // 👈 your live Angular site
    cleartext: true
  }
};

export default config;
