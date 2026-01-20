import React from "react";
import ComponentCreator from "@docusaurus/ComponentCreator";

export default [
	{
		path: "/__docusaurus/debug",
		component: ComponentCreator("/__docusaurus/debug", "5ff"),
		exact: true
	},
	{
		path: "/__docusaurus/debug/config",
		component: ComponentCreator("/__docusaurus/debug/config", "5ba"),
		exact: true
	},
	{
		path: "/__docusaurus/debug/content",
		component: ComponentCreator("/__docusaurus/debug/content", "a2b"),
		exact: true
	},
	{
		path: "/__docusaurus/debug/globalData",
		component: ComponentCreator("/__docusaurus/debug/globalData", "c3c"),
		exact: true
	},
	{
		path: "/__docusaurus/debug/metadata",
		component: ComponentCreator("/__docusaurus/debug/metadata", "156"),
		exact: true
	},
	{
		path: "/__docusaurus/debug/registry",
		component: ComponentCreator("/__docusaurus/debug/registry", "88c"),
		exact: true
	},
	{
		path: "/__docusaurus/debug/routes",
		component: ComponentCreator("/__docusaurus/debug/routes", "000"),
		exact: true
	},
	{
		path: "/",
		component: ComponentCreator("/", "549"),
		routes: [
			{
				path: "/",
				component: ComponentCreator("/", "eb6"),
				routes: [
					{
						path: "/",
						component: ComponentCreator("/", "d67"),
						routes: [
							{
								path: "/api/endpoints",
								component: ComponentCreator("/api/endpoints", "93e"),
								exact: true,
								sidebar: "docs"
							},
							{
								path: "/api/form-actions",
								component: ComponentCreator("/api/form-actions", "9a2"),
								exact: true,
								sidebar: "docs"
							},
							{
								path: "/core/architecture",
								component: ComponentCreator("/core/architecture", "eaa"),
								exact: true,
								sidebar: "docs"
							},
							{
								path: "/core/database",
								component: ComponentCreator("/core/database", "4ff"),
								exact: true,
								sidebar: "docs"
							},
							{
								path: "/core/providers",
								component: ComponentCreator("/core/providers", "a02"),
								exact: true,
								sidebar: "docs"
							},
							{
								path: "/core/services",
								component: ComponentCreator("/core/services", "a78"),
								exact: true,
								sidebar: "docs"
							},
							{
								path: "/features/assets",
								component: ComponentCreator("/features/assets", "258"),
								exact: true,
								sidebar: "docs"
							},
							{
								path: "/features/cart",
								component: ComponentCreator("/features/cart", "642"),
								exact: true,
								sidebar: "docs"
							},
							{
								path: "/features/collections",
								component: ComponentCreator("/features/collections", "699"),
								exact: true,
								sidebar: "docs"
							},
							{
								path: "/features/orders",
								component: ComponentCreator("/features/orders", "095"),
								exact: true,
								sidebar: "docs"
							},
							{
								path: "/features/payments",
								component: ComponentCreator("/features/payments", "ba0"),
								exact: true,
								sidebar: "docs"
							},
							{
								path: "/features/products",
								component: ComponentCreator("/features/products", "1b2"),
								exact: true,
								sidebar: "docs"
							},
							{
								path: "/features/shipping",
								component: ComponentCreator("/features/shipping", "965"),
								exact: true,
								sidebar: "docs"
							},
							{
								path: "/getting-started/configuration",
								component: ComponentCreator(
									"/getting-started/configuration",
									"641"
								),
								exact: true,
								sidebar: "docs"
							},
							{
								path: "/getting-started/installation",
								component: ComponentCreator("/getting-started/installation", "e0c"),
								exact: true,
								sidebar: "docs"
							},
							{
								path: "/getting-started/project-structure",
								component: ComponentCreator(
									"/getting-started/project-structure",
									"508"
								),
								exact: true,
								sidebar: "docs"
							},
							{
								path: "/integrations/erp-example",
								component: ComponentCreator("/integrations/erp-example", "a4f"),
								exact: true,
								sidebar: "docs"
							},
							{
								path: "/integrations/events",
								component: ComponentCreator("/integrations/events", "410"),
								exact: true,
								sidebar: "docs"
							},
							{
								path: "/integrations/job-queue",
								component: ComponentCreator("/integrations/job-queue", "1fb"),
								exact: true,
								sidebar: "docs"
							},
							{
								path: "/integrations/overview",
								component: ComponentCreator("/integrations/overview", "eab"),
								exact: true,
								sidebar: "docs"
							},
							{
								path: "/integrations/sync-runner",
								component: ComponentCreator("/integrations/sync-runner", "4de"),
								exact: true,
								sidebar: "docs"
							},
							{
								path: "/integrations/webhooks",
								component: ComponentCreator("/integrations/webhooks", "d1d"),
								exact: true,
								sidebar: "docs"
							},
							{
								path: "/",
								component: ComponentCreator("/", "7da"),
								exact: true,
								sidebar: "docs"
							}
						]
					}
				]
			}
		]
	},
	{
		path: "*",
		component: ComponentCreator("*")
	}
];
