// 发现者物品列表页面逻辑
import { getItemsList, showError } from '../../../utils/api';
import { formatDate } from '../../../utils/common';

Page({
  data: {
    items: [], // 物品列表
    loading: true, // 加载状态
    hasMore: true, // 是否有更多数据
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
  },
  
  onPullDownRefresh() {
    // 下拉刷新
    console.log('下拉刷新');
    this.setData({
      items: [],
      page: 1,
      hasMore: true
    });
    this.loadItems();
  },
  
  onReachBottom() {
    // 上拉加载更多
    console.log('上拉加载更多');
    if (!this.data.loading && this.data.hasMore) {
      this.setData({
        page: this.data.page + 1
      });
      this.loadItems();
    }
  },
  
  // 加载物品列表
  async loadItems() {
    const { page, pageSize, items } = this.data;
    
    try {
      this.setData({ loading: true });
      
      // 调用API获取物品列表
      // 注意：这里需要后端提供获取物品列表的API
      // 暂时使用模拟数据
      const mockItems = this.getMockItems();
      
      // 模拟分页
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const pageItems = mockItems.slice(startIndex, endIndex);
      
      // 格式化日期
      const formattedItems = pageItems.map(item => ({
        ...item,
        createdAt: formatDate(item.createdAt)
      }));
      
      // 更新物品列表
      this.setData({
        items: page === 1 ? formattedItems : [...items, ...formattedItems],
        hasMore: endIndex < mockItems.length,
        loading: false
      });
      
      // 停止下拉刷新
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
    wx.navigateTo({
      url: '../upload/upload'
    });
  },
  
  // 跳转到图表页面
  gotoChart() {
    wx.navigateTo({
      url: '../chart/chart'
    });
  },
  
  // 模拟物品数据
  getMockItems() {
    return [
      {
        id: 1,
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lost%20wallet%20on%20table&image_size=square',
        createdAt: '2026-02-20 10:00:00'
      },
      {
        id: 2,
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lost%20phone%20on%20bench&image_size=square',
        createdAt: '2026-02-20 09:30:00'
      },
      {
        id: 3,
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lost%20keys%20on%20counter&image_size=square',
        createdAt: '2026-02-20 09:00:00'
      },
      {
        id: 4,
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lost%20backpack%20on%20chair&image_size=square',
        createdAt: '2026-02-20 08:30:00'
      },
      {
        id: 5,
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lost%20umbrella%20by%20door&image_size=square',
        createdAt: '2026-02-20 08:00:00'
      }
    ];
  }
})