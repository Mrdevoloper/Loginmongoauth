const express = require('express');
const router = express.Router();

//mongodb user model
const User = require('../models/User');

//mongodb user verification model
const UserVerification = require('../models/UserVerified');

//email handler
const nodemailer = require('nodemailer');

//unique string
const { v4: uuid4 } = require('uuid');

//env varibles
require('dotenv').config();

//password handlar
const bcrypt = require('bcrypt');

//path
const path = require('path');

//nodemailer
let transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.AUTH_EMAIL,
		pass: process.env.AUTH_PASS,
	},
});

//testing success

transporter.verify((error, success) => {
	if (error) {
		console.log(error);
	} else {
		console.log('redy');
		console.log(success);
	}
});

//get user

router.get('/all', async (req, res) => {
	const all = await User.find();
	res.json(all);
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
								verified: false,
							});
							newUser
								.save()
								.then((result) => {
									//handle accound verification
									sendVerificationEmail(result, res);
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

const sendVerificationEmail = ({ _id, email }, res) => {
	const currentUrl = 'http://localhost:5000/';
	const uniqueString = uuid4() + _id;
	const mailOptions = {
		from: process.env.AUTH_EMAIL,
		to: email,
		subject: 'Verify your email',
		html: `<p>Verify your email to complete the sign up login into your accouunt</p><p><b>This lik is expires in 6 houres</b>.</p>
		<p>Press <a href=${
			currentUrl + 'user/verify' + _id + '/' + uniqueString
		}> here </a> to procced </p>`,
	};

	//hash uniquestring
	const saltRounds = 10;
	bcrypt
		.hash(uniqueString, saltRounds)
		.then((hashedUniqueString) => {
			//set values in userVerification collection
			const newVerification = new UserVerification({
				userId: _id,
				uniqueString: hashedUniqueString,
				created_at: Date.now(),
				expired_at: Date.now() + 21600000,
			});
			newVerification
				.save()
				.then(() => {
					transporter
						.sendMail(mailOptions)
						.then(() => {
							res.json({
								status: 'Pending',
								message: ' Verification email sent!',
							});
						})
						.catch((err) => {
							console.log(err);
							res.json({
								status: 'FAILED',
								message: 'Verification email failed!',
							});
						});
				})
				.catch((err) => {
					console.log(err);
					res.json({
						status: 'FAILED',
						message: 'Could not save Verification email data!',
					});
				});
		})
		.catch(() => {
			res.json({
				status: 'FAILED',
				message: 'An error occured while hashing email!',
			});
		});
};

//verify email
router.get('/verify/:userId:uniqueString', (req, res) => {
	let { userId, uniqueString } = req.params;
	UserVerification.find({ userId })
		.then((result) => {
			if (result.length > 0) {
				const { expired_at } = result[0];
				const hashedUniqueString = result[0].uniqueString;

				if (expired_at < Date.now()) {
					UserVerification.deleteOne({ userId })
						.then((result) => {
							User.deleteOne({ _id: userId })
								.then(() => {
									let message = 'Sign up again ';
									res.redirect(
										`/user/verified/error=true&message=${message}`,
									);
								})
								.catch((err) => {
									let message = 'Clearing user with expired ';
									res.redirect(
										`/user/verified/error=true&message=${message}`,
									);
								});
						})
						.catch((error) => {
							console.log(error);
							let message =
								'An error occured while cleaning expires user';
							res.redirect(
								`/user/verified/error=true&message=${message}`,
							);
						});
				} else {
					//valid
					bcrypt
						.compare(uniqueString, hashedUniqueString)
						.then((result) => {
							if (result) {
								User.updateOne(
									{ _id: userId },
									{ verified: true },
								)
									.then(() => {
										UserVerification
										  .deleteOne({userId})
										  .then(() => {
												res.sendFile(path.join(__dirname, "./../views/verified.html"))
										  })
										  .catch((err) => {
											let message =
											'an error occured finiliziz successfull ';
										res.redirect(
											`/user/verified/error=true&message=${message}`
										);
										  })
									})
									.catch((err) => {
										console.log(err);
										let message =
											'show verified error';
										res.redirect(
											`/user/verified/error=true&message=${message}`
										);
									});
							} else {
								let message = 'Invalid verification';
								res.redirect(
									`/user/verified/error=true&message=${message}`,
								);
							}
						})
						.catch((err) => {
							let message =
								'An error occured while compairing unique string ';
							res.redirect(
								`/user/verified/error=true&message=${message}`,
							);
						});
				}
			} else {
				let message =
					'Accound record doesnt exists or has been verified already';
				res.redirect(`/user/verified/error=true&message=${message}`);
			}
		})
		.catch((err) => {
			console.log(err);
			let message =
				'An error occured while checking  for existing user verification';
			res.redirect(`/user/verified/error=true&message=${message}`);
		});
});

router.get('/verified', (req, res) => {
	res.sendFile(path.join(__dirname, './views/verified.html'));
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
					if(!data[0].verified){
						res.json({
							status: 'FAILED',
							message: 'email hasnt been verified',
						})
					}else{
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
					}
					
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
