
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CarImageGalleryProps {
  images: string[];
  alt: string;
}

const CarImageGallery: React.FC<CarImageGalleryProps> = ({ images, alt }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const currentImage = images[currentImageIndex];

  const handlePrevImage = () => {
    if (!images.length) return;
    setCurrentImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!images.length) return;
    setCurrentImageIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <Card className="mb-6 overflow-hidden">
      <div className="relative">
        <div className="aspect-video">
          <img 
            src={currentImage} 
            alt={alt} 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Image Navigation */}
        {images.length > 1 && (
          <>
            <Button 
              onClick={handlePrevImage}
              variant="secondary"
              size="icon"
              className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full h-8 w-8"
            >
              {"<"}
            </Button>
            <Button 
              onClick={handleNextImage}
              variant="secondary"
              size="icon"
              className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full h-8 w-8"
            >
              {">"}
            </Button>
          </>
        )}
      </div>
      
      {/* Thumbnail Previews */}
      {images.length > 1 && (
        <div className="p-2 flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`h-16 w-24 flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                index === currentImageIndex ? 'border-rento-blue' : 'border-transparent'
              }`}
            >
              <img 
                src={image} 
                alt={`Thumbnail ${index}`} 
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </Card>
  );
};

export default CarImageGallery;
