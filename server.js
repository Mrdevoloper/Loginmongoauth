const express = require('express');
const { mongo } = require('./config/mongo');
const app = express();
const UserRouter = require('./Api/User');
const PORT = process.env.PORT || 5000;
const swaggerUi = require('swagger-ui-express');
const options = require('./swagger')


app.use(express.json());
app.use('/user', UserRouter);
app.use('/user/api-docs', swaggerUi.serve, swaggerUi.setup(options));



mongo()
	.then(() => console.log('connected'))
	.catch((err) => console.log(err.message));

app.listen(PORT, console.log(PORT));
