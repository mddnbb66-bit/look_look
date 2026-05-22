---
description: "Create a new material component for the vision-craft low-code platform following the current guide. Handles schema type/node, default config mapping, React render materials, registry, hints-based property panel, and optional panel entry."
user_invocable: true
---

# create-component

You are a component scaffolding expert for the **vision-craft** low-code visual platform. When the user asks to create a new **material component** (基础组件 / 图表组件), follow the procedure below **exactly**.

## Input

The user will provide:
- **ComponentName** (PascalCase, e.g. `Marquee`)
- **A description of the component's purpose and props** (or you should ask for clarification)
- **Which category**: `basic` or `chart` (infer from intent; default to `basic` if not specified)

Derive the following from the name:
- `kebab-name` → e.g. `marquee` (for file names like `marquee.config.ts`)
- `camelName` → e.g. `marquee` (for variable names like `marqueeDefaultConfig`)
- `ChineseName` → ask the user or infer a reasonable Chinese display name

## Step-by-step procedure

### Step 1: Define the type

**File: `frontend/src/core/schema/types.ts`**

Add `"ComponentName"` to the `ComponentType` union type.

Example — add `| "Marquee"` before the semicolon:
```ts
export type ComponentType =
    | "Text"
    // ... existing entries ...
    | "Marquee";
```

**File: `frontend/src/core/schema/basic.ts`**

1. Create a new interface that extends `BaseComponentNode`:
```ts
/**
 * 跑马灯组件（示例）
 */
export interface MarqueeComponent extends BaseComponentNode {
    type: "Marquee";
    props: {
        text: string;       // 滚动文字
        speed: number;      // 滚动速度
        fontSize: number;   // 字体大小
        color: string;      // 颜色
    };
}
```
2. Add the new interface to the `ComponentNode` union type:
```ts
export type ComponentNode =
    | TextComponent
    // ... existing entries ...
    | MarqueeComponent;
```

> **Note on Chinese enum values**: This project uses Chinese literals for certain enum props (e.g. `AlignCN = "左" | "居中" | "右"`, `TrendCN = "上升" | "下降" | "持平"`). Reuse existing Chinese type aliases when applicable. If the new component needs a new Chinese enum, define a `type` alias at the top of `basic.ts` following the same pattern.

> **Chart components**: If the user is creating a *chart* component, the node interface is typically defined under `frontend/src/core/schema/chart.ts` instead of `basic.ts` (still add the string type to `ComponentType` in `types.ts`). Follow existing chart interfaces in `chart.ts`.

### Step 2: Create default config

**File (basic): `frontend/src/config/basic-config/{kebab-name}.config.ts`**

```ts
import type { MarqueeComponent } from "@/core/schema/basic";

/**
 * Marquee 组件默认配置
 */
export const marqueeDefaultConfig: MarqueeComponent = {
    id: "",
    type: "Marquee",
    name: "跑马灯",      // Chinese display name
    props: {
        text: "这是一段滚动文字",
        speed: 50,
        fontSize: 16,
        color: "#000000",
    },
    style: {
        top: 0,
        left: 0,
        width: 300,       // reasonable default width
        height: 40,       // reasonable default height
        zIndex: 1,
    },
};
```

> **Guidelines**: `id` is always `""` (generated at runtime). Choose reasonable default `width`/`height` for the component type.

> **File (chart)**: Use `frontend/src/config/chart-config/{kebab-name}.config.ts` and type it with the corresponding chart node interface (see `frontend/src/core/schema/chart.ts`). Keep defaults aligned with existing chart configs.

### Step 3: Add property-panel hints (recommended)

This project no longer uses `basic-meta` / `FieldMeta` / `form-render` for component props. The property panel uses:
- `frontend/src/components/panels/property-panel/PropsFormRenderer.tsx` to infer controls from value types
- `frontend/src/config/hints/*` to provide Chinese titles, enums, min/max, placeholders, and hidden fields

**File (basic): `frontend/src/config/hints/basic.ts`**

Add a `FormHints` object (example):

```ts
import type { FormHints } from "./types";

export const marqueeHints: FormHints = {
    text:     { title: "滚动文字", widget: "textarea", placeholder: "请输入滚动文字" },
    speed:    { title: "滚动速度", min: 1, max: 200 },
    fontSize: { title: "字体大小", min: 12, max: 72 },
    color:    { title: "文字颜色", widget: "color", placeholder: "例如：#000000" },
};
```

