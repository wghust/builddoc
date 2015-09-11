module.exports = function(mongoose, moment, mail, set) {

    /**
     * [BugSchema 定义mongoose对象]
     * @type {mongoose}
     */
    var BugSchema = new mongoose.Schema({
        caseid: {
            type: String
        },
        content: {
            type: String
        },
        author: {
            userid: Number,
            name: String,
            email: String
        },
        state: {
            type: Number, // 0: 未解决 1: 待确认 2: 已确认
            default: 0
        },
        grade: {
            type: Number,
            default: 3
        },
        date: {
            type: Date
        },
        images: [{
            name: String,
            url: String,
            hash: String
        }],
        term: {
            type: String,
            default: ""
        },
        step: {
            type: String,
            default: ""
        },
        result: {
            type: String,
            default: ""
        },
        trueresult: {
            type: String,
            default: ""
        },
        rate: {
            type: Number,
            default: 2
        }
    });

    var Bug = mongoose.model('bug', BugSchema);

    /**
     * [addBug 添加bug]
     * @param {[type]}   bug      [错误]
     * @param {Function} callback [返回参数]
     */
    addBug = function(bug, callback) {
        var newBug = new Bug({
            caseid: bug.caseid,
            content: bug.content,
            author: bug.author,
            date: moment().format(),
            images: bug.images,
            grade: bug.grade,
            term: bug.term,
            step: bug.step,
            result: bug.result,
            trueresult: bug.trueresult,
            rate: bug.rate
        });
        newBug.save(function(err) {
            if (err) {
                callback(null, false);
            } else {
                callback(newBug._id, true);
            }
        });
    };

    updateBug = function(bug, callback) {
        console.log(bug);
        Bug.update({
            '_id': bug._id
        }, {
            $set: {
                content: bug.content,
                images: bug.images,
                grade: bug.grade,
                term: bug.term,
                step: bug.step,
                result: bug.result,
                trueresult: bug.trueresult,
                rate: bug.rate
            }
        }).exec(function(err) {
            if (err) {
                callback(null, false);
            } else {
                callback(bug._id, true);
            }
        });
    };

    /**
     * [getAllBug get all the Bug]
     * @param  {[type]}   caseid   [description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    getAllBug = function(caseid, callback) {
        Bug.find({
            'caseid': caseid
        }).exec(function(err, bugs) {
            var allbugs = [];
            bugs.forEach(function(one, index) {
                var s;
                s = {
                    _id: one._id,
                    content: one.content,
                    author: one.author,
                    state: one.state,
                    grade: one.grade,
                    date: moment(one.date).format('YYYY-MM-DD HH:mm:ss'),
                    images: one.images,
                    term: one.term,
                    step: one.step,
                    result: one.result,
                    trueresult: one.trueresult,
                    rate: one.rate
                };
                allbugs.push(s);
            });

            callback(err, allbugs);
        });
    };

    /**
     * [getOneBug description]
     * @param  {[type]}   bugid    [description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    getOneBug = function(bugid, callback) {
        Bug.findOne({
            _id: bugid
        }).exec(function(err, bug) {
            var onebug;
            if (bug != null) {
                onebug = {
                    _id: bug._id,
                    content: bug.content,
                    author: bug.author,
                    state: bug.state,
                    grade: bug.grade,
                    date: moment(bug.date).format('YYYY-MM-DD HH:mm:ss'),
                    images: bug.images,
                    term: bug.term,
                    step: bug.step,
                    result: bug.result,
                    trueresult: bug.trueresult,
                    rate: bug.rate
                };
            }
            callback(err, onebug);
        });
    };

    /**
     * [waitForConform description]
     * @param  {[type]}   caseid   [description]
     * @param  {[type]}   _id      [description]
     * @param  {Function} callback [description]
     * @return {[type]}            [description]
     */
    waitForConform = function(caseid, _id, callback) {
        Bug.update({
            caseid: caseid,
            _id: _id
        }, {
            $set: {
                state: 1
            }
        }).exec(function(err) {
            if (err) {
                callback(false);
            } else {
                callback(true);
            }
        });
    };

    /**
     * [setBugSolve description]
     * @param {[type]}   userid   [description]
     * @param {[type]}   caseid   [description]
     * @param {[type]}   _id      [description]
     * @param {Function} callback [description]
     */
    setBugSolve = function(userid, caseid, _id, callback) {
        Bug.findOne({
            'caseid': caseid,
            '_id': _id
        }).exec(function(err, result) {
            if (result == null) {
                callback(0, "不存在此Bug"); // 不存在
            } else {
                if (result.founder.userid == userid) {
                    Bug.update({
                        'caseid': caseid,
                        '_id': _id
                    }, {
                        $set: {
                            state: 2
                        }
                    }).exec(function(err) {
                        if (err) {
                            callback(2, "修改不成功"); // 修改不成功
                        } else {
                            callback(1, "修改成功"); // 修改成功
                        }
                    });
                } else {
                    callback(-1, "不是创建者无法确认Bug"); // 不是创建者无法确认Bug
                }
            }
        });
    };

    sendBugToOne = function(email, content, caseid, _id, callback) {

    };



    return {
        addBug: addBug,
        getAllBug: getAllBug,
        waitForConform: waitForConform,
        setBugSolve: setBugSolve,
        getOneBug: getOneBug,
        updateBug: updateBug
    };
};