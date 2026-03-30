import { facebookAdsService } from '../services/facebook-ads';
import { openaiService } from '../services/openai';
import prisma from '../config/database';

interface AdConfig {
  budget: number;
  platform: string;
  targeting?: any;
}

export class AdvertiserAgent {
  private defaultBudget = 10;
  private minRoas = 1.5;
  private targetRoas = 3.0;

  async createAdForProduct(productId: string, config?: AdConfig) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    
    if (!product || !product.shopifyId) {
      return { success: false, error: 'Product not published yet' };
    }

    const shopUrl = `https://${process.env.SHOPIFY_SHOP_NAME}/products/${product.shopifyId}`;

    try {
      const adCopy = await openaiService.generateAdCopy({
        title: product.title,
        description: product.description || '',
        price: product.sellPrice,
      });

      const campaign = await facebookAdsService.createCampaign(
        `Dropship_${product.title}_${Date.now()}`,
        'CONVERSIONS'
      );

      const adSet = await facebookAdsService.createAdSet(
        campaign.id,
        config?.targeting || this.getDefaultTargeting(),
        config?.budget || this.defaultBudget
      );

      const creative = await facebookAdsService.createAdCreative({
        message: adCopy.body,
        headline: adCopy.headline,
        imageUrl: product.imageUrl || '',
        link: shopUrl,
      });

      const ad = await facebookAdsService.createAd(adSet.id, {
        creative_id: creative.id,
      });

      await prisma.ad.create({
        data: {
          productId: product.id,
          platform: 'facebook',
          adId: ad.id,
          adSetId: adSet.id,
          campaignId: campaign.id,
          budget: config?.budget || this.defaultBudget,
          status: 'active',
        },
      });

      await prisma.product.update({
        where: { id: productId },
        data: { adsCreated: true },
      });

      return { success: true, campaignId: campaign.id, adId: ad.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private getDefaultTargeting() {
    return {
      geo_countries: ['US', 'CA', 'GB', 'AU', 'DE'],
      age_min: 25,
      age_max: 54,
      interests: [
        { id: '6004387609673', name: 'Online Shopping' },
        { id: '6004387609673', name: 'E-commerce' },
      ],
    };
  }

  async optimizeAds(): Promise<{ optimized: number; paused: number }> {
    const ads = await prisma.ad.findMany({
      where: { status: 'active' },
      include: { product: true },
    });

    let optimized = 0;
    let paused = 0;

    for (const ad of ads) {
      const insights = await facebookAdsService.getAdInsights(ad.adId || '');
      
      if (!insights) continue;

      const spend = parseFloat(insights.spend || '0');
      const conversions = parseInt(insights.conversions || '0');
      const conversionValue = parseFloat(insights.conversion_value || '0');
      const roas = spend > 0 ? conversionValue / spend : 0;

      await prisma.ad.update({
        where: { id: ad.id },
        data: {
          spend,
          conversions,
          revenue: conversionValue,
          roas,
          impressions: parseInt(insights.impressions || '0'),
          clicks: parseInt(insights.clicks || '0'),
        },
      });

      if (roas < this.minRoas && spend > 30) {
        const newBudget = ad.budget * 0.5;
        await facebookAdsService.updateAdSetBudget(ad.adSetId || '', newBudget);
        await prisma.ad.update({ where: { id: ad.id }, data: { budget: newBudget } });
        optimized++;
        console.log(`📉 ${ad.id} ROAS ${roas.toFixed(2)}, 降低出价到 $${newBudget}`);
      } else if (roas > this.targetRoas && spend > 50) {
        const newBudget = ad.budget * 1.2;
        await facebookAdsService.updateAdSetBudget(ad.adSetId || '', newBudget);
        await prisma.ad.update({ where: { id: ad.id }, data: { budget: newBudget } });
        optimized++;
        console.log(`📈 ${ad.id} ROAS ${roas.toFixed(2)}, 提高出价到 $${newBudget}`);
      } else if (roas < 0.5 && spend > 50) {
        await facebookAdsService.setAdStatus(ad.adId || '', 'PAUSED');
        await prisma.ad.update({ where: { id: ad.id }, data: { status: 'paused' } });
        paused++;
        console.log(`🛑 ${ad.id} ROAS ${roas.toFixed(2)}, 暂停广告`);
      }
    }

    return { optimized, paused };
  }

  async run(): Promise<{ created: number; optimized: number }> {
    const productsWithoutAds = await prisma.product.findMany({
      where: { status: 'published', adsCreated: false },
    });

    let created = 0;
    for (const product of productsWithoutAds) {
      const result = await this.createAdForProduct(product.id);
      if (result.success) created++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const { optimized } = await this.optimizeAds();

    return { created, optimized };
  }
}

export const advertiserAgent = new AdvertiserAgent();
