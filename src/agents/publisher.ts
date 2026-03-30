import { shopifyService } from '../services/shopify';
import { openaiService } from '../services/openai';
import { imageProcessorService } from '../services/image-processor';
import prisma from '../config/database';

export class PublisherAgent {
  async publishProduct(productId: string): Promise<{ success: boolean; shopifyId?: string; error?: string }> {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    if (product.status === 'published') {
      return { success: false, error: 'Product already published' };
    }

    try {
      console.log(`📝 开始上架: ${product.title}`);
      
      const translatedTitle = await openaiService.translate(product.title, 'en');
      const translatedDesc = await openaiService.generateSEODescription(
        translatedTitle, 
        product.category ? [product.category] : []
      );
      
      let images: { src: string }[] = [];
      if (product.imageUrl) {
        const processedImages = await imageProcessorService.processProductImages(
          [product.imageUrl],
          product.id
        );
        images = processedImages.map(src => ({ src }));
      }

      const shopifyProduct = await shopifyService.createProduct({
        title: translatedTitle,
        description: translatedDesc,
        price: product.sellPrice.toString(),
        images,
      });

      await prisma.product.update({
        where: { id: productId },
        data: {
          status: 'published',
          shopifyId: shopifyProduct.id.toString(),
          title: translatedTitle,
          description: translatedDesc,
        },
      });

      console.log(`✅ 上架成功: ${shopifyProduct.id}`);
      return { success: true, shopifyId: shopifyProduct.id.toString() };
    } catch (error: any) {
      console.error(`❌ 上架失败: ${productId}`, error);
      return { success: false, error: error.message };
    }
  }

  async publishBatch(productIds: string[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const productId of productIds) {
      const result = await this.publishProduct(productId);
      if (result.success) {
        success++;
      } else {
        failed++;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return { success, failed };
  }

  async autoPublishAll(): Promise<{ success: number; failed: number }> {
    const pendingProducts = await prisma.product.findMany({
      where: { status: 'pending' },
    });

    return this.publishBatch(pendingProducts.map(p => p.id));
  }
}

export const publisherAgent = new PublisherAgent();
