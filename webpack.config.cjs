const path = require("path");

module.exports = () => {
	return {
		entry: ["./src/index.js", "./src/style.scss"],
		output: {
			filename: "main.js",
			path: path.resolve(__dirname, "dist"),
			library: {
				type: "module",
			},
		},
		experiments: {
			outputModule: true,
		},
		module: {
			rules: [
				{
					test: /\.js$/,
					exclude: /node_modules/,
					use: "babel-loader",
				},
				{
					test: /\.scss$/,
					use: [
						"style-loader", // Injects styles into the DOM
						"css-loader", // Translates CSS into CommonJS modules
						"sass-loader", // Compiles SCSS into CSS
					],
				},
			],
		},
		resolve: {
			extensions: [".js", ".scss"],
		},
	};
};
