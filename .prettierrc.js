/** @type {import("prettier").Config} */
export default {
    // 每行最大字符数，超过会换行（默认 80，改为 100 更宽松）
    printWidth: 100,

    // 缩进空格数（用 4 个空格，与项目现有风格一致）
    tabWidth: 4,

    // 是否用 Tab 缩进（false = 用空格）
    useTabs: true,

    // 语句末尾是否加分号
    semi: true,

    // 是否用单引号（false = 双引号）
    singleQuote: false,

    // 对象的 key 是否加引号：
    //   "as-needed"  → 只在必要时加（如 key 含特殊字符）
    //   "consistent" → 要么全加要么全不加
    //   "preserve"   → 保持原样
    quoteProps: "as-needed",

    // JSX 中的属性值是否用单引号（false = 双引号）
    jsxSingleQuote: false,

    // 末尾逗号风格：
    //   "es5"  → 对象、数组末尾加逗号，函数参数不加（推荐，兼容性好）
    //   "all"  → 函数参数也加逗号
    //   "none" → 全不加
    trailingComma: "es5",

    // 对象字面量花括号内侧是否有空格，如 { foo: bar }
    bracketSpacing: true,

    // JSX 的 > 是否放在最后一个属性的同一行（false = 单独一行）
    bracketSameLine: false,

    // 箭头函数参数是否总加括号：
    //   "always" → 始终加，如 (x) => x
    //   "avoid"  → 单参数时省略，如 x => x
    arrowParens: "always",

    // 换行符风格：
    //   "lf"   → Unix/Mac 风格（\n），跨平台协作推荐
    //   "crlf" → Windows 风格（\r\n）
    //   "auto" → 保持文件原有风格
    endOfLine: "lf",
};
