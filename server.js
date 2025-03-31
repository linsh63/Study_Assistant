const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'courses.json');

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// 确保数据文件存在
if (!fs.existsSync(DATA_FILE)) {
    // 创建初始数据
    const initialData = [
        {
            id: 1,
            name: "数据结构",
            code: "CS201",
            teacher: "张教授",
            weekDay: 1,
            startTime: "08:00",
            endTime: "09:40", 
            location: "教学楼A-301",
            type: "lecture",
            color: "#4a6fa5",
            note: "带课本和笔记本"
        },
        {
            id: 2,
            name: "计算机网络",
            code: "CS301", 
            teacher: "李教授",
            weekDay: 2,
            startTime: "10:00",
            endTime: "11:40",
            location: "教学楼B-201",
            type: "lecture",
            color: "#ff7e5f",
            note: ""
        }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

// 读取课程数据
function readCourses() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取课程数据失败:', error);
        return [];
    }
}

// 写入课程数据
function writeCourses(courses) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(courses, null, 2));
        return true;
    } catch (error) {
        console.error('写入课程数据失败:', error);
        return false;
    }
}

// 获取所有课程
app.get('/api/courses', (req, res) => {
    const courses = readCourses();
    res.json(courses);
});

// 获取单个课程
app.get('/api/courses/:id', (req, res) => {
    const courses = readCourses();
    const course = courses.find(c => c.id === parseInt(req.params.id));
    
    if (!course) {
        return res.status(404).json({ message: '未找到该课程' });
    }
    
    res.json(course);
});

// 创建新课程
app.post('/api/courses', (req, res) => {
    const courses = readCourses();
    
    // 生成新ID (当前最大ID + 1)
    const maxId = courses.reduce((max, course) => Math.max(max, course.id), 0);
    const newCourse = {
        id: maxId + 1,
        ...req.body
    };
    
    courses.push(newCourse);
    
    if (writeCourses(courses)) {
        res.status(201).json(newCourse);
    } else {
        res.status(500).json({ message: '保存课程失败' });
    }
});

// 更新课程
app.put('/api/courses/:id', (req, res) => {
    const courses = readCourses();
    const id = parseInt(req.params.id);
    const courseIndex = courses.findIndex(c => c.id === id);
    
    if (courseIndex === -1) {
        return res.status(404).json({ message: '未找到该课程' });
    }
    
    // 更新课程，保留原ID
    const updatedCourse = {
        ...req.body,
        id: id
    };
    
    courses[courseIndex] = updatedCourse;
    
    if (writeCourses(courses)) {
        res.json(updatedCourse);
    } else {
        res.status(500).json({ message: '更新课程失败' });
    }
});

// 删除课程
app.delete('/api/courses/:id', (req, res) => {
    const courses = readCourses();
    const id = parseInt(req.params.id);
    const courseIndex = courses.findIndex(c => c.id === id);
    
    if (courseIndex === -1) {
        return res.status(404).json({ message: '未找到该课程' });
    }
    
    courses.splice(courseIndex, 1);
    
    if (writeCourses(courses)) {
        res.json({ message: '课程删除成功' });
    } else {
        res.status(500).json({ message: '删除课程失败' });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});