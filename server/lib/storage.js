const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const path = require('path');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

function isCloudinaryConfigured() {
    return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

async function uploadBuffer(buffer, options = {}) {
    const defaultOptions = {
        folder: 'sndc',
        resource_type: 'auto',
        transformation: [
            { quality: 'auto', fetch_format: 'auto' },
        ],
    };

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { ...defaultOptions, ...options },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        const readable = new Readable();
        readable.push(buffer);
        readable.push(null);
        readable.pipe(stream);
    });
}

async function uploadFromPath(filePath, options = {}) {
    return cloudinary.uploader.upload(filePath, {
        folder: 'sndc',
        quality: 'auto',
        fetch_format: 'auto',
        ...options,
    });
}

function getOptimizedUrl(publicId, options = {}) {
    return cloudinary.url(publicId, {
        quality: 'auto',
        fetch_format: 'auto',
        width: 'auto',
        crop: 'scale',
        ...options,
    });
}

function getResponsiveUrls(publicId) {
    const sizes = [320, 640, 960, 1280];
    return sizes.map(w => ({
        width: w,
        url: cloudinary.url(publicId, { quality: 'auto', fetch_format: 'auto', width: w, crop: 'scale' }),
    }));
}

async function deleteFile(publicId) {
    return cloudinary.uploader.destroy(publicId);
}

async function getSignedUrl(publicId, options = {}) {
    return cloudinary.url(publicId, {
        sign_url: true,
        type: 'upload',
        ...options,
    });
}

function extractPublicId(url) {
    if (!url) return null;
    const match = url.match(/\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    return match ? match[1] : null;
}

module.exports = {
    isCloudinaryConfigured,
    uploadBuffer,
    uploadFromPath,
    getOptimizedUrl,
    getResponsiveUrls,
    deleteFile,
    getSignedUrl,
    extractPublicId,
};
