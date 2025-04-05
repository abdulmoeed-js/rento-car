
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import CameraCapture from "./CameraCapture";
import { trackUserActivity, ActivityType } from "@/services/UserActivityService";
import LicenseVerified from "./license/LicenseVerified";
import LicensePending from "./license/LicensePending";
import LicenseRejected from "./license/LicenseRejected";
import LicenseReupload from "./license/LicenseReupload";
import LicenseUploadForm from "./license/LicenseUploadForm";

const LicenseUpload: React.FC = () => {
  const { uploadLicense, user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Track component view
  useEffect(() => {
    if (user) {
      trackUserActivity(ActivityType.LICENSE_UPDATED, {
        action: "view_license_page",
        current_status: user.license_status,
      });
    }
  }, [user]);

  const handleCapture = async (imageData: string) => {
    setShowCamera(false);
    setIsUploading(true);
    
    try {
      await uploadLicense(imageData);
      toast.success("License uploaded", {
        description: "Your license has been submitted for verification."
      });
    } catch (error) {
      console.error("Error uploading license:", error);
      toast.error("Upload failed", {
        description: "There was an error uploading your license. Please try again."
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target?.result as string;
      
      try {
        await uploadLicense(imageData);
        toast.success("License uploaded", {
          description: "Your license has been submitted for verification."
        });
      } catch (error) {
        console.error("Error uploading license:", error);
        toast.error("Upload failed", {
          description: "There was an error uploading your license. Please try again."
        });
      } finally {
        setIsUploading(false);
      }
    };
    
    reader.readAsDataURL(file);
  };

  // Render component based on license status
  const renderLicenseStatus = () => {
    if (user?.license_status === 'pending_verification') {
      return <LicensePending />;
    }

    if (user?.license_status === 'verified') {
      return <LicenseVerified />;
    }

    if (user?.license_status === 'rejected') {
      return <LicenseRejected />;
    }

    // Using String() to ensure proper type comparison
    if (String(user?.license_status) === 'pending_reupload') {
      return (
        <LicenseReupload 
          onTakePhoto={() => setShowCamera(true)}
          onFileUpload={handleFileUpload}
          isUploading={isUploading}
        />
      );
    }

    // Default: Initial upload form
    return (
      <LicenseUploadForm 
        onTakePhoto={() => setShowCamera(true)}
        onFileUpload={handleFileUpload}
        isUploading={isUploading}
      />
    );
  };

  return (
    <>
      {renderLicenseStatus()}
      
      {showCamera && (
        <CameraCapture 
          onCapture={handleCapture} 
          onCancel={() => setShowCamera(false)} 
        />
      )}
    </>
  );
};

export default LicenseUpload;
