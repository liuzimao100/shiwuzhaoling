// API工具函数
const app = getApp();
const baseUrl = app.globalData.baseUrl;

/**
 * 用户注册
 * @param {Object} userInfo - 用户信息
 * @param {string} userInfo.username - 用户名
 * @param {string} userInfo.password - 密码
 * @param {string} userInfo.phone_number - 手机号
 * @returns {Promise} - 返回注册结果
 */
function userRegister(userInfo) {
  return new Promise((resolve, reject) => {
    wx.showLoading({ title: '注册中...' });
    
    wx.request({
      url: `${baseUrl}/register/`,
      method: 'POST',
      data: userInfo,
      header: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          const result = res.data;
          if (result.code === 200) {
            // 保存token到本地存储
            wx.setStorageSync('token', result.token);
            resolve(result);
          } else {
            reject(new Error(result.msg || '注册失败'));
          }
        } else {
          reject(new Error('注册失败，请稍后重试'));
        }
      },
      fail: (err) => {
        wx.hideLoading();
        reject(new Error('网络错误，请稍后重试'));
      }
    });
  });
}

/**
 * 用户登录
 * @param {Object} loginInfo - 登录信息
 * @param {string} loginInfo.username - 用户名
 * @param {string} loginInfo.password - 密码
 * @returns {Promise} - 返回登录结果
 */
function userLogin(loginInfo) {
  return new Promise((resolve, reject) => {
    wx.showLoading({ title: '登录中...' });
    
    wx.request({
      url: `${baseUrl}/login/`,
      method: 'POST',
      data: loginInfo,
      header: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          const result = res.data;
          if (result.code === 200) {
            // 保存token到本地存储
            wx.setStorageSync('token', result.token);
            resolve(result);
          } else {
            reject(new Error(result.msg || '登录失败'));
          }
        } else {
          reject(new Error('登录失败，请稍后重试'));
        }
      },
      fail: (err) => {
        wx.hideLoading();
        reject(new Error('网络错误，请稍后重试'));
      }
    });
  });
}

/**
 * 获取本地存储的token
 * @returns {string|null} - 返回token或null
 */
function getToken() {
  return wx.getStorageSync('token') || null;
}

/**
 * 清除本地存储的token
 */
function clearToken() {
  wx.removeStorageSync('token');
}

/**
 * 上传图片到后端
 * @param {Object} file - 图片文件对象
 * @returns {Promise} - 返回上传结果
 */
function uploadPhoto(file) {
  return new Promise((resolve, reject) => {
    wx.showLoading({ title: '上传中...' });
    
    const token = getToken();
    
    const header = {};
    
    if (token) {
      header['Authorization'] = `Token ${token}`;
    }
    
    wx.uploadFile({
      url: `${baseUrl}/upload/`,
      filePath: file.tempFilePath,
      name: 'photo',
      header: header,
      timeout: 180000,
      success: (res) => {
        wx.hideLoading();
        const result = JSON.parse(res.data);
        if (result.code === 200) {
          resolve(result);
        } else {
          reject(new Error(result.message || '上传失败'));
        }
      },
      fail: (err) => {
        wx.hideLoading();
        reject(new Error('网络错误，请稍后重试'));
      }
    });
  });
}

/**
 * 对比图片相似度
 * @param {Object} file - 图片文件对象
 * @returns {Promise} - 返回对比结果
 */
function comparePhoto(file) {
  return new Promise((resolve, reject) => {
    wx.showLoading({ title: '对比中...', mask: true });
    
    const token = getToken();
    
    const header = {};
    
    if (token) {
      header['Authorization'] = `Token ${token}`;
    }
    
    const uploadTask = wx.uploadFile({
      url: `${baseUrl}/compare/`,
      filePath: file.tempFilePath,
      name: 'photo',
      header: header,
      timeout: 180000,
      success: (res) => {
        console.log('uploadFile success, statusCode:', res.statusCode);
        console.log('uploadFile response data:', res.data);
        wx.hideLoading();
        try {
          const result = JSON.parse(res.data);
          console.log('parsed result:', result);
          if (result.code === 200) {
            resolve(result);
          } else {
            reject(new Error(result.msg || result.message || '对比失败'));
          }
        } catch (e) {
          console.error('JSON parse error:', e);
          reject(new Error('响应解析失败'));
        }
      },
      fail: (err) => {
        console.error('uploadFile fail:', err);
        wx.hideLoading();
        reject(new Error('网络错误，请稍后重试'));
      }
    });
    
    uploadTask.onProgressUpdate((res) => {
      console.log('上传进度', res.progress, res.totalBytesSent, res.totalBytesExpectedToSend);
    });
  });
}

/**
 * 获取所有物品列表
 * @returns {Promise} - 返回物品列表
 */
function getItemsList() {
  return new Promise((resolve, reject) => {
    wx.showLoading({ title: '加载中...' });
    
    wx.request({
      url: `${baseUrl}/items/`,
      method: 'GET',
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          const result = res.data;
          if (result.code === 200) {
            resolve(result.data || []);
          } else {
            reject(new Error(result.msg || '获取列表失败'));
          }
        } else {
          reject(new Error('获取列表失败'));
        }
      },
      fail: (err) => {
        wx.hideLoading();
        reject(new Error('网络错误，请稍后重试'));
      }
    });
  });
}

function getMyItems() {
  return new Promise((resolve, reject) => {
    wx.showLoading({ title: '加载中...' });

    const token = getToken();
    const header = {};

    if (token) {
      header['Authorization'] = `Token ${token}`;
    }

    wx.request({
      url: `${baseUrl}/my-items/`,
      method: 'GET',
      header: header,
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          const result = res.data;
          if (result.code === 200) {
            resolve(result.data || []);
          } else {
            reject(new Error(result.msg || '获取列表失败'));
          }
        } else {
          reject(new Error('获取列表失败'));
        }
      },
      fail: (err) => {
        wx.hideLoading();
        reject(new Error('网络错误，请稍后重试'));
      }
    });
  });
}

/**
 * 显示错误提示
 * @param {string} message - 错误信息
 */
function showError(message) {
  wx.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  });
}

/**
 * 显示成功提示
 * @param {string} message - 成功信息
 */
function showSuccess(message) {
  wx.showToast({
    title: message,
    icon: 'success',
    duration: 2000
  });
}

/**
 * 检查用户是否登录
 * @returns {boolean} - 返回登录状态
 */
function checkLogin() {
  const token = getToken();
  return !!token;
}

/**
 * 检查登录状态，如果未登录则提示并跳转到登录页面
 * @returns {boolean} - 返回登录状态
 */
function requireLogin() {
  if (!checkLogin()) {
    wx.showModal({
      title: '提示',
      content: '请先登录后再进行操作',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.switchTab({
            url: '/pages/auth/me/me'
          });
        }
      }
    });
    return false;
  }
  return true;
}

/**
 * 显示确认对话框
 * @param {string} title - 标题
 * @param {string} content - 内容
 * @returns {Promise} - 返回用户选择结果
 */
function showConfirm(title, content) {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm);
      }
    });
  });
}

// 使用CommonJS模块系统导出所有函数
module.exports = {
  userRegister,
  userLogin,
  getToken,
  clearToken,
  uploadPhoto,
  comparePhoto,
  getItemsList,
  getMyItems,
  showError,
  showSuccess,
  showConfirm,
  checkLogin,
  requireLogin
};
