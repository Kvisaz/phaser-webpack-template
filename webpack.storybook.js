const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { EsbuildPlugin } = require("esbuild-loader");
const os = require("os");

function getChromeOsName() {
  const platform = os.platform();

  if (platform === "darwin") {
    return "Google Chrome";
  } else if (platform === "linux") {
    return "google-chrome";
  } else {
    return "chrome";
  }
}

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    entry: "./storybook/index.ts",
    output: {
      path: path.resolve(__dirname, "docs/storybook"),
      filename: "bundle.[contenthash].js",
      clean: true
    },
    devtool: isProduction ? "source-map" : "eval-source-map",
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: "esbuild-loader",
          options: {
            loader: "tsx",
            target: "es2015"
          }
        }
      ]
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js"]
    },
    optimization: {
      minimizer: [
        new EsbuildPlugin({
          target: "es2015",
          css: true // Если у вас есть CSS для минификации
        })
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./storybook/index.html",
        filename: "index.html"
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "src/assets",
            to: "assets"
          }
        ]
      })
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, "build")
      },
      compress: true,
      port: 8080,
      open: {
        target: ["http://localhost:8080"],
        app: {
          name: getChromeOsName(),
          arguments: []
        }
      }
    }
  };
};
