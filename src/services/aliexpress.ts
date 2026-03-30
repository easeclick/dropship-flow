import axios from 'axios';

interface AliExpressProduct {
  product_id: string;
  product_title: string;
  sale_price: string;
  original_price: string;
  product_main_image_url: string;
  product_images?: string[];
  evaluate_score: string;
  volume?: string;
  commission_rate?: string;
}

export class AliExpressService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.DSERS_API_KEY || '';
  }

  async searchProducts(keyword: string, page: number = 1, pageSize: number = 20): Promise<AliExpressProduct[]> {
    try {
      const response = await axios.get('https://api.aliexpress.com/product/list', {
        params: {
          keyword,
          page,
          pageSize,
          apikey: this.apiKey,
        },
      });
      return response.data.products || [];
    } catch (error) {
      console.error('AliExpress API error:', error);
      return this.getMockProducts(keyword);
    }
  }

  async getProductDetail(productId: string): Promise<AliExpressProduct | null> {
    try {
      const response = await axios.get(`https://api.aliexpress.com/product/${productId}`, {
        params: { apikey: this.apiKey },
      });
      return response.data;
    } catch (error) {
      console.error('AliExpress API error:', error);
      return null;
    }
  }

  private getMockProducts(keyword: string): AliExpressProduct[] {
    return [
      {
        product_id: '1000001',
        product_title: `${keyword} - 智能家用`,
        sale_price: '5.50',
        original_price: '8.99',
        product_main_image_url: 'https://via.placeholder.com/300',
        evaluate_score: '4.8',
        volume: '1000',
        commission_rate: '10%',
      },
      {
        product_id: '1000002',
        product_title: `${keyword} - 便携版`,
        sale_price: '7.99',
        original_price: '12.99',
        product_main_image_url: 'https://via.placeholder.com/300',
        evaluate_score: '4.6',
        volume: '500',
        commission_rate: '8%',
      },
    ];
  }

  calculateProfit(aliPrice: number, sellPrice: number, shipping: number = 5): number {
    const platformFee = sellPrice * 0.029 + 0.3;
    const paymentFee = sellPrice * 0.014 + 0.5;
    return sellPrice - aliPrice - shipping - platformFee - paymentFee;
  }

  isGoodProduct(aliPrice: number, sellPrice: number, score: number): boolean {
    const profit = this.calculateProfit(aliPrice, sellPrice);
    const profitMargin = profit / sellPrice;
    return profit > 10 && profitMargin > 0.3 && score >= 4.5;
  }
}

export const aliExpressService = new AliExpressService();
