import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">學生資料管理系統</h1>
        <p className="text-lg text-muted-foreground">歡迎使用學生資料管理系統，請選擇您要進入的頁面</p>
        <div className="flex flex-col space-y-4 pt-4">
          <Link href="/login" passHref>
            <Button className="w-full" size="lg">
              登入系統
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
