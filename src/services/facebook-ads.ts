import axios from 'axios';

export class FacebookAdsService {
  private accessToken: string;
  private adAccountId: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.accessToken = process.env.FACEBOOK_ACCESS_TOKEN || '';
    this.adAccountId = process.env.FACEBOOK_AD_ACCOUNT_ID || '';
  }

  async createCampaign(name: string, objective: string = 'CONVERSIONS') {
    const url = `${this.baseUrl}/act_${this.adAccountId}/campaigns`;
    
    const response = await axios.post(url, {
      name,
      objective,
      status: 'PAUSED',
      access_token: this.accessToken,
    });

    return response.data;
  }

  async createAdSet(campaignId: string, targeting: any, budget: number) {
    const url = `${this.baseUrl}/act_${this.adAccountId}/adsets`;

    const response = await axios.post(url, {
      name: `AdSet_${Date.now()}`,
      campaign_id: campaignId,
      targeting,
      daily_budget: budget * 100,
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'CONVERSIONS',
      status: 'PAUSED',
      access_token: this.accessToken,
    });

    return response.data;
  }

  async createAd(adSetId: string, creative: any) {
    const url = `${this.baseUrl}/act_${this.adAccountId}/ads`;

    const response = await axios.post(url, {
      name: `Ad_${Date.now()}`,
      adset_id: adSetId,
      creative,
      status: 'PAUSED',
      access_token: this.accessToken,
    });

    return response.data;
  }

  async createAdCreative(adsData: {
    message: string;
    headline: string;
    imageUrl: string;
    link: string;
  }) {
    const url = `${this.baseUrl}/act_${this.adAccountId}/adcreatives`;

    const response = await axios.post(url, {
      name: `Creative_${Date.now()}`,
      object_story_spec: {
        link_data: {
          message: adsData.message,
          link: adsData.link,
          image_url: adsData.imageUrl,
          call_to_action: {
            type: 'SHOP_NOW',
            value: { link: adsData.link },
          },
          caption: adsData.headline,
        },
      },
      access_token: this.accessToken,
    });

    return response.data;
  }

  async getAdInsights(adId: string, dateRange: string = 'last_30_days') {
    const url = `${this.baseUrl}/${adId}/insights`;
    
    const response = await axios.get(url, {
      params: {
        fields: 'spend,impressions,clicks,ctr,cpc,conversions,conversion_value',
        time_range: dateRange,
        access_token: this.accessToken,
      },
    });

    return response.data.data[0] || null;
  }

  async updateAdSetBudget(adSetId: string, budget: number) {
    const url = `${this.baseUrl}/${adSetId}`;
    
    const response = await axios.post(url, {
      daily_budget: budget * 100,
      access_token: this.accessToken,
    });

    return response.data;
  }

  async setAdStatus(adId: string, status: string) {
    const url = `${this.baseUrl}/${adId}`;
    
    const response = await axios.post(url, {
      status,
      access_token: this.accessToken,
    });

    return response.data;
  }
}

export const facebookAdsService = new FacebookAdsService();
