// 物品陈列图表页面逻辑
import { getItemsList, showError } from '../../../utils/api';

Page({
  data: {
    totalItems: 0, // 总物品数
    todayItems: 0, // 今日新增
    items: [] // 物品列表
  },
  
  onLoad() {
    // 页面加载时执行
    console.log('物品陈列图表页面加载');
    this.loadData();
  },
  
  // 加载数据
  async loadData() {
    try {
      // 调用API获取物品列表
      // 注意：这里需要后端提供获取物品列表的API
      // 暂时使用模拟数据
      const mockItems = this.getMockItems();
      
      // 计算统计数据
      const totalItems = mockItems.length;
      const todayItems = this.calculateTodayItems(mockItems);
      
      // 更新数据
      this.setData({
        totalItems,
        todayItems,
        items: mockItems
      });
      
      // 绘制图表
      this.drawTimeChart(mockItems);
      
    } catch (error) {
      console.error('加载数据失败:', error);
      showError(error.message || '加载失败，请重试');
    }
  },
  
  // 计算今日新增物品数
  calculateTodayItems(items) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return items.filter(item => {
      const itemDate = new Date(item.createdAt);
      return itemDate >= today;
    }).length;
  },
  
  // 绘制时间分布图表
  drawTimeChart(items) {
    // 这里使用wx-charts库绘制图表
    // 由于微信小程序不支持直接引入第三方库
    // 实际开发中需要下载wx-charts.js并放入utils目录
    
    // 模拟数据处理
    const timeData = this.processTimeData(items);
    
    // 绘制图表（这里只是示例，实际需要使用wx-charts）
    console.log('绘制时间分布图表:', timeData);
    
    // 实际绘制代码示例：
    /*
    new wxCharts({
      canvasId: 'timeChart',
      type: 'line',
      categories: timeData.categories,
      series: [{
        name: '物品数',
        data: timeData.data,
        format: function(val) {
          return val;
        }
      }],
      xAxis: {
        disableGrid: true
      },
      yAxis: {
        title: '物品数',
        format: function(val) {
          return val;
        },
        min: 0
      },
      width: wx.getSystemInfoSync().windowWidth - 40,
      height: 300,
      dataLabel: false,
      dataPointShape: true,
      enableScroll: true,
      extra: {
        lineStyle: 'curve'
      }
    });
    */
  },
  
  // 处理时间数据
  processTimeData(items) {
    // 按日期分组
    const dateMap = {};
    items.forEach(item => {
      const date = new Date(item.createdAt);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = 0;
      }
      dateMap[dateStr]++;
    });
    
    // 转换为图表数据
    const categories = Object.keys(dateMap).sort();
    const data = categories.map(date => dateMap[date]);
    
    return { categories, data };
  },
  
  // 模拟物品数据
  getMockItems() {
    return [
      {
        id: 1,
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lost%20wallet%20on%20table&image_size=square',
        createdAt: '2026-02-20 10:00:00'
      },
      {
        id: 2,
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lost%20phone%20on%20bench&image_size=square',
        createdAt: '2026-02-20 09:30:00'
      },
      {
        id: 3,
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lost%20keys%20on%20counter&image_size=square',
        createdAt: '2026-02-19 16:00:00'
      },
      {
        id: 4,
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lost%20backpack%20on%20chair&image_size=square',
        createdAt: '2026-02-19 14:30:00'
      },
      {
        id: 5,
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lost%20umbrella%20by%20door&image_size=square',
        createdAt: '2026-02-18 12:00:00'
      },
      {
        id: 6,
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lost%20glasses%20on%20desk&image_size=square',
        createdAt: '2026-02-18 10:30:00'
      },
      {
        id: 7,
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lost%20hat%20on%20sofa&image_size=square',
        createdAt: '2026-02-17 18:00:00'
      },
      {
        id: 8,
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lost%20watch%20on%20bed&image_size=square',
        createdAt: '2026-02-17 09:00:00'
      }
    ];
  }
})