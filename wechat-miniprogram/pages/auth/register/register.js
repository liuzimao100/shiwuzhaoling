const { userRegister, showError, showSuccess } = require('../../../utils/api');

Page({
  data: {
    username: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    showPassword: false,
    canRegister: false
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
  
  // 处理确认密码输入
  handleConfirmPasswordInput(e) {
    const confirmPassword = e.detail.value;
    this.setData({ confirmPassword });
    this.checkFormValidity();
  },
  
  // 处理手机号输入
  handlePhoneNumberInput(e) {
    const phoneNumber = e.detail.value;
    this.setData({ phoneNumber });
    this.checkFormValidity();
  },
  
  // 切换密码显示状态
  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword });
  },
  
  // 检查表单有效性
  checkFormValidity() {
    const { username, password, confirmPassword, phoneNumber } = this.data;
    
    // 检查所有字段是否都已填写
    const allFieldsFilled = username && password && confirmPassword && phoneNumber;
    
    // 检查密码是否一致
    const passwordsMatch = password === confirmPassword;
    
    // 检查手机号格式
    const phoneValid = /^1[3-9]\d{9}$/.test(phoneNumber);
    
    // 检查用户名长度
    const usernameValid = username.length >= 3 && username.length <= 20;
    
    // 检查密码长度
    const passwordValid = password.length >= 6;
    
    const canRegister = allFieldsFilled && passwordsMatch && phoneValid && usernameValid && passwordValid;
    this.setData({ canRegister });
  },
  
  // 处理注册
  async handleRegister() {
    const { username, password, phoneNumber } = this.data;
    
    try {
      // 调用注册API
      const result = await userRegister({
        username,
        password,
        phone_number: phoneNumber
      });
      
      // 注册成功
      showSuccess('注册成功');
      
      // 跳转到首页
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 1500);
    } catch (error) {
      // 注册失败
      showError(error.message);
    }
  },
  
  // 跳转到登录页面
  navigateToLogin() {
    wx.navigateTo({ url: '/pages/auth/login/login' });
  }
});
