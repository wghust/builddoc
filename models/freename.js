module.exports = function(mongoose, moment, cheerio, crypto, set) {
    var FnameSchema = new mongoose.Schema({
        uid: {
            type: String
        },
        useruid: {
            type: String
        },
        projectname: {
            type: String // 唯一
        },
        objectname: {
            type: String
        },
        objectdec: {
            type: String
        }
    });
    var Fname = mongoose.model('fname', FnameSchema);

    isHasProjectname = function(projectname, useruid, callback) {
        console.log("2-" + projectname + ":" + useruid);
        Fname.findOne({
            'projectname': projectname,
            'useruid': useruid
        }).exec(function(error, one) {
            console.log(one);
            var state = 0;
            if (one == null) {
                state = 0;
            } else {
                state = 1; //存在
            }
            callback(state);
        });
    };

    createUid = function(projectname) {
        var shaSum = crypto.createHash('sha256');
        var str = projectname + set.cookieSecret;
        shaSum.update(str);
        var newSum = shaSum.digest('hex');
        return newSum;
    };

    /**
    callback: 0 成功，1 已存在，2 保存不成功
    */
    createProjectname = function(projectname, useruid, callback) {
        console.log(projectname + ":" + useruid);
        isHasProjectname(projectname, useruid, function(state) {
            if (state == 1) {
                callback(null, 1);
            } else {
                var newSum = createUid(projectname);
                var fname = new Fname({
                    uid: newSum,
                    useruid: useruid,
                    projectname: projectname
                });
                fname.save(function(err) {
                    if (err) {
                        callback(newSum, 2);
                    } else {
                        callback(newSum, 0);
                    }
                });
            }
        });
    };

    userhasproject = function(useruid, callback) {
        Fname.find({
            useruid: useruid
        }).exec(function(err, results) {
            callback(results);
        });
    };

    getObject = function(uid, projectname, callback) {
        Fname.findOne({
            uid: uid,
            projectname: projectname
        }).exec(function(err, one) {
            callback(one);
        });
    };

    saveObject = function(uid, objectname, callback) {
        console.log(uid + ":" + objectname);
        Fname.update({
            uid: uid
        }, {
            $set: {
                objectname: objectname
            }
        }).exec(function(err) {
            console.log()
            if (err) {
                callback(1);
            } else {
                callback(0);
            }
        });
    };

    getAllObject = function(callback) {
        Fname.find(function(err, Obs) {
            var k = [];
            Obs.forEach(function(one, index) {
                var b;
                b = {
                    uid: one.uid,
                    projectname: one.projectname
                };
                k.push(b);
            });
            callback(k);
        });
    };

    return {
        createProjectname: createProjectname,
        userhasproject: userhasproject,
        getObject: getObject,
        saveObject: saveObject,
        getAllObject: getAllObject
    };
};