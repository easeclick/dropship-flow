import { aliExpressService } from '../services/aliexpress';
import { openaiService } from '../services/openai';
import prisma from '../config/database';

export interface ProductCandidate {
  sourceId: string;
  title: string;
  costPrice: number;
  sellPrice: number;
  profit: number;
  imageUrl: string;
  score: number;
  volume: number;
  reason: string;
}

const DEFAULT_CATEGORIES = [
  'phone accessories',
  'home decoration',
  'fitness equipment',
  'pet supplies',
  'kitchen gadgets',
  'led lights',
  'outdoor sports',
  'beauty tools',
];

export class SelectorAgent {
  private targetProfit = 10;
  private targetMargin = 0.35;

  async scanAndSelect(): Promise<ProductCandidate[]> {
    const candidates: ProductCandidate[] = [];

    for (const category of DEFAULT_CATEGORIES) {
      console.log(`📡 扫描类目: ${category}`);
      const products = await aliExpressService.searchProducts(category, 1, 30);

      for (const product of products) {
        const costPrice = parseFloat(product.sale_price);
        const suggestedPrice = this.calculateSuggestedPrice(costPrice);
        
        const profit = aliExpressService.calculateProfit(costPrice, suggestedPrice);
        const score = parseFloat(product.evaluate_score || '0');
        const volume = parseInt(product.volume || '0');

        if (profit >= this.targetProfit && score >= 4.5) {
          const reason = await this.analyzeWithAI(
            product.product_title,
            costPrice,
            suggestedPrice,
            profit,
            score,
            volume
          );

          if (reason.accept) {
            candidates.push({
              sourceId: product.product_id,
              title: product.product_title,
              costPrice,
              sellPrice: suggestedPrice,
              profit,
              imageUrl: product.product_main_image_url,
              score,
              volume,
              reason: reason.explanation,
            });
          }
        }
      }
    }

    return candidates;
  }

  private calculateSuggestedPrice(costPrice: number): number {
    const minPrice = costPrice * 2.5;
    return Math.ceil(minPrice / 5) * 5;
  }

  private async analyzeWithAI(
    title: string,
    costPrice: number,
    sellPrice: number,
    profit: number,
    score: number,
    volume: number
  ): Promise<{ accept: boolean; explanation: string }> {
    const prompt = `分析以下AliExpress商品是否适合在独立站销售:

商品: ${title}
成本: $${costPrice}
售价: $${sellPrice}
利润: $${profit}
评分: ${score}
销量: ${volume}

请判断是否值得销售，返回JSON格式:
{"accept": true/false, "explanation": "简短原因"}`;

    try {
      const result = await openaiService.chat(prompt);
      return JSON.parse(result);
    } catch (error) {
      console.error('AI分析失败:', error);
      return { accept: false, explanation: 'AI分析失败' };
    }
  }

  async saveCandidates(candidates: ProductCandidate[]): Promise<number> {
    let saved = 0;
    
    for (const candidate of candidates) {
      try {
        await prisma.product.create({
          data: {
            sourceId: candidate.sourceId,
            title: candidate.title,
            costPrice: candidate.costPrice,
            sellPrice: candidate.sellPrice,
            profit: candidate.profit,
            imageUrl: candidate.imageUrl,
            category: 'pending',
            status: 'pending',
          },
        });
        saved++;
      } catch (error) {
        console.error(`保存商品失败: ${candidate.sourceId}`, error);
      }
    }

    return saved;
  }

  async run(): Promise<{ scanned: number; saved: number }> {
    console.log('🔍 选品Agent启动...');
    const candidates = await this.scanAndSelect();
    console.log(`📊 找到 ${candidates.length} 个候选商品`);
    
    const saved = await this.saveCandidates(candidates);
    console.log(`✅ 保存 ${saved} 个商品到数据库`);
    
    return { scanned: candidates.length, saved };
  }
}

export const selectorAgent = new SelectorAgent();
