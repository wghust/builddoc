var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var moment = require('moment');
var marked = require('marked');
var cheerio = require('cheerio');
var crypto = require('crypto');
var mail = require('nodemailer');
var s = require('../settings');
var qn = require('qn');
var http = require('http');
var fs = require('fs');
require('oneapm');
// console.log(settings);
mongoose.connect("mongodb://" + s.host + ":" + s.port + "/" + s.db, function onMongooseError(err) {
    if (err) {
        throw err;
    }
});

// qn
var client = qn.create({
    accessKey: s.qiniu.ACCESS_KEY,
    secretKey: s.qiniu.SECRET_KEY,
    bucket: s.qiniu.Bucket_Name,
    domain: s.qiniu.Domain
});

// email
var smtpTransport = mail.createTransport({
    service: s.service,
    auth: {
        user: s.auth.user,
        pass: s.auth.pass
    }
});

// 模块
var models = {
    Cat: require("../models/cat.js")(mongoose, moment),
    Block: require("../models/block.js")(mongoose, moment, marked, cheerio),
    User: require("../models/user.js")(mongoose, moment, crypto, smtpTransport, s),
    Page: require("../models/page.js")(mongoose, moment, marked),
    Back: require("../models/backup.js")(mongoose, moment, s),
    Free: require("../models/freename.js")(mongoose, moment, cheerio, crypto, s),
    Case: require("../models/case.js")(mongoose, moment, crypto, smtpTransport, s),
    Bug: require("../models/bug.js")(mongoose, moment, smtpTransport, s)
};

/* GET home page. */


router.get('/', function(req, res) {
    // res.render("index", {
    //     title: 'index'
    // });
    res.redirect('/show');
});

router.get('/show', function(req, res) {
    models.Page.getIndexPage(0, function(err, pages) {
        models.Page.getHotPage(function(hotpage) {
            res.render("index", {
                title: 'index',
                pages: pages,
                tag: 0,
                hotpage: hotpage
            });
        });
    });
});
router.get('/show/:tag', function(req, res) {
    var tag = req.param('tag');
    models.Page.getIndexPage(tag, function(err, pages) {
        models.Page.getHotPage(function(hotpage) {
            res.render("index", {
                title: 'index',
                pages: pages,
                tag: tag,
                hotpage: hotpage
            });
        });
    });
});

// 注册
router.get('/admin/register', function(req, res) {
    if (req.session.loggedIn != true) {
        res.render('reg', {
            'title': 'register'
        });
    } else {
        res.redirect('/page/index');
    }
});

// 登陆
router.get('/admin/login', function(req, res) {
    // console.log(req.session.user);
    if (req.session.loggedIn != true) {
        res.render('login', {
            'title': 'login'
        });
    } else {
        res.redirect('/');
    }
});

// 退出
router.get('/admin/logout', function(req, res) {
    req.session.loggedIn = false;
    req.session.user = null;
    res.redirect(req.headers.referer);
});

// 登陆判断
router.post('/admin/logincheck', function(req, res) {
    var email = req.param('email');
    var password = req.param('password');
    var user = {
        email: email,
        password: password
    };
    models.User.login(user, function(state, okuser) {
        if (state == 2) {
            req.session.loggedIn = true;
            req.session.user = okuser;
            console.log(req.session.user);
        }
        var b = {
            state: state
        };
        res.end(JSON.stringify(b));
    });
});

// 注册判断
router.post('/admin/regcheck', function(req, res) {
    var email = req.param('email');
    var password = req.param('password');
    var username = req.param('username');
    var user = {
        email: email,
        password: password,
        username: username
    };
    models.User.register(user, function(state, okuser) {
        // if (state == 2) {
        // req.session.loggedIn = true;
        // req.session.user = okuser;
        // console.log(req.session.user);
        // res.redirect('/callback/show');
        // }
        var b = {
            state: state
        };
        res.end(JSON.stringify(b));
    });
});

