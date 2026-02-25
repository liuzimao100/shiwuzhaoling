const { userLogin, showError, showSuccess } = require('../../../utils/api');

Page({
  data: {
    username: '',
    password: '',
    showPassword: false,
    canLogin: false
  },
  
  onLoad() {
    // 页面加载时执行
  },
  
  onShow() {
    // 页面显示时执行
  },
  
  // 处理用户名输入
  handleUsernameInput(e) {
    const username = e.detail.value;
    this.setData({ username });
    this.checkFormValidity();
  },
  
  // 处理密码输入
  handlePasswordInput(e) {
    const password = e.detail.value;
    this.setData({ password });
    this.checkFormValidity();
  },
  
  // 切换密码显示状态
  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword });
  },
  
  // 检查表单有效性
  checkFormValidity() {
    const { username, password } = this.data;
    const canLogin = username && password;
    this.setData({ canLogin });
  },
  
  // 处理登录
  async handleLogin() {
    const { username, password } = this.data;
    
    try {
      // 调用登录API
      const result = await userLogin({
        username,
        password
      });
      
      // 登录成功
      showSuccess('登录成功');
      
      // 跳转到首页
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 1500);
    } catch (error) {
      // 登录失败
      showError(error.message);
    }
  },
  
  // 跳转到注册页面
  navigateToRegister() {
    wx.navigateTo({ url: '/pages/auth/register/register' });
  }
});
