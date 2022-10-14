const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");
const { resolve } = require("path");

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => {
    // config.output.publicPath = "/_next/";
    config.experiments.asyncWebAssembly = true;
    // config.module.rules.push({
    //   test: /\.wasm$/,
    //   type: "webassembly/async",
    // });
    // config.plugins.push(
    //   new WasmPackPlugin({
    //     crateDirectory: resolve("./rust/joshs-graphing-calculator-lib"),
    //     args: "--log-level warn",
    //   })
    // );

    if (isServer) {
      config.output.webassemblyModuleFilename =
        "./../static/wasm/[modulehash].wasm";
    } else {
      config.output.webassemblyModuleFilename = "static/wasm/[modulehash].wasm";
    }

    config.optimization.moduleIds = "named";

    return config;
  },
};

module.exports = nextConfig;
