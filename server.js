const express = require('express');
const { mongo } = require('./config/mongo');
const app = express();
const UserRouter = require('./Api/User')
const PORT = process.env.PORT || 9000

app.use(express.json());
app.use('/user', UserRouter)

mongo()
	.then(() => console.log('connected'))
	.catch((err) => console.log(err.message));

app.listen(PORT, console.log(PORT));
