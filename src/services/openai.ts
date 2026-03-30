import OpenAI from 'openai';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async chat(prompt: string, model: string = 'gpt-4-turbo-preview'): Promise<string> {
    const response = await this.client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || '';
  }

  async generateAdCopy(product: {
    title: string;
    description: string;
    price: number;
  }): Promise<{ headline: string; body: string; callToAction: string }> {
    const prompt = `为以下商品生成Facebook广告文案:

商品: ${product.title}
描述: ${product.description}
价格: $${product.price}

返回JSON格式（不要其他内容）:
{
  "headline": "主标题",
  "body": "广告正文",
  "callToAction": "Shop Now"
}`;

    const result = await this.chat(prompt);
    try {
      return JSON.parse(result);
    } catch {
      return {
        headline: `Buy ${product.title} Now!`,
        body: `Get this amazing ${product.title} for only $${product.price}!`,
        callToAction: 'Shop Now',
      };
    }
  }

  async translate(text: string, targetLang: string = 'en'): Promise<string> {
    const prompt = `翻译以下文本到${targetLang}，保持营销风格:
${text}`;
    return this.chat(prompt);
  }

  async generateSEODescription(title: string, keywords: string[]): Promise<string> {
    const prompt = `为以下商品生成SEO友好的产品描述（100-150词）:
    
商品标题: ${title}
关键词: ${keywords.join(', ')}`;
    return this.chat(prompt);
  }
}

export const openaiService = new OpenAIService();
