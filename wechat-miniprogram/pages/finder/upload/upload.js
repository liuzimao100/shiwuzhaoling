// 发现者上传页面逻辑
import { uploadPhoto as apiUploadPhoto, showSuccess, showError } from '../../../utils/api';
import { compressImage } from '../../../utils/common';

Page({
  data: {
    photoPath: '', // 拍摄的照片路径
    uploadResult: null, // 上传结果
    cameraContext: null // 相机上下文
  },
  
  onLoad() {
    // 页面加载时执行
    console.log('上传页面加载');
    // 获取相机上下文
    this.setData({
      cameraContext: wx.createCameraContext()
    });
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
    wx.navigateTo({
      url: '../list/list'
    });
  },
  
  // 相机错误处理
  error(e) {
    console.error('相机错误:', e.detail);
    showError('相机初始化失败，请检查权限');
  }
})