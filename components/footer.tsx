'use client'

import { cn } from "@/lib/utils";
import { Github } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Footer({ className }: { className?: string }) {
  const pathname = usePathname();
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  if (pathname.startsWith('/dashboard')) {
    return null
  }

  return (
    <footer className={cn("w-full py-6 text-center text-sm text-muted-foreground bg-slate-50", className)}>
      <div className="container">
        <p className="flex items-center justify-center gap-2">
            © {currentYear || 2024} 小學伴資料管理系統. All rights reserved.
        </p>
        
        <div className="mt-2 flex items-center justify-center gap-1">
          Powered by{" "}
          <a
            href="https://vercel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4"
          >
            Vercel
          </a>{" "}
          and built by
          <a
            href="https://github.com/ruby0322"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-4 w-4" />
            <span>Ruby</span>
          </a>
          with{" "}
          <a
            href="https://cursor.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4"
          >
            Cursor
          </a>
        </div>
      </div>
    </footer>
  )
} 