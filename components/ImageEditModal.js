"use client";
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTimes } from '@fortawesome/free-solid-svg-icons';

export default function ImageEditModal({ isOpen, onClose, imageUrl, onImageEdited }) {
  const [editPrompt, setEditPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If the modal is not open, don't render anything
  if (!isOpen) return null;

  // Extract image path from URL
  const imagePath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;

  // Handle image editing submission
  const handleEditImage = async (e) => {
    e.preventDefault();
    
    if (!editPrompt.trim()) {
      setError("请输入编辑指令");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch the image file from the server
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      const imageFile = new File([imageBlob], imagePath.split('/').pop(), { type: imageBlob.type });

      const formData = new FormData();
      formData.append("prompt", editPrompt);
      formData.append("input_image", imageFile);
      formData.append("model", "fal-ai/flux-pro/kontext"); // Use Kontext model for image editing
      
      // Add other parameters with default values
      formData.append("image_size", "landscape_4_3");
      formData.append("num_inference_steps", "30");
      formData.append("guidance_scale", "7.5");
      formData.append("num_images", "1");
      formData.append("enable_safety_checker", "true");
      formData.append("strength", "0.8"); // Strength parameter for image-to-image
      formData.append("output_format", "jpeg");
      formData.append("sync_mode", "true");

      const response = await fetch("/api/generateImage", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        if (data.imageUrl) {
          // Call the callback with the generated image URL
          onImageEdited(data.imageUrl);
          onClose(); // Close the modal after successful edit
        } else {
          throw new Error("No image URL found in the response.");
        }
      } else {
        setError(`Failed to edit image: ${data.message}`);
      }
    } catch (err) {
      console.error("Error occurred:", err.message);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">编辑图片</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>

        {/* Current Image Preview */}
        <div className="mb-4">
          <div className="relative">
            <img
              src={imageUrl}
              alt="Image to edit"
              className="w-full h-48 object-contain rounded-xl border border-gray-200"
            />
          </div>
        </div>
        
        {/* Edit Prompt */}
        <div className="mb-4">
          <label htmlFor="editPrompt" className="block text-sm font-semibold text-gray-900 mb-2">
            编辑指令 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="editPrompt"
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-28 resize-none text-sm leading-relaxed"
            placeholder="描述你想如何修改这张图片，例如：'将背景改为海滩场景'"
          />
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleEditImage}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                处理中...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <FontAwesomeIcon icon={faEdit} className="mr-2" />
                应用编辑
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
