module.exports = function(mongoose, moment, marked) {
    var PageSchema = new mongoose.Schema({
        uid: {
            type: Number,
            default: 1
        },
        userid: {
            type: Number
        },
        pagename: {
            type: String
        },
        pagedec: {
            type: String
        }
    });

    var Page = mongoose.model('page', PageSchema);


    getNewPageUid = function(callback) {
        Page.find().sort({
            'uid': 'asc'
        }).exec(function(err, pages) {
            var nowUid = 1;
            if (pages.length != 0) {
                nowUid = pages[pages.length - 1].uid + 1;
            }
            callback(nowUid);
        });
    };

    getPageUserId = function(pageid, callback) {
        Page.findOne({
            'uid': pageid
        }).exec(function(err, page) {
            if (page == null) {
                callback(null);
            } else {
                callback(page.userid);
            }
        });
    };

    // 新建
    addPage = function(userid, page, callback) {
        getNewPageUid(function(uid) {
            var newPage = new Page({
                uid: uid,
                userid: userid,
                pagename: page.pagename,
                pagedec: page.pagedec
            });
            newPage.save(function(err) {
                if (err) {
                    callback(false);
                } else {
                    callback(true);
                }
            });
        });
    };

    getOnePage = function(uid, callback) {
        Page.findOne({
            uid: uid
        }).exec(function(err, page) {
            callback(err, page);
        });
    };

    // 获取所有的文档
    getAllPage = function(userid, callback) {
        Page.find({
            'userid': userid
        }).sort({
            'uid': 'desc'
        }).exec(function(err, pages) {
            if (pages.length == 0) {
                callback(err, null);
            } else {
                callback(err, pages);
            }
        });
    };

    // page update
    updatePage = function(page, callback) {
        Page.update({
            uid: page.uid,
        }, {
            $set: {
                pagename: page.pagename,
                pagedec: page.pagedec
            }
        }).exec(function(err) {
            callback(err);
        });
    };

    // page delete
    deletePage = function(uid, callback) {
        Page.remove({
            uid: uid
        }).exec(function(err) {
            callback(err);
        });
    };

    return {
        addPage: addPage,
        getAllPage: getAllPage,
        getPageUserId: getPageUserId,
        getOnePage: getOnePage,
        updatePage: updatePage,
        deletePage: deletePage
    };
};