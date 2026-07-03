import nextConfig from "eslint-config-next";

const config = [
  ...nextConfig,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".git/**",
      "*.config.js",
      "next-env.d.ts",
      "tsconfig.tsbuildinfo"
    ],
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-page-custom-font": "warn", 
      "react/jsx-key": "error",
    },
  },
];

export default config;
