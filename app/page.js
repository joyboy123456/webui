"use client";
import { useState, useEffect } from "react";
import ImageEditor from "../components/ImageEditor";
import ImageEditModal from "../components/ImageEditModal";
import ModelSelector from "../components/ModelSelector";
import MobileNavigation from "../components/MobileNavigation";
import LoadingSpinner from "../components/LoadingSpinner";
import ProgressBar from "../components/ProgressBar";
import StatusBadge from "../components/StatusBadge";
import ImageGallery from "../components/ImageGallery";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faUpload, faImage, faEdit, faTimes, faDownload, faMagic, faRocket, faStar, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

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
  const [isPromptConverterOpen, setIsPromptConverterOpen] = useState(false); // For prompt converter modal
  const [chinesePrompt, setChinesePrompt] = useState(""); // For Chinese prompt input
  const [loadingConversion, setLoadingConversion] = useState(false); // For conversion loading state
  const [progress, setProgress] = useState(0); // For progress tracking
  const [generationSpeed, setGenerationSpeed] = useState(null); // For speed tracking

  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [activePanel, setActivePanel] = useState('generate');

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
  const [model, setModel] = useState("fal-ai/flux-pro/kontext");
  // ---------------------

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <LoadingSpinner size="xl" color="blue" />
          <div className="text-lg mt-4 text-gray-700">检查认证状态...</div>
        </div>
      </div>
    );
  }

  // 如果未认证，显示登录提示
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
        <div className="apple-card-elevated p-8 text-center animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-2xl flex items-center justify-center">
            <FontAwesomeIcon icon={faMagic} className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to access AI Image Studio</p>
          <a 
            href="/login" 
            className="apple-button-primary inline-flex items-center px-6 py-3"
          >
            <FontAwesomeIcon icon={faRocket} className="mr-2" />
            Sign In
          </a>
        </div>
      </div>
    );
  }

  // Model pricing information (per megapixel) - 更新的热门模型
  const modelPricing = {
    // 🏆 Top 10 热门模型
    "fal-ai/flux-pro/kontext": { 
      price: 0.04, 
      name: "FLUX.1 Kontext [pro]", 
      description: "🥇 #1 最热门 - 革命性指令式编辑", 
      speed: "Ultra Fast (1-4s)",
      quality: "Premium",
      hotness: "🔥🔥🔥🔥🔥",
      rank: 1
    },
    "fal-ai/flux-pro/v1.1-ultra": { 
      price: 0.06, 
      name: "FLUX.1 [pro] v1.1 Ultra", 
      description: "🥈 #2 最新旗舰 - 2K分辨率支持", 
      speed: "Ultra Fast (1-3s)",
      quality: "Ultra Premium",
      hotness: "🔥🔥🔥🔥🔥",
      rank: 2
    },
    "fal-ai/google-imagen-4": { 
      price: 0.04, 
      name: "Google Imagen 4", 
      description: "🥉 #3 Google最新 - AI图像生成重大飞跃", 
      speed: "Fast (2-5s)",
      quality: "Premium",
      hotness: "🔥🔥🔥🔥🔥",
      rank: 3
    },
    "fal-ai/recraft-v3": { 
      price: 0.04, 
      name: "Recraft V3", 
      description: "#4 ELO冠军 - 行业领先基准测试第一", 
      speed: "Fast (2-4s)",
      quality: "Premium",
      hotness: "🔥🔥🔥🔥",
      rank: 4
    },
    "fal-ai/flux/dev": { 
      price: 0.025, 
      name: "FLUX.1 [dev]", 
      description: "#5 开源之王 - 120亿参数开源版本", 
      speed: "Fast (3-6s)",
      quality: "High",
      hotness: "🔥🔥🔥🔥",
      rank: 5
    },
    "fal-ai/flux/schnell": { 
      price: 0.003, 
      name: "FLUX.1 [schnell]", 
      description: "#6 极速版本 - 0.6秒超快生成", 
      speed: "Ultra Fast (0.6s)",
      quality: "Good",
      hotness: "🔥🔥🔥🔥",
      rank: 6
    },
    "fal-ai/omnigen-v1": { 
      price: 0.10, 
      name: "OmniGen v1", 
      description: "#7 多模态统一 - 一个模型多种任务", 
      speed: "Medium (5-8s)",
      quality: "High",
      hotness: "🔥🔥🔥🔥",
      rank: 7
    },
    "fal-ai/ideogram-v3": { 
      price: 0.05, 
      name: "Ideogram v3", 
      description: "#8 文字渲染专家 - 复杂提示理解", 
      speed: "Fast (2-5s)",
      quality: "High",
      hotness: "🔥🔥🔥",
      rank: 8
    },
    "fal-ai/stable-diffusion-3.5-large": { 
      price: 0.035, 
      name: "Stable Diffusion 3.5 Large", 
      description: "#9 SD最新版 - 80亿参数专业应用", 
      speed: "Medium (4-7s)",
      quality: "High",
      hotness: "🔥🔥🔥",
      rank: 9
    },
    "fal-ai/minimax-image-01": { 
      price: 0.01, 
      name: "MiniMax Image-01", 
      description: "#10 性价比之王 - 超低成本固定价格", 
      speed: "Fast (2-4s)",
      quality: "Good",
      hotness: "🔥🔥🔥",
      rank: 10
    },
    
    // 经典热门模型
    "fal-ai/flux-realism": { 
      price: 0.025, 
      name: "Flux Realism", 
      description: "照片级真实感图像生成", 
      speed: "Fast (3-6s)",
      quality: "High",
      hotness: "🔥🔥🔥"
    },
    "fal-ai/flux-pro": { 
      price: 0.05, 
      name: "FLUX.1 [pro]", 
      description: "商业级高端质量", 
      speed: "Fast (2-5s)",
      quality: "Premium",
      hotness: "🔥🔥🔥"
    },
    "fal-ai/flux-lora": { 
      price: 0.025, 
      name: "FLUX LoRA", 
      description: "自定义风格和创意", 
      speed: "Medium (4-8s)",
      quality: "Customizable",
      hotness: "🔥🔥"
    }
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
    setProgress(0);
    const startTime = Date.now();

    // Progress simulation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      // Check if Kontext model requires input image
      if (requiresInputImage() && !inputImage) {
        setError("请为Kontext模型上传一张输入图片");
        setLoading(false);
        clearInterval(progressInterval);
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

      console.log('🚀 发送生成请求，使用模型:', model);
      const response = await fetch("/api/generateImage", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log('📡 生成响应:', data);

      if (response.ok) {
        if (data.imageUrl) {
          setProgress(100);
          const endTime = Date.now();
          const speed = ((endTime - startTime) / 1000).toFixed(1);
          setGenerationSpeed(speed);
          
          setImageUrl(data.imageUrl); // Display the image from the local /outputs directory
          
          // 只有在本地环境下才更新图片列表
          if (data.environment === 'local') {
            setGeneratedImages([data.imageUrl.split('/').pop(), ...generatedImages]);
          }
          
          // Auto switch to image panel on mobile after generation
          if (isMobile) {
            setTimeout(() => setActivePanel('image'), 500);
          }
        } else {
          throw new Error("No image URL found in the response.");
        }
      } else {
        // 显示更详细的错误信息
        let errorMsg = data.message || "生成失败";
        if (data.code) {
          errorMsg += ` (${data.code})`;
        }
        setError(errorMsg);
        
        // 如果是环境配置问题，显示特殊提示
        if (data.code === 'MISSING_API_KEY') {
          setError("❌ API密钥未配置！请在Vercel项目设置中添加FAL_KEY环境变量");
        } else if (data.code === 'INVALID_CREDENTIALS') {
          setError("❌ API密钥无效！请检查FAL_KEY是否正确");
        } else if (data.code === 'QUOTA_EXCEEDED') {
          setError("❌ API配额不足！请检查您的fal.ai账户余额");
        }
      }
    } catch (err) {
      console.error("❌ 生成请求失败:", err.message);
      setError(`网络错误: ${err.message}`);
    } finally {
      setLoading(false);
      clearInterval(progressInterval);
      if (progress < 100) setProgress(0);
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

  // Download image function
  const downloadImage = async (imageUrl, imageName) => {
    try {
      // 如果是 base64 data URL，直接下载
      if (imageUrl.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = imageName || 'generated-image.jpeg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      
      // 否则通过 fetch 下载
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

  // Mobile panel content
  const renderMobileContent = () => {
    switch (activePanel) {
      case 'generate':
        return (
          <div className="p-4 space-y-6 pb-24">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Image Studio</h1>
              <p className="text-gray-500 font-medium">Powered by fal.ai</p>
            </div>

            <form onSubmit={generateImage} className="space-y-6">
              {/* Prompt */}
              <div>
                <label htmlFor="prompt" className="block text-sm font-semibold text-gray-900 mb-3">
                  <FontAwesomeIcon icon={faStar} className="mr-2 text-blue-500" />
                  Describe your vision
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  required
                  className="apple-input h-24 resize-none text-sm leading-relaxed"
                  placeholder="描述你想要生成的图像..."
                />
              </div>

              {/* Model Selection */}
              <ModelSelector 
                value={model}
                onChange={setModel}
                modelPricing={modelPricing}
              />

              {/* Cost Summary */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
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
                <div className="space-y-3">
                  <ProgressBar progress={progress} />
                  <div className="text-center">
                    <StatusBadge status="processing">
                      Generating with {modelPricing[model]?.name}
                    </StatusBadge>
                  </div>
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
                  <span className="flex items-center justify-center">
                    <FontAwesomeIcon icon={faMagic} className="mr-2" />
                    Generate for ${calculateCost()} ✨
                  </span>
                )}
              </button>

              {/* Basic Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Settings</h3>
                
                {/* Image Size */}
                <div>
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

                {/* Number of Images */}
                <div>
                  <label htmlFor="numImages" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Images
                  </label>
                  <select
                    id="numImages"
                    value={numImages}
                    onChange={(e) => setNumImages(parseInt(e.target.value))}
                    className="apple-select text-sm"
                  >
                    <option value="1">1 Image</option>
                    <option value="2">2 Images</option>
                    <option value="3">3 Images</option>
                    <option value="4">4 Images</option>
                  </select>
                </div>
              </div>
            </form>

            {/* Error Messages */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                    {error.includes('FAL_KEY') && (
                      <div className="mt-2 text-xs text-red-600">
                        <p>💡 解决方法:</p>
                        <ol className="list-decimal list-inside mt-1 space-y-1">
                          <li>登录 Vercel Dashboard</li>
                          <li>进入项目设置 → Environment Variables</li>
                          <li>添加 FAL_KEY 变量</li>
                          <li>重新部署项目</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="p-4 pb-24">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Generated Image</h2>
              {generationSpeed && (
                <StatusBadge status="success">
                  Generated in {generationSpeed}s
                </StatusBadge>
              )}
            </div>

            {loading ? (
              <div className="text-center py-20">
                <LoadingSpinner size="xl" color="purple" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">Creating your masterpiece</h3>
                <p className="text-gray-500">This may take a few moments...</p>
                {progress > 0 && (
                  <div className="mt-4 max-w-xs mx-auto">
                    <ProgressBar progress={progress} />
                  </div>
                )}
              </div>
            ) : imageUrl ? (
              <div className="space-y-4">
                <div className="relative group">
                  <img
                    src={imageUrl}
                    alt="Generated AI Image"
                    className="w-full object-contain squircle-lg shadow-xl cursor-pointer"
                    onClick={handleImageClick}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 squircle-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white font-semibold bg-black bg-opacity-50 px-4 py-2 rounded-full">
                      Tap to enlarge
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => downloadImage(imageUrl, `generated-image-${Date.now()}.jpeg`)}
                    className="apple-button-secondary flex items-center justify-center py-3"
                  >
                    <FontAwesomeIcon icon={faDownload} className="mr-2" />
                    Download
                  </button>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="apple-button-primary flex items-center justify-center py-3"
                  >
                    <FontAwesomeIcon icon={faEdit} className="mr-2" />
                    Edit
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                  <FontAwesomeIcon icon={faImage} className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No image yet</h3>
                <p className="text-gray-500">Generate an image to see it here</p>
                <button
                  onClick={() => setActivePanel('generate')}
                  className="apple-button-primary mt-4 px-6 py-3"
                >
                  <FontAwesomeIcon icon={faMagic} className="mr-2" />
                  Start Creating
                </button>
              </div>
            )}
          </div>
        );

      case 'gallery':
        return (
          <div className="p-4 pb-24">
            <ImageGallery
              images={generatedImages}
              onImageSelect={(image) => {
                setImageUrl(`/outputs/${image}`);
                setActivePanel('image');
              }}
              onImageEdit={(image) => {
                setImageUrl(`/outputs/${image}`);
                setIsEditModalOpen(true);
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Desktop layout
  if (!isMobile) {
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
                      <FontAwesomeIcon icon={faStar} className="mr-2 text-blue-500" />
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

                  {/* Model Selection */}
                  <ModelSelector 
                    value={model}
                    onChange={setModel}
                    modelPricing={modelPricing}
                  />

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

                  {/* Progress Bar */}
                  {loading && (
                    <div className="animate-fade-in-up space-y-3">
                      <ProgressBar progress={progress} />
                      <div className="text-center">
                        <StatusBadge status="processing">
                          Generating with {modelPricing[model]?.name}
                        </StatusBadge>
                      </div>
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
                      <span className="flex items-center justify-center">
                        <FontAwesomeIcon icon={faMagic} className="mr-2" />
                        Generate for ${calculateCost()} ✨
                      </span>
                    )}
                  </button>

                  {/* Rest of the desktop form... */}
                  {/* (继续包含所有其他设置项) */}
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
                      <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">{error}</p>
                      {error.includes('FAL_KEY') && (
                        <div className="mt-2 text-xs text-red-600">
                          <p>💡 解决方法:</p>
                          <ol className="list-decimal list-inside mt-1 space-y-1">
                            <li>登录 Vercel Dashboard</li>
                            <li>进入项目设置 → Environment Variables</li>
                            <li>添加 FAL_KEY 变量</li>
                            <li>重新部署项目</li>
                          </ol>
                        </div>
                      )}
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
                    <LoadingSpinner size="xl" color="purple" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">Creating your masterpiece</h3>
                    <p className="text-gray-500">This may take a few moments...</p>
                    {progress > 0 && (
                      <div className="mt-4 max-w-xs mx-auto">
                        <ProgressBar progress={progress} />
                      </div>
                    )}
                    {generationSpeed && (
                      <div className="mt-2">
                        <StatusBadge status="info">
                          Speed: {generationSpeed}s
                        </StatusBadge>
                      </div>
                    )}
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
                    {/* Action buttons overlay */}
                    <div className="absolute bottom-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(imageUrl, `generated-image-${Date.now()}.jpeg`);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-full p-3 shadow-lg transition-all duration-200"
                      >
                        <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsEditModalOpen(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200"
                      >
                        <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                      <FontAwesomeIcon icon={faImage} className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to create</h3>
                    <p className="text-gray-500">Enter a prompt and click generate to start</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar for generated image history */}
            <div className="col-span-2 apple-card-elevated custom-scrollbar overflow-auto p-6 animate-fade-in-up">
              <ImageGallery
                images={generatedImages}
                onImageSelect={(image) => setImageUrl(`/outputs/${image}`)}
                onImageEdit={(image) => {
                  setImageUrl(`/outputs/${image}`);
                  setIsEditModalOpen(true);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Mobile sticky header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 safe-area-pt">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">AI Image Studio</h1>
            <p className="text-xs text-gray-500">Powered by fal.ai</p>
          </div>
          <div className="flex items-center space-x-2">
            {generationSpeed && (
              <StatusBadge status="success">
                {generationSpeed}s
              </StatusBadge>
            )}
            <StatusBadge status="info">
              {generatedImages.length}
            </StatusBadge>
          </div>
        </div>
      </div>

      {/* Mobile content */}
      <div className="min-h-screen">
        {renderMobileContent()}
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation
        activePanel={activePanel}
        onPanelChange={setActivePanel}
        hasImage={!!imageUrl}
        imageCount={generatedImages.length}
      />

      {/* Modals */}
      <ImageEditModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        imageUrl={imageUrl} 
        onImageEdited={(url) => {
          setImageUrl(url);
          const imageName = url.split('/').pop();
          setGeneratedImages([imageName, ...generatedImages]);
          if (isMobile) setActivePanel('image');
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
  );
}