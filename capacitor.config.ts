import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.0791849ca1444c1c9a6066c79268a176',
  appName: 'TrackMaster',
  webDir: 'dist',
  server: {
    url: 'https://0791849c-a144-4c1c-9a60-66c79268a176.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    BackgroundGeolocation: {
      notificationTitle: 'TrackMaster is tracking',
      notificationText: 'Location tracking active',
      notificationChannelName: 'Location Tracking',
      requestPermissions: true,
      backgroundMessage: 'Cancel to prevent battery drain',
    }
  }
};

export default config;
