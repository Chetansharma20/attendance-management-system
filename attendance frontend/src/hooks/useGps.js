import { useState } from 'react';

export default function useGps() {
  const [gpsLoading, setGpsLoading] = useState(false);

  const getCoordinates = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLoading(false);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (err) => {
          setGpsLoading(false);
          let errMsg = "Failed to retrieve location. ";
          if (err.code === err.PERMISSION_DENIED) {
            errMsg += "Please grant location access permissions in your browser.";
          } else {
            errMsg += err.message;
          }
          reject(new Error(errMsg));
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
  };

  return {
    gpsLoading,
    getCoordinates
  };
}
