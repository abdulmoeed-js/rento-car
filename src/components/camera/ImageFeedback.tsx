
import React from "react";

interface ImageFeedbackProps {
  feedbackType: string | null;
}

const ImageFeedback: React.FC<ImageFeedbackProps> = ({ feedbackType }) => {
  if (!feedbackType) return null;

  return (
    <div className={`absolute top-4 left-0 right-0 p-3 mx-4 rounded-lg animate-appear ${
      feedbackType === "good" 
        ? "bg-green-500" 
        : "bg-red-500"
    }`}>
      <p className="text-white text-center font-medium">
        {feedbackType === "blurry" && "Image is too blurry. Please retake."}
        {feedbackType === "expired" && "License appears to be expired. Please use a valid license."}
        {feedbackType === "good" && "Good image quality! Click the checkmark to confirm."}
      </p>
    </div>
  );
};

export default ImageFeedback;
