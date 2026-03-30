import { Router } from 'express';
import { selectorAgent } from '../agents/selector';
import { publisherAgent } from '../agents/publisher';
import { advertiserAgent } from '../agents/advertiser';
import { supportAgent } from '../agents/support';
import prisma from '../config/database';

const router = Router();

router.get('/products', async (req, res) => {
  res.json({ message: 'products endpoint' });
});

router.get('/orders', async (req, res) => {
  res.json({ message: 'orders endpoint' });
});

router.post('/webhook/make', async (req, res) => {
  res.json({ received: true });
});

router.post('/selector/run', async (req, res) => {
  try {
    const result = await selectorAgent.run();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/selector/candidates', async (req, res) => {
  try {
    const candidates = await prisma.product.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, candidates });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/publisher/publish/:productId', async (req, res) => {
  try {
    const result = await publisherAgent.publishProduct(req.params.productId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/publisher/auto-publish', async (req, res) => {
  try {
    const result = await publisherAgent.autoPublishAll();
    res.json({ ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ads/create/:productId', async (req, res) => {
  try {
    const result = await advertiserAgent.createAdForProduct(req.params.productId, req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ads/optimize', async (req, res) => {
  try {
    const result = await advertiserAgent.optimizeAds();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ads/run', async (req, res) => {
  try {
    const result = await advertiserAgent.run();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/support/reply', async (req, res) => {
  try {
    const { message, type, orderId, email } = req.body;
    const response = await supportAgent.handleCustomerMessage({
      message,
      type,
      orderId,
      email,
    });
    res.json({ success: true, response });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/support/bad-reviews', async (req, res) => {
  try {
    const result = await supportAgent.checkForBadReviews();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
