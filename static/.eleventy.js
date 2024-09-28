import EleventyFetch from "@11ty/eleventy-fetch";
import { TemplatePath } from "@11ty/eleventy-utils";
import twig from "twig";

import data from "../lib/data.js";

export default async function (eleventyConfig) {
	if (!process.env.DISCOGS_TOKEN) {
		console.error("Please provide your DISCOGS_TOKEN.");
		process.exit(1);
	}

	const { records, genres } = await data(fetchData);

	eleventyConfig.addGlobalData("records", records);
	eleventyConfig.addGlobalData("genres", genres);

	/* Passthrough Copy */
	eleventyConfig.addPassthroughCopy({
		"../public": "/",
	});

	eleventyConfig.addExtension("twig", {
		outputFileExtension: "html",
		getInstanceFromInputPath: (inputPath) => {
			const requirePath = TemplatePath.absolutePath(inputPath);
			return require(requirePath);
		},
		compile: async (inputContent, inputPath) => {
			const template = twig.twig({
				data: inputContent,
				path: `./${inputPath}`,
			});

			return async (data) => {
				return template.render(data);
			};
		},
	});
	eleventyConfig.addTemplateFormats("twig");
}

async function fetchData(page = 1) {
	const url = `https://api.discogs.com/users/mgrsskls/collection/folders/0/releases?token=${process.env.DISCOGS_TOKEN}&per_page=100&page=${page}`;

	return {
		collection: await EleventyFetch(url, {
			duration: "1d",
			type: "json",
		}),
	};
}
