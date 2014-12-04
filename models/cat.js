module.exports = function(mongoose, moment) {
    var CatSchema = new mongoose.Schema({
        catid: {
            type: Number,
            default: 1
        },
        catname: {
            type: String
        },
        catdec: {
            type: String,
            default: ""
        }
    });

    var Cat = mongoose.model('cat', CatSchema);

    // 判断是否有这个栏目
    isHasCat = function(catname, callback) {
        Cat.find({
            'catname': catname
        }, function(err, cats) {
            if (cats.length == 0) {
                callback(true);
            } else {
                callback(false);
            }
        });
    };

    // 获取新的id
    getNewId = function(callback) {
        Cat.find().sort({
            catid: 'asc'
        }).exec(function(err, cats) {
            var newid = 1;
            if (cats.length != 0) {
                newid = cats[cats.length - 1].catid + 1;
            }
            callback(newid);
        });
    };

    // 插入新的栏目
    insertCat = function(cat, callback) {
        isHasCat(cat.catname, function(ishas) {
            if (!ishas) {
                callback(null, false);
            } else {
                getNewId(function(newid) {
                    var newCat = new Cat({
                        catid: newid,
                        catname: cat.catname,
                        catdec: cat.catdec
                    });
                    newCat.save(function(err) {
                        if (err) {
                            callback(null, false);
                        } else {
                            callback(newCat, true);
                        }
                    });
                });
            }
        });
    };

    // 编辑栏目
    editCat = function(cat, callback) {
        Cat.update({
            'catid': cat.catid
        }, {
            $set: {
                'catname': cat.catname,
                'catdec': cat.catdec
            }
        }, function(err) {
            if (err) {
                callback(1);
            } else {
                callback(0);
            }
        });
    };

    // 获取所有的栏目
    getAllCat = function(callback) {
        Cat.find().sort({
            catid: "asc"
        }).exec(function(err, cats) {
            if (err) {
                callback(err, null);
            } else {
                callback(err, cats);
            }
        });
    };

    // 删除栏目
    deleteCat = function(catid, callback) {
        Cat.remove({
            catid: catid
        }, function(err) {
            if (err) {
                callback(1);
            } else {
                callback(0);
            }
        });
    }

    return {
        insertCat: insertCat,
        getAllCat: getAllCat,
        deleteCat: deleteCat,
        editCat: editCat
    };
};