module.exports = function(mongoose, moment, marked) {
    var PageSchema = new mongoose.Schema({
        uid: {
            type: Number,
            default: 1
        },
        userid: {
            type: Number
        },
        name: {
            type: String
        },
        dec: {
            type: String
        }
    });
}