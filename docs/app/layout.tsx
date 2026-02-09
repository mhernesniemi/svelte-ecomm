import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import { Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import 'nextra-theme-docs/style.css';

export const metadata = {
	title: 'Hoikka Documentation'
};

export default async function RootLayout({
	children
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" dir="ltr" suppressHydrationWarning>
			<Head />
			<body>
				<Layout
					navbar={
						<Navbar
							logo={<b>Hoikka</b>}
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
