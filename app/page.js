"use client";
import { useState, useEffect } from "react";
import ImageEditor from "../components/ImageEditor";
import ImageEditModal from "../components/ImageEditModal";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faUpload, faImage, faEdit, faTimes } from '@fortawesome/free-solid-svg-icons';

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
  const [isModalOpen, setIsModalOpen] = useState(false); // For image preview modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // For image editing modal
  const [activeTab, setActiveTab] = useState("generate"); // For tab switching: "generate" or "edit"

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

  // Fetch generated images from the outputs directory (needs hooks above)
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch("/api/getGeneratedImages"); // Backend route that lists images
        const data = await res.json();

        // Sort images by timestamp in filename
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

  // ---------------- Guarded early returns (after all hooks/effects) ----------------
  // 显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">检查认证状态...</div>
      </div>
    );
  }

  // 如果未认证，显示登录提示
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <a href="/login" className="text-blue-600 underline hover:text-blue-800">
          Please login first
        </a>
      </div>
    );
  }

  // Model pricing information (per megapixel)
  const modelPricing = {
    "fal-ai/flux/dev": { price: 0.025, name: "Flux Development", description: "High-quality generation" },
    "fal-ai/flux-realism": { price: 0.025, name: "Flux Realism", description: "Photorealistic images" },
    "fal-ai/flux-pro": { price: 0.05, name: "FLUX.1 [pro]", description: "Premium quality" },
    "fal-ai/flux-pro/v1.1": { price: 0.04, name: "FLUX1.1 [pro]", description: "6x faster than FLUX.1" },
    "fal-ai/flux-pro/kontext": { price: 0.04, name: "FLUX.1 Kontext [pro]", description: "Advanced image editing" }
  };

  // Calculate estimated cost based on image size and model
  const calculateCost = () => {
    const modelInfo = modelPricing[model];
    if (!modelInfo) return 0;

    // Image size to megapixels mapping
    const sizeMegapixels = {
      "square_hd": 1.0,        // 1024x1024 = ~1MP
      "portrait_4_3": 0.75,    // ~0.75MP  
      "portrait_16_9": 0.5,    // ~0.5MP
      "landscape_4_3": 0.75,   // ~0.75MP
      "landscape_16_9": 0.5    // ~0.5MP
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

    try {
      // Check if Kontext model requires input image
      if (requiresInputImage() && !inputImage) {
        setError("请为Kontext模型上传一张输入图片");
        setLoading(false);
        return;
      }

      // Always use FormData for consistency with backend
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

      // Append image if required and provided
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
          setImageUrl(data.imageUrl); // Display the image from the local /outputs directory
          setGeneratedImages([data.imageUrl.split('/').pop(), ...generatedImages]);
        } else {
          throw new Error("No image URL found in the response.");
        }
      } else {
        setError(`Failed to generate image: ${data.message}`);
      }
    } catch (err) {
      console.error("Error occurred:", err.message);
      setError(`Error: ${err.message}`); // This will show more useful information in case something breaks.
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = () => {
    setIsModalOpen(true); // Open the preview modal when the image is clicked
  };
  
  const handleImageEditClick = (e) => {
    e.stopPropagation(); // Prevent the preview modal from opening
    setIsEditModalOpen(true); // Open the edit modal
  };

  const handleCloseModal = () => {
    setIsModalOpen(false); // Close the modal
  };

  const addLoraField = () => {
    setLoraUrls([...loraUrls, { url: "", scale: 1 }]);
  };

  const removeLoraField = () => {
    if (loraUrls.length > 1) {
      setLoraUrls(loraUrls.slice(0, -1)); // Remove the last element from the array
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

  // Handle image upload for image-to-image models
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
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

  // Check if current model requires input image
  const requiresInputImage = () => {
    return model === "fal-ai/flux-pro/kontext";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8 h-screen">
          {/* Left Sidebar for form */}
          <div className="col-span-3 apple-card-elevated custom-scrollbar overflow-y-auto space-y-6 p-6 h-full animate-fade-in-up">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Image Studio</h1>
              <p className="text-gray-500 font-medium">Powered by fal.ai</p>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab("generate")}
                className={`flex-1 py-3 font-medium text-sm ${activeTab === "generate" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                生成图片
              </button>
              <button
                onClick={() => setActiveTab("edit")}
                className={`flex-1 py-3 font-medium text-sm ${activeTab === "edit" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              >
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-28 resize-none text-sm leading-relaxed"
              placeholder="描述你想要生成的图像..."
            />
          </div>

          {/* Cost Summary */}
          <div className="animate-fade-in-up p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
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

          {/* Submit Prompt */}
          <button
            type="submit"
            disabled={loading}
            className="apple-button-primary w-full text-center font-semibold text-base py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating magic...
              </span>
            ) : (
              `Generate for $${calculateCost()} ✨`
            )}
          </button>

          {/* Model Selection */}
          <div className="animate-fade-in-up">
            <label htmlFor="model" className="block text-sm font-semibold text-gray-900 mb-3">
              AI Model
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="apple-select text-sm"
            >
              <optgroup label="🚀 Fast & Affordable">
                <option value="fal-ai/flux/dev">Flux Development - $0.025/MP (High Quality)</option>
                <option value="fal-ai/flux-realism">Flux Realism - $0.025/MP (Photorealistic)</option>
              </optgroup>
              <optgroup label="✨ Premium Quality">
                <option value="fal-ai/flux-pro/v1.1">FLUX1.1 [pro] - $0.04/MP (6x Faster)</option>
                <option value="fal-ai/flux-pro/kontext">FLUX.1 Kontext [pro] - $0.04/MP (Image Editing)</option>
                <option value="fal-ai/flux-pro">FLUX.1 [pro] - $0.05/MP (Premium)</option>
              </optgroup>
            </select>
            
            {/* Model Description and Cost Estimate */}
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">
                  {modelPricing[model]?.name}
                </p>
                <p className="text-blue-700 text-xs mb-2">
                  {modelPricing[model]?.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-600">
                    Estimated cost: <span className="font-semibold">${calculateCost()}</span>
                  </span>
                  <span className="text-xs text-blue-500">
                    {numImages} image{numImages > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Image Upload for Image-to-Image Models */}
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
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      <FontAwesomeIcon icon={faImage} className="mr-1" />
                      Input Image
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 animate-fade-in-up">
                <label htmlFor="strength" className="block text-sm font-semibold text-gray-900 mb-3">
                  Edit Strength ({strength})
                </label>
                <input
                  id="strength"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={strength}
                  onChange={(e) => setStrength(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Kontext模式:</strong> 上传一张图片，然后用文字描述你想要对图片进行的修改。
                </p>
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

          {/* LoRA URL Input */}
          <div className="animate-fade-in-up">
            <label htmlFor="loraUrl" className="block text-sm font-semibold text-gray-900 mb-3">
              Custom LoRA Models
            </label>
            <div className="space-y-3">
              {loraUrls.map((lora, index) => (
                <div key={index} className="space-y-2">
                  <input
                    type="text"
                    value={lora.url}
                    onChange={(e) => handleLoraChange(index, e.target.value)}
                    className="apple-input text-sm"
                    placeholder="Enter LoRA URL"
                  />
                  <input
                    type="number"
                    value={lora.scale}
                    onChange={(e) => handleLoraScaleChange(index, e.target.value)}
                    className="apple-input text-sm"
                    placeholder="Scale (0.0 - 1.0)"
                    step="0.1"
                    min="0"
                    max="1"
                  />
                </div>
              ))}

              {/* Buttons to add/remove LoRA fields */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={addLoraField}
                  className="apple-button-secondary flex-1 py-2 text-sm"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  Add LoRA
                </button>

                {loraUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={removeLoraField}
                    className="apple-button-secondary px-4 py-2 text-sm"
                  >
                    <FontAwesomeIcon icon={faMinus} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Advanced Settings Section */}
          <div className="animate-fade-in-up pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Number of Inference Steps */}
              <div>
                <label htmlFor="numInferenceSteps" className="block text-sm font-medium text-gray-700 mb-2">
                  Steps
                </label>
                <input
                  type="number"
                  id="numInferenceSteps"
                  value={numInferenceSteps}
                  onChange={(e) => setNumInferenceSteps(e.target.value)}
                  className="apple-input text-sm"
                  min="1"
                />
              </div>

              {/* Guidance Scale */}
              <div>
                <label htmlFor="guidanceScale" className="block text-sm font-medium text-gray-700 mb-2">
                  Guidance
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="guidanceScale"
                  value={guidanceScale}
                  onChange={(e) => setGuidanceScale(e.target.value)}
                  className="apple-input text-sm"
                />
              </div>

              {/* Number of Images */}
              <div>
                <label htmlFor="numImages" className="block text-sm font-medium text-gray-700 mb-2">
                  Images
                </label>
                <input
                  type="number"
                  id="numImages"
                  value={numImages}
                  onChange={(e) => setNumImages(e.target.value)}
                  className="apple-input text-sm"
                  min="1"
                  max="4"
                />
              </div>

              {/* Strength */}
              <div>
                <label htmlFor="strength" className="block text-sm font-medium text-gray-700 mb-2">
                  Strength
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="strength"
                  value={strength}
                  onChange={(e) => setStrength(e.target.value)}
                  className="apple-input text-sm"
                  min="0"
                  max="1"
                />
              </div>
            </div>
          </div>

          {/* Output Settings */}
          <div className="animate-fade-in-up pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Output Settings</h3>
            
            {/* Output Format */}
            <div className="mb-4">
              <label htmlFor="outputFormat" className="block text-sm font-semibold text-gray-900 mb-3">
                File Format
              </label>
              <select
                id="outputFormat"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                className="apple-select text-sm"
              >
                <option value="jpeg">JPEG (Smaller file)</option>
                <option value="png">PNG (Higher quality)</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              {/* Enable Safety Checker */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <label htmlFor="enableSafetyChecker" className="text-sm font-medium text-gray-900">
                    Content Safety
                  </label>
                  <p className="text-xs text-gray-500">Filter inappropriate content</p>
                </div>
                <input
                  type="checkbox"
                  id="enableSafetyChecker"
                  checked={enableSafetyChecker}
                  onChange={(e) => setEnableSafetyChecker(e.target.checked)}
                  className="h-5 w-5 text-blue-500 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                />
              </div>

              {/* Sync Mode */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <label htmlFor="syncMode" className="text-sm font-medium text-gray-900">
                    Real-time Mode
                  </label>
                  <p className="text-xs text-gray-500">Faster processing</p>
                </div>
                <input
                  type="checkbox"
                  id="syncMode"
                  checked={syncMode}
                  onChange={(e) => setSyncMode(e.target.checked)}
                  className="h-5 w-5 text-blue-500 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                />
              </div>
            </div>
          </div>

        </form>
        ) : (
          <ImageEditor onImageGenerated={(url) => {
            setImageUrl(url);
            const imageName = url.split('/').pop();
            setGeneratedImages([imageName, ...generatedImages]);
          }} />
        )}

        {/* Status Messages */}
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

          {/* Center Panel for displaying the generated image */}
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
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20"></div>
                  <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-spin"></div>
                  <div className="absolute inset-3 rounded-full bg-white"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating your masterpiece</h3>
                <p className="text-gray-500">This may take a few moments...</p>
              </div>
            ) : imageUrl ? (
              <div className="relative group">
                <img
                  src={imageUrl}
                  alt="Generated AI Image"
                  className="max-w-full max-h-[70vh] object-contain squircle-lg shadow-xl cursor-pointer transition-transform duration-300 group-hover:scale-105"
                  onClick={handleImageClick}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 squircle-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white font-semibold bg-black bg-opacity-50 px-4 py-2 rounded-full">
                    Click to enlarge
                  </div>
                </div>
                {/* Edit button overlay */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // This is crucial to prevent the image click handler
                    e.preventDefault();
                    setIsEditModalOpen(true);
                  }}
                  className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
                >
                  <FontAwesomeIcon icon={faEdit} className="w-5 h-5" />
                </button>
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

            {/* Image Edit Modal */}
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
            
            {/* Enhanced Modal for full-size image */}
            {isModalOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm animate-scale-in"
                onClick={handleCloseModal}
              >
                <div
                  className="relative max-w-7xl max-h-[95vh] p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close button */}
                  <button
                    className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors duration-200 z-10"
                    onClick={handleCloseModal}
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Full-size image */}
                  <img
                    src={imageUrl}
                    alt="Full-size Generated AI Image"
                    className="max-w-full max-h-full object-contain squircle-lg shadow-2xl"
                  />
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Right Sidebar for generated image history */}
          <div className="col-span-2 apple-card-elevated custom-scrollbar overflow-auto p-6 animate-fade-in-up">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Gallery</h2>
              <p className="text-sm text-gray-500">Your recent creations</p>
            </div>
            
            <div className="space-y-3">
              {generatedImages.length > 0 ? (
                generatedImages.map((image, index) => (
                  <div
                    key={index}
                    className="group cursor-pointer transition-all duration-200 hover:scale-105 relative"
                    onClick={() => setImageUrl(`/outputs/${image}`)}
                  >
                    <div className="relative overflow-hidden squircle-sm">
                      <img
                        src={`/outputs/${image}`}
                        alt={`Generated Image ${index + 1}`}
                        className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                        <div className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black bg-opacity-50 px-2 py-1 rounded-md">
                          Image #{generatedImages.length - index}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setImageUrl(`/outputs/${image}`);
                            setTimeout(() => setIsEditModalOpen(true), 50); // Add a small delay to ensure image URL is set
                          }}
                          className="bg-blue-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-blue-700"
                        >
                          <FontAwesomeIcon icon={faEdit} className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">No images yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}