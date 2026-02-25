import MySQLdb

# 数据库连接信息
config = {
    'host': 'localhost',
    'user': 'root',
    'password': '123456',
    'port': 3306,
}

# 连接到MySQL服务器并创建数据库
try:
    # 连接到MySQL服务器
    conn = MySQLdb.connect(**config)
    cursor = conn.cursor()
    
    # 创建数据库
    cursor.execute("CREATE DATABASE IF NOT EXISTS find_ku CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    print("数据库创建成功！")
    
    # 关闭连接
    cursor.close()
    conn.close()
except Exception as e:
    print(f"创建数据库失败: {str(e)}")
