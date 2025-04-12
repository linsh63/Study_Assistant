# 课程表项目

这是一个基于Node.js开发的课程表Web应用，集成了番茄钟功能和数据统计功能，帮助学生更好地管理学习时间。

## 功能特点

- 课程表管理
- 番茄钟计时
- 学习数据统计
- 用户登录注册

## 安装步骤

1. 克隆项目到本地：
   ```bash
   git clone https://github.com/linsh63/Study_Assistant.git
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 配置环境：
   - 确保已安装Node.js环境
   - 项目会自动创建SQLite数据库文件

## 运行说明

1. 启动服务器：
   ```bash
   node server.js
   ```

2. 访问应用：
   - 打开浏览器访问：`http://localhost:3000`
   - 首次使用需要注册账号

## 主要页面

- `/login.html` - 登录页面
- `/register.html` - 注册页面
- `/index.html` - 课程表主页
- `/pomodoro.html` - 番茄钟页面
- `/pomodoro-stats.html` - 学习统计页面
- `/dashboard.html` - 仪表盘页面

## 技术栈

- 后端：Node.js
- 数据库：SQLite
- 前端：HTML, CSS, JavaScript

## 注意事项

- 首次运行会自动初始化数据库
- 上传的文件将保存在 `uploads` 目录
- 确保3000端口未被占用