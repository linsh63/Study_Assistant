const mongoose = require('mongoose');

const pomodoroTaskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    clientId: {
        type: String,
        index: true
    },
    taskName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['completed', 'abandoned', 'reset', 'in_progress'],
        default: 'in_progress'
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date
    },
    plannedDuration: {
        type: Number,  // 计划持续时间（秒）
        required: true
    },
    actualDuration: {
        type: Number   // 实际持续时间（秒）
    },
    isBreakMode: {
        type: Boolean,
        default: false
    },
    tags: [String],
    notes: String,
    synced: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// 创建复合索引以提高查询性能
pomodoroTaskSchema.index({ userId: 1, startTime: -1 });

const PomodoroTask = mongoose.model('PomodoroTask', pomodoroTaskSchema);

module.exports = PomodoroTask;