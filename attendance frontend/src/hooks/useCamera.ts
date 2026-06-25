import { useState, useRef, useEffect } from 'react';

export default function useCamera() {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async (): Promise<void> => {
    setCameraError(null);
    setCameraLoading(true);
    setCameraActive(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setCameraError("Camera access denied or unavailable. Please enable webcam permissions.");
      setCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = (): void => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const captureSelfie = (): string | null => {
    const video = videoRef.current;
    if (!video) return null;

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.7);
  };

  return {
    cameraActive,
    cameraLoading,
    cameraError,
    videoRef,
    startCamera,
    stopCamera,
    captureSelfie,
    setCameraError
  };
}
