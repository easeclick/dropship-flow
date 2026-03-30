import axios, { AxiosInstance } from 'axios';

export class ShopifyService {
  private client: AxiosInstance;
  private shop: string;

  constructor() {
    this.shop = process.env.SHOPIFY_SHOP_NAME || '';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN || '';
    
    this.client = axios.create({
      baseURL: `https://${this.shop}/admin/api/2024-01`,
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });
  }

  async createProduct(product: {
    title: string;
    description: string;
    price: string;
    images?: { src: string }[];
    variants?: { price: string; inventory_management?: string }[];
  }) {
    const payload = {
      product: {
        title: product.title,
        body_html: product.description,
        status: 'active',
        images: product.images,
        variants: product.variants || [{ price: product.price }],
      },
    };

    const response = await this.client.post('/products.json', payload);
    return response.data.product;
  }

  async updateProduct(id: string, updates: any) {
    const response = await this.client.put(`/products/${id}.json`, {
      product: updates,
    });
    return response.data.product;
  }

  async getProduct(id: string) {
    const response = await this.client.get(`/products/${id}.json`);
    return response.data.product;
  }

  async getOrders(status: string = 'any') {
    const response = await this.client.get(`/orders.json?status=${status}`);
    return response.data.orders;
  }

  async getOrder(id: string) {
    const response = await this.client.get(`/orders/${id}.json`);
    return response.data.order;
  }

  async createWebhook(topic: string, address: string) {
    const payload = {
      webhook: {
        topic,
        address,
        format: 'json',
      },
    };
    const response = await this.client.post('/webhooks.json', payload);
    return response.data.webhook;
  }

  async updateInventory(inventoryItemId: string, locationId: string, quantity: number) {
    const payload = {
      location_id: locationId,
      inventory_item_id: inventoryItemId,
      available: quantity,
    };
    const response = await this.client.post('/inventory_levels/set.json', payload);
    return response.data;
  }
}

export const shopifyService = new ShopifyService();
