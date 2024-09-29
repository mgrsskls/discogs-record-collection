import path from "node:path";
import express from "express";
import disconnect from "disconnect";
import cookieParser from "cookie-parser";
import Twig from "twig";
import compression from "compression";

import { records, login } from "./lib/render.js";
import { requestToken, getUser, getToken } from "./lib/auth.js";

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

app.get("/", (req, res) => {
	getUser(req, tokens, req.cookies.discogs_oauth_token)
		.then((userName) => {
			res.redirect(`/u/${userName}`);
		})
		.catch(() => {
			clearCookie(req, res);
			login(res, host);
		});
});

app.get("/u/*", (req, res) => {
	getUser(req, tokens, req.cookies.discogs_oauth_token)
		.then((userName) => {
			if (userName && userName === req.params[0]) {
				records(req, res, tokens, host);
			} else {
				clearCookie(req, res);
				res.redirect("/");
			}
		})
		.catch(() => {
			clearCookie(req, res);
			res.redirect("/");
		});
});

app.get("/sign-in", (req, res) => requestToken(res, host, Discogs));

app.get("/callback", (req, res) =>
	getToken(req, res, Discogs, (err, data) => {
		if (data) {
			tokens[data.token] = data;

			res.cookie("discogs_oauth_token", data.token, {
				httpOnly: true,
				sameSite: "lax",
			});

			getUser(req, tokens, data.token)
				.then((userName) => {
					res.redirect(`/u/${userName}`);
				})
				.catch(() => {
					clearCookie(req, res);
					res.redirect("/");
				});
		} else {
			clearCookie(req, res);
			res.redirect("/");
		}
	})
);

app.post("/logout", (req, res) => {
	clearCookie(req, res);
	res.redirect("/");
});

function clearCookie(req, res) {
	if (req.cookies.discogs_oauth_token) {
		if (req.cookies.discogs_oauth_token in tokens) {
			delete tokens[req.cookies.discogs_oauth_token];
		}

		res.clearCookie("discogs_oauth_token");
	}
}
