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
		unoptimized: false, // Keep optimization enabled for external images
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
			{
				protocol: 'https',
				hostname: 'drive.google.com',
				port: '',
			},
			{
				protocol: 'https',
				hostname: 'student-management-seven-theta.vercel.app',
				port: '',
			},
			{
				protocol: 'http',
				hostname: 'localhost',
				port: '',
			},
		],
	},
	eslint: {
		// 警告：這會禁用生產環境構建時的 ESLint 檢查。
		// 僅在臨時需要時使用，並確保之後移除或設定為 false。
		ignoreDuringBuilds: true,
	},
	// Disable static optimization for pages requiring Supabase
	// to prevent prerendering issues when env vars are missing
	env: {
		// Provide fallback values for build time
		NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co',
		NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
	},
};

module.exports = nextConfig;
