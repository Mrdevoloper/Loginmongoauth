const mongoose = require('mongoose')
const mongo = async() => {
    try {
        return await mongoose.connect('mongodb://localhost:27017/eshmat')
    } catch (error) {
        console.log(error.message);
    }
}
module.exports = {mongo}