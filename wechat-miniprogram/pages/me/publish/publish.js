const { getMyItems, showError, requireLogin } = require('../../../utils/api');

Page({
  data: {
    items: [],
    loading: true
  },

  onLoad() {
    this.loadItems();
  },

  onShow() {
    this.loadItems();
  },

  async loadItems() {
    if (!requireLogin()) {
      this.setData({
        items: [],
        loading: false
      });
      return;
    }

    try {
      this.setData({ loading: true });

      const list = await getMyItems();

      const items = (list || []).map((item) => ({
        id: item.id,
        imageUrl: item.image_url || item.imagePath || '',
        createdAt: item.created_at || item.createdAt || ''
      }));

      this.setData({
        items,
        loading: false
      });
    } catch (error) {
      console.error('加载我的发布失败:', error);
      showError(error.message || '加载失败，请重试');
      this.setData({ loading: false });
    }
  }
})
