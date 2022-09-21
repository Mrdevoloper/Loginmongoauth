const mongoose = require('mongoose')
const mongo = async() => {
    try {
        return await mongoose.connect('mongodb+srv://superUser:xayrullo2003@newcluster.1pce53g.mongodb.net/test')
    } catch (error) {
        console.log(error.message);
    }
}
module.exports = {mongo}