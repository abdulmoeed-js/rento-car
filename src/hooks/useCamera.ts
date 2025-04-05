
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

interface UseCameraProps {
  onCancel: () => void;
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isCapturing: boolean;
  capturedImage: string | null;
  captureImage: () => void;
  retakePhoto: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showFeedback: string | null;
  checkImageQuality: (imageData: string) => void;
}

const useCamera = ({ onCancel }: UseCameraProps): UseCameraReturn => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        setIsCapturing(true);
      } catch (err) {
        toast.error("Unable to access camera. Please check your permissions.");
        onCancel();
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onCancel]);

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL("image/png");
    setCapturedImage(imageData);
    
    // Simulate checking image quality
    checkImageQuality(imageData);
    
    // Stop the video stream
    const stream = video.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    
    setIsCapturing(false);
  };

  const retakePhoto = async () => {
    setCapturedImage(null);
    setShowFeedback(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsCapturing(true);
    } catch (err) {
      toast.error("Unable to access camera. Please check your permissions.");
      onCancel();
    }
  };

  const checkImageQuality = (imageData: string) => {
    // In a real app, we would use image processing to check quality
    // For demo purposes, we'll randomly show different feedback
    
    const random = Math.random();
    
    if (random < 0.3) {
      setShowFeedback("blurry");
    } else if (random < 0.6) {
      setShowFeedback("expired");
    } else {
      setShowFeedback("good");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setCapturedImage(imageData);
      checkImageQuality(imageData);
      setIsCapturing(false);
    };
    
    reader.readAsDataURL(file);
  };

  return {
    videoRef,
    canvasRef,
    isCapturing,
    capturedImage,
    captureImage,
    retakePhoto,
    handleFileUpload,
    showFeedback,
    checkImageQuality
  };
};

export default useCamera;
