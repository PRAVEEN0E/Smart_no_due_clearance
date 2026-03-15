const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a stream to Cloudinary
 * @param {ReadableStream} fileStream
 * @param {string} folder
 * @param {string} originalFilename
 */
const uploadStream = (fileStream, folder, originalFilename) => {
    return new Promise((resolve, reject) => {
        const publicId = originalFilename ? `${originalFilename.replace(/\.[^/.]+$/, "")}_${Date.now()}` : `upload_${Date.now()}`;
        
        const stream = cloudinary.uploader.upload_stream(
            { 
                folder: folder, 
                public_id: publicId,
                resource_type: "auto"
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        fileStream.pipe(stream);
    });
};

/**
 * Upload a buffer to Cloudinary
 */
const uploadBuffer = (buffer, folder, originalFilename) => {
    return new Promise((resolve, reject) => {
        const publicId = originalFilename ? `${originalFilename.replace(/\.[^/.]+$/, "")}_${Date.now()}` : `upload_${Date.now()}`;

        const stream = cloudinary.uploader.upload_stream(
            { 
                folder: folder, 
                public_id: publicId,
                resource_type: "auto"
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(buffer);
    });
};

module.exports = {
    cloudinary,
    uploadStream,
    uploadBuffer
};
