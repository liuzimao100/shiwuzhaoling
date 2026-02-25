const { getToken, clearToken, showSuccess, showError } = require('../../../utils/api');

Page({
  data: {
    isLoggedIn: false,
    userInfo: {
      username: '',
      phone: ''
    },
    avatarUrl: '',
    showAvatarPreview: false
  },
  
  onLoad() {
    console.log('我的页面加载');
    this.checkLoginStatus();
  },
  
  onShow() {
    console.log('我的页面显示');
    this.checkLoginStatus();
  },
  
  checkLoginStatus() {
    console.log('检查登录状态');
    const token = getToken();
    console.log('获取到的token:', token);
    if (token) {
      const userInfo = wx.getStorageSync('userInfo') || {
        username: '用户',
        phone: '138****8888'
      };
      const avatarUrl = wx.getStorageSync('userAvatar') || '';
      console.log('获取到的用户信息:', userInfo);
      this.setData({ isLoggedIn: true, userInfo, avatarUrl });
      console.log('设置登录状态为true');
    } else {
      this.setData({ isLoggedIn: false, avatarUrl: '' });
      console.log('设置登录状态为false');
    }
  },

  handleAvatarTap() {
    if (this.data.avatarUrl) {
      this.setData({ showAvatarPreview: true });
    } else {
      this.chooseAvatar();
    }
  },

  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        const avatarUrl = res.tempFilePaths[0];
        this.setData({ avatarUrl, showAvatarPreview: false });
        wx.setStorageSync('userAvatar', avatarUrl);
        showSuccess('头像设置成功');
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
      }
    });
  },

  closeAvatarPreview() {
    this.setData({ showAvatarPreview: false });
  },

  preventClose() {},

  navigateToLogin() {
    console.log('跳转到登录页面');
    wx.navigateTo({ 
      url: '/pages/auth/login/login',
      success: function(res) {
        console.log('登录页面跳转成功');
      },
      fail: function(res) {
        console.log('登录页面跳转失败:', res);
      }
    });
  },

  navigateToRegister() {
    console.log('跳转到注册页面');
    wx.navigateTo({ 
      url: '/pages/auth/register/register',
      success: function(res) {
        console.log('注册页面跳转成功');
      },
      fail: function(res) {
        console.log('注册页面跳转失败:', res);
      }
    });
  },

  gotoMyPublish() {
    wx.navigateTo({
      url: '/pages/me/publish/publish'
    });
  },

  gotoMyClaim() {
    wx.navigateTo({
      url: '/pages/me/claim/claim'
    });
  },

  gotoSettings() {
    wx.navigateTo({
      url: '/pages/me/settings/settings'
    });
  },

  gotoAbout() {
    wx.navigateTo({
      url: '/pages/me/about/about'
    });
  },

  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          clearToken();
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('userAvatar');
          this.setData({ isLoggedIn: false, avatarUrl: '' });
          showSuccess('退出登录成功');
        }
      }
    });
  }
});
