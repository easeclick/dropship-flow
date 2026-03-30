import { shopifyService } from '../services/shopify';
import { openaiService } from '../services/openai';
import prisma from '../config/database';

interface CustomerQuery {
  orderId?: string;
  email?: string;
  message: string;
  type: 'order_status' | 'refund' | 'product_question' | 'shipping' | 'other';
}

const KNOWLEDGE_BASE = {
  shipping: 'We usually ship within 1-3 business days. Delivery takes 15-30 days via standard shipping.',
  refund: 'We offer 30-day money-back guarantee. Please provide your order number.',
  order_status: 'Please provide your order number to check the status.',
  default: 'Thank you for contacting us. How can we help you today?',
};

export class SupportAgent {
  async handleCustomerMessage(query: CustomerQuery): Promise<string> {
    const { type, message, orderId } = query;

    const ruleResponse = this.getRuleBasedResponse(type);
    if (ruleResponse) {
      return ruleResponse;
    }

    const context = await this.buildContext(orderId);
    const prompt = `你是Dropship店铺的客服。请根据以下信息回复客户:

客户问题: ${message}
问题类型: ${type}
订单信息: ${context}

请用友好、专业的语气回复，保持简洁。`;

    try {
      const response = await openaiService.chat(prompt);
      return response;
    } catch (error) {
      console.error('AI回复失败:', error);
      return KNOWLEDGE_BASE.default;
    }
  }

  private getRuleBasedResponse(type: string): string | null {
    return KNOWLEDGE_BASE[type as keyof typeof KNOWLEDGE_BASE] || null;
  }

  private async buildContext(orderId?: string): Promise<string> {
    if (!orderId) return '无订单信息';

    try {
      const order = await shopifyService.getOrder(orderId);
      if (!order) return '订单不存在';

      return `
        订单号: ${order.id}
        商品: ${order.line_items?.map((i: any) => i.title).join(', ')}
        总价: ${order.total_price} ${order.currency}
        状态: ${order.fulfillment_status || '处理中'}
        物流: ${order.fulfillments?.[0]?.tracking_number || '待发货'}
      `;
    } catch {
      return '无法获取订单信息';
    }
  }

  async checkForBadReviews(): Promise<{ orders: any[] }> {
    const recentOrders = await shopifyService.getOrders('any');
    const badReviewOrders = [];

    for (const order of recentOrders.slice(0, 20)) {
      if (order.note && this.isNegative(order.note)) {
        badReviewOrders.push({
          orderId: order.id,
          note: order.note,
          customer: order.email,
        });
      }
    }

    return { orders: badReviewOrders };
  }

  private isNegative(text: string): boolean {
    const negativeWords = ['bad', 'terrible', 'worst', 'refund', 'scam', 'fake', 'broken'];
    return negativeWords.some(word => text.toLowerCase().includes(word));
  }

  async sendReviewRequest(orderId: string): Promise<boolean> {
    try {
      const order = await shopifyService.getOrder(orderId);
      if (!order || !order.email) return false;

      const productName = order.line_items?.[0]?.title || 'your order';
      console.log(`📧 发送评价请求到 ${order.email} for ${productName}`);
      
      return true;
    } catch {
      return false;
    }
  }

  async run(): Promise<{ reviewRequests: number; badReviews: number }> {
    const orders = await shopifyService.getOrders('fulfilled');
    let reviewRequests = 0;

    for (const order of orders.slice(0, 10)) {
      const sent = await this.sendReviewRequest(order.id);
      if (sent) reviewRequests++;
    }

    const { orders: badOrders } = await this.checkForBadReviews();

    return { reviewRequests, badReviews: badOrders.length };
  }
}

export const supportAgent = new SupportAgent();
