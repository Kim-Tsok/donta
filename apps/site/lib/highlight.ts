import { codeToHtml, type ThemeRegistration } from "shiki";

// Palette-matched theme so code sits naturally on the page.
const donta: ThemeRegistration = {
  name: "donta",
  type: "dark",
  colors: { "editor.background": "#00000000", "editor.foreground": "#f2f3f7" },
  tokenColors: [
    { scope: ["comment"], settings: { foreground: "#5c627a", fontStyle: "italic" } },
    { scope: ["keyword", "storage", "storage.type", "keyword.control"], settings: { foreground: "#bfcbf0" } },
    { scope: ["string", "string.quoted"], settings: { foreground: "#7cf2c3" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call"], settings: { foreground: "#f0d6a8" } },
    { scope: ["entity.name.tag", "support.class.component"], settings: { foreground: "#bfcbf0" } },
    { scope: ["entity.other.attribute-name"], settings: { foreground: "#a0ade0" } },
    { scope: ["constant", "constant.numeric", "constant.language"], settings: { foreground: "#f0a8c0" } },
    { scope: ["variable.other.property", "support.type.property-name"], settings: { foreground: "#d6dbec" } },
    { scope: ["punctuation", "meta.brace", "keyword.operator"], settings: { foreground: "#8a90a6" } },
  ],
};

const dontaLight: ThemeRegistration = {
  name: "donta-light",
  type: "light",
  colors: { "editor.background": "#00000000", "editor.foreground": "#14161f" },
  tokenColors: [
    { scope: ["comment"], settings: { foreground: "#8a90a6", fontStyle: "italic" } },
    { scope: ["keyword", "storage", "storage.type", "keyword.control"], settings: { foreground: "#4c5bb0" } },
    { scope: ["string", "string.quoted"], settings: { foreground: "#087a52" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call"], settings: { foreground: "#9a5b00" } },
    { scope: ["entity.name.tag", "support.class.component"], settings: { foreground: "#4c5bb0" } },
    { scope: ["entity.other.attribute-name"], settings: { foreground: "#6b78c4" } },
    { scope: ["constant", "constant.numeric", "constant.language"], settings: { foreground: "#b0306a" } },
    { scope: ["variable.other.property", "support.type.property-name"], settings: { foreground: "#2a2f45" } },
    { scope: ["punctuation", "meta.brace", "keyword.operator"], settings: { foreground: "#6b7088" } },
  ],
};

export function highlight(code: string, lang: "ts" | "tsx") {
  return codeToHtml(code, {
    lang,
    themes: { dark: donta, light: dontaLight },
    // Emit both palettes as CSS variables; globals.css picks one per theme.
    defaultColor: false,
    transformers: [
      {
        line(node, line) {
          node.properties.style = `--i:${line}`;
        },
      },
    ],
  });
}
