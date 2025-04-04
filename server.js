const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const { sequelize, User, Course } = require('./models');
// 删除百度OCR API相关依赖
const multer = require('multer');
const fs = require('fs');
// 删除mongoose依赖
// const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// 删除MongoDB连接代码
// mongoose.connect('mongodb://localhost:27017/pomodoro')
// .then(() => console.log('MongoDB连接成功'))
// .catch(err => console.error('MongoDB连接失败:', err));

// 设置文件上传
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 } // 限制5MB
});

// 确保上传目录存在
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}


// 中间件
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 1天
}));

// API路由
const apiRouter = express.Router();

// 注册
apiRouter.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 检查用户名是否已存在
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: '用户名已存在' });
        }
        
        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 创建新用户
        const user = await User.create({
            username,
            password: hashedPassword
        });
        
        // 登录用户
        req.session.userId = user.id;
        
        res.status(201).json({ message: '注册成功', user: { id: user.id, username: user.username } });
    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 登录
apiRouter.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('登录尝试:', username); // 添加日志
        
        // 查找用户
        const user = await User.findOne({ where: { username } });
        if (!user) {
            console.log('用户不存在:', username);
            return res.status(401).json({ message: '用户名或密码不正确' });
        }
        
        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('密码验证结果:', isPasswordValid); // 添加日志
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: '用户名或密码不正确' });
        }
        
        // 登录用户
        req.session.userId = user.id;
        console.log('登录成功，用户ID:', user.id);
        
        res.json({ message: '登录成功', user: { id: user.id, username: user.username } });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 获取当前用户
apiRouter.get('/me', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: '未登录' });
        }
        
        const user = await User.findByPk(req.session.userId);
        if (!user) {
            return res.status(401).json({ message: '用户不存在' });
        }
        
        res.json({ id: user.id, username: user.username });
    } catch (error) {
        console.error('获取用户信息失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 退出登录
apiRouter.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: '退出成功' });
});

// 获取所有课程
apiRouter.get('/courses', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: '未登录' });
        }
        
        const courses = await Course.findAll({
            where: { UserId: req.session.userId },
            order: [['weekDay', 'ASC'], ['startTime', 'ASC']]
        });
        
        res.json(courses);
    } catch (error) {
        console.error('获取课程失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 添加课程
apiRouter.post('/courses', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: '未登录' });
        }
        
        const courseData = req.body;
        const course = await Course.create({
            ...courseData,
            UserId: req.session.userId
        });
        
        res.status(201).json(course);
    } catch (error) {
        console.error('添加课程失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 更新课程
apiRouter.put('/courses/:id', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: '未登录' });
        }
        
        const { id } = req.params;
        const courseData = req.body;
        
        // 查找课程并验证所有权
        const course = await Course.findOne({
            where: { id, UserId: req.session.userId }
        });
        
        if (!course) {
            return res.status(404).json({ message: '课程不存在或无权限' });
        }
        
        // 更新课程
        await course.update(courseData);
        
        res.json(course);
    } catch (error) {
        console.error('更新课程失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 删除课程
apiRouter.delete('/courses/:id', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: '未登录' });
        }
        
        const { id } = req.params;
        
        // 查找课程并验证所有权
        const course = await Course.findOne({
            where: { id, UserId: req.session.userId }
        });
        
        if (!course) {
            return res.status(404).json({ message: '课程不存在或无权限' });
        }
        
        // 删除课程
        await course.destroy();
        
        res.json({ message: '删除成功' });
    } catch (error) {
        console.error('删除课程失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 添加简单的文件上传路由，替代OCR相关路由
apiRouter.post('/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: '未上传文件' });
        }
        
        res.json({
            message: '文件上传成功',
            filename: req.file.filename,
            path: req.file.path
        });
    } catch (error) {
        console.error('文件上传失败:', error);
        res.status(500).json({ message: '文件上传失败' });
    }
});

// 注销账号
apiRouter.delete('/delete-account', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: '未登录' });
        }
        
        // 查找用户
        const user = await User.findByPk(req.session.userId);
        if (!user) {
            return res.status(404).json({ message: '用户不存在' });
        }
        
        // 查找并删除用户的所有课程
        await Course.destroy({
            where: { UserId: req.session.userId }
        });
        
        // 删除用户
        await user.destroy();
        
        // 清除会话
        req.session.destroy();
        
        res.json({ message: '账号已成功注销' });
    } catch (error) {
        console.error('注销账号失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});
app.use('/api', apiRouter);

// 删除番茄钟路由
// const pomodoroRoutesModule = require('./server/routes/pomodoro');
// app.use('/api/pomodoro', pomodoroRoutesModule);

// 启动服务器
async function startServer() {
    try {
        // 同步数据库模型
        await sequelize.sync();
        console.log('数据库同步成功');
        
        app.listen(PORT, () => {
            console.log(`服务器运行在 http://localhost:${PORT}`);
            console.log(`在局域网内可通过 http://${getLocalIP()}:${PORT} 访问`);
        });
    } catch (error) {
        console.error('启动服务器失败:', error);
    }
}

// 获取本地IP地址
function getLocalIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    
    return 'localhost';
}

startServer();
