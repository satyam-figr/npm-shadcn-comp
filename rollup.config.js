import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import { dts } from "rollup-plugin-dts";
import postcss from "rollup-plugin-postcss";
import { nodeResolve } from "@rollup/plugin-node-resolve";
const packageJson = require("./package.json");
export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: packageJson.main,
        format: "cjs",
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      nodeResolve({
        ignoreGlobal: false,
        include: ["node_modules/**"],
        skip: ["react", "react-dom"],
      }),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json", sourceMap: true }),
      terser(),
      postcss({
        extract: true,
        minimize: true,
      }),
    ],
    external: ["react", "react-dom"],
  },
  {
    input: "src/index.ts",
    output: [{ file: packageJson.types }],
    plugins: [dts()],
    external: [/\.css$/],
  },
  {
    input: "src/index.css",
    output: [{ file: "dist/index.css" }],
    plugins: [
      postcss({
        extract: true,
        minimize: true,
      }),
    ],
  },
];
