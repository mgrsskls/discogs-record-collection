import disconnect from "disconnect";

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
				const data = await fetchData(response.username, collection);

				let records = [...data.collection.releases];

				if (data.collection.pagination.pages > 1) {
					for (let i = 2; i <= data.collection.pagination.pages; i += 1) {
						const data = await fetchData(response.username, collection, i);

						records = [...records, ...data.collection.releases];
					}
				}

				let genres = [];
				for (const record of records) {
					genres = [...genres, ...record.basic_information.genres];
				}

				res.render("records.twig", {
					username: response.username,
					genres: Array.from(new Set(genres)),
					records: records
						.map((record) => ({
							...record.basic_information,
							id: record.id,
							artist_names: record.basic_information.artists
								.map(({ name }) => name)
								.join(", "),
						}))
						.sort((a, b) => {
							if (a.artist_names > b.artist_names) return 1;
							if (a.artist_names < b.artist_names) return -1;

							return 0;
						}),
				});
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

function fetchData(username, auth, page = 1) {
	return new Promise((resolve, reject) => {
		auth.getReleases(
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
