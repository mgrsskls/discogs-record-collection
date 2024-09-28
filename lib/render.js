import disconnect from "disconnect";

import data from "./data.js";

export const records = (req, res, tokens) => {
	const Discogs = disconnect.Client;

	try {
		const auth = new Discogs(tokens[req.cookies.discogs_oauth_token]);
		const collection = auth.user().collection();

		auth.getIdentity(async function (err, response) {
			if (err) {
				res.render("index.twig", {
					err: err,
				});
			} else if (response) {
				res.render(
					"records.twig",
					await data(fetchData, { username: response.username, collection })
				);
			}
		});
	} catch (err) {
		res.render("index.twig", {
			err: err,
		});
	}
};

export const login = (res) => {
	res.render("index.twig");
};

function fetchData(page, { username, collection }) {
	return new Promise((resolve, reject) => {
		collection.getReleases(
			username,
			0,
			{ page, per_page: 100 },
			async function (err, collection) {
				if (err) {
					reject(err);
				} else {
					resolve({ collection });
				}
			}
		);
	});
}
