module.exports = function(mongoose, moment, crypto, mail, set) {
    var UserSchema = new mongoose.Schema({
        uid: {
            type: Number,
            default: 0
        },
        email: {
            type: String
        },
        password: {
            type: String
        },
        username: {
            type: String
        },
        islegal: {
            type: Number,
            default: 0 //0 不合法，1 合法
        }
    });
    var User = mongoose.model('user', UserSchema);

    // 判断是否存在
    isHas = function(email, callback) {
        User.findOne({
            email: email
        }, function(err, result) {
            console.log(result);
            if (result == null) {
                callback(true, 0);
            } else {
                if (result.islegal == 1) {
                    callback(false, 0);
                } else {
                    callback(true, 1);
                }
            }
        });
    };

    // 获取新的ID
    getNewId = function(callback) {
        User.find().sort({
            'uid': 'asc'
        }).exec(function(err, users) {
            var newuid = 1;
            if (users.length != 0) {
                newuid = users[users.length - 1].uid + 1;
            }
            callback(newuid);
        });
    };

    /**	
     * register
     * state 0 用户已经存在
     * 1 存入不成功 2 注册成功
     */
    register = function(user, callback) {
        isHas(user.email, function(back, isHadSave) {
            if (back) {
                getNewId(function(newuid) {
                    var shaSum = crypto.createHash('sha256');
                    shaSum.update(user.password);
                    var nowSha = shaSum.digest('hex');
                    var newUser = new User({
                        uid: newuid,
                        email: user.email,
                        password: nowSha,
                        username: user.username,
                        islegal: 0
                    });
                    var newma = buildma(user.email, nowSha);
                    var content = "<h3>你好，我是doc的作者，欢迎来到doc</h3><p>请访问<a href='http://doc.tecclass.cn/callback/" + newma + "'>http://doc.tecclass.cn/callback/" + newma + "</a>确认邮件</p>";
                    var mailOptions = {
                        from: set.auth.user,
                        to: user.email,
                        subject: "确认邮箱",
                        text: content,
                        html: content
                    };

                    var newContent = "<h3>新注册用户</h3><p>注册邮箱：" + user.email + ",注册时间：" + moment().format('MMMM Do YYYY, h:mm:ss a') + ",用户名：" + user.username + "</p>";
                    var newMailOptions = {
                        from: set.auth.user,
                        to: "1225733380@qq.com",
                        subject: "新注册",
                        text: newContent,
                        html: newContent
                    };
                    mail.sendMail(newMailOptions, function(error, response) {

                    });
                    mail.sendMail(mailOptions, function(error, response) {
                        if (error) {
                            console.log("send fail");
                            callback(3, null);
                        } else {
                            console.log("send success");
                            var b = {
                                uid: newuid,
                                email: user.email,
                                username: user.username
                            };
                            if (isHadSave == 0) {
                                newUser.save(function(err) {
                                    if (err) {
                                        callback(1, null);
                                    } else {
                                        callback(2, b);
                                    }
                                });
                            } else {
                                callback(2, b);
                            }
                        }
                    });
                });
            } else {
                callback(0, null);
            }
        });
    };

    // 生成校验码
    buildma = function(email, password) {
        var shaSum = crypto.createHash('sha256');
        var string = email + password + set.cookieSecret;
        shaSum.update(string);
        return shaSum.digest('hex');
    };

    // 确认校验码
    checkMa = function(ma, callback) {
        User.find(function(err, users) {
            var isRight = 0;
            var newemail;
            for (var i = 0; i < users.length; i++) {
                var user = users[i];
                var newma = buildma(user.email, user.password);
                if (newma == ma) {
                    isRight = 1;
                    newemail = user.email;
                    console.log(newemail);
                    updateMa(newemail);
                    break;
                }
            }
            callback(isRight);
        });
    };

    updateMa = function(email) {
        User.update({
            email: email
        }, {
            $set: {
                islegal: 1
            }
        }).exec(function(err) {
            console.log(err);
            if (err) {
                return false;
            } else {
                return true;
            }
        });
    };

    // 登陆判断
    isLoginHas = function(email, password, callback) {
        User.findOne({
            email: email,
            password: password,
            islegal: 1
        }, function(err, result) {
            if (result == null) {
                callback(false, result);
            } else {
                callback(true, result);
            }
        });
    };

    /**
     * login
     * state 0 用户不存在
     * 1 登陆不成功 2 登陆成功
     */
    login = function(user, callback) {
        var shaSum = crypto.createHash('sha256');
        shaSum.update(user.password);
        isLoginHas(user.email, shaSum.digest('hex'), function(state, newuser) {
            if (state) {
                callback(2, newuser);
            } else {
                callback(0, newuser);
            }
        });
    };
    return {
        register: register,
        login: login,
        checkMa: checkMa
    };
};