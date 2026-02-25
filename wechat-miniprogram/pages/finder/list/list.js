// 发现者物品列表页面逻辑
const { getItemsList, showError, requireLogin } = require('../../../utils/api');

Page({
  data: {
    items: [], // 物品列表
    loading: true, // 加载状态
    hasMore: false, // 是否有更多数据（暂时不需要分页）
    page: 1, // 当前页码
    pageSize: 10 // 每页数量
  },
  
  onLoad() {
    // 页面加载时执行
    console.log('物品列表页面加载');
    this.loadItems();
  },
  
  onShow() {
    // 页面显示时执行
    console.log('物品列表页面显示');
    // 每次页面显示时重新加载数据，确保列表是最新的
    this.loadItems();
  },
  
  onPullDownRefresh() {
    // 下拉刷新
    console.log('下拉刷新');
    this.setData({
      items: [],
      page: 1,
      hasMore: false
    });
    this.loadItems();
  },
  
  // 加载物品列表
  async loadItems() {
    if (!requireLogin()) {
      this.setData({
        items: [],
        loading: false
      });
      wx.stopPullDownRefresh();
      return;
    }

    try {
      this.setData({ loading: true });

      const list = await getItemsList();

      const items = (list || []).map((item) => ({
        id: item.id,
        imageUrl: item.image_url || item.imagePath || '',
        createdAt: item.created_at || item.createdAt || ''
      }));

      this.setData({
        items,
        loading: false
      });

      wx.stopPullDownRefresh();
    } catch (error) {
      console.error('加载物品列表失败:', error);
      showError(error.message || '加载失败，请重试');
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    }
  },
  
  // 跳转到上传页面
  gotoUpload() {
    if (requireLogin()) {
      wx.navigateTo({
        url: '../upload/upload'
      });
    }
  },
  
  // 跳转到图表页面
  gotoChart() {
    wx.navigateTo({
      url: '../chart/chart'
    });
  }
})
