/**
 * 设计变量（Design Tokens）
 * ------------------------------------------------------------------
 * 整个项目的配色只有两类：
 *   1. 中性色：直接用 Tailwind 自带的 slate（文字、边线、面板底色）
 *   2. 强调色：下面的 brand（一种钴蓝），只用在「选中、聚焦、链接」这类需要被注意到的地方
 *
 * 主按钮不用强调色，用最深的中性色 slate-900（见 index.css 的 .vc-btn）。
 * 这样界面外壳是灰阶的，颜色留给画布里的内容。
 *
 * 想换强调色：只改 brand 这一组，再同步 index.css 里的 --vc-accent 和 App.tsx 里的 ACCENT。
 */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                // 强调色：数字越大越深。500 是标准色，50/100 做浅底，600/700 做深色文字
                brand: {
                    50: "#eff5ff",
                    100: "#dbe8fe",
                    200: "#bfd6fe",
                    300: "#93bafd",
                    400: "#6096fa",
                    500: "#3b76f6",
                    600: "#2459eb",
                    700: "#1c45d8",
                    800: "#1d3aaf",
                    900: "#1e358a",
                },
                accent: {
                    emerald: "#34d399",
                    cyan: "#06b6d4",
                    pink: "#ec4899",
                    amber: "#f59e0b",
                },
            },
            boxShadow: {
                // 只保留两种阴影：浮在画布上的小控件用 float，画板本身用 artboard
                float: "0 0 0 1px rgba(15,23,42,0.08), 0 4px 12px rgba(15,23,42,0.08)",
                artboard: "0 0 0 1px rgba(15,23,42,0.10), 0 8px 24px rgba(15,23,42,0.06)",
            },
            gridTemplateColumns: {
                13: "repeat(13, minmax(0, 1fr))",
                14: "repeat(14, minmax(0, 1fr))",
                16: "repeat(16, minmax(0, 1fr))",
                // 编辑器三栏：左侧物料 | 中间画布（占满剩余） | 右侧属性
                custom: "272px minmax(0, 1fr) 296px",
                sidebar: "250px 1fr",
            },
            gridTemplateRows: {
                20: "repeat(20, minmax(0, 1fr))",
                custom: "auto 1fr auto",
                // 编辑器两行：顶栏 48px | 主体（占满剩余）
                header: "48px minmax(0, 1fr)",
            },
            gridGap: {
                18: "4.5rem",
                88: "22rem",
            },
            gridTemplateAreas: {
                layout: '"header header" "sidebar main" "footer footer"',
                dashboard:
                    '"nav nav nav" "sidebar main stats" "sidebar main stats"',
            },
            animation: {
                "fade-in": "fadeIn 0.3s ease-out",
                "slide-up": "slideUp 0.3s ease-out",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { opacity: "0", transform: "translateY(8px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
        },
    },
};