// 注册成功提示查看邮箱
router.get('/callback/show', function(req, res) {
    res.render('promit', {
        title: '提示'
    });
});

// 邮件确认
router.get('/callback/:ma', function(req, res) {
    var ma = req.param('ma');
    models.User.checkMa(ma, function(state) {
        var isOk = 0;
        if (state == 1) {
            isOk = 1;
        }
        res.render('macheck', {
            'title': '确认',
            'isOk': isOk
        });
    });
});


// 控制面板
router.get('/admin/index', function(req, res) {
    if (req.session.loggedIn) {
        models.Page.getAllPage(req.session.user.uid, function(err, pages) {
            var thisfounder = {
                userid: req.session.user.uid,
                name: req.session.user.username,
                email: req.session.user.email
            };
            models.Case.getAllCase(thisfounder, function(err, cases) {
                res.render('panel', {
                    title: '控制台',
                    pages: pages,
                    cases: cases
                });
            });
        });
    } else {
        res.redirect('/admin/login');
    }

});

// 文档首页
router.get('/page/:id/index', function(req, res) {
    var pageid = req.param('id');
    models.Block.makeIndexBlock(pageid, function(err, blocks) {
        models.Page.getPageUserId(pageid, function(userid, pageys) {
            if (pageys == 1) {
                if (req.session.loggedIn) {
                    if (req.session.user.uid != userid) {
                        res.redirect('/show');
                    }
                } else {
                    res.redirect('/show');
                }
            }
            if (userid == null) {
                res.redirect('/admin/index');
            } else {
                models.Page.addPageView(pageid, function(err) {
                    res.render('doc', {
                        title: '文档',
                        pageid: pageid,
                        blocks: blocks,
                        userid: userid
                    });
                });
            }
        });
    });
})
router.get('/page/add', function(req, res) {
    if (req.session.loggedIn) {
        res.render('addpage', {
            title: 'Add Page'
        });
    } else {
        res.redirect('/admin/login');
    }
});
router.post('/page/add', function(req, res) {
    if (req.session.loggedIn) {
        var page = {
            pagename: req.param('pagename'),
            pagedec: req.param('pagedec'),
            pagetag: req.param('pagetag'),
            pagetagValue: req.param('pagetagValue'),
            pageys: req.param('pageys')
        };
        models.Page.addPage(req.session.user, page, function(state) {
            var b = {
                state: 0
            };
            if (state) {
                b.state = 1;
            } else {
                b.state = 0;
            }
            res.end(JSON.stringify(b));
        });
    } else {
        var b = {
            state: 0
        };
        res.end(JSON.stringify(b));
    }
});

router.get('/page/:id/edit', function(req, res) {
    var pageid = req.param('id');
    if (req.session.loggedIn) {
        models.Page.getPageUserId(pageid, function(userid, pageys) {
            if (req.session.user.uid == userid) {
                models.Page.getOnePage(pageid, function(err, page) {
                    res.render('pageedit', {
                        title: 'EDIT',
                        pageid: pageid,
                        userid: userid,
                        page: page
                    });
                });
            } else {
                res.redirect('/admin/index');
            }
        });
    } else {
        res.redirect('/admin/login');
    }
});

router.post('/page/save', function(req, res) {
    var page = req.param('page');
    // console.log(page);
    if (req.session.loggedIn) {
        models.Page.updatePage(page, function(err) {
            var b = {
                state: 0,
            };
            if (err) {
                b.state = 0;
            } else {
                b.state = 1;
            }
            res.end(JSON.stringify(b));
        });
    } else {
        var b = {
            state: 0
        };
        res.end(JSON.stringify(b));
    }
});

