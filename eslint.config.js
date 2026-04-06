const js = require("@eslint/js");

module.exports = [
    js.configs.recommended,
    {
        files: ["build.js"],
        languageOptions: {
            globals: {
                require: "readonly",
                module: "readonly",
                __dirname: "readonly",
                console: "readonly",
                process: "readonly"
            }
        },
        rules: {
            "no-unused-vars": "warn",
            "no-console": "off",
            "indent": ["error", 4],
            "quotes": ["error", "single"],
            "semi": ["error", "always"]
        }
    },
    {
        files: ["templates/*.ejs"],
        // 针对 EJS 模板中的脚本，虽然 ESLint 默认不处理 HTML，但我们为未来可能的独立脚本做准备
        languageOptions: {
            globals: {
                window: "readonly",
                document: "readonly",
                console: "readonly"
            }
        }
    }
];
