const { requireLogin, showSuccess, showError, showConfirm } = require('../../../utils/api');

Page({
  data: {},

  onLoad() {
    if (!requireLogin()) {
      wx.navigateBack({
        delta: 1
      });
    }
  },

  async clearLocalData() {
    const confirm = await showConfirm('清除本地数据', '将清除头像、本地认领记录等缓存信息');
    if (!confirm) {
      return;
    }

    try {
      wx.removeStorageSync('userAvatar');
      wx.removeStorageSync('myClaims');
      showSuccess('已清除本地数据');
    } catch (e) {
      console.error('清除本地数据失败:', e);
      showError('清除失败，请重试');
    }
  }
})