router.get('/page/:uid/delete', function(req, res) {
    var pageid = req.param('uid');
    if (req.session.loggedIn) {
        models.Page.getPageUserId(pageid, function(userid, pageys) {
            if (req.session.user.uid == userid) {
                models.Page.deletePage(pageid, function(err) {
                    models.Cat.deleteCatByPageId(pageid, function(state_1) {
                        models.Block.deleteBlockByPageId(pageid, function(state_2) {
                            var msg = ""
                            if (state_2 == 0) {
                                msg = "删除失败";
                            } else {
                                msg = "删除成功";
                            }
                            res.render('deletepage', {
                                'title': '删除',
                                'msg': msg
                            });
                        });
                    });
                });
            } else {
                res.redirect('/admin/index');
            }
        });
    } else {
        res.redirect('/admin/login');
    }
});

// 保存栏目
router.post('/doc/savecat', function(req, res) {
    if (req.session.loggedIn) {
        var newCat = {
            catname: req.param('catname'),
            catdec: req.param('catdec'),
            pageid: req.param('pageid')
        };
        models.Cat.insertCat(newCat, function(cat, state) {
            var b = {
                cat: cat,
                state: state
            };
            res.end(JSON.stringify(b));
        });
    } else {
        var b = {
            cat: "",
            state: false
        };
        res.end(JSON.stringify(b));
    }
});


// 删除栏目
router.post('/doc/deletecat', function(req, res) {
    var catid = req.param('catid');
    if (req.session.loggedIn) {
        models.Cat.deleteCat(catid, function(state) {
            var b = {
                state: state
            };
            res.end(JSON.stringify(b));
        });
    } else {
        var b = {
            state: 1
        };
        res.end(JSON.stringify(b));
    }
});

// 编辑栏目
router.post('/doc/editcat', function(req, res) {
    var newCat = {
        catid: req.param('catid'),
        catname: req.param('catname'),
        catdec: req.param('catdec')
    };
    if (req.session.loggedIn) {
        models.Cat.editCat(newCat, function(state) {
            models.Block.editBlockCat(newCat, function(state_2) {
                var b = {
                    state: state_2,
                    cat: newCat
                };
                res.end(JSON.stringify(b));
            });
        });
    } else {
        var b = {
            state: 1,
            cat: null
        };
        res.end(JSON.stringify(b));
    }
});

// 保存文档
router.post('/doc/savecon', function(req, res) {
    var block = req.param('block');
    if (req.session.loggedIn) {
        models.Block.saveOneBlock(block, function(nowpageid, nowuid, state) {
            var back = {
                nowpageid: nowpageid,
                nowuid: nowuid,
                state: state
            };
            res.end(JSON.stringify(back));
        });
    } else {
        var back = {
            nowpageid: 0,
            nowuid: 0,
            state: 0
        };
        res.end(JSON.stringify(back));
    }
});

// 更新文档
router.post('/doc/updatecon', function(req, res) {
    var block = req.param('block');
    if (req.session.loggedIn) {
        models.Block.updateOneBlock(block, function(nowpageid, nowuid, state) {
            var back = {
                nowpageid: nowpageid,
                nowuid: nowuid,
                state: state
            };
            res.end(JSON.stringify(back));
        });
    } else {
        var back = {
            nowpageid: -1,
            nowuid: -1,
            state: 0
        };
        res.end(JSON.stringify(back));
    }
});


// 添加块
router.get('/block/:id/add', function(req, res) {
    if (req.session.loggedIn) {
        var pageid = req.param('id');
        getPageUserId(pageid, function(userid, pageys) {
            if (req.session.user.uid == userid) {
                models.Cat.getAllCat(pageid, function(err, cats) {
                    res.render('addblock', {
                        title: '添加块',
                        pageid: pageid,
                        cats: cats,
                        userid: userid
                    });
                });
            } else {
                res.redirect('/admin/login');
            }
        });
    } else {
        res.redirect('/admin/login');
    }
});

// one block
router.get('/block/:id/:uid', function(req, res) {
    var uid = req.param('uid');
    var pageid = req.param('id');
    getPageUserId(pageid, function(userid, pageys) {
        if (pageys == 1) {
            if (req.session.loggedIn) {
                if (req.session.user.uid != userid) {
                    res.redirect('/show');
                }
            } else {
                res.redirect('/show');
            }
        }
        models.Block.getOneBlock(uid, function(block, state) {
            res.render('block', {
                title: 'Block',
                block: block,
                pageid: pageid,
                state: state,
                userid: userid
            });
        });
    });
});

