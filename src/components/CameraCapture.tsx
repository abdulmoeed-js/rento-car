
import React from "react";
import useCamera from "@/hooks/useCamera";
import CameraControls from "./camera/CameraControls";
import ImageFeedback from "./camera/ImageFeedback";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const {
    videoRef,
    canvasRef,
    isCapturing,
    capturedImage,
    captureImage,
    retakePhoto,
    handleFileUpload,
    showFeedback
  } = useCamera({ onCancel });

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
        <CameraControls 
          isCapturing={isCapturing}
          capturedImage={capturedImage}
          onCapture={captureImage}
          onRetake={retakePhoto}
          onConfirm={confirmImage}
          onCancel={onCancel}
          onFileUpload={handleFileUpload}
          disableConfirm={showFeedback === "blurry" || showFeedback === "expired"}
        />
        
        {/* Feedback */}
        <ImageFeedback feedbackType={showFeedback} />
      </div>
    </div>
  );
};

export default CameraCapture;
