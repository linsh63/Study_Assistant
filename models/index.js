const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// 创建数据库连接
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'),
    logging: false
});

// 定义用户模型
const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

// 定义课程模型
const Course = sequelize.define('Course', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    code: {
        type: DataTypes.STRING
    },
    teacher: {
        type: DataTypes.STRING,
        allowNull: false
    },
    weekDay: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    startTime: {
        type: DataTypes.STRING,
        allowNull: false
    },
    endTime: {
        type: DataTypes.STRING,
        allowNull: false
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    color: {
        type: DataTypes.STRING,
        defaultValue: '#4a6fa5'
    },
    note: {
        type: DataTypes.TEXT
    }
});

// 定义番茄钟任务模型 - 根据pomodoro-stats.html中的数据结构
const PomodoroTask = sequelize.define('PomodoroTask', {
    taskId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    taskName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    startTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    plannedDuration: {
        type: DataTypes.INTEGER,  // 以秒为单位
        allowNull: false
    },
    actualDuration: {
        type: DataTypes.INTEGER,  // 以秒为单位
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,   // 'completed', 'abandoned'
        defaultValue: 'in-progress'
    },
    isBreakMode: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    remainingSeconds: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    elapsedSeconds: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

// 定义用户统计数据模型 - 用于存储聚合的统计信息
const PomodoroStats = sequelize.define('PomodoroStats', {
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    totalTasks: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    completedTasks: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    abandonedTasks: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    totalFocusTime: {
        type: DataTypes.INTEGER,  // 以秒为单位
        defaultValue: 0
    },
    completionRate: {
        type: DataTypes.FLOAT,    // 百分比
        defaultValue: 0
    }
});

// 定义每周统计数据模型
const WeeklyStats = sequelize.define('WeeklyStats', {
    weekStart: {
        type: DataTypes.DATEONLY,  // 周一的日期
        allowNull: false
    },
    weekEnd: {
        type: DataTypes.DATEONLY,  // 周日的日期
        allowNull: false
    },
    totalTasks: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    completedTasks: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    abandonedTasks: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    totalFocusTime: {
        type: DataTypes.INTEGER,  // 以秒为单位
        defaultValue: 0
    },
    completionRate: {
        type: DataTypes.FLOAT,    // 百分比
        defaultValue: 0
    },
    // 每天的完成率，用于图表显示
    dailyCompletionRates: {
        type: DataTypes.TEXT,     // JSON字符串存储每天的完成率
        defaultValue: '[]'
    }
});

// 定义月度统计数据模型
const MonthlyStats = sequelize.define('MonthlyStats', {
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    month: {
        type: DataTypes.INTEGER,  // 1-12
        allowNull: false
    },
    totalTasks: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    completedTasks: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    abandonedTasks: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    totalFocusTime: {
        type: DataTypes.INTEGER,  // 以秒为单位
        defaultValue: 0
    },
    completionRate: {
        type: DataTypes.FLOAT,    // 百分比
        defaultValue: 0
    },
    // 每天的完成率，用于图表显示
    dailyCompletionRates: {
        type: DataTypes.TEXT,     // JSON字符串存储每天的完成率
        defaultValue: '[]'
    }
});

// 建立用户和课程之间的关系
User.hasMany(Course);
Course.belongsTo(User);

// 建立用户和番茄钟任务之间的关系
User.hasMany(PomodoroTask);
PomodoroTask.belongsTo(User);

// 建立用户和统计数据之间的关系
User.hasMany(PomodoroStats);
PomodoroStats.belongsTo(User);

User.hasMany(WeeklyStats);
WeeklyStats.belongsTo(User);

User.hasMany(MonthlyStats);
MonthlyStats.belongsTo(User);

// 导出模型
module.exports = {
    sequelize,
    User,
    Course,
    PomodoroTask,
    PomodoroStats,
    WeeklyStats,
    MonthlyStats
};