// 编辑
router.get('/block/:id/:uid/edit', function(req, res) {
    var pageid = req.param('id');
    var uid = req.param('uid');
    // console.log(uid);
    if (req.session.loggedIn) {
        models.Page.getPageUserId(pageid, function(userid, pageys) {
            if (req.session.user.uid == userid) {
                models.Block.getOneBlockMark(uid, function(block, state) {
                    models.Cat.getAllCat(pageid, function(err, cats) {
                        res.render('edit', {
                            title: '编辑',
                            cats: cats,
                            pageid: pageid,
                            block: block,
                            userid: userid
                        });
                    });
                });
            } else {
                res.redirect('/');
            }
        });
    } else {
        res.redirect('/');
    }
});

// 删除
router.get('/block/:id/:uid/delete', function(req, res) {
    var uid = req.param('uid');
    var pageid = req.param('id');
    if (req.session.loggedIn) {
        models.Page.getPageUserId(pageid, function(userid, pageys) {
            if (req.session.user.uid == userid) {
                models.Block.deleteOneBlock(uid, function(state) {
                    var msg = "";
                    if (state == 0) {
                        msg = "删除不成功";
                    } else {
                        msg = "删除成功";
                    }
                    res.render('delete', {
                        title: '删除',
                        msg: msg,
                        pageid: pageid,
                        userid: userid
                    });
                });
            } else {
                res.render('delete', {
                    title: '删除',
                    msg: '删除不成功',
                    pageid: pageid,
                    userid: userid
                });
            }
        });
    } else {
        res.render('delete', {
            title: '删除',
            msg: "删除不成功",
            pageid: pageid
        });
    }
});

router.get('/back', function(req, res) {
    models.Back.backup(function(pages) {
        pages.forEach(function(one, index) {
            console.log(one.uid + '\n');
        });
        res.render('back', {});
    });
});


router.get('/project/addprojectname', function(req, res) {
    if (req.session.loggedIn) {
        models.Free.userhasproject(req.session.user.uid, function(ps) {
            var projectname = [];
            if (ps.length != 0) {
                projectname = ps;
            }
            res.render('addProject', {
                title: '添加项目',
                projectname: projectname
            });
        });
    } else {
        res.redirect('/admin/login');
    }
});

router.post('/project/addOne', function(req, res) {
    var projectname = req.param('projectname');
    var back = {
        state: 0,
        uid: ""
    };
    if (req.session.loggedIn) {
        models.Free.createProjectname(projectname, req.session.user.uid, function(uid, state) {
            back = {
                state: state,
                uid: uid
            }
            res.end(JSON.stringify(back));
        });
    } else {
        back = {
            state: 2,
            uid: ""
        };
        res.end(JSON.stringify(back));
    }
});

router.post('/project/getObject', function(req, res) {
    var projectname = req.param('projectname');
    var uid = req.param('uid');
    models.Free.getObject(uid, projectname, function(objects) {
        var back = {
            objects: objects
        };
        res.end(JSON.stringify(back));
    });
});

router.post('/project/save', function(req, res) {
    var uid = req.param('uid');
    var objectname = req.param('objectname');
    models.Free.saveObject(uid, objectname, function(state) {
        var back = {
            state: state
        };
        res.end(JSON.stringify(back));
    });
});


router.get('/project/luck', function(req, res) {
    models.Free.getAllObject(function(obs) {
        res.render('luckyobject', {
            title: '开心选对象',
            obs: obs
        });
    });
});

router.get('/case/add', function(req, res) {
    if (req.session.loggedIn) {
        models.Page.getAllPage(req.session.user.uid, function(err, pages) {
            res.render('addcase', {
                title: '添加案例',
                pages: pages
            });
        });
    } else {
        res.redirect('/admin/login');
    }
});

