// pages/api/generateImage.js

import * as fal from "@fal-ai/serverless-client";
import fs from 'fs';
import path from 'path';
import formidable from 'formidable';
// Using built-in fetch (available in Node.js 18+)

const FAL_KEY = process.env.FAL_KEY;

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

    try {
        // Parse form data (handles both file uploads and regular fields)
        const form = formidable({
            uploadDir: path.join(process.cwd(), 'temp'),
            keepExtensions: true,
            maxFileSize: 10 * 1024 * 1024, // 10MB limit
        });

        const [fields, files] = await form.parse(req);

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
        const model = fields.model?.[0] || 'fal-ai/flux-lora';
        const loras = fields.loras?.[0] ? JSON.parse(fields.loras[0]) : [];

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
            const uploadedFile = files.input_image[0];
            const imageBuffer = fs.readFileSync(uploadedFile.filepath);
            
            // Upload image to fal storage for processing
            const imageUrl = await fal.storage.upload(imageBuffer, {
                contentType: uploadedFile.mimetype || 'image/jpeg',
            });
            
            input.image_url = imageUrl;
            
            // Clean up temporary file
            fs.unlinkSync(uploadedFile.filepath);
        }

        const result = await fal.subscribe(model, {
            input,
            sync_mode,
        });

        const imageUrl = result.images[0].url;
        const imageResponse = await fetch(imageUrl); // Fetch the image from the result URL
        const arrayBuffer = await imageResponse.arrayBuffer(); // Convert to array buffer
        const buffer = Buffer.from(arrayBuffer); // Convert to Node.js buffer

        const outputDir = path.join(process.cwd(), 'public', 'outputs'); // Save in the public/outputs directory
        const imageName = `generated-image-${Date.now()}.jpeg`;
        const outputFilePath = path.join(outputDir, imageName);

        // Ensure the outputs folder exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        // Save the image buffer to a file in the outputs folder
        fs.writeFileSync(outputFilePath, buffer);

        // Return a relative URL that the frontend can access
        res.status(200).json({ message: 'Image generated and saved!', imageUrl: `/outputs/${imageName}` });
    } catch (error) {
        console.error("Error generating image:", error.message);
        res.status(500).json({ message: "Failed to generate image", error: error.message });
    }
}