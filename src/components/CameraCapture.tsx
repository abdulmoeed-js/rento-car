
import React, { useRef, useState, useEffect } from "react";
import { Camera, X, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
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

  const confirmImage = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center">
      <div className="relative w-full h-full max-w-lg mx-auto">
        {isCapturing ? (
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : capturedImage ? (
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="w-full h-full object-contain bg-black"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <p className="text-white">Starting camera...</p>
          </div>
        )}
        
        {/* Hidden canvas for capturing */}
        <canvas ref={canvasRef} className="hidden"></canvas>
        
        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
          <div className="flex justify-between items-center">
            <Button variant="outline" size="icon" onClick={onCancel} className="rounded-full bg-white/20 border-none text-white hover:bg-white/30">
              <X className="h-6 w-6" />
            </Button>
            
            {isCapturing ? (
              <Button 
                size="icon"
                className="rounded-full w-16 h-16 bg-white text-black hover:bg-white/90"
                onClick={captureImage}
              >
                <Camera className="h-8 w-8" />
              </Button>
            ) : capturedImage ? (
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={retakePhoto}
                  className="rounded-full bg-white/20 border-none text-white hover:bg-white/30"
                >
                  <RefreshCw className="h-6 w-6" />
                </Button>
                <Button 
                  size="icon"
                  className="rounded-full w-16 h-16 bg-white text-black hover:bg-white/90"
                  onClick={confirmImage}
                  disabled={showFeedback === "blurry" || showFeedback === "expired"}
                >
                  ✓
                </Button>
              </div>
            ) : null}
            
            <label className="cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload}
              />
              <div className="rounded-full p-3 bg-white/20 text-white hover:bg-white/30">
                <Upload className="h-6 w-6" />
              </div>
            </label>
          </div>
        </div>
        
        {/* Feedback */}
        {showFeedback && (
          <div className={`absolute top-4 left-0 right-0 p-3 mx-4 rounded-lg animate-appear ${
            showFeedback === "good" 
              ? "bg-green-500" 
              : "bg-red-500"
          }`}>
            <p className="text-white text-center font-medium">
              {showFeedback === "blurry" && "Image is too blurry. Please retake."}
              {showFeedback === "expired" && "License appears to be expired. Please use a valid license."}
              {showFeedback === "good" && "Good image quality! Click the checkmark to confirm."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