router.post('/case/add', function(req, res) {
    var newCase = {
        casename: req.param('casename'),
        founder: {
            userid: req.session.user.uid,
            name: req.session.user.username,
            email: req.session.user.email
        },
        grade: req.param('grade'),
        version: req.param('version'),
        panel: req.param('panel'),
        modal: req.param('modal'),
        page: req.param('page')
    };
    models.Case.createCase(newCase, function(id, state) {
        var back = {
            id: id,
            state: state,
            url: "/case/" + id + "/p/add"
        };
        res.end(JSON.stringify(back));
    });
});

router.post('/case/update', function(req, res) {
    var newCase = {
        _id: req.param('_id'),
        casename: req.param('casename'),
        founder: {
            userid: req.session.user.uid,
            name: req.session.user.username,
            email: req.session.user.email
        },
        grade: req.param('grade'),
        version: req.param('version'),
        panel: req.param('panel'),
        modal: req.param('modal'),
        page: req.param('page')
    };
    models.Case.updateCase(newCase, function(state) {
        var back = {
            state: state,
            url: "/case/" + newCase._id + "/list"
        };
        res.end(JSON.stringify(back));
    });
});

router.get('/case/:caseid/one', function(req, res) {
    var caseid = req.param('caseid');
    if (req.session.loggedIn) {
        models.Case.getFounder(caseid, function(result) {
            if ((result.founder.userid != req.session.user.uid) && (isMember(req.session.user.uid, result.member) == false)) {
                res.redirect('/show');
            } else {
                models.Page.getAllPage(req.session.user.uid, function(err, pages) {
                    res.render('editcase', {
                        title: '修改案例',
                        onecase: result,
                        pages: pages
                    });
                });
            }
        });
    } else {
        res.redirect('/admin/login');
    }
});

router.get('/case/:id/p/add', function(req, res) {
    var _id = req.param('id');
    if (req.session.loggedIn) {
        models.Case.getFounder(_id, function(result) {
            if (req.session.user.uid != result.founder.userid) {
                res.redirect('/show');
            } else {
                res.render('addmember', {
                    title: '添加团队',
                    onecase: result
                });
            }
        });
    } else {
        res.redirect('/admin/login');
    }
});

router.post('/case/sendmail', function(req, res) {
    var email = req.param("email");
    var id = req.param("caseid");
    models.Case.sendEmail(id, email, function(state) {
        var back = {
            state: state
        };
        res.end(JSON.stringify(back));
    });
});

router.get('/case/emailcheck/:ma', function(req, res) {
    var ma = req.param('ma');
    if (req.session.loggedIn) {
        models.Case.checkEmail(ma, function(isMem, caseid) {
            if (isMem == true) {
                var newUser = {
                    uid: req.session.user.uid,
                    name: req.session.user.username,
                    email: req.session.user.email
                };
                models.Case.addMem(newUser, caseid, function(state) {
                    res.render('casecheck', {
                        title: '邮件确认',
                        isMem: true,
                        state: state,
                        caseid: caseid
                    });
                });
            } else {
                res.render('casecheck', {
                    title: '邮件确认',
                    isMem: true,
                    state: state,
                    caseid: caseid
                });
            }
        });
    } else {
        res.redirect('/admin/login');
    }
});

router.get('/case/:caseid/list', function(req, res) {
    var _id = req.param('caseid');
    if (req.session.loggedIn) {
        models.Case.getFounder(_id, function(onecase) {
            if ((onecase.founder.userid != req.session.user.uid) && (isMember(req.session.user.uid, onecase.member) == false)) {
                res.redirect('/admin/index');
            } else {
                models.Bug.getAllBug(_id, function(err, bugs) {
                    res.render('caselist', {
                        title: 'BUG列表',
                        onecase: onecase,
                        bugs: bugs
                    });
                });
            }
        });
    } else {
        res.redirect('/admin/login');
    }
});

