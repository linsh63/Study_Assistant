# 智能学习辅助系统

这是一个基于Node.js开发的综合学习辅助Web应用，集成了课程表管理、番茄钟计时、待办事项和学习数据统计等功能，帮助学生更好地管理学习时间和提高学习效率。

## 功能特点

### 课程表管理
- 添加、编辑和删除课程信息
- 支持单个课程添加和批量导入
- 课程信息可视化展示
- 支持课程表导入导出功能

### 番茄钟计时
- 可自定义工作和休息时间
- 多种背景音效选择（咖啡厅、森林、火焰、雨声、海浪）
- 动态背景效果
- 任务完成记录和统计

### 待办事项管理
- 添加、编辑和删除待办事项
- 设置任务优先级和截止日期
- 多种视图模式（列表视图、周视图）
- 任务完成状态追踪

### 学习数据统计
- 番茄钟使用情况统计
- 学习时间分析图表
- 任务完成率统计
- 学习效率评估

### 用户系统
- 用户注册和登录功能
- 个人数据保存和同步
- 账号管理功能

## 项目结构

```
├── data/                  # 数据库文件目录
├── models/                # 数据模型定义
│   └── index.js           # 数据库模型配置
├── public/                # 静态资源文件
│   ├── audio/             # 背景音效文件
│   ├── components/        # 前端组件
│   ├── css/               # 样式文件
│   ├── images/            # 图片资源
│   └── js/                # JavaScript文件
├── uploads/               # 文件上传目录
├── dashboard.html         # 仪表盘页面
├── index.html             # 课程表主页
├── login.html             # 登录页面
├── pomodoro-stats.html    # 番茄钟统计页面
├── pomodoro.html          # 番茄钟页面
├── register.html          # 注册页面
├── TodoList.html          # 待办事项页面
├── server.js              # 服务器入口文件
└── package.json           # 项目依赖配置
```

## 技术栈

### 后端
- **Node.js**: 服务器运行环境
- **Express**: Web应用框架
- **Sequelize**: ORM数据库操作
- **SQLite3**: 轻量级数据库
- **bcryptjs**: 密码加密
- **express-session**: 会话管理
- **multer**: 文件上传处理

### 前端
- **HTML5/CSS3**: 页面结构和样式
- **JavaScript**: 客户端逻辑
- **Tailwind CSS**: CSS框架
- **Font Awesome**: 图标库
- **Chart.js**: 数据可视化图表

## 安装步骤

1. **配置环境**：
   - 安装Node.js环境（推荐v14.0.0以上版本）
   - 安装npm包管理器

2. **克隆项目到本地**：
   ```bash
   git clone https://github.com/linsh63/Study_Assistant.git
   ```

3. **进入项目目录**：
   ```bash
   cd Study_Assistant
   ```

4. **安装依赖**：
   ```bash
   npm install
   ```

## 运行说明

1. **启动服务器**：
   ```bash
   npm start
   # 或者直接使用
   node server.js
   ```

2. **访问应用**：
   - 打开浏览器访问：`http://localhost:3000`
   - 首次使用需要在注册页面创建账号
   - 使用创建的账号登录系统

## 使用指南

### 用户注册与登录
1. 访问`/register.html`页面注册新账号
2. 在`/login.html`页面使用注册的账号登录
3. 登录后自动跳转到仪表盘页面

### 课程表管理
1. 在仪表盘选择「课程表」或直接访问`/index.html`
2. 点击「添加课程」按钮添加新课程
3. 可以选择单个添加或批量导入
4. 课程信息包括名称、教师、时间、地点等

### 番茄钟使用
1. 在仪表盘选择「番茄钟」或直接访问`/pomodoro.html`
2. 设置工作时间和休息时间
3. 选择背景音效（可选）
4. 点击开始按钮开始计时
5. 在`/pomodoro-stats.html`查看学习统计数据

### 待办事项管理
1. 在仪表盘选择「待办事项」或直接访问`/TodoList.html`
2. 添加新任务，设置优先级和截止日期
3. 可以切换不同视图模式查看任务
4. 完成任务后勾选标记为已完成

## 数据模型

系统包含以下主要数据模型：

- **User**: 用户信息
- **Course**: 课程信息
- **PomodoroTask**: 番茄钟任务记录
- **TodoTask**: 待办事项任务

## 注意事项

- 首次运行会自动初始化数据库
- 上传的文件将保存在 `uploads` 目录
- 确保3000端口未被占用
- 建议使用现代浏览器（Chrome、Firefox、Edge等）访问应用
- 本地开发环境中，数据存储在SQLite数据库文件中