// const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");
const path = require("path");

// const withTM = require("next-transpile-modules")(["@use-gpu/wgsl"]);

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // transpilePackages: ["@use-gpu/wgsl"],
  webpack: (config, options) => {
    config.experiments.asyncWebAssembly = true;

    // if (options.isServer) {
    //   config.output.webassemblyModuleFilename =
    //     "./../static/wasm/[modulehash].wasm";
    // } else {
    //   config.output.webassemblyModuleFilename = "static/wasm/[modulehash].wasm";
    // }

    // config.optimization.moduleIds = "named";

    // use-gpu config
    config.module.rules.push({
      test: /\.wgsl$/i,
      use: ["@use-gpu/wgsl-loader"],
      include: [
        path.resolve(__dirname, "pages"),
        path.resolve(__dirname, "components"),
        path.resolve(__dirname, "hooks"),
        path.resolve(__dirname, "node_modules/@use-gpu/wgsl"),
      ],
    });

    console.log("Config: ", options.isServer, config.module.rules);

    return config;
  },
};

module.exports = nextConfig;
