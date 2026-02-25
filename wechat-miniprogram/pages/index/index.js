// 首页逻辑
const { requireLogin } = require('../../utils/api');

Page({
  data: {
    // 页面数据
  },
  
  onLoad() {
    // 页面加载时执行
    console.log('首页加载');
  },
  
  // 跳转到发现者上传页面
  goToFinder() {
    if (requireLogin()) {
      wx.navigateTo({
        url: '/pages/finder/upload/upload'
      });
    }
  },
  
  // 跳转到丢失者对比页面
  goToLoser() {
    if (requireLogin()) {
      wx.navigateTo({
        url: '/pages/loser/compare/compare'
      });
    }
  }
})