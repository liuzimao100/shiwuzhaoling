// 丢失者对比页面逻辑
import { comparePhoto as apiComparePhoto, showSuccess, showError } from '../../../utils/api';
import { compressImage, formatDate } from '../../../utils/common';

Page({
  data: {
    photoPath: '', // 拍摄的照片路径
    compareResult: null, // 对比结果
    cameraContext: null // 相机上下文
  },
  
  onLoad() {
    // 页面加载时执行
    console.log('对比页面加载');
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
          compareResult: null
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
    
    try {
      // 压缩图片
      const compressedPath = await compressImage(photoPath);
      
      // 对比图片
      const result = await apiComparePhoto({
        tempFilePath: compressedPath
      });
      
      // 显示对比成功
      showSuccess('对比成功');
      
      // 更新对比结果
      this.setData({
        compareResult: {
          success: true,
          matchedItem: {
            id: result.data.id,
            imageUrl: result.data.image_path,
            createdAt: formatDate(result.data.created_at)
          }
        }
      });
      
    } catch (error) {
      console.error('对比失败:', error);
      showError(error.message || '对比失败，请重试');
      
      // 更新对比结果
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
    wx.navigateTo({
      url: '/pages/finder/list/list'
    });
  },
  
  // 相机错误处理
  error(e) {
    console.error('相机错误:', e.detail);
    showError('相机初始化失败，请检查权限');
  }
})