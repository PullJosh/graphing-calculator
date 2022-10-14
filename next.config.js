// const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");
// const { resolve } = require("path");

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => {
    config.experiments.asyncWebAssembly = true;

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
