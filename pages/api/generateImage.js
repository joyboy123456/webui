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
            console.log('- 函数区域:', process.env.VERCEL_REGION || 'unknown');
        }

        // 确保临时目录存在 (Vercel 使用 /tmp)
        const tempDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
            console.log('📁 创建临时目录:', tempDir);
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Parse form data
        const form = formidable({
            uploadDir: tempDir,
            keepExtensions: true,
            maxFileSize: 10 * 1024 * 1024, // 10MB limit
        });

        console.log('📝 解析表单数据...');
        const [fields, files] = await form.parse(req);
        console.log('✅ 表单解析完成');

        // Extract fields
        const prompt = fields.prompt?.[0] || '';
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
                message: "API密钥未配置，请在Vercel环境变量中设置FAL_KEY",
                code: "MISSING_API_KEY"
            });
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
                result: result
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

        // Vercel 环境下的文件保存路径
        const outputDir = process.env.VERCEL 
            ? '/tmp/outputs' 
            : path.join(process.cwd(), 'public', 'outputs');
        
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

        const totalTime = Date.now() - startTime;
        console.log(`🎉 图片生成成功! 总耗时: ${totalTime}ms`);

        // Vercel 环境下需要返回临时URL或base64
        if (process.env.VERCEL) {
            // 在 Vercel 上，我们需要将图片转换为 base64 或使用其他方式
            const base64Image = buffer.toString('base64');
            const dataUrl = `data:image/jpeg;base64,${base64Image}`;
            
            return res.status(200).json({ 
                message: 'Image generated successfully!', 
                imageUrl: dataUrl, // 使用 base64 data URL
                originalUrl: imageUrl,
                model: model,
                generationTime: totalTime,
                environment: 'vercel'
            });
        } else {
            // 本地环境
            return res.status(200).json({ 
                message: 'Image generated successfully!', 
                imageUrl: `/outputs/${imageName}`,
                originalUrl: imageUrl,
                model: model,
                generationTime: totalTime,
                environment: 'local'
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
        
        if (error.message.includes('credentials') || error.message.includes('unauthorized')) {
            errorMessage = "API 密钥无效或已过期，请检查 FAL_KEY 环境变量";
            errorCode = "INVALID_CREDENTIALS";
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
            errorMessage = "API 配额不足或达到限制";
            errorCode = "QUOTA_EXCEEDED";
        } else if (error.message.includes('timeout') || error.message.includes('超时')) {
            errorMessage = "请求超时，请稍后重试";
            errorCode = "TIMEOUT";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = "网络连接错误，请稍后重试";
            errorCode = "NETWORK_ERROR";
        } else if (error.message.includes('ENOENT')) {
            errorMessage = "文件不存在错误，请重新上传图片";
            errorCode = "FILE_ERROR";
        } else if (error.message.includes('Invalid input')) {
            errorMessage = "输入参数不正确，请检查模型要求";
            errorCode = "INVALID_INPUT";
        } else if (error.message.includes('Model not found')) {
            errorMessage = "模型不存在或暂时不可用";
            errorCode = "MODEL_NOT_FOUND";
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        res.status(500).json({ 
            message: errorMessage,
            code: errorCode,
            error: error.message,
            model: fields?.model?.[0] || 'unknown',
            environment: process.env.VERCEL ? 'vercel' : 'local',
            errorTime: errorTime,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}