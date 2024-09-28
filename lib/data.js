export default async function (fetchData, props) {
	const data = await fetchData(1, props);

	let records = [...data.collection.releases];

	if (data.collection.pagination.pages > 1) {
		for (let i = 2; i <= data.collection.pagination.pages; i += 1) {
			const data = await fetchData(i, props);

			records = [...records, ...data.collection.releases];
		}
	}

	let genres = [];
	for (const record of records) {
		genres = [...genres, ...record.basic_information.genres];
	}

	return {
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
	};
}
