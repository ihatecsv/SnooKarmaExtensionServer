const fs = require("fs");
const https = require("https");
const express = require("express");
const mongoose = require("mongoose");
const request = require("request");

const config = require("./config");

const User = require("./User");

mongoose.connect(config.dbConnectionString, {
	useNewUrlParser: true
});

const app = express();

https.createServer({
		key: fs.readFileSync("tls/key.pem"),
		cert: fs.readFileSync("tls/cert.pem")
	}, app)
	.listen(443, function () {
		console.log("Listening on port 443!");
	});

app.get("/get/:redditUsername", (req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	User.findOne({
		redditUsername: req.params.redditUsername
	}).exec((err, user) => {
		if (err) {
			return res.json({
				error: "Database query failed!"
			});
		}
		if (user === null) {
			return res.json({
				error: "Username not found!"
			});
		}
		res.json({
			ethereumAddress: user.ethereumAddress
		});
	});
});

app.get("/set/:ethereumAddress", (req, res, next) => {
	if (req.params.ethereumAddress.length != 42) { //TODO: better address verification
		return res.json({
			error: "Address invalid!"
		});
	}
	const authURI = "https://www.reddit.com/api/v1/authorize?client_id=" + config.redditClientID + "&response_type=code&state=" + req.params.ethereumAddress + "&redirect_uri=" + config.redirectURI + "&duration=temporary&scope=identity";
	res.redirect(authURI);
});

app.get("/redirect", (req, res, next) => {
	const ethereumAddress = req.query.state;
	const code = req.query.code;
	const grantTokenURI = "https://www.reddit.com/api/v1/access_token";
	const auth = "Basic " + new Buffer(config.redditClientID + ":" + config.redditSecret).toString("base64");
	request.post({
		url: grantTokenURI,
		form: {
			"grant_type": "authorization_code",
			"code": code,
			"redirect_uri": config.redirectURI
		},
		headers: {
			"Authorization": auth
		}
	}, function (err1, res1, body1) {
		if (err1) {
			return res.json({
				error: "Request 1 failed!"
			});
		}
		const parsedBody1 = JSON.parse(body1);
		if (typeof parsedBody1["access_token"] !== "string") {
			return res.json({
				error: "Authorization JSON invalid!"
			});
		}
		const token = parsedBody1["access_token"];
		const userInformationURI = "https://oauth.reddit.com/api/v1/me";
		request.get({
			url: userInformationURI,
			headers: {
				"Authorization": "bearer " + token,
				"User-Agent": "SnooKarmaExtensionServer/0.0.1 by ihatecsv"
			}
		}, function (err2, res2, body2) {
			if (err2) {
				return res.json({
					error: "Request 2 failed!" //???
				});
			}
			const parsedBody2 = JSON.parse(body2);
			if (typeof parsedBody2.name !== "string") {
				return res.json({
					error: "Authorization JSON invalid 2!"
				});
			}
			const redditUsername = parsedBody2.name;

			const query = {
					redditUsername: redditUsername
				},
				update = {
					ethereumAddress: ethereumAddress
				},
				options = {
					upsert: true,
					new: true,
					setDefaultsOnInsert: true
				};
			User.findOneAndUpdate(query, update, options, function (err, result) {
				if (err) {
					return res.json({
						error: "Error updating database!"
					});
				}
				res.json({
					status: "Address set successfully!"
				});
			});
		});
	});
});