function isMember(uid, arr) {
    var isMem = false;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].userid == uid) {
            isMem = true;
            break;
        }
    }
    return isMem;
}

router.get('/case/:caseid/add', function(req, res) {
    var _id = req.param('caseid');
    if (req.session.loggedIn) {
        models.Case.getFounder(_id, function(onecase) {
            if ((onecase.founder.userid != req.session.user.uid) && (isMember(req.session.user.uid, onecase.member) == false)) {
                res.redirect('/admin/index');
            } else {
                res.render('addbug', {
                    title: '添加BUG',
                    onecase: onecase,
                });
            }
        });
    } else {
        res.redirect('/admin/login');
    }
});

router.post('/case/bugimage/add', function(req, res) {
    var imageData = req.param('imageData');
    var caseid = req.param('caseid');
    var imageName = req.param('imageName');
    imageData = imageData.replace(/^data:image\/\w+;base64,/, "");
    var dataBuffer = new Buffer(imageData, 'base64');
    client.upload(dataBuffer, {
        key: imageName
    }, function(err, result) {
        if (err) {
            res.json({
                state: false,
                imgname: imageName,
                imgurl: "",
                imghash: ""
            });
        } else {
            res.json({
                state: true,
                imgname: result.key,
                imgurl: result.url,
                imghash: result.hash
            });
        }
    });
});

router.post('/case/bug/add', function(req, res) {
    if (req.session.loggedIn) {
        var newbug = {
            caseid: req.param('caseid'),
            content: req.param('content'),
            images: req.param('images'),
            author: {
                userid: req.session.user.uid,
                name: req.session.user.username,
                email: req.session.user.email
            },
            grade: req.param('grade'),
            term: req.param('term'),
            step: req.param('step'),
            result: req.param('result'),
            trueresult: req.param('trueresult'),
            rate: req.param('rate')
        };
        models.Bug.addBug(newbug, function(bugid, state) {
            if (state == true) {
                res.json({
                    bugid: bugid,
                    state: state
                });
            } else {
                res.json({
                    bugid: -1,
                    state: state
                });
            }
        });
    } else {
        res.json({
            bugid: -1,
            state: false
        });
    }
});

router.post('/case/bug/update', function(req, res) {
    if (req.session.loggedIn) {
        var newbug = {
            _id: req.param('_id'),
            caseid: req.param('caseid'),
            content: req.param('content'),
            images: req.param('images'),
            author: {
                userid: req.session.user.uid,
                name: req.session.user.username,
                email: req.session.user.email
            },
            grade: req.param('grade'),
            term: req.param('term'),
            step: req.param('step'),
            result: req.param('result'),
            trueresult: req.param('trueresult'),
            rate: req.param('rate')
        };
        console.log(typeof newbug.grade);
        models.Bug.updateBug(newbug, function(bugid, state) {
            if (state == true) {
                res.json({
                    bugid: bugid,
                    state: state
                });
            } else {
                res.json({
                    bugid: -1,
                    state: state
                });
            }
        });
    } else {
        res.json({
            bugid: -1,
            state: false
        });
    }
});

router.get('/case/:caseid/:bugid/one', function(req, res) {
    var _id = req.param('caseid');
    var bug_id = req.param('bugid');
    if (req.session.loggedIn) {
        models.Case.getFounder(_id, function(onecase) {
            if ((onecase.founder.userid != req.session.user.uid) && (isMember(req.session.user.uid, onecase.member) == false)) {
                res.redirect('/admin/index');
            } else {
                models.Bug.getOneBug(bug_id, function(err, onebug) {
                    res.render('onebug', {
                        title: 'BUG列表',
                        onecase: onecase,
                        onebug: onebug
                    });
                });
            }
        });
    } else {
        res.redirect('/admin/login');
    }
});

// 404
router.get('*', function(req, res) {
    res.render('404', {
        'title': '404'
    });
});

module.exports = router;