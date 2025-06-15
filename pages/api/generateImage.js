// pages/api/generateImage.js

import * as fal from "@fal-ai/serverless-client";
import fs from 'fs';
import path from 'path';
import formidable from 'formidable';

const FAL_KEY = process.env.FAL_KEY;

// 检查 FAL_KEY 是否存在
if (!FAL_KEY) {
    console.error('❌ FAL_KEY is not set in environment variables');
} else {
    console.log('✅ FAL_KEY is configured');
}

fal.config({
    credentials: FAL_KEY,
});

// Disable default body parser for file upload
export const config = {
    api: {
        bodyParser: false,
        // Vercel 特定配置
        maxDuration: 60, // 增加超时时间到60秒
    },
};

// 模型特定的参数映射
const getModelSpecificInput = (model, baseInput) => {
    console.log(`🎯 配置模型参数: ${model}`);
    
    const modelConfigs = {
        // Google Imagen 4 特定配置
        "fal-ai/google-imagen-4": {
            prompt: baseInput.prompt,
            aspect_ratio: baseInput.image_size,
            output_format: baseInput.output_format,
            safety_tolerance: baseInput.enable_safety_checker ? "block_most" : "block_only_high",
        },
        
        // Recraft V3 特定配置
        "fal-ai/recraft-v3": {
            prompt: baseInput.prompt,
            style: "realistic_image",
            size: baseInput.image_size,
            output_format: baseInput.output_format,
        },
        
        // FLUX 系列通用配置
        "fal-ai/flux/dev": baseInput,
        "fal-ai/flux/schnell": baseInput,
        "fal-ai/flux-realism": baseInput,
        "fal-ai/flux-pro": baseInput,
        "fal-ai/flux-pro/v1.1": baseInput,
        "fal-ai/flux-pro/v1.1-ultra": baseInput,
        "fal-ai/flux-pro/kontext": baseInput,
        
        // Ideogram V3 特定配置
        "fal-ai/ideogram-v3": {
            prompt: baseInput.prompt,
            aspect_ratio: baseInput.image_size,
            model: "V_3",
            magic_prompt_option: "Auto",
            style_type: "Auto",
        },
        
        // Stable Diffusion 3.5 特定配置
        "fal-ai/stable-diffusion-3.5-large": {
            prompt: baseInput.prompt,
            image_size: baseInput.image_size,
            num_inference_steps: Math.min(baseInput.num_inference_steps, 50),
            guidance_scale: baseInput.guidance_scale,
            num_images: baseInput.num_images,
            enable_safety_checker: baseInput.enable_safety_checker,
            output_format: baseInput.output_format,
        },
        
        // OmniGen 特定配置
        "fal-ai/omnigen-v1": {
            prompt: baseInput.prompt,
            width: getImageDimensions(baseInput.image_size).width,
            height: getImageDimensions(baseInput.image_size).height,
            num_inference_steps: baseInput.num_inference_steps,
            guidance_scale: baseInput.guidance_scale,
            num_images: baseInput.num_images,
        },
        
        // MiniMax 特定配置
        "fal-ai/minimax-image-01": {
            prompt: baseInput.prompt,
            aspect_ratio: baseInput.image_size,
        },
    };

    const config = modelConfigs[model] || baseInput;
    console.log(`📋 模型配置:`, JSON.stringify(config, null, 2));
    return config;
};

// 获取图片尺寸
const getImageDimensions = (imageSize) => {
    const dimensions = {
        "square_hd": { width: 1024, height: 1024 },
        "portrait_4_3": { width: 768, height: 1024 },
        "portrait_16_9": { width: 576, height: 1024 },
        "landscape_4_3": { width: 1024, height: 768 },
        "landscape_16_9": { width: 1024, height: 576 },
    };
    return dimensions[imageSize] || dimensions["landscape_4_3"];
};

// 图片尺寸格式转换
const convertImageSize = (imageSize, model) => {
    // Google Imagen 4 使用不同的尺寸格式
    if (model === "fal-ai/google-imagen-4") {
        const sizeMap = {
            "square_hd": "1:1",
            "portrait_4_3": "3:4",
            "portrait_16_9": "9:16",
            "landscape_4_3": "4:3",
            "landscape_16_9": "16:9",
        };
        return sizeMap[imageSize] || "4:3";
    }
    
    // Recraft V3 使用特定的尺寸格式
    if (model === "fal-ai/recraft-v3") {
        const sizeMap = {
            "square_hd": "1024x1024",
            "portrait_4_3": "768x1024",
            "portrait_16_9": "576x1024",
            "landscape_4_3": "1024x768",
            "landscape_16_9": "1024x576",
        };
        return sizeMap[imageSize] || "1024x768";
    }
    
    // Ideogram V3 使用比例格式
    if (model === "fal-ai/ideogram-v3") {
        const sizeMap = {
            "square_hd": "ASPECT_1_1",
            "portrait_4_3": "ASPECT_3_4",
            "portrait_16_9": "ASPECT_9_16",
            "landscape_4_3": "ASPECT_4_3",
            "landscape_16_9": "ASPECT_16_9",
        };
        return sizeMap[imageSize] || "ASPECT_4_3";
    }
    
    return imageSize;
};

