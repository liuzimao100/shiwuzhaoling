App({
  onLaunch() {
    // 小程序启动时执行
    console.log('小程序启动');
  },
  onShow() {
    // 小程序显示时执行
  },
  onHide() {
    // 小程序隐藏时执行
  },
  globalData: {
    // 全局数据
    baseUrl: 'http://localhost:8000/api' // 后端API基础地址
  }
})