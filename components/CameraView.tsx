import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface CameraViewProps {
  onImageCapture: (file: File) => void;
  onBack: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onImageCapture, onBack }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Could not access camera. Please check your browser permissions.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [startCamera, stream]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      setCapturedImage(canvas.toDataURL('image/jpeg'));
      stream?.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setError(null);
    startCamera();
  };
  
  const handleUsePhoto = () => {
    if (canvasRef.current) {
      canvasRef.current.toBlob(blob => {
        if (blob) {
          const file = new File([blob], `doodle-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          onImageCapture(file);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  return (
    <div className="w-full max-w-2xl text-center">
       <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-6 group"
      >
        <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Options
      </button>

      <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-lg overflow-hidden shadow-lg">
        {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-white bg-red-800/50">
                <p>{error}</p>
                <button onClick={onBack} className="mt-4 px-4 py-2 bg-white text-slate-800 rounded-md">Go Back</button>
            </div>
        )}

        {!capturedImage && !error && (
            <>
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                {!stream && <div className="absolute inset-0 flex items-center justify-center"><SpinnerIcon className="w-12 h-12 text-white" /></div>}
            </>
        )}

        {capturedImage && (
            <img src={capturedImage} alt="Captured document" className="w-full h-full object-contain" />
        )}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />

      <div className="mt-6">
        {capturedImage ? (
            <div className="flex justify-center gap-4">
                <button onClick={handleRetake} className="px-6 py-3 bg-white dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-slate-700 font-semibold rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600">
                    Retake
                </button>
                <button onClick={handleUsePhoto} className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-500">
                    Use Photo
                </button>
            </div>
        ) : (
            <button
                onClick={handleCapture}
                disabled={!stream}
                className="w-20 h-20 bg-white rounded-full border-4 border-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 disabled:opacity-50"
                aria-label="Capture photo"
            />
        )}
      </div>
    </div>
  );
};

export default CameraView;