const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  target: "node",
  externalsPresets: {
    node: true,
  },
  externals: [
    nodeExternals(),
    nodeExternals({
      modulesDir: path.resolve(__dirname, "../../node_modules"),
    }),
  ],
  mode: "production",
  entry: ["./index.ts"],
  output: {
    path: path.resolve(__dirname, "dist/umd"),
    filename: "index.js",
    library: "exampleTypescriptPackage",
    libraryTarget: "umd",
    globalObject: "this",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: path.resolve(__dirname, "tsconfig.udm.json"),
          },
        },
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
};
