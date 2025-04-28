module.exports = {
	plugins: [
		require.resolve('@trivago/prettier-plugin-sort-imports'),
		require.resolve('prettier-plugin-tailwindcss'),
	],
	importOrder: ['^react', '^next', '<THIRD_PARTY_MODULES>', '^@\\/', '^\\.\\/'],
	importOrderSeparation: true,

	useTabs: true,

	tabWidth: 4,

	printWidth: 100,

	semi: true,

	singleQuote: true,

	quoteProps: 'as-needed',

	trailingComma: 'all',

	bracketSpacing: true,
};
