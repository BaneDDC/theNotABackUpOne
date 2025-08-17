const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const CopyPlugin = require("copy-webpack-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const path = require("path")
const TerserPlugin = require("terser-webpack-plugin")
const webpack = require("webpack")

const line = "---------------------------------------------------------"
const msg = `❤️❤️❤️ Tell us about your game! - games@phaser.io ❤️❤️❤️`
process.stdout.write(`${line}\n${msg}\n${line}\n`)

module.exports = {
  mode: "production",
  entry: "./src/main.ts",
  output: {
    path: path.resolve(process.cwd(), "dist"),
    filename: "./bundle.min.js",
  },
  resolve: {
    extensions: [".ts", ".js", ".json"],
  },
  devtool: false,
  performance: {
    maxEntrypointSize: 2500000,
    maxAssetSize: 1200000,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          options: {
            // Make TypeScript super permissive
            transpileOnly: true, // Skip type checking entirely
            compilerOptions: {
              noUnusedLocals: false,
              noUnusedParameters: false,
              strict: false,
              noImplicitAny: false,
              noImplicitReturns: false,
              noImplicitThis: false,
              strictNullChecks: false,
              strictFunctionTypes: false,
              strictBindCallApply: false,
              strictPropertyInitialization: false,
              noImplicitUseStrict: false,
              alwaysStrict: false,
            },
          },
        },
      },
      {
        test: [/\.vert$/, /\.frag$/],
        use: "raw-loader",
      },
      {
        test: /\.(gif|png|jpe?g|svg|xml|glsl)$/i,
        use: "file-loader",
      },
    ],
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            comments: false,
          },
        },
      }),
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin({
      "typeof CANVAS_RENDERER": JSON.stringify(true),
      "typeof WEBGL_RENDERER": JSON.stringify(true),
      "typeof WEBGL_DEBUG": JSON.stringify(false),
      "typeof EXPERIMENTAL": JSON.stringify(false),
      "typeof PLUGIN_3D": JSON.stringify(false),
      "typeof PLUGIN_CAMERA3D": JSON.stringify(false),
      "typeof PLUGIN_FBINSTANT": JSON.stringify(false),
      "typeof FEATURE_SOUND": JSON.stringify(true),
      // Define process object for browser environment
      "process": JSON.stringify({
        env: {
          VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://vnsvgrphapsicombzmrn.supabase.co',
          VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3ZncnBoYXBzaWNvbWJ6bXJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzODgyNDMsImV4cCI6MjA3MDk2NDI0M30.v6Pw_GCOh3bDM_ME22Cqv9jcGl2BacM2aJXRuuJ76EA'
        }
      }),
    }),
    new HtmlWebpackPlugin({
      template: "./index.html",
      templateParameters: {
        SANDBOX_SCRIPT_URL: process.env.NODE_ENV === "production" ? "" : (process.env.SANDBOX_SCRIPT_URL ?? ""),
      },
    }),
    new CopyPlugin({
      patterns: [
        { from: "public/assets", to: "assets", noErrorOnMissing: true },
        { from: "public/favicon.png", to: "favicon.png", noErrorOnMissing: true },
        { from: "public/style.css", to: "style.css", noErrorOnMissing: true },
      ],
    }),
  ],
}
