// 认证中间件
// 检查用户是否已登录，并将用户ID添加到请求对象中
const auth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: '未登录' });
    }
    
    // 将用户ID添加到req.user对象中，以便在路由处理程序中使用
    req.user = { id: req.session.userId };
    
    next();
};

module.exports = auth;