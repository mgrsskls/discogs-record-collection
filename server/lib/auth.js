import disconnect from "disconnect";

const Discogs = disconnect.Client;

let requestData;

export const requestToken = (res, host, Discogs) => {
	const oAuth = new Discogs().oauth();

	oAuth.getRequestToken(
		process.env.DISCOGS_CONSUMER_KEY,
		process.env.DISCOGS_CONSUMER_SECRET,
		`${host}/callback`,
		function (err, data) {
			// Persist "data" here so that the callback handler can
			// access it later after returning from the authorize url
			requestData = data;
			res.redirect(requestData.authorizeUrl);
		}
	);
};

export const getUser = (req, tokens, token) => {
	return new Promise((resolve, reject) => {
		if (token && token in tokens) {
			const auth = new Discogs(tokens[token]);

			auth.getIdentity(async function (err, response) {
				if (err) {
					reject(null);
				} else {
					resolve(response.username);
				}
			});
		} else {
			reject(null);
		}
	});
};

export const getToken = (req, res, Discogs, cb) => {
	var oAuth = new Discogs(requestData).oauth();
	oAuth.getAccessToken(
		req.query.oauth_verifier, // Verification code sent back by Discogs
		function (err, data) {
			if (err) {
				cb(err);
			} else {
				cb(null, data);
			}
		}
	);
};
