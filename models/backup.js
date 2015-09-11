module.exports = function(mongoose, moment, set) {
    var Page = mongoose.model('page');
    var Cat = mongoose.model('cat');
    var Block = mongoose.model('block');
    var fs = require("fs");
    //显示所有的文档
    backup = function(callback) {
        Page.find(function(err, pages) {
            callback(pages);
        });
    };



    return {
        backup: backup
    };
};