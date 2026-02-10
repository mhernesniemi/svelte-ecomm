import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";
import "./custom.css";

export const metadata = {
	title: "Hoikka Documentation"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" dir="ltr" suppressHydrationWarning>
			<Head
				color={{
					hue: { dark: 330, light: 330 },
					saturation: { dark: 80, light: 81 },
					lightness: { dark: 65, light: 50 }
				}}
			/>
			<body>
				<Layout
					navbar={
						<Navbar
							logo={
								<>
									<img src="/pute.png" alt="" className="hoikka-face" />
									<span className="hoikka-logo">Hoikka</span>
								</>
							}
							projectLink="https://github.com/your-org/hoikka"
						/>
					}
					pageMap={await getPageMap()}
					docsRepositoryBase="https://github.com/your-org/hoikka/tree/main/docs"
					footer={<Footer>Copyright © {new Date().getFullYear()} Hoikka.</Footer>}
				>
					{children}
				</Layout>
			</body>
		</html>
	);
}
