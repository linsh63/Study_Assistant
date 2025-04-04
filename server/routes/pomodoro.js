const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PomodoroTask = require('../models/PomodoroTask');

// 获取用户的所有番茄钟任务
router.get('/tasks', auth, async (req, res) => {
    try {
        // 修改查询条件，使用req.user.id作为userId
        const tasks = await PomodoroTask.find({ userId: req.user.id })
            .sort({ startTime: -1 });
        
        res.json(tasks);
    } catch (error) {
        console.error('获取番茄钟任务失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 创建新的番茄钟任务
router.post('/tasks', auth, async (req, res) => {
    try {
        const taskData = {
            ...req.body,
            userId: req.user.id
        };
        
        const task = new PomodoroTask(taskData);
        await task.save();
        
        res.status(201).json(task);
    } catch (error) {
        console.error('创建番茄钟任务失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 批量同步本地任务到数据库
router.post('/sync', auth, async (req, res) => {
    try {
        const { tasks } = req.body;
        
        if (!Array.isArray(tasks) || tasks.length === 0) {
            return res.status(400).json({ message: '没有提供有效的任务数据' });
        }
        
        const results = [];
        
        // 批量处理任务
        for (const taskData of tasks) {
            // 检查任务是否已存在（通过客户端生成的ID）
            let existingTask = null;
            if (taskData.clientId) {
                existingTask = await PomodoroTask.findOne({ 
                    userId: req.user.id,
                    clientId: taskData.clientId
                });
            }
            
            if (existingTask) {
                // 更新现有任务
                Object.assign(existingTask, {
                    ...taskData,
                    userId: req.user.id
                });
                await existingTask.save();
                results.push(existingTask);
            } else {
                // 创建新任务
                const newTask = new PomodoroTask({
                    ...taskData,
                    userId: req.user.id
                });
                await newTask.save();
                results.push(newTask);
            }
        }
        
        res.status(200).json({
            message: `成功同步 ${results.length} 个任务`,
            tasks: results
        });
    } catch (error) {
        console.error('同步番茄钟任务失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

module.exports = router;