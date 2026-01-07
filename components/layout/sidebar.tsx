'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { Home, BarChart3, History, Settings } from 'lucide-react'


const navigation = [
    {name: 'Home', href:'/dashboard', icon:Home},
    {name: 'Progess', href:'/progress', icon:BarChart3},
    {name: 'History', href:'/history', icon:History},
    // {name: 'Settings', href:'/settings', icon:Settings}

]

export function SideBar() {
    const pathname =  usePathname()

    return (
        <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow border-r border-border pt-5 pb-4 overflow-y-auto">
        <nav className="flex-1 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-default',
                  isActive
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0 transition-default',
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>

    )
}