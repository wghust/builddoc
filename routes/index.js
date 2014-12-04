var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var moment = require('moment');
var marked = require('marked');
var cheerio = require('cheerio');
var s = require('../settings');
// console.log(settings);
mongoose.connect("mongodb://" + s.host + ":" + s.port + "/" + s.db, function onMongooseError(err) {
    if (err) {
        throw err;
    }
});

// 模块
var models = {
    Cat: require("../models/cat.js")(mongoose, moment),
    Block: require("../models/block.js")(mongoose, moment, marked, cheerio)
};

/* GET home page. */
router.get('/', function(req, res) {
    res.redirect('/index');
});
router.get('/index', function(req, res) {
    models.Block.makeIndexBlock(function(err, blocks) {
        res.render('doc', {
            title: '文档',
            blocks: blocks
        });
    });
});
router.get('/block/add', function(req, res) {
    models.Cat.getAllCat(function(err, cats) {
        res.render('addblock', {
            title: '添加块',
            cats: cats
        });
    });
});

// 保存栏目
router.post('/doc/savecat', function(req, res) {
    var newCat = {
        catname: req.param('catname'),
        catdec: req.param('catdec')
    };
    models.Cat.insertCat(newCat, function(cat, state) {
        var b = {
            cat: cat,
            state: state
        };
        res.end(JSON.stringify(b));
    });
});


// 删除栏目
router.post('/doc/deletecat', function(req, res) {
    var catid = req.param('catid');
    models.Cat.deleteCat(catid, function(state) {
        var b = {
            state: state
        };
        res.end(JSON.stringify(b));
    });
});

// 编辑栏目
router.post('/doc/editcat', function(req, res) {
    var newCat = {
        catid: req.param('catid'),
        catname: req.param('catname'),
        catdec: req.param('catdec')
    };
    models.Cat.editCat(newCat, function(state) {
        var b = {
            state: state,
            cat: newCat
        };
        res.end(JSON.stringify(b));
    });
});

// 保存文档
router.post('/doc/savecon', function(req, res) {
    var block = req.param('block');
    models.Block.saveOneBlock(block, function(nowuid, state) {
        var back = {
            nowuid: nowuid,
            state: state
        };
        res.end(JSON.stringify(back));
    });
});

// 更新文档
router.post('/doc/updatecon', function(req, res) {
    var block = req.param('block');
    models.Block.updateOneBlock(block, function(nowuid, state) {
        var back = {
            nowuid: nowuid,
            state: state
        };
        res.end(JSON.stringify(back));
    });
});


// one block
router.get('/block/:uid', function(req, res) {
    var uid = req.param('uid');
    models.Block.getOneBlock(uid, function(block, state) {
        res.render('block', {
            title: 'Block',
            block: block,
            state: state
        });
    });
});

// 编辑
router.get('/block/:uid/edit', function(req, res) {
    var uid = req.param('uid');
    // console.log(uid);
    models.Block.getOneBlockMark(uid, function(block, state) {
        models.Cat.getAllCat(function(err, cats) {
            res.render('edit', {
                title: '编辑',
                cats: cats,
                block: block
            });
        });
    });
});

// 删除
router.get('/block/:uid/delete', function(req, res) {
    var uid = req.param('uid');
    models.Block.deleteOneBlock(uid, function(state) {
        var msg = "";
        if (state == 0) {
            msg = "删除不成功";
        } else {
            msg = "删除成功";
        }
        res.render('delete', {
            title: '删除',
            msg: msg
        });
    });
});

// 404
router.get('*', function(req, res) {
    res.render('404', {
        'title': '404'
    });
});

module.exports = router;