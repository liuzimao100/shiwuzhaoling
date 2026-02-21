// API工具函数
const app = getApp();
const baseUrl = app.globalData.baseUrl;

/**
 * 上传图片到后端
 * @param {Object} file - 图片文件对象
 * @returns {Promise} - 返回上传结果
 */
export function uploadPhoto(file) {
  return new Promise((resolve, reject) => {
    wx.showLoading({ title: '上传中...' });
    
    wx.uploadFile({
      url: `${baseUrl}/upload/`,
      filePath: file.tempFilePath,
      name: 'photo',
      header: {
        'Content-Type': 'multipart/form-data'
      },
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
export function comparePhoto(file) {
  return new Promise((resolve, reject) => {
    wx.showLoading({ title: '对比中...' });
    
    wx.uploadFile({
      url: `${baseUrl}/compare/`,
      filePath: file.tempFilePath,
      name: 'photo',
      header: {
        'Content-Type': 'multipart/form-data'
      },
      success: (res) => {
        wx.hideLoading();
        const result = JSON.parse(res.data);
        if (result.code === 200) {
          resolve(result);
        } else {
          reject(new Error(result.message || '对比失败'));
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
 * 获取所有物品列表
 * @returns {Promise} - 返回物品列表
 */
export function getItemsList() {
  return new Promise((resolve, reject) => {
    wx.showLoading({ title: '加载中...' });
    
    wx.request({
      url: `${baseUrl}/items/`,
      method: 'GET',
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          resolve(res.data);
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
export function showError(message) {
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
export function showSuccess(message) {
  wx.showToast({
    title: message,
    icon: 'success',
    duration: 2000
  });
}

/**
 * 显示确认对话框
 * @param {string} title - 标题
 * @param {string} content - 内容
 * @returns {Promise} - 返回用户选择结果
 */
export function showConfirm(title, content) {
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