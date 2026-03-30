import axios from 'axios';

export class ImageProcessorService {
  private cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
  private cloudinaryApiKey = process.env.CLOUDINARY_API_KEY || '';
  private cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET || '';

  async downloadImage(url: string): Promise<Buffer> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  }

  async uploadToCloudinary(imageUrl: string, publicId: string): Promise<string> {
    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudinaryCloudName}/image/upload`;
    
    const formData = new FormData();
    formData.append('file', imageUrl);
    formData.append('public_id', publicId);
    formData.append('transformation', 'c_fill,w_800,h_800,q_auto,f_auto');

    const response = await axios.post(uploadUrl, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data.secure_url;
  }

  async processProductImages(images: string[], productId: string): Promise<string[]> {
    const processedUrls: string[] = [];
    
    for (let i = 0; i < images.length; i++) {
      try {
        const publicId = `product_${productId}_${i}`;
        const url = await this.uploadToCloudinary(images[i], publicId);
        processedUrls.push(url);
      } catch (error) {
        console.error(`处理图片失败: ${images[i]}`, error);
      }
    }

    return processedUrls;
  }

  async addWatermark(imageUrl: string): Promise<string> {
    const transform = 'l_logo,w_100,o_50,g_south_e';
    return imageUrl.replace('/upload/', `/upload/${transform}/`);
  }
}

export const imageProcessorService = new ImageProcessorService();
