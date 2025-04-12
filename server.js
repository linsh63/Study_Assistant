const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const { sequelize, User, Course, PomodoroTask } = require('./models'); // 保留现有模型
const multer = require('multer');
const fs = require('fs');
// 添加 SQLite 支持
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// 创建 SQLite 数据库连接
const db = new sqlite3.Database('./todos.db', (err) => {
  if (err) {
    console.error('无法连接到SQLite数据库', err);
  } else {
    console.log('已连接到SQLite数据库');
    
    // 创建任务表 (仅创建 todo_tasks)
    db.run(`
      CREATE TABLE IF NOT EXISTS todo_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        priority TEXT NOT NULL DEFAULT 'medium',
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        datetime TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
  }
});

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

// 番茄钟任务相关路由
// 获取所有番茄钟任务
apiRouter.get('/tasks', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: '未登录' });
        }
        
        const tasks = await PomodoroTask.findAll({
            where: { UserId: req.session.userId },
            order: [['startTime', 'DESC']]
        });
        
        res.json(tasks);
    } catch (error) {
        console.error('获取番茄钟任务失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 创建新番茄钟任务
apiRouter.post('/tasks', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: '未登录' });
        }
        
        const taskData = req.body;
        const task = await PomodoroTask.create({
            ...taskData,
            UserId: req.session.userId
        });
        
        res.status(201).json(task);
    } catch (error) {
        console.error('创建番茄钟任务失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 更新番茄钟任务状态 - 暂停
apiRouter.put('/tasks/:taskId/pause', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: '未登录' });
        }
        
        const { taskId } = req.params;
        const { pauseTime, elapsedSeconds } = req.body;
        
        const task = await PomodoroTask.findOne({
            where: { 
                taskId: taskId,
                UserId: req.session.userId 
            }
        });
        
        if (!task) {
            return res.status(404).json({ message: '任务不存在或无权限' });
        }
        
        await task.update({
            status: 'paused',
            remainingSeconds: task.plannedDuration - elapsedSeconds
        });
        
        res.json(task);
    } catch (error) {
        console.error('暂停番茄钟任务失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 更新番茄钟任务状态 - 完成
apiRouter.put('/tasks/:taskId/complete', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: '未登录' });
        }
        
        const { taskId } = req.params;
        const { endTime, actualDuration } = req.body;
        
        const task = await PomodoroTask.findOne({
            where: { 
                taskId: taskId,
                UserId: req.session.userId 
            }
        });
        
        if (!task) {
            return res.status(404).json({ message: '任务不存在或无权限' });
        }
        
        await task.update({
            status: 'completed',
            endTime: endTime || new Date(),
            actualDuration: actualDuration || task.plannedDuration,
            remainingSeconds: 0
        });
        
        res.json(task);
    } catch (error) {
        console.error('完成番茄钟任务失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 更新番茄钟任务状态 - 放弃
apiRouter.put('/tasks/:taskId/abandon', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: '未登录' });
        }
        
        const { taskId } = req.params;
        const { endTime, elapsedSeconds } = req.body;
        
        const task = await PomodoroTask.findOne({
            where: { 
                taskId: taskId,
                UserId: req.session.userId 
            }
        });
        
        if (!task) {
            return res.status(404).json({ message: '任务不存在或无权限' });
        }
        
        await task.update({
            status: 'abandoned',
            endTime: endTime || new Date(),
            actualDuration: elapsedSeconds || 0
        });
        
        res.json(task);
    } catch (error) {
        console.error('放弃番茄钟任务失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 删除番茄钟任务
apiRouter.delete('/tasks/:taskId', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: '未登录' });
        }
        
        const { taskId } = req.params;
        
        const task = await PomodoroTask.findOne({
            where: { 
                taskId: taskId,
                UserId: req.session.userId 
            }
        });
        
        if (!task) {
            return res.status(404).json({ message: '任务不存在或无权限' });
        }
        
        await task.destroy();
        
        res.json({ message: '删除成功' });
    } catch (error) {
        console.error('删除番茄钟任务失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 注销账号时也删除番茄钟任务
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
        
        // 查找并删除用户的所有番茄钟任务
        await PomodoroTask.destroy({
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

// 获取当前用户的所有任务
apiRouter.get('/todo-tasks', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: '未登录' });
    }
    
    db.all('SELECT * FROM todo_tasks WHERE user_id = ? ORDER BY datetime', [req.session.userId], (err, tasks) => {
      if (err) {
        console.error('获取任务失败:', err);
        return res.status(500).json({ message: '服务器错误' });
      }
      
      // 转换 completed 为布尔值
      const formattedTasks = tasks.map(task => ({
        ...task,
        completed: task.completed === 1
      }));
      
      res.json(formattedTasks);
    });
  } catch (error) {
    console.error('获取任务失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加新任务
apiRouter.post('/todo-tasks', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: '未登录' });
    }
    
    const { text, completed, priority, date, time, datetime } = req.body;
    
    if (!text || !date || !time) {
      return res.status(400).json({ message: '缺少必要参数' });
    }
    
    const created_at = new Date().toISOString();
    
    db.run(
      `INSERT INTO todo_tasks (user_id, text, completed, priority, date, time, datetime, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.session.userId, text, completed ? 1 : 0, priority, date, time, datetime || new Date(date + 'T' + time).toISOString(), created_at],
      function(err) {
        if (err) {
          console.error('添加任务失败:', err);
          return res.status(500).json({ message: '服务器错误' });
        }
        
        // 获取新插入的任务
        db.get('SELECT * FROM todo_tasks WHERE id = ?', [this.lastID], (err, task) => {
          if (err) {
            console.error('获取新任务失败:', err);
            return res.status(500).json({ message: '服务器错误' });
          }
          
          // 转换 completed 为布尔值
          task.completed = task.completed === 1;
          
          res.status(201).json(task);
        });
      }
    );
  } catch (error) {
    console.error('添加任务失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新任务
apiRouter.put('/todo-tasks/:id', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: '未登录' });
    }
    
    const taskId = req.params.id;
    const { text, completed, priority, date, time, datetime } = req.body;
    
    // 先检查任务是否属于当前用户
    db.get('SELECT * FROM todo_tasks WHERE id = ? AND user_id = ?', [taskId, req.session.userId], (err, task) => {
      if (err) {
        console.error('检查任务所有权失败:', err);
        return res.status(500).json({ message: '服务器错误' });
      }
      
      if (!task) {
        return res.status(404).json({ message: '任务不存在或无权访问' });
      }
      
      // 更新任务
      db.run(
        `UPDATE todo_tasks 
         SET text = ?, completed = ?, priority = ?, date = ?, time = ?, datetime = ? 
         WHERE id = ? AND user_id = ?`,
        [text, completed ? 1 : 0, priority, date, time, datetime, taskId, req.session.userId],
        function(err) {
          if (err) {
            console.error('更新任务失败:', err);
            return res.status(500).json({ message: '更新任务失败' });
          }
          
          // 获取更新后的任务
          db.get('SELECT * FROM todo_tasks WHERE id = ?', [taskId], (err, updatedTask) => {
            if (err || !updatedTask) {
              console.error('获取更新后的任务失败:', err);
              return res.status(500).json({ message: '获取更新后的任务失败' });
            }
            
            // 转换 completed 为布尔值
            updatedTask.completed = updatedTask.completed === 1;
            
            res.json(updatedTask);
          });
        }
      );
    });
  } catch (error) {
    console.error('更新任务失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 切换任务完成状态
apiRouter.patch('/todo-tasks/:id/toggle', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: '未登录' });
    }
    
    const taskId = req.params.id;
    const { completed } = req.body;
    
    // 检查任务是否属于当前用户
    db.get('SELECT * FROM todo_tasks WHERE id = ? AND user_id = ?', [taskId, req.session.userId], (err, task) => {
      if (err) {
        console.error('检查任务所有权失败:', err);
        return res.status(500).json({ message: '服务器错误' });
      }
      
      if (!task) {
        return res.status(404).json({ message: '任务不存在或无权访问' });
      }
      
      // 更新完成状态
      db.run(
        'UPDATE todo_tasks SET completed = ? WHERE id = ? AND user_id = ?',
        [completed ? 1 : 0, taskId, req.session.userId],
        function(err) {
          if (err) {
            console.error('更新任务状态失败:', err);
            return res.status(500).json({ message: '更新任务状态失败' });
          }
          
          // 获取更新后的任务
          db.get('SELECT * FROM todo_tasks WHERE id = ?', [taskId], (err, updatedTask) => {
            if (err || !updatedTask) {
              console.error('获取更新后的任务失败:', err);
              return res.status(500).json({ message: '获取更新后的任务失败' });
            }
            
            // 转换 completed 为布尔值
            updatedTask.completed = updatedTask.completed === 1;
            
            res.json(updatedTask);
          });
        }
      );
    });
  } catch (error) {
    console.error('更新任务状态失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除任务
apiRouter.delete('/todo-tasks/:id', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: '未登录' });
    }
    
    const taskId = req.params.id;
    
    // 检查任务是否属于当前用户
    db.get('SELECT * FROM todo_tasks WHERE id = ? AND user_id = ?', [taskId, req.session.userId], (err, task) => {
      if (err) {
        console.error('检查任务所有权失败:', err);
        return res.status(500).json({ message: '服务器错误' });
      }
      
      if (!task) {
        return res.status(404).json({ message: '任务不存在或无权访问' });
      }
      
      // 删除任务
      db.run('DELETE FROM todo_tasks WHERE id = ? AND user_id = ?', [taskId, req.session.userId], function(err) {
        if (err) {
          console.error('删除任务失败:', err);
          return res.status(500).json({ message: '删除任务失败' });
        }
        
        res.json({ message: '任务已删除', id: taskId });
      });
    });
  } catch (error) {
    console.error('删除任务失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 修改注销账号功能，添加删除todo任务的逻辑
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
    
    // 删除该用户的所有Todo任务
    db.run('DELETE FROM todo_tasks WHERE user_id = ?', [req.session.userId], function(err) {
      if (err) {
        console.error('删除用户Todo任务失败:', err);
        // 继续删除其他数据
      }
      
      console.log(`已删除 ${this?.changes || 0} 条Todo任务`);
      
      // 查找并删除用户的所有课程
      Course.destroy({
        where: { UserId: req.session.userId }
      }).then(() => {
        // 删除番茄钟任务
        return PomodoroTask.destroy({
          where: { UserId: req.session.userId }
        });
      }).then(() => {
        // 删除用户
        return user.destroy();
      }).then(() => {
        // 清除会话
        req.session.destroy(() => {
          res.json({ message: '账号已成功注销' });
        });
      }).catch(error => {
        console.error('删除用户数据失败:', error);
        res.status(500).json({ message: '服务器错误' });
      });
    });
  } catch (error) {
    console.error('注销账号失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

app.use('/api', apiRouter);

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

// 确保关闭数据库连接
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('关闭数据库连接失败:', err);
    } else {
      console.log('数据库连接已关闭');
    }
    process.exit(0);
  });
});

startServer();
