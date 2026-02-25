const { requireLogin } = require('../../../utils/api');
const { formatDate } = require('../../../utils/common');

Page({
  data: {
    items: []
  },

  onLoad() {
    this.loadItems();
  },

  onShow() {
    this.loadItems();
  },

  loadItems() {
    if (!requireLogin()) {
      this.setData({
        items: []
      });
      return;
    }

    const list = wx.getStorageSync('myClaims') || [];

    const items = list.map((item) => ({
      id: item.id,
      imageUrl: item.imageUrl || '',
      createdAt: item.matchedAt ? formatDate(item.matchedAt) : item.createdAt || '',
      phone: item.phone || ''
    }));

    this.setData({
      items
    });
  }
})
