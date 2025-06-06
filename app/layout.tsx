import { AuthProvider } from "@/components/auth-provider"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "學生資料管理系統",
  description: "提供教師查詢學生資料和管理員管理學生資訊的系統"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-S6QMCYNM83"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-S6QMCYNM83');
            `,
          }}
        />
        <link rel="icon" href="/logo.png" sizes="any" />
      </head>
      <body className={inter.className}>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" 
          enableSystem 
          disableTransitionOnChange
          storageKey="theme"
        >
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster />
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
