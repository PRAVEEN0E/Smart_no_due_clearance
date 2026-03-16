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

module.exports = {
    cloudinary,
    uploadStream,
    uploadBuffer
};
