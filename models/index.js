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

// 建立用户和课程之间的关系
User.hasMany(Course);
Course.belongsTo(User);

// 导出模型
module.exports = {
    sequelize,
    User,
    Course
};