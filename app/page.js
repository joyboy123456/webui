"use client";
import { useState, useEffect } from "react";
import ImageEditor from "../components/ImageEditor";
import ImageEditModal from "../components/ImageEditModal";
import ImageGallery from "../components/ImageGallery";
import ModelSelector from "../components/ModelSelector";
import LoadingSpinner from "../components/LoadingSpinner";
import ProgressBar from "../components/ProgressBar";
import StatusBadge from "../components/StatusBadge";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faUpload, faImage, faEdit, faTimes, faMagic, faDownload } from '@fortawesome/free-solid-svg-icons';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 检查认证状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth-check');
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // ---------------------
  // State hooks (must run on every render)
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const [generationProgress, setGenerationProgress] = useState(0);

  // Image upload states for image-to-image models
  const [inputImage, setInputImage] = useState(null);
  const [inputImagePreview, setInputImagePreview] = useState(null);

  // Additional parameters for fine-tuning
  const [imageSize, setImageSize] = useState("landscape_4_3");
  const [numInferenceSteps, setNumInferenceSteps] = useState(28);
  const [guidanceScale, setGuidanceScale] = useState(3.5);
  const [numImages, setNumImages] = useState(1);
  const [enableSafetyChecker, setEnableSafetyChecker] = useState(true);
  const [strength, setStrength] = useState(1);
  const [outputFormat, setOutputFormat] = useState("jpeg");
  const [syncMode, setSyncMode] = useState(false);
  const [loraUrls, setLoraUrls] = useState([{ url: "", scale: 1 }]);

  // Model Selection
  const [model, setModel] = useState("fal-ai/flux/dev");
  // ---------------------

  // Fetch generated images from the outputs directory
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch("/api/getGeneratedImages");
        const data = await res.json();

        const sortedImages = data.images.sort((a, b) => {
          const timeA = parseInt(a.match(/(\d+)\.jpeg$/)[1]);
          const timeB = parseInt(b.match(/(\d+)\.jpeg$/)[1]);
          return timeB - timeA;
        });

        setGeneratedImages(sortedImages);
        if (sortedImages.length > 0) {
          setImageUrl(`/outputs/${sortedImages[0]}`);
        }
      } catch (err) {
        console.error("Failed to fetch images:", err);
      }
    };
    fetchImages();
  }, []);

  // Progress simulation for better UX
  useEffect(() => {
    if (loading) {
      setGenerationProgress(0);
      const interval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);

      return () => clearInterval(interval);
    } else {
      setGenerationProgress(100);
    }
  }, [loading]);

  // ---------------- Guarded early returns ----------------
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <LoadingSpinner size="xl" color="blue" />
          <p className="mt-4 text-lg text-gray-600">检查认证状态...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
        <div className="apple-card-elevated p-8 text-center animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <FontAwesomeIcon icon={faTimes} className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please login to access the AI Image Studio</p>
          <a 
            href="/login" 
            className="apple-button-primary inline-flex items-center px-6 py-3"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Model pricing information
  const modelPricing = {
    "fal-ai/flux/dev": { price: 0.025, name: "Flux Development", description: "High-quality generation with excellent detail" },
    "fal-ai/flux-realism": { price: 0.025, name: "Flux Realism", description: "Photorealistic images with natural lighting" },
    "fal-ai/flux-pro": { price: 0.05, name: "FLUX.1 [pro]", description: "Premium quality with advanced features" },
    "fal-ai/flux-pro/v1.1": { price: 0.04, name: "FLUX1.1 [pro]", description: "6x faster than FLUX.1 with same quality" },
    "fal-ai/flux-pro/kontext": { price: 0.04, name: "FLUX.1 Kontext [pro]", description: "Advanced image editing and modification" }
  };

  // Calculate estimated cost
  const calculateCost = () => {
    const modelInfo = modelPricing[model];
    if (!modelInfo) return 0;

    const sizeMegapixels = {
      "square_hd": 1.0,
      "portrait_4_3": 0.75,
      "portrait_16_9": 0.5,
      "landscape_4_3": 0.75,
      "landscape_16_9": 0.5
    };

    const megapixels = sizeMegapixels[imageSize] || 1.0;
    const totalCost = modelInfo.price * megapixels * numImages;
    return totalCost.toFixed(3);
  };

  const generateImage = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError("请输入提示词");
      return;
    }

    setLoading(true);
    setError("");
    setGenerationProgress(0);

    try {
      if (requiresInputImage() && !inputImage) {
        setError("请为Kontext模型上传一张输入图片");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("image_size", imageSize);
      formData.append("num_inference_steps", numInferenceSteps);
      formData.append("guidance_scale", guidanceScale);
      formData.append("num_images", numImages);
      formData.append("enable_safety_checker", enableSafetyChecker);
      formData.append("strength", strength);
      formData.append("output_format", outputFormat);
      formData.append("sync_mode", syncMode);
      formData.append("model", model);
      formData.append("loras", JSON.stringify(loraUrls));

      if (requiresInputImage() && inputImage) {
        formData.append("input_image", inputImage);
      }

      const response = await fetch("/api/generateImage", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        if (data.imageUrl) {
          setImageUrl(data.imageUrl);
          setGeneratedImages([data.imageUrl.split('/').pop(), ...generatedImages]);
          setGenerationProgress(100);
        } else {
          throw new Error("No image URL found in the response.");
        }
      } else {
        setError(`Failed to generate image: ${data.message}`);
      }
    } catch (err) {
      console.error("Error occurred:", err.message);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const addLoraField = () => {
    setLoraUrls([...loraUrls, { url: "", scale: 1 }]);
  };

  const removeLoraField = () => {
    if (loraUrls.length > 1) {
      setLoraUrls(loraUrls.slice(0, -1));
    }
  };

  const handleLoraChange = (index, value) => {
    const updatedLoraUrls = [...loraUrls];
    updatedLoraUrls[index].url = value;
    setLoraUrls(updatedLoraUrls);
  };

  const handleLoraScaleChange = (index, scale) => {
    const updatedLoraUrls = [...loraUrls];
    updatedLoraUrls[index].scale = scale;
    setLoraUrls(updatedLoraUrls);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setInputImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setInputImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearInputImage = () => {
    setInputImage(null);
    setInputImagePreview(null);
  };

  const requiresInputImage = () => {
    return model === "fal-ai/flux-pro/kontext";
  };

  const downloadImage = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-image-${Date.now()}.jpeg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('下载失败:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8 h-screen">
          {/* Left Sidebar */}
          <div className="col-span-3 apple-card-elevated custom-scrollbar overflow-y-auto space-y-6 p-6 h-full animate-fade-in-up">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold gradient-text mb-2">AI Image Studio</h1>
              <p className="text-gray-500 font-medium">Powered by fal.ai</p>
              <StatusBadge status="success">Online</StatusBadge>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab("generate")}
                className={`flex-1 py-3 font-medium text-sm transition-all ${
                  activeTab === "generate" 
                    ? "text-blue-600 border-b-2 border-blue-600" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <FontAwesomeIcon icon={faMagic} className="mr-2" />
                生成图片
              </button>
              <button
                onClick={() => setActiveTab("edit")}
                className={`flex-1 py-3 font-medium text-sm transition-all ${
                  activeTab === "edit" 
                    ? "text-blue-600 border-b-2 border-blue-600" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <FontAwesomeIcon icon={faEdit} className="mr-2" />
                编辑图片
              </button>
            </div>

            {activeTab === "generate" ? (
              <form onSubmit={generateImage} className="space-y-6">
                {/* Prompt */}
                <div className="animate-fade-in-up">
                  <label htmlFor="prompt" className="block text-sm font-semibold text-gray-900 mb-3">
                    Describe your vision
                  </label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    required
                    className="apple-input h-28 resize-none text-sm leading-relaxed"
                    placeholder="描述你想要生成的图像..."
                  />
                </div>

                {/* Cost Summary */}
                <div className="animate-fade-in-up p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Generation Cost</span>
                    <span className="text-lg font-bold text-purple-600">${calculateCost()}</span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>{modelPricing[model]?.name}</span>
                      <span>${modelPricing[model]?.price}/MP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{numImages} image{numImages > 1 ? 's' : ''} × {imageSize.replace('_', ' ')}</span>
                      <span>≈ {(modelPricing[model]?.price * (imageSize === 'square_hd' ? 1.0 : imageSize.includes('portrait') ? 0.75 : 0.5) * numImages).toFixed(3)}MP</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {loading && (
                  <div className="animate-fade-in-up">
                    <ProgressBar progress={generationProgress} />
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="apple-button-gradient w-full text-center font-semibold text-base py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <LoadingSpinner size="sm" color="gray" />
                      <span className="ml-3">Creating magic...</span>
                    </span>
                  ) : (
                    `Generate for $${calculateCost()} ✨`
                  )}
                </button>

                {/* Model Selection */}
                <div className="animate-fade-in-up">
                  <ModelSelector 
                    value={model}
                    onChange={setModel}
                    modelPricing={modelPricing}
                  />
                </div>

                {/* Image Upload for Kontext */}
                {requiresInputImage() && (
                  <div className="animate-fade-in-up">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Input Image <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-3">
                      {!inputImagePreview ? (
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="imageUpload"
                            required={requiresInputImage()}
                          />
                          <label
                            htmlFor="imageUpload"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <FontAwesomeIcon icon={faUpload} className="w-8 h-8 mb-3 text-gray-400" />
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Click to upload</span> an image
                              </p>
                              <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 10MB)</p>
                            </div>
                          </label>
                        </div>
                      ) : (
                        <div className="relative">
                          <img
                            src={inputImagePreview}
                            alt="Input preview"
                            className="w-full h-32 object-cover rounded-xl border border-gray-200"
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
                  </div>
                )}

                {/* Image Size */}
                <div className="animate-fade-in-up">
                  <label htmlFor="imageSize" className="block text-sm font-semibold text-gray-900 mb-3">
                    Canvas Size
                  </label>
                  <select
                    id="imageSize"
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value)}
                    className="apple-select text-sm"
                  >
                    <option value="square_hd">Square HD (1:1)</option>
                    <option value="portrait_4_3">Portrait (3:4)</option>
                    <option value="portrait_16_9">Portrait (9:16)</option>
                    <option value="landscape_4_3">Landscape (4:3)</option>
                    <option value="landscape_16_9">Landscape (16:9)</option>
                  </select>
                </div>

                {/* Advanced Settings */}
                <details className="animate-fade-in-up">
                  <summary className="cursor-pointer text-sm font-semibold text-gray-900 mb-3">
                    Advanced Settings
                  </summary>
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Steps</label>
                        <input
                          type="number"
                          value={numInferenceSteps}
                          onChange={(e) => setNumInferenceSteps(e.target.value)}
                          className="apple-input text-sm"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Guidance</label>
                        <input
                          type="number"
                          step="0.1"
                          value={guidanceScale}
                          onChange={(e) => setGuidanceScale(e.target.value)}
                          className="apple-input text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </details>
              </form>
            ) : (
              <ImageEditor onImageGenerated={(url) => {
                setImageUrl(url);
                const imageName = url.split('/').pop();
                setGeneratedImages([imageName, ...generatedImages]);
              }} />
            )}

            {/* Error Message */}
            {error && (
              <div className="animate-scale-in p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Center Panel */}
          <div className="col-span-7 apple-card-elevated flex flex-col p-8 animate-fade-in-up">
            {/* Model Info Bar */}
            <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{modelPricing[model]?.name}</h3>
                  <p className="text-xs text-gray-500">{modelPricing[model]?.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">${modelPricing[model]?.price}/MP</p>
                <p className="text-xs text-gray-500">Cost per megapixel</p>
              </div>
            </div>

            {/* Image Display Area */}
            <div className="flex-1 flex items-center justify-center">
              {loading ? (
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <LoadingSpinner size="xl" color="purple" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating your masterpiece</h3>
                  <p className="text-gray-500">This may take a few moments...</p>
                  <div className="mt-4 w-64 mx-auto">
                    <ProgressBar progress={generationProgress} />
                  </div>
                </div>
              ) : imageUrl ? (
                <div className="relative group">
                  <img
                    src={imageUrl}
                    alt="Generated AI Image"
                    className="max-w-full max-h-[70vh] object-contain squircle-lg shadow-glow cursor-pointer transition-transform duration-300 group-hover:scale-105"
                    onClick={handleImageClick}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 squircle-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white font-semibold bg-black bg-opacity-50 px-4 py-2 rounded-full">
                      Click to enlarge
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="absolute bottom-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditModalOpen(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 tooltip"
                      data-tooltip="Edit Image"
                    >
                      <FontAwesomeIcon icon={faEdit} className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadImage(imageUrl);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 tooltip"
                      data-tooltip="Download"
                    >
                      <FontAwesomeIcon icon={faDownload} className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to create</h3>
                  <p className="text-gray-500">Enter a prompt and click generate to start</p>
                </div>
              )}
            </div>

            {/* Modals */}
            <ImageEditModal 
              isOpen={isEditModalOpen} 
              onClose={() => setIsEditModalOpen(false)} 
              imageUrl={imageUrl} 
              onImageEdited={(url) => {
                setImageUrl(url);
                const imageName = url.split('/').pop();
                setGeneratedImages([imageName, ...generatedImages]);
              }} 
            />
            
            {/* Full-size Modal */}
            {isModalOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm animate-scale-in"
                onClick={handleCloseModal}
              >
                <div
                  className="relative max-w-7xl max-h-[95vh] p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors duration-200 z-10"
                    onClick={handleCloseModal}
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <img
                    src={imageUrl}
                    alt="Full-size Generated AI Image"
                    className="max-w-full max-h-full object-contain squircle-lg shadow-2xl"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Gallery */}
          <div className="col-span-2 apple-card-elevated custom-scrollbar overflow-auto p-6 animate-slide-in-right">
            <ImageGallery 
              images={generatedImages}
              onImageSelect={(image) => setImageUrl(`/outputs/${image}`)}
              onImageEdit={(image) => {
                setImageUrl(`/outputs/${image}`);
                setTimeout(() => setIsEditModalOpen(true), 50);
              }}
              onImageDelete={(image) => {
                // Implement delete functionality if needed
                console.log('Delete image:', image);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}