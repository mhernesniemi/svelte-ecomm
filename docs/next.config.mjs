import nextra from 'nextra';

const withNextra = nextra({
	contentDirBasePath: '/',
	defaultShowCopyCode: true
});

export default withNextra({
	output: 'export',
	trailingSlash: true,
	images: {
		unoptimized: true
	},
	eslint: {
		ignoreDuringBuilds: true
	}
});
