import { Router } from 'express';
import { shopifyService } from '../services/shopify';

const router = Router();

router.post('/products', async (req, res) => {
  try {
    const { title, description, price, images } = req.body;
    const product = await shopifyService.createProduct({
      title,
      description,
      price,
      images: images?.map((src: string) => ({ src })),
    });
    res.json({ success: true, product });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const status = (req.query.status as string) || 'any';
    const orders = await shopifyService.getOrders(status);
    res.json({ success: true, orders });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
