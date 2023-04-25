// const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");
// const { resolve } = require("path");

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  webpack: (config, options) => {
    config.experiments.asyncWebAssembly = true;

    if (options.isServer) {
      config.output.webassemblyModuleFilename =
        "./../static/wasm/[modulehash].wasm";
    } else {
      config.output.webassemblyModuleFilename = "static/wasm/[modulehash].wasm";
    }

    config.optimization.moduleIds = "named";

    // use-gpu config
    config.module.rules.push({
      test: /\.wgsl$/i,
      use: ["@use-gpu/wgsl-loader"],
    });

    // config.entry = async () => {
    //   const entry = await config.entry();
    //   return {
    //     ...entry,
    //     "webpack-dev-server/client/index.js?hot=true&live-reload=true":
    //       "webpack-dev-server/client/index.js?hot=true&live-reload=true",
    //   };
    // };

    // config.devServer.hot = true;

    return config;
  },
};

module.exports = nextConfig;
