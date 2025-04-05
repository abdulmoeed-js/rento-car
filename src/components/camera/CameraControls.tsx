
import React from "react";
import { X, Camera, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraControlsProps {
  isCapturing: boolean;
  capturedImage: string | null;
  onCapture: () => void;
  onRetake: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disableConfirm: boolean;
}

const CameraControls: React.FC<CameraControlsProps> = ({
  isCapturing,
  capturedImage,
  onCapture,
  onRetake,
  onConfirm,
  onCancel,
  onFileUpload,
  disableConfirm
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
      <div className="flex justify-between items-center">
        <Button variant="outline" size="icon" onClick={onCancel} className="rounded-full bg-white/20 border-none text-white hover:bg-white/30">
          <X className="h-6 w-6" />
        </Button>
        
        {isCapturing ? (
          <Button 
            size="icon"
            className="rounded-full w-16 h-16 bg-white text-black hover:bg-white/90"
            onClick={onCapture}
          >
            <Camera className="h-8 w-8" />
          </Button>
        ) : capturedImage ? (
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onRetake}
              className="rounded-full bg-white/20 border-none text-white hover:bg-white/30"
            >
              <RefreshCw className="h-6 w-6" />
            </Button>
            <Button 
              size="icon"
              className="rounded-full w-16 h-16 bg-white text-black hover:bg-white/90"
              onClick={onConfirm}
              disabled={disableConfirm}
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
            onChange={onFileUpload}
          />
          <div className="rounded-full p-3 bg-white/20 text-white hover:bg-white/30">
            <Upload className="h-6 w-6" />
          </div>
        </label>
      </div>
    </div>
  );
};

export default CameraControls;
