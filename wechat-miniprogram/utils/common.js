// 通用工具函数

/**
 * 格式化日期
 * @param {string} dateString - 日期字符串
 * @returns {string} - 格式化后的日期
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 压缩图片
 * @param {string} tempFilePath - 图片临时路径
 * @param {number} maxWidth - 最大宽度
 * @returns {Promise} - 返回压缩后的图片
 */
export function compressImage(tempFilePath, maxWidth = 800) {
  return new Promise((resolve, reject) => {
    wx.getImageInfo({
      src: tempFilePath,
      success: (info) => {
        const { width, height } = info;
        let scale = 1;
        
        if (width > maxWidth) {
          scale = maxWidth / width;
        }
        
        wx.compressImage({
          src: tempFilePath,
          quality: 80,
          success: (res) => {
            resolve(res.tempFilePath);
          },
          fail: (err) => {
            reject(err);
          }
        });
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

/**
 * 生成唯一ID
 * @returns {string} - 唯一ID
 */
export function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 节流函数
 * @param {Function} func - 要执行的函数
 * @param {number} delay - 延迟时间
 * @returns {Function} - 节流后的函数
 */
export function throttle(func, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
}

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} delay - 延迟时间
 * @returns {Function} - 防抖后的函数
 */
export function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * 验证图片格式
 * @param {string} fileName - 文件名
 * @returns {boolean} - 是否为有效图片格式
 */
export function isValidImage(fileName) {
  const validFormats = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const fileExt = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return validFormats.includes(fileExt);
}

/**
 * 计算文件大小
 * @param {number} bytes - 字节数
 * @returns {string} - 格式化后的文件大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}