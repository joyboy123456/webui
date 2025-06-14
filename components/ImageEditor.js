"use client";
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

export default function ImageEditor({ onImageGenerated }) {
  const [inputImage, setInputImage] = useState(null);
  const [inputImagePreview, setInputImagePreview] = useState(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('上传文件:', file.name, file.size, file.type);
      setInputImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setInputImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear uploaded image
  const clearInputImage = () => {
    setInputImage(null);
    setInputImagePreview(null);
  };

  // Handle image editing submission
  const handleEditImage = async (e) => {
    e.preventDefault();
    
    if (!inputImage) {
      setError("请先上传一张图片");
      return;
    }

    if (!editPrompt.trim()) {
      setError("请输入编辑指令");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('开始编辑图片...');
      console.log('文件信息:', {
        name: inputImage.name,
        size: inputImage.size,
        type: inputImage.type
      });

      const formData = new FormData();
      formData.append("prompt", editPrompt);
      formData.append("input_image", inputImage);
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

      console.log('发送编辑请求...');
      const response = await fetch("/api/generateImage", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log('编辑响应:', data);

      if (response.ok) {
        if (data.imageUrl) {
          // Call the callback with the generated image URL
          onImageGenerated(data.imageUrl);
          // Optionally clear the form
          setEditPrompt('');
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
    <div className="space-y-6 animate-fade-in-up">
      <h2 className="text-xl font-bold text-gray-900 mb-4">图片编辑</h2>
      
      {/* Image Upload Area */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          上传图片 <span className="text-red-500">*</span>
        </label>
        
        {!inputImagePreview ? (
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="imageUpload"
              required
            />
            <label
              htmlFor="imageUpload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FontAwesomeIcon icon={faUpload} className="w-8 h-8 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">点击上传</span> 需要编辑的图片
                </p>
                <p className="text-xs text-gray-500">PNG, JPG 或 JPEG (最大 10MB)</p>
              </div>
            </label>
          </div>
        ) : (
          <div className="relative">
            <img
              src={inputImagePreview}
              alt="Input preview"
              className="w-full h-48 object-contain rounded-xl border border-gray-200"
            />
            <button
              type="button"
              onClick={clearInputImage}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
            >
              ×
            </button>
          </div>
        )}
      </div>
      
      {/* Edit Prompt */}
      <div>
        <label htmlFor="editPrompt" className="block text-sm font-semibold text-gray-900 mb-2">
          编辑指令 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="editPrompt"
          value={editPrompt}
          onChange={(e) => setEditPrompt(e.target.value)}
          required
          className="apple-input h-28 resize-none text-sm leading-relaxed"
          placeholder="描述你想如何修改这张图片，例如：'将背景改为海滩场景'"
        />
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      
      {/* Submit Button */}
      <button
        type="button"
        onClick={handleEditImage}
        disabled={loading || !inputImage}
        className="apple-button-primary w-full text-center font-semibold text-base py-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            正在编辑图片...
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <FontAwesomeIcon icon={faEdit} className="mr-2" />
            编辑图片
          </span>
        )}
      </button>
    </div>
  );
}