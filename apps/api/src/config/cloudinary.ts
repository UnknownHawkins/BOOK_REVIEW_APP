import { v2 as cloudinary } from "cloudinary";
import { logger } from "./logger";

const isConfigured = 
  !!process.env.CLOUDINARY_CLOUD_NAME && 
  !!process.env.CLOUDINARY_API_KEY && 
  !!process.env.CLOUDINARY_API_SECRET;

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  logger.info("Cloudinary configured successfully.");
} else {
  logger.warn("Cloudinary environment variables missing. Falling back to local uploads.");
}

export { cloudinary, isConfigured as isCloudinaryConfigured };
