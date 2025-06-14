"use client";
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faDownload, faTrash, faExpand } from '@fortawesome/free-solid-svg-icons';

export default function ImageGallery({ images, onImageSelect, onImageEdit, onImageDelete }) {
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (image, index) => {
    setSelectedImage({ image, index });
    onImageSelect?.(image, index);
  };

  const downloadImage = async (imageUrl, imageName) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = imageName || 'generated-image.jpeg';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('下载失败:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Gallery</h3>
        <span className="text-sm text-gray-500">{images.length} images</span>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {images.length > 0 ? (
          images.map((image, index) => (
            <div
              key={index}
              className="group relative cursor-pointer transition-all duration-200 hover:scale-105"
              onClick={() => handleImageClick(image, index)}
            >
              <div className="relative overflow-hidden squircle-sm bg-gray-100">
                <img
                  src={`/outputs/${image}`}
                  alt={`Generated Image ${index + 1}`}
                  className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onImageEdit?.(image, index);
                      }}
                      className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors tooltip"
                      data-tooltip="Edit"
                    >
                      <FontAwesomeIcon icon={faEdit} className="w-3 h-3" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadImage(`/outputs/${image}`, image);
                      }}
                      className="bg-green-600 text-white rounded-full p-2 hover:bg-green-700 transition-colors tooltip"
                      data-tooltip="Download"
                    >
                      <FontAwesomeIcon icon={faDownload} className="w-3 h-3" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onImageDelete?.(image, index);
                      }}
                      className="bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors tooltip"
                      data-tooltip="Delete"
                    >
                      <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {/* Image info */}
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black bg-opacity-50 px-2 py-1 rounded-md">
                    Image #{images.length - index}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">No images yet</p>
            <p className="text-xs text-gray-400 mt-1">Generate your first image to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}