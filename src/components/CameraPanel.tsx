import { useEffect, useRef, useState, useCallback } from 'react';
import './CameraPanel.css';

interface VideoDevice {
  deviceId: string;
  label: string;
}

function CameraPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Get list of video devices
  const getVideoDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices
        .filter((device) => device.kind === 'videoinput')
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`,
        }));
      setDevices(videoDevices);
      return videoDevices;
    } catch (err) {
      console.error('Failed to enumerate devices:', err);
      return [];
    }
  }, []);

  // Start camera with specific device
  const startCamera = useCallback(async (deviceId?: string) => {
    // Stop existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Update selected device ID from the actual track
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.deviceId) {
          setSelectedDeviceId(settings.deviceId);
        }
      }

      setError(null);
    } catch (err) {
      console.error('Failed to access camera:', err);
      setError('Failed to access camera. Please ensure camera permissions are granted.');
    }
  }, []);

  // Initialize camera on mount
  useEffect(() => {
    const initCamera = async () => {
      // First, get camera permission with any camera
      await startCamera();

      // Get device list (labels available after permission)
      const videoDevices = await getVideoDevices();

      // Find DECXIN camera
      const decxinDevice = videoDevices.find((device) =>
        device.label.toUpperCase().includes('DECXIN')
      );

      // If DECXIN found, switch to it
      if (decxinDevice) {
        await startCamera(decxinDevice.deviceId);
      }
    };

    initCamera();

    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle device selection change
  const handleDeviceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = event.target.value;
    startCamera(deviceId);
  };

  return (
    <div className="camera-panel">
      <div className="camera-container">
        <div className="camera-viewport">
          {error ? (
            <div className="camera-error">
              <span className="error-icon">📷</span>
              <p>{error}</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              className="camera-video"
              autoPlay
              playsInline
              muted
            />
          )}
        </div>
      </div>

      {devices.length > 1 && (
        <div className="camera-controls">
          <select
            value={selectedDeviceId}
            onChange={handleDeviceChange}
            className="device-select"
          >
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export default CameraPanel;
