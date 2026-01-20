import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
	title: "Hoikka",
	tagline: "Lightweight e-commerce for SvelteKit",
	favicon: "img/favicon.ico",

	url: "https://hoikka.dev",
	baseUrl: "/",

	organizationName: "hoikka",
	projectName: "hoikka",

	onBrokenLinks: "throw",
	onBrokenMarkdownLinks: "warn",

	i18n: {
		defaultLocale: "en",
		locales: ["en"]
	},

	presets: [
		[
			"classic",
			{
				docs: {
					sidebarPath: "./sidebars.ts",
					routeBasePath: "/"
				},
				blog: false,
				theme: {
					customCss: "./src/css/custom.css"
				}
			} satisfies Preset.Options
		]
	],

	themeConfig: {
		navbar: {
			title: "Hoikka",
			items: [
				{
					type: "docSidebar",
					sidebarId: "docs",
					position: "left",
					label: "Documentation"
				},
				{
					href: "https://github.com/your-org/hoikka",
					label: "GitHub",
					position: "right"
				}
			]
		},
		footer: {
			style: "dark",
			links: [
				{
					title: "Docs",
					items: [
						{
							label: "Getting Started",
							to: "/getting-started"
						},
						{
							label: "Architecture",
							to: "/architecture"
						}
					]
				}
			],
			copyright: `Copyright © ${new Date().getFullYear()} Hoikka.`
		},
		prism: {
			theme: prismThemes.github,
			darkTheme: prismThemes.dracula,
			additionalLanguages: ["bash", "typescript"]
		}
	} satisfies Preset.ThemeConfig
};

export default config;
