// 发现者上传页面逻辑
const { uploadPhoto: apiUploadPhoto, showSuccess, showError, requireLogin } = require('../../../utils/api');
const { compressImage } = require('../../../utils/common');

Page({
  data: {
    photoPath: '', // 拍摄的照片路径
    uploadResult: null, // 上传结果
    cameraContext: null // 相机上下文
  },
  
  onLoad() {
    // 页面加载时执行
    console.log('上传页面加载');
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
          uploadResult: null
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
          uploadResult: null
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
      uploadResult: null
    });
  },
  
  // 上传照片
  async uploadPhoto() {
    const photoPath = this.data.photoPath;
    if (!photoPath) {
      showError('请先拍照');
      return;
    }
    
    try {
      // 压缩图片
      const compressedPath = await compressImage(photoPath);
      
      // 上传图片
      const result = await apiUploadPhoto({
        tempFilePath: compressedPath
      });
      
      // 显示上传成功
      showSuccess('上传成功');
      
      // 更新上传结果
      this.setData({
        uploadResult: {
          success: true,
          message: '物品已成功上传到系统'
        }
      });
      
    } catch (error) {
      console.error('上传失败:', error);
      showError(error.message || '上传失败，请重试');
      
      // 更新上传结果
      this.setData({
        uploadResult: {
          success: false,
          message: error.message || '上传失败，请重试'
        }
      });
    }
  },
  
  // 重试上传
  retryUpload() {
    this.setData({
      uploadResult: null
    });
  },
  
  // 跳转到物品列表
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
