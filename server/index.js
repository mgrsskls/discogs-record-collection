import path from "node:path";
import express from "express";
import disconnect from "disconnect";
import cookieParser from "cookie-parser";
import Twig from "twig";
import compression from "compression";

import { records, login } from "../lib/render.js";
import { getToken, callback } from "../lib/auth.js";

Twig.cache(process.env.NODE_ENV == "production");

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || `http://localhost:${port}`;

const Discogs = disconnect.Client;

const tokens = {};

app.set("view engine", "twig");
app.set("twig cache", process.env.NODE_ENV == "production");
app.set("views", path.join(import.meta.dirname, "../views"));
app.use(express.static(path.join(import.meta.dirname, "../public")));
app.use(cookieParser());
app.use(compression());

app.listen(port, () => {
	console.log(host);
});

app.get("/", function (req, res) {
	if (req.cookies.discogs_oauth_token) {
		records(req, res, tokens);
	} else {
		login(res);
	}
});
app.get("/sign-in", (req, res) => getToken(res, host, Discogs));
app.get("/callback", (req, res) =>
	callback(req, res, Discogs, (err, data) => {
		if (data) {
			tokens[data.token] = data;
		}

		res.redirect("/");
	})
);
