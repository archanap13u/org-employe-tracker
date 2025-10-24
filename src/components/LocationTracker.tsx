import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';
import { registerPlugin, Capacitor } from '@capacitor/core';

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
}

export const LocationTracker = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [watchId, setWatchId] = useState<number | string | null>(null);
  const { user } = useAuth();

  const validateLocation = (location: LocationData): boolean => {
    return (
      location.latitude >= -90 && location.latitude <= 90 &&
      location.longitude >= -180 && location.longitude <= 180 &&
      location.accuracy > 0 &&
      (location.altitude === null || Math.abs(location.altitude) < 100000)
    );
  };

  const saveLocation = async (location: LocationData) => {
    if (!user) return;

    if (!validateLocation(location)) {
      toast.error('Invalid location data');
      return;
    }

    const { error } = await supabase.from('location_tracks').insert({
      user_id: user.id,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      altitude: location.altitude,
      speed: location.speed,
      heading: location.heading,
      tracked_at: new Date().toISOString(),
    });

    if (error) {
      toast.error('Failed to save location');
      return;
    }

    await supabase.from('activity_logs').insert([{
      user_id: user.id,
      activity_type: 'location',
      title: 'Location Updated',
      description: `Location tracked at ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
      metadata: location as any,
    }]);
  };

  const startTracking = async () => {
    // Use native background geolocation on mobile, fallback to web API
    if (Capacitor.isNativePlatform()) {
      try {
        const id = await BackgroundGeolocation.addWatcher(
          {
            backgroundMessage: 'TrackMaster is tracking your location',
            backgroundTitle: 'Location Tracking Active',
            requestPermissions: true,
            stale: false,
            distanceFilter: 10, // Update every 10 meters
          },
          (location, error) => {
            if (error) {
              toast.error('Background tracking error');
              return;
            }
            if (location) {
              const locationData: LocationData = {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                altitude: location.altitude ?? null,
                speed: location.speed ?? null,
                heading: location.bearing ?? null,
              };
              setCurrentLocation(locationData);
              saveLocation(locationData);
            }
          }
        );
        setWatchId(id);
        setIsTracking(true);
        toast.success('Background location tracking started');
      } catch (err) {
        toast.error('Failed to start background tracking');
      }
    } else {
      // Web fallback
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by your browser');
        return;
      }

      const id = navigator.geolocation.watchPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            speed: position.coords.speed,
            heading: position.coords.heading,
          };
          setCurrentLocation(locationData);
          saveLocation(locationData);
        },
        (error) => {
          toast.error('Unable to get location. Please enable location services.');
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        }
      );

      setWatchId(id);
      setIsTracking(true);
      toast.success('Location tracking started');
    }
  };

  const stopTracking = async () => {
    if (Capacitor.isNativePlatform()) {
      if (watchId !== null && typeof watchId === 'string') {
        await BackgroundGeolocation.removeWatcher({ id: watchId });
      }
      setIsTracking(false);
      setWatchId(null);
      toast.success('Background tracking stopped');
    } else {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId as number);
        setWatchId(null);
        setIsTracking(false);
        toast.success('Location tracking stopped');
      }
    }
  };

  useEffect(() => {
    return () => {
      if (Capacitor.isNativePlatform() && watchId && typeof watchId === 'string') {
        BackgroundGeolocation.removeWatcher({ id: watchId });
      } else if (watchId !== null && typeof watchId === 'number') {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return (
    <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Location Tracking
        </CardTitle>
        <CardDescription>
          Real-time GPS position tracking with background support
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentLocation && (
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Navigation className="h-4 w-4 text-secondary" />
              <span className="font-mono">
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Accuracy: {currentLocation.accuracy.toFixed(0)}m</p>
              {currentLocation.altitude && <p>Altitude: {currentLocation.altitude.toFixed(0)}m</p>}
              {currentLocation.speed && <p>Speed: {(currentLocation.speed * 3.6).toFixed(1)} km/h</p>}
            </div>
          </div>
        )}
        
        <Button
          onClick={isTracking ? stopTracking : startTracking}
          className={`w-full ${isTracking ? 'bg-destructive hover:bg-destructive/90' : 'bg-gradient-primary'}`}
          size="lg"
        >
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </Button>
      </CardContent>
    </Card>
  );
};