**Then register in `frontend/src/config/hints/index.ts`:**
1. Add import from `./basic`
2. Add entry in `componentHintsRegistry`: `Marquee: marqueeHints,`

> **Hints tips**:
> - Use `widget: "color"` for hex colors.
> - Use `enum` + `widget: "radio"` / `"select"` for discrete options (Chinese enums are common in this repo).
> - Use `hidden: true` for advanced/internal props not meant for the panel.

### Step 4: Create the React render component

**File: `frontend/src/components/materials/basic/{ComponentName}.tsx`**

```tsx
import type { RendererProps } from "@/core/schema/types";
import type { MarqueeComponent } from "@/core/schema/basic";

/**
 * 跑马灯组件渲染实现
 */
export default function Marquee({ node }: RendererProps) {
    const props = node.props as MarqueeComponent["props"];

    return (
        <div
            style={{
                fontSize: `${props.fontSize}px`,
                color: props.color,
                overflow: "hidden",
                whiteSpace: "nowrap",
            }}
        >
            {props.text}
        </div>
    );
}
```

> **Pattern**: Always destructure `{ node }` from `RendererProps`, then cast `node.props as XxxComponent["props"]`. Keep the component focused — only render UI based on props.

> **Chart render file**: Put chart components under `frontend/src/components/materials/chart/{ComponentName}.tsx` and follow existing chart component patterns (usually wrapping ECharts and reading `node.dataSource` when applicable).

### Step 5: Register in the component registry

**File: `frontend/src/components/materials/registry.ts`**

1. Add import at top:
```ts
import Marquee from "./basic/Marquee";
```
2. Add registration call (before `RootContainer` registration):
```ts
ComponentRegistryManager.register(
    "Marquee",
    Marquee as unknown as RegistryComponent,
);
```

### Step 6: Add to default config mapping

**File: `frontend/src/config/index.ts`**

1. Add import:
```ts
import { marqueeDefaultConfig } from "./basic-config/marquee.config";
```
2. Add entry in `componentDefaultConfigs` object:
```ts
Marquee: marqueeDefaultConfig,
```

### Step 7: Add to the component panel (recommended)

**Basic components** → File: `frontend/src/components/panels/component-panel/BasicPanel.tsx`

1. Import an appropriate icon from `lucide-react` (choose one that best represents the component).
2. Add a new entry in the `component` array **before** the Container entry:
```ts
{ type: "Marquee", name: "跑马灯", icon: <SomeIcon className="h-5 w-5" /> },
```
> **Note**: `type` must exactly match the string in `ComponentType`. Choose icons from `lucide-react` that are already imported or add a new import.

**Chart components** → File: `frontend/src/components/panels/component-panel/ChartPanel.tsx`

Add the new chart entry into the appropriate `chartItemsByCategory` category:
```ts
{ type: "MarqueeChart", name: "跑马灯图（示例）", icon: <SomeIcon className="h-5 w-5" /> },
```

> Keep naming consistent with your `ComponentType`. Most chart components in this repo follow `XxxChart` naming (e.g. `BarChart`, `LineChart`).

## Checklist

After generating all files, verify:
- [ ] `ComponentType` union in `types.ts` includes the new type
- [ ] Node interface defined in `basic.ts` (or `chart.ts` for chart components) and added to the `ComponentNode` union
- [ ] Default config file created in `config/basic-config/` (or `config/chart-config/` for chart components)
- [ ] Hints added under `config/hints/basic.ts` or `config/hints/chart.ts` and registered in `config/hints/index.ts` (recommended)
- [ ] React component created in `components/materials/basic/`
- [ ] Component registered in `components/materials/registry.ts`
- [ ] Default config mapped in `config/index.ts`
- [ ] Entry added in `BasicPanel.tsx` (or `ChartPanel.tsx` for chart components)

## Important conventions

- **id**: Always `""` in default configs (UUID generated at runtime).
- **Chinese labels**: All user-facing text (`name`, hints `title`, panel names) should be in Chinese.
- **File naming**: Config files use `kebab-case` (e.g. `statistic-card.config.ts`). React components use `PascalCase` (e.g. `StatisticCard.tsx`).
- **Imports**: Use `@/` path alias for all imports (maps to `frontend/src/`).
- **Style defaults**: Every component must have `style` with `top: 0, left: 0, width, height, zIndex: 1`.
- **Hints completeness** (recommended): Provide hints for all user-facing props so the property panel shows readable Chinese labels and correct widgets.
