import nextra from 'nextra';

const withNextra = nextra({
	contentDirBasePath: '/'
});

export default withNextra({
	basePath: '/docs',
	output: 'export',
	images: {
		unoptimized: true
	}
});