// 提示词质量检查和增强
const enhancePrompt = (prompt, model) => {
    // 如果提示词太短或太简单，进行增强
    if (prompt.length < 10 || /^(1girl|1boy|cat|dog|car)$/i.test(prompt.trim())) {
        console.log('🔧 检测到简单提示词，进行增强...');
        
        const enhancedPrompts = {
            '1girl': 'a beautiful young woman with long flowing hair, wearing elegant clothing, standing in a scenic outdoor setting, soft natural lighting, high quality, detailed',
            '1boy': 'a handsome young man with confident expression, wearing casual modern clothing, urban background, natural lighting, high quality, detailed',
            'cat': 'a cute fluffy cat with bright eyes, sitting gracefully, soft fur texture, warm lighting, high quality, detailed',
            'dog': 'a friendly golden retriever dog with happy expression, sitting in a park, natural lighting, high quality, detailed',
            'car': 'a sleek modern sports car with metallic paint, parked on a scenic road, dramatic lighting, high quality, detailed'
        };
        
        const enhanced = enhancedPrompts[prompt.toLowerCase().trim()];
        if (enhanced) {
            console.log(`✨ 提示词增强: "${prompt}" -> "${enhanced}"`);
            return enhanced;
        }
    }
    
    return prompt;
};

export default async function handler(req, res) {
    const startTime = Date.now();
    console.log('🚀 开始处理图片生成请求...');
    console.log('🌍 环境:', process.env.VERCEL ? 'Vercel' : 'Local');
    console.log('⏰ 请求时间:', new Date().toISOString());

    if (req.method !== "POST") {
        console.log('❌ 错误的请求方法:', req.method);
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        // Vercel 环境检查
        if (process.env.VERCEL) {
            console.log('🔧 Vercel 环境配置检查:');
            console.log('- FAL_KEY 存在:', !!FAL_KEY);
            console.log('- FAL_KEY 长度:', FAL_KEY ? FAL_KEY.length : 0);
            console.log('- FAL_KEY 前缀:', FAL_KEY ? FAL_KEY.substring(0, 8) + '...' : 'N/A');
            console.log('- 函数区域:', process.env.VERCEL_REGION || 'unknown');
            console.log('- 部署URL:', process.env.VERCEL_URL || 'unknown');
        }

        // 🔥 修复：确保使用正确的临时目录
        const tempDir = '/tmp'; // Vercel 环境下只能使用 /tmp
        console.log('📁 使用临时目录:', tempDir);
        
        // 确保临时目录存在
        if (!fs.existsSync(tempDir)) {
            console.log('📁 创建临时目录:', tempDir);
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Parse form data - 🔥 修复：直接使用 /tmp 作为上传目录
        const form = formidable({
            uploadDir: tempDir, // 直接使用 /tmp
            keepExtensions: true,
            maxFileSize: 10 * 1024 * 1024, // 10MB limit
        });

        console.log('📝 解析表单数据...');
        const [fields, files] = await form.parse(req);
        console.log('✅ 表单解析完成');

        // Extract fields
        let prompt = fields.prompt?.[0] || '';
        const image_size = fields.image_size?.[0] || 'landscape_4_3';
        const num_inference_steps = parseInt(fields.num_inference_steps?.[0]) || 28;
        const guidance_scale = parseFloat(fields.guidance_scale?.[0]) || 3.5;
        const num_images = parseInt(fields.num_images?.[0]) || 1;
        const enable_safety_checker = fields.enable_safety_checker?.[0] === 'true';
        const strength = parseFloat(fields.strength?.[0]) || 1;
        const output_format = fields.output_format?.[0] || 'jpeg';
        const sync_mode = fields.sync_mode?.[0] === 'true';
        const model = fields.model?.[0] || 'fal-ai/flux/dev';

        console.log('📊 请求参数:', {
            prompt: prompt.substring(0, 50) + '...',
            model,
            image_size,
            num_images,
            sync_mode
        });

        if (!prompt.trim()) {
            console.log('❌ 提示词为空');
            return res.status(400).json({ 
                message: "提示词不能为空",
                code: "EMPTY_PROMPT"
            });
        }

        if (!FAL_KEY) {
            console.log('❌ FAL_KEY 未配置');
            return res.status(500).json({ 
                message: "❌ API密钥未配置！请在Vercel项目设置中添加FAL_KEY环境变量",
                code: "MISSING_API_KEY",
                solution: {
                    title: "解决方案",
                    steps: [
                        "1. 登录 Vercel Dashboard",
                        "2. 进入项目设置 → Environment Variables", 
                        "3. 添加 FAL_KEY 变量",
                        "4. 重新部署项目"
                    ],
                    debugUrl: "/debug-vercel"
                }
            });
        }

        // 验证FAL_KEY格式
        if (!FAL_KEY.startsWith('fal-')) {
            console.log('⚠️ FAL_KEY 格式可能不正确');
            return res.status(500).json({
                message: "❌ API密钥格式不正确！FAL API密钥应该以'fal-'开头",
                code: "INVALID_API_KEY_FORMAT",
                solution: {
                    title: "解决方案",
                    steps: [
                        "1. 访问 https://fal.ai/dashboard/keys",
                        "2. 重新生成API密钥",
                        "3. 确保密钥以'fal-'开头",
                        "4. 更新Vercel环境变量"
                    ],
                    debugUrl: "/debug-vercel"
                }
            });
        }

        // 增强提示词
        const originalPrompt = prompt;
        prompt = enhancePrompt(prompt, model);
        if (prompt !== originalPrompt) {
            console.log(`✨ 提示词已增强: "${originalPrompt}" -> "${prompt}"`);
        }

        // 基础输入参数
        let baseInput = {
            prompt,
            image_size: convertImageSize(image_size, model),
            num_inference_steps,
            guidance_scale,
            num_images,
            enable_safety_checker,
            strength,
            output_format,
        };

        // Handle image upload for image-to-image models
        if (files.input_image && files.input_image[0]) {
            console.log('🖼️ 处理输入图片...');
            const uploadedFile = files.input_image[0];
            
            if (!fs.existsSync(uploadedFile.filepath)) {
                console.error('❌ 上传的文件不存在:', uploadedFile.filepath);
                return res.status(400).json({ 
                    message: "上传的文件不存在或已被删除",
                    code: "FILE_NOT_FOUND"
                });
            }
            
            const imageBuffer = fs.readFileSync(uploadedFile.filepath);
            console.log('📤 上传图片到 fal 存储...');
            
            const imageUrl = await fal.storage.upload(imageBuffer, {
                contentType: uploadedFile.mimetype || 'image/jpeg',
            });
            
            baseInput.image_url = imageUrl;
            console.log('✅ 图片已上传到 fal 存储');
            
            // Clean up temporary file
            try {
                fs.unlinkSync(uploadedFile.filepath);
            } catch (cleanupError) {
                console.warn('⚠️ 删除临时文件失败:', cleanupError.message);
            }
        }

        // 根据模型获取特定的输入参数
        const input = getModelSpecificInput(model, baseInput);

        console.log('🤖 调用 fal.ai API...');
        console.log('📡 模型:', model);
        console.log('⚙️ 同步模式:', sync_mode);

        // 设置超时处理
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('API调用超时')), 55000); // 55秒超时
        });

        const apiPromise = fal.subscribe(model, {
            input,
            sync_mode,
        });

        const result = await Promise.race([apiPromise, timeoutPromise]);

        const apiTime = Date.now() - startTime;
        console.log(`⚡ API 调用完成，耗时: ${apiTime}ms`);

        if (!result || !result.images || result.images.length === 0) {
            console.error('❌ API 响应中没有图片:', result);
            return res.status(500).json({ 
                message: "API返回的结果中没有图片",
                code: "NO_IMAGES_RETURNED",
                result: result,
                solution: {
                    title: "可能的原因",
                    steps: [
                        "1. 提示词被安全检查器拦截",
                        "2. 模型暂时不可用",
                        "3. API配额不足",
                        "4. 网络连接问题"
                    ],
                    debugUrl: "/debug-vercel"
                }
            });
        }

        const imageUrl = result.images[0].url;
        console.log('🔗 获取到图片 URL:', imageUrl);

        // 下载图片
        console.log('⬇️ 下载图片...');
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error(`下载图片失败: ${imageResponse.status} ${imageResponse.statusText}`);
        }
        
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const totalTime = Date.now() - startTime;
        console.log(`🎉 图片生成成功! 总耗时: ${totalTime}ms`);

        // 🔥 修复：在 Vercel 环境下直接返回 base64，不保存文件
        if (process.env.VERCEL) {
            console.log('📱 Vercel 环境：返回 base64 格式图片');
            const base64Image = buffer.toString('base64');
            const dataUrl = `data:image/jpeg;base64,${base64Image}`;
            
            return res.status(200).json({ 
                message: 'Image generated successfully!', 
                imageUrl: dataUrl, // 使用 base64 data URL
                originalUrl: imageUrl,
                model: model,
                generationTime: totalTime,
                environment: 'vercel',
                enhancedPrompt: prompt !== originalPrompt ? prompt : null
            });
        } else {
            // 本地环境：保存到文件系统
            const outputDir = path.join(process.cwd(), 'public', 'outputs');
            const imageName = `generated-image-${Date.now()}.jpeg`;
            const outputFilePath = path.join(outputDir, imageName);

            // 确保输出目录存在
            if (!fs.existsSync(outputDir)) {
                console.log('📁 创建输出目录:', outputDir);
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // 保存图片
            console.log('💾 保存图片到:', outputFilePath);
            fs.writeFileSync(outputFilePath, buffer);
            
            return res.status(200).json({ 
                message: 'Image generated successfully!', 
                imageUrl: `/outputs/${imageName}`,
                originalUrl: imageUrl,
                model: model,
                generationTime: totalTime,
                environment: 'local',
                enhancedPrompt: prompt !== originalPrompt ? prompt : null
            });
        }

    } catch (error) {
        const errorTime = Date.now() - startTime;
        console.error("💥 生成图片时发生错误:", error);
        console.error("📍 错误堆栈:", error.stack);
        console.error(`⏱️ 错误发生时间: ${errorTime}ms`);
        
        // 提供更详细的错误信息
        let errorMessage = "生成图片失败";
        let errorCode = "UNKNOWN_ERROR";
        let solution = null;
        
        if (error.message.includes('credentials') || error.message.includes('unauthorized') || error.message.includes('401')) {
            errorMessage = "❌ API密钥无效！请检查FAL_KEY是否正确";
            errorCode = "INVALID_CREDENTIALS";
            solution = {
                title: "解决方案",
                steps: [
                    "1. 检查FAL_KEY是否正确设置",
                    "2. 访问 https://fal.ai/dashboard/keys 重新生成密钥",
                    "3. 更新Vercel环境变量",
                    "4. 重新部署项目"
                ],
                debugUrl: "/debug-vercel"
            };
        } else if (error.message.includes('quota') || error.message.includes('limit') || error.message.includes('insufficient')) {
            errorMessage = "❌ API配额不足！请检查您的fal.ai账户余额";
            errorCode = "QUOTA_EXCEEDED";
            solution = {
                title: "解决方案",
                steps: [
                    "1. 访问 https://fal.ai/dashboard 查看账户余额",
                    "2. 充值账户或等待配额重置",
                    "3. 检查使用限制设置"
                ]
            };
        } else if (error.message.includes('timeout') || error.message.includes('超时')) {
            errorMessage = "⏱️ 请求超时，请稍后重试";
            errorCode = "TIMEOUT";
            solution = {
                title: "解决方案",
                steps: [
                    "1. 稍等片刻后重试",
                    "2. 尝试使用更快的模型（如FLUX schnell）",
                    "3. 减少生成图片数量"
                ]
            };
        } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('ENOTFOUND')) {
            errorMessage = "🌐 网络连接错误，请稍后重试";
            errorCode = "NETWORK_ERROR";
            solution = {
                title: "解决方案",
                steps: [
                    "1. 检查网络连接",
                    "2. 稍后重试",
                    "3. 检查fal.ai服务状态"
                ]
            };
        } else if (error.message.includes('ENOENT') || error.message.includes('mkdir')) {
            errorMessage = "📁 文件系统错误，这是Vercel环境限制";
            errorCode = "FILESYSTEM_ERROR";
            solution = {
                title: "解决方案",
                steps: [
                    "1. 这个错误已经修复",
                    "2. 重新部署项目",
                    "3. 如果仍有问题，请联系支持"
                ]
            };
        } else if (error.message.includes('Invalid input') || error.message.includes('validation')) {
            errorMessage = "📝 输入参数不正确，请检查模型要求";
            errorCode = "INVALID_INPUT";
        } else if (error.message.includes('Model not found') || error.message.includes('404')) {
            errorMessage = "🤖 模型不存在或暂时不可用";
            errorCode = "MODEL_NOT_FOUND";
        } else if (error.message) {
            errorMessage = `❌ ${error.message}`;
        }
        
        res.status(500).json({ 
            message: errorMessage,
            code: errorCode,
            error: error.message,
            model: fields?.model?.[0] || 'unknown',
            environment: process.env.VERCEL ? 'vercel' : 'local',
            errorTime: errorTime,
            solution: solution,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}