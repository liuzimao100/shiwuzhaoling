// 丢失者对比页面逻辑
const { comparePhoto: apiComparePhoto, showSuccess, showError, requireLogin } = require('../../../utils/api');
const { compressImage, formatDate } = require('../../../utils/common');

Page({
  data: {
    photoPath: '', // 拍摄的照片路径
    compareResult: null, // 对比结果
    cameraContext: null // 相机上下文
  },
  
  onLoad() {
    // 页面加载时执行
    console.log('对比页面加载');
    // 检查登录状态
    if (!requireLogin()) {
      return;
    }
    // 检查相机权限
    this.checkCameraPermission();
  },
  
  // 检查相机权限
  checkCameraPermission() {
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.camera']) {
          // 请求相机权限
          wx.authorize({
            scope: 'scope.camera',
            success: () => {
              // 权限获取成功，初始化相机
              this.initCamera();
            },
            fail: () => {
              // 权限获取失败
              wx.showModal({
                title: '提示',
                content: '需要相机权限才能拍照',
                confirmText: '去设置',
                cancelText: '取消',
                success: (res) => {
                  if (res.confirm) {
                    wx.openSetting({
                      success: (res) => {
                        if (res.authSetting['scope.camera']) {
                          this.initCamera();
                        } else {
                          showError('请开启相机权限');
                        }
                      }
                    });
                  }
                }
              });
            }
          });
        } else {
          // 已获取权限，初始化相机
          this.initCamera();
        }
      },
      fail: (err) => {
        console.error('获取设置失败:', err);
        showError('获取相机权限失败');
      }
    });
  },
  
  // 初始化相机
  initCamera() {
    try {
      this.setData({
        cameraContext: wx.createCameraContext()
      });
      console.log('相机初始化成功');
    } catch (error) {
      console.error('相机初始化失败:', error);
      showError('相机初始化失败，请检查设备');
    }
  },
  
  // 拍照
  takePhoto() {
    const cameraContext = this.data.cameraContext;
    cameraContext.takePhoto({
      quality: 'high',
      success: (res) => {
        console.log('拍照成功:', res);
        this.setData({
          photoPath: res.tempImagePath,
          compareResult: null
        });
      },
      fail: (err) => {
        console.error('拍照失败:', err);
        showError('拍照失败，请重试');
      }
    });
  },
  
  // 从相册选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        console.log('选择图片成功:', res);
        this.setData({
          photoPath: res.tempFilePaths[0],
          compareResult: null
        });
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        showError('选择图片失败，请重试');
      }
    });
  },
  
  // 重拍
  retakePhoto() {
    this.setData({
      photoPath: '',
      compareResult: null
    });
  },
  
  // 对比照片
  async comparePhoto() {
    const photoPath = this.data.photoPath;
    if (!photoPath) {
      showError('请先拍照');
      return;
    }
    
    console.log('开始对比照片, photoPath:', photoPath);
    
    try {
      console.log('开始压缩图片...');
      const compressedPath = await compressImage(photoPath);
      console.log('图片压缩完成, compressedPath:', compressedPath);
      
      console.log('开始调用API对比图片...');
      const result = await apiComparePhoto({
        tempFilePath: compressedPath
      });
      console.log('API返回结果:', result);
      
      showSuccess('对比成功');
      
      const matchedItem = {
        id: result.data.id,
        imageUrl: result.data.image_url,
        createdAt: formatDate(result.data.created_at),
        phone: result.data.phone
      };

      const history = wx.getStorageSync('myClaims') || [];
      history.unshift({
        id: matchedItem.id,
        imageUrl: matchedItem.imageUrl,
        matchedAt: result.data.created_at,
        phone: matchedItem.phone
      });
      if (history.length > 50) {
        history.length = 50;
      }
      wx.setStorageSync('myClaims', history);

      this.setData({
        compareResult: {
          success: true,
          matchedItem
        }
      });

      wx.showModal({
        title: '找到您的物品',
        content: `发现者物品ID：${matchedItem.id}\n联系电话：${matchedItem.phone || '暂无'}`,
        showCancel: false,
        confirmText: '我知道了'
      });
      
    } catch (error) {
      console.error('对比失败:', error);
      showError(error.message || '对比失败，请重试');
      
      this.setData({
        compareResult: {
          success: false,
          message: error.message || '未找到匹配的物品'
        }
      });
    }
  },
  
  // 再次寻找
  searchAgain() {
    this.setData({
      photoPath: '',
      compareResult: null
    });
  },
  
  // 查看所有物品
  gotoItemList() {
    wx.switchTab({
      url: '/pages/finder/list/list'
    });
  },
  
  // 相机错误处理
  error(e) {
    console.error('相机错误:', e.detail);
    showError('相机初始化失败，请检查权限');
  }
})
