const express = require('express');
const { mongo } = require('./config/mongo');
const app = express();
const UserRouter = require('./Api/User');
const PORT = process.env.PORT || 9000;
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const options = require('./swagger')
app.use(express.json());
app.use('/user', UserRouter);



const swaggerSpec = swaggerJSDoc(options);
app.use('/user/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));



mongo()
	.then(() => console.log('connected'))
	.catch((err) => console.log(err.message));

app.listen(PORT, console.log(PORT));
