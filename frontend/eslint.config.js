import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
    // 忽略构建产物目录
    globalIgnores(["dist"]),
    {
        // 只检查 TypeScript 文件（.ts 和 .tsx）
        files: ["**/*.{ts,tsx}"],

        // 注册插件（prettier 用于把格式问题作为 ESLint 规则报告）
        plugins: {
            prettier: prettierPlugin,
        },

        // 继承多套推荐规则集
        extends: [
            // ESLint 官方推荐规则（禁止未声明变量、重复 case 等基础问题）
            js.configs.recommended,
            // TypeScript ESLint 推荐规则（类型安全相关检查）
            tseslint.configs.recommended,
            // React Hooks 规则（检查 useEffect 依赖项、Hooks 调用顺序等）
            reactHooks.configs.flat.recommended,
            // React Fast Refresh 规则（确保组件热更新正常工作）
            reactRefresh.configs.vite,
        ],

        languageOptions: {
            // 支持 ES2020 语法（可选链 ?. 、空值合并 ?? 等）
            ecmaVersion: 2020,
            // 注入浏览器全局变量（如 window、document、fetch 等）
            globals: globals.browser,
        },

        rules: {
            // 关闭与 prettier 冲突的 ESLint 格式规则（避免两者打架）
            ...prettierConfig.rules,

            // 格式交给 VS Code Prettier 插件保存时自动处理，ESLint 不再报告
            "prettier/prettier": "off",

            // 允许使用 any 类型（动态渲染场景需要灵活处理未知结构）
            "@typescript-eslint/no-explicit-any": "off",

            // 关闭 ESLint 原生的 no-unused-vars（由 TypeScript 版本接管，避免重复报告）
            "no-unused-vars": "off",

            // 未使用的变量报 warning，但以下划线 _ 开头的参数允许忽略
            // （常见用法：函数参数占位，如 (_event, value) => {}）
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
        },
    },
]);
