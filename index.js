const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const config = require('config-lite')(__dirname);
const routes = require('./routes');
const pkg = require('./package');
const winston = require('winston');
const expressWinston = require('express-winston');

const app = express();
// 设置模版目录
app.set('views', path.join(__dirname, 'views'));
// 设置模版引擎 ejs
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(function (err, req, res, next) {
    console.error(err);
    req.flash('error', err.message);
    res.redirect('/posts');
})
app.use(session({
    name: config.session.key,
    secret: config.session.secret,
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge: config.session.maxAge
    },
    store: new MongoStore({
        url: config.mongodb
    })
}));
app.use(require('express-formidable')({
    uploadDir: path.join(__dirname, 'public/img'),
    keepExtensions: true
}));
app.use(flash());
app.locals.blog = {
    title: pkg.name,
    description: pkg.description
};
app.use(function (req, res, next) {
    res.locals.user = req.session.user;
    res.locals.success = req.flash('success').toString();
    res.locals.error = req.flash('error').toString();
    next();
});
// 正常请求的日志
app.use(expressWinston.logger({
    transports: [
        new (winston.transports.Console)({
            json: true,
            colorize: true
        }),
        new winston.transports.File({
            filename: 'logs/success.log'
        })
    ]
}));
routes(app);
// 错误请求的日志
app.use(expressWinston.errorLogger({
    transports: [
        new winston.transports.Console({
            json: true,
            colorize: true
        }),
        new winston.transports.File({
            filename: 'log/error.log'
        })
    ]
}));
if (module.parent) {
    module.exports = app;
} else {
    app.listen(config.port, function () {
        console.log(`${pkg.name} listening on port ${config.port}`)
    })
}

