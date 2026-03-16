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
        const stream = cloudinary.uploader.upload_stream(
            { 
                folder: folder, 
                use_filename: true,
                unique_filename: true,
                resource_type: "auto",
                type: 'upload',        // Explicitly public
                access_mode: 'public'  // Force public access
            },
            (error, result) => {
                if (error) reject(error);
                else {
                    let secure_url = result.secure_url;
                    const lastPart = secure_url.split('/').pop();
                    
                    if (!lastPart.includes('.')) {
                        if (result.format) {
                            secure_url = `${secure_url}.${result.format}`;
                        } else if (originalFilename && originalFilename.includes('.')) {
                            const ext = originalFilename.split('.').pop();
                            secure_url = `${secure_url}.${ext}`;
                        }
                    }
                    resolve({ ...result, secure_url });
                }
            }
        );
        fileStream.pipe(stream);
    });
};

const uploadBuffer = (buffer, folder, originalFilename) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { 
                folder: folder, 
                use_filename: true,
                unique_filename: true,
                resource_type: "auto",
                type: 'upload',        // Explicitly public
                access_mode: 'public'  // Force public access
            },
            (error, result) => {
                if (error) reject(error);
                else {
                    let secure_url = result.secure_url;
                    const lastPart = secure_url.split('/').pop();
                    
                    if (!lastPart.includes('.')) {
                        if (result.format) {
                            secure_url = `${secure_url}.${result.format}`;
                        } else if (originalFilename && originalFilename.includes('.')) {
                            const ext = originalFilename.split('.').pop();
                            secure_url = `${secure_url}.${ext}`;
                        }
                    }
                    resolve({ ...result, secure_url });
                }
            }
        );
        stream.end(buffer);
    });
};

const getSignedUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    
    try {
        // Extract public_id and resource_type from URL
        // Example: https://res.cloudinary.com/cloud_name/image/upload/v123/folder/id.jpg
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) return url;
        
        const resourceType = parts[uploadIndex - 1]; // e.g., 'image' or 'raw'
        const publicIdWithExt = parts.slice(uploadIndex + 2).join('/'); // skip version
        const publicId = publicIdWithExt.split('.')[0];
        
        return cloudinary.url(publicId, {
            resource_type: resourceType,
            type: 'upload',
            sign_url: true,
            secure: true
        });
    } catch (e) {
        console.error("Failed to sign URL", e);
        return url;
    }
};

module.exports = {
    cloudinary,
    uploadStream,
    uploadBuffer,
    getSignedUrl
};
