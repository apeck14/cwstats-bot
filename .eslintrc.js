module.exports = {
	env: {
		browser: true,
		es2022: true,
		node: true
	},
	extends: [
		"eslint:recommended",
		"plugin:sonarjs/recommended",
		"plugin:promise/recommended"
	],
	plugins: [
		"unicorn",
		"sonarjs",
		"promise"
	],
	parserOptions: {
		ecmaVersion: "latest",
		sourceType: "module"
	},
	rules: {
		"array-bracket-newline": [
			"error", {
				multiline: true
			}
		],
		"array-element-newline": [
			"error", {
				minItems: 3
			}
		],
		"brace-style": ["error", "stroustrup"],
		"comma-dangle": [
			"error", {
				arrays: "never",
				objects: "only-multiline",
				imports: "never",
				exports: "never",
				functions: "never"
			}
		],
		"curly": ["error", "multi-or-nest"],
		"eol-last": ["error", "never"],
		"indent": ["error", "tab"],
		"keyword-spacing": [
			"error", {
				after: true
			}
		],
		"no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
		"no-multiple-empty-lines": [
			"error", {
				max: 1,
				maxEOF: 0,
				maxBOF: 0
			}
		],
		"no-trailing-spaces": "error",
		"no-unused-vars": [
			"error", {
				vars: "all",
				args: "none"
			}
		],
		"object-curly-newline": [
			"error", {
				ObjectExpression: {
					minProperties: 1
				},
				ObjectPattern: {
					minProperties: 7
				},
				ImportDeclaration: {
					minProperties: 7
				},
				ExportDeclaration: {
					minProperties: 5
				}
			}
		],
		"object-curly-spacing": ["error", "always"],
		"object-property-newline": [
			"error", {
				allowAllPropertiesOnSameLine: false
			}
		],
		"padding-line-between-statements": [
			"error", {
				blankLine: "always",
				prev: "*",
				next: "return"
			}
		],
		"semi": ["error", "never"],
		"quote-props": ["error", "consistent-as-needed"],
		"sonarjs/cognitive-complexity": "off",
		"sonarjs/no-duplicate-string": "off"
	}
}