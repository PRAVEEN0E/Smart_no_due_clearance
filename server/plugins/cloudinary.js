const fp = require('fastify-plugin');
const cloudinary = require('cloudinary').v2;

async function cloudinaryPlugin(fastify, opts) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    fastify.decorate('cloudinary', cloudinary);
}

module.exports = fp(cloudinaryPlugin);
