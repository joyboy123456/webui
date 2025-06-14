// pages/api/generateImage.js

import * as fal from "@fal-ai/serverless-client";
import fs from 'fs';
import path from 'path';
import formidable from 'formidable';

const FAL_KEY = process.env.FAL_KEY;

// 检查 FAL_KEY 是否存在
if (!FAL_KEY) {
    console.error('FAL_KEY is not set in environment variables');
}

fal.config({
    credentials: FAL_KEY,
});

// Disable default body parser for file upload
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    console.log('开始处理图片生成请求...');

    try {
        // Parse form data (handles both file uploads and regular fields)
        const form = formidable({
            uploadDir: path.join(process.cwd(), 'temp'),
            keepExtensions: true,
            maxFileSize: 10 * 1024 * 1024, // 10MB limit
        });

        console.log('解析表单数据...');
        const [fields, files] = await form.parse(req);
        console.log('表单字段:', Object.keys(fields));
        console.log('上传文件:', Object.keys(files));

        // Extract fields (form values are arrays in formidable v3)
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
        const loras = fields.loras?.[0] ? JSON.parse(fields.loras[0]) : [];

        console.log('提取的参数:', {
            prompt,
            model,
            image_size,
            num_inference_steps,
            guidance_scale,
            num_images
        });

        if (!prompt.trim()) {
            console.log('错误: 提示词为空');
            return res.status(400).json({ message: "提示词不能为空" });
        }

        let input = {
            prompt,
            image_size,
            num_inference_steps,
            guidance_scale,
            num_images,
            enable_safety_checker,
            strength,
            output_format,
            loras: loras.length > 0 ? loras : undefined,
        };

        // Handle image upload for image-to-image models (like Kontext)
        if (files.input_image && files.input_image[0]) {
            console.log('处理输入图片...');
            const uploadedFile = files.input_image[0];
            const imageBuffer = fs.readFileSync(uploadedFile.filepath);
            
            // Upload image to fal storage for processing
            const imageUrl = await fal.storage.upload(imageBuffer, {
                contentType: uploadedFile.mimetype || 'image/jpeg',
            });
            
            input.image_url = imageUrl;
            console.log('图片已上传到 fal 存储:', imageUrl);
            
            // Clean up temporary file
            fs.unlinkSync(uploadedFile.filepath);
        }

        console.log('调用 fal.ai API...');
        console.log('使用模型:', model);
        console.log('输入参数:', JSON.stringify(input, null, 2));

        const result = await fal.subscribe(model, {
            input,
            sync_mode,
        });

        console.log('fal.ai API 响应:', result);

        if (!result || !result.images || result.images.length === 0) {
            console.error('API 响应中没有图片:', result);
            return res.status(500).json({ message: "API 返回的结果中没有图片" });
        }

        const imageUrl = result.images[0].url;
        console.log('获取到图片 URL:', imageUrl);

        // 下载图片
        console.log('下载图片...');
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error(`下载图片失败: ${imageResponse.status} ${imageResponse.statusText}`);
        }
        
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const outputDir = path.join(process.cwd(), 'public', 'outputs');
        const imageName = `generated-image-${Date.now()}.jpeg`;
        const outputFilePath = path.join(outputDir, imageName);

        // Ensure the outputs folder exists
        if (!fs.existsSync(outputDir)) {
            console.log('创建输出目录:', outputDir);
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Save the image buffer to a file in the outputs folder
        console.log('保存图片到:', outputFilePath);
        fs.writeFileSync(outputFilePath, buffer);

        console.log('图片生成成功!');
        // Return a relative URL that the frontend can access
        res.status(200).json({ 
            message: 'Image generated and saved!', 
            imageUrl: `/outputs/${imageName}`,
            originalUrl: imageUrl
        });
    } catch (error) {
        console.error("生成图片时发生错误:", error);
        console.error("错误堆栈:", error.stack);
        
        // 提供更详细的错误信息
        let errorMessage = "生成图片失败";
        if (error.message.includes('credentials')) {
            errorMessage = "API 密钥配置错误，请检查 FAL_KEY 环境变量";
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
            errorMessage = "API 配额不足或达到限制";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = "网络连接错误，请稍后重试";
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        res.status(500).json({ 
            message: errorMessage,
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}