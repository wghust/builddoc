module.exports = function(mongoose, moment, crypto, mail, set) {
    /**
     * [CaseSchema 创建mongoose对象]
     * @type {mongoose}
     */
    var CaseSchema = new mongoose.Schema({
        casename: {
            type: String
        },
        founder: {
            userid: Number,
            name: String,
            email: String
        },
        member: [{
            userid: Number,
            name: String,
            email: String
        }],
        date: {
            type: Date,
            default: Date.now
        },
        isFinish: {
            type: Number,
            default: 0
        },
        version: {
            type: String
        },
        panel: {
            type: String
        },
        grade: {
            type: Number,
            default: 3 //三个等级 0 ，1 ，2，3
        },
        modal: {
            type: String,
            default: ""
        },
        page: {
            id: Number,
            name: String
        }
    });
    var Case = mongoose.model('case', CaseSchema);
    var User = mongoose.model('user');

    createCase = function(cases, callback) {
        var newCase = new Case({
            casename: cases.casename,
            founder: cases.founder,
            date: moment().format(),
            grade: cases.grade,
            panel: cases.panel,
            version: cases.version,
            modal: cases.modal,
            page: {
                id: cases.page.id,
                name: cases.page.name
            }
        });
        newCase.save(function(err) {
            console.log(newCase);
            if (err) {
                callback(null, false)
            } else {
                var id = newCase._id;
                callback(id, true);
            }
        });
    };

    updateCase = function(cases, callback) {
        console.log(cases);
        Case.update({
            _id: cases._id
        }, {
            $set: {
                casename: cases.casename,
                grade: cases.grade,
                version: cases.version,
                panel: cases.panel,
                modal: cases.modal,
                page: cases.page
            }
        }).exec(function(err) {
            if (err) {
                callback(false);
            } else {
                callback(true);
            }
        });
    };

    getFounder = function(_id, callback) {
        Case.findOne({
            '_id': _id
        }).exec(function(err, result) {
            callback(result);
        });
    };

    getAllCase = function(founder, callback) {
        Case.find({
            founder: founder
        }).exec(function(err, cases) {
            callback(err, cases);
        });
    };

    sendEmail = function(caseid, email, callback) {
        var string = caseid + set.cookieSecret;
        var ma = buildMa(string);
        var content = "<div style='width:80%;position:relative;margin:0 auto;border: 1px solid #B2B2B2;border-radius:5px;'>" +
            "<div style='background-color:#4A90E2;color:white;padding:5px 10px;'>参与解决bug</div>" +
            "<div style='padding: 5px 10px;word-wrap:break-word;'>" +
            "<h5>点击参与</h5>" +
            "<p>请访问<a href='http://doc.tecclass.cn/case/emailcheck/" + ma + "' style='color:#4A90E2;text-decoration:none;padding:1px 5px;'>http://doc.tecclass.cn/case/emailcheck/" + ma + "</a>确认邮件</p>" +
            "</div>" +
            "</div>";
        var mailOption = {
            from: set.auth.user,
            to: email,
            subject: "邀请参与",
            text: content,
            html: content
        };
        mail.sendMail(mailOption, function(err, response) {
            if (err) {
                console.log("send fail");
                callback(false);
            } else {
                console.log("send success");
                callback(true);
            }
        });
    };

    buildMa = function(string) {
        var shaSum = crypto.createHash('sha256');
        shaSum.update(string);
        return shaSum.digest('hex');
    };

    checkEmail = function(ma, callback) {
        var isMem = false;
        var caseid = "";
        Case.find().exec(function(err, results) {
            for (var i = 0; i < results.length; i++) {
                var string = results[i]._id + set.cookieSecret;
                var newma = buildMa(string);
                if (newma == ma) {
                    isMem = true;
                    caseid = results[i]._id;
                    break;
                }
            }
            callback(isMem, caseid);
        });
    };

    addMem = function(user, caseid, callback) {
        Case.findOne({
            '_id': caseid
        }).exec(function(err, result) {
            if (result == null) {
                callback(0);
            } else {
                var mem = [];
                var isHas = false;
                mem = result.member;
                for (var i = 0; i < mem.length; i++) {
                    if (mem[i].userid == user.uid && mem[i].name == user.name && mem[i].email == user.email) {
                        isHas = true;
                        break;
                    }
                }
                if (isHas == false) {
                    if (result.founder == user.uid) {
                        isHas = true;
                    }
                }
                if (isHas == false) {
                    var newMem = {
                        userid: user.uid,
                        name: user.name,
                        email: user.email
                    };
                    result.member.push(newMem);
                    Case.update({
                        '_id': caseid
                    }, {
                        $set: {
                            member: result.member
                        }
                    }).exec(function(err) {
                        callback(1);
                    });
                } else {
                    callback(2);
                }
            }
        });
    };

    return {
        createCase: createCase,
        getFounder: getFounder,
        getAllCase: getAllCase,
        sendEmail: sendEmail,
        checkEmail: checkEmail,
        addMem: addMem,
        updateCase: updateCase
    };
};