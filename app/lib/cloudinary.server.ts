import { v2 as cloudinary } from 'cloudinary';
import { appEnv } from '~/lib/env.server';


// Configuration
cloudinary.config({
    cloud_name: appEnv.CLOUDINARY_CLOUD_NAME,
    api_key: appEnv.CLOUDINARY_API_KEY,
    api_secret: appEnv.CLOUDINARY_API_SECRET
});
