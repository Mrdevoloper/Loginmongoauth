const express = require('express');
const router = express.Router();

//mongodb user model
const User = require('../models/User');


//mongodb user verification model
const UserVerification = require('../models/UserVerified');

//email handler
const nodemailer = require('nodemailer')

//unique string
const {v4: uuid4} = require('uuid')

//env varibles
require('dotenv').config();

//password handlar
const bcrypt = require('bcrypt');

//get user

router.get('/all', async(req, res) => {
	const all = await User.find();
	res.json(all)
});

// sign up
router.post('/signup', (req, res) => {
	let { name, email, password, dateOfBirth } = req.body;
	name = name.trim();
	email = email.trim();
	password = password.trim();
	dateOfBirth = dateOfBirth.trim();

	if (name == '' || email == '' || password == '' || dateOfBirth == '') {
		res.json({
			status: 'Failed',
			message: 'Empty input field',
		});
	} else if (!/^[a-zA-Z]*$/.test(name)) {
		res.json({
			status: 'Failed',
			message: 'Empty name entered',
		});
	} else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
		res.json({
			status: 'Failed',
			message: 'Empty email entered',
		});
	} else if (!new Date(dateOfBirth).getTime()) {
		res.json({
			status: 'Failed',
			message: 'Empty date of birth entered',
		});
	} else if (password.lenth < 8) {
		res.json({
			status: 'Failed',
			message: 'Password is too short',
		});
	} else {
		// checking if user already exists

		User.find({ email })
			.then((result) => {
				if (email.lenth) {
					res.json({
						status: 'Failed',
						message: 'User With provided email already exists',
					});
				} else {
					const saltRounds = 10;
					bcrypt
						.hash(password, saltRounds)
						.then((hashedpassword) => {
							const newUser = new User({
								name,
								email,
								password: hashedpassword,
								dateOfBirth,
							});
							newUser
								.save()
								.then((result) => {
									res.json({
										status: 'SUCCESS',
										message: 'Sign up successfully',
										data: result,
									});
								})
								.catch((err) => {
									res.json({
										status: 'Failed',
										message:
											'An occured while saving user account',
									});
								});
						})
						.catch((err) => {
							res.json({
								status: 'Failed',
								message: 'An occured while hashing password',
							});
						});
				}
			})
			.catch((err) => {
				console.log(err);
				res.json({
					status: 'Failed',
					message: 'An occured while checking for existing user',
				});
			});
	}
});

// sign in
router.post('/signin', (req, res) => {
	let { email, password } = req.body;
	email = email.trim();
	password = password.trim();

	if (email == '' || password == '') {
		res.json({
			status: 'FAILED',
			message: 'Empty credentials supplied',
		});
	} else {
		// checking if user exists
		User.find({ email })
			.then((data) => {
				if (data.length) {
					//User exists
					const hashedpassword = data[0].password;
					bcrypt
						.compare(password, hashedpassword)
						.then((result) => {
							if (result) {
								//password match
								res.json({
									status: 'SUCCESS',
									message: 'Sigin successfull',
									data: data,
								});
							} else {
								res.json({
									status: 'FAILED',
									message: 'invalid password entered',
								});
							}
						})
						.catch((err) => {
							res.json({
								status: 'FAILED',
								message: 'AN error occured while comparing',
							});
						});
				} else {
					res.json({
						status: 'FAILED',
						message: 'invalid credital entered!',
					});
				}
			})
			.catch((err) => {
				res.json({
					status: 'FAILED',
					message:
						'An error occured while checking for exsiting user',
				});
			});
	}
});

module.exports = router;
