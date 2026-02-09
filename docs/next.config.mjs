import nextra from 'nextra';

const withNextra = nextra({
	contentDirBasePath: '/',
	defaultShowCopyCode: true
});

export default withNextra({
	basePath: '/docs',
	output: 'export',
	trailingSlash: true,
	images: {
		unoptimized: true
	}
});
