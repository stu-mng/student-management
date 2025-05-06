/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		serverActions: {
			bodySizeLimit: '4mb',
		},
	},
	// Enable standalone output for Docker deployments
	output: 'standalone',
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'via.placeholder.com',
				port: '',
			},
			{
				protocol: 'https',
				hostname: 'github.com',
				port: '',
			},
			{
				protocol: 'https',
				hostname: 'lh3.googleusercontent.com',
				port: '',
			},
		],
	},
	eslint: {
		// 警告：這會禁用生產環境構建時的 ESLint 檢查。
		// 僅在臨時需要時使用，並確保之後移除或設定為 false。
		ignoreDuringBuilds: true,
	},
};

module.exports = nextConfig;
