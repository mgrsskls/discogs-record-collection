let requestData;

export const getToken = (res, host, Discogs) => {
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

export const callback = (req, res, Discogs, cb) => {
	var oAuth = new Discogs(requestData).oauth();
	oAuth.getAccessToken(
		req.query.oauth_verifier, // Verification code sent back by Discogs
		function (err, data) {
			if (err) {
				cb(err);
			} else {
				res.cookie("discogs_oauth_token", data.token, {
					httpOnly: true,
					sameSite: "lax",
				});
				cb(null, data);
			}
		}
	);
};
