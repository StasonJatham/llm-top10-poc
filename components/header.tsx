import * as React from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import { auth } from '@/auth'
import { Button, buttonVariants } from '@/components/ui/button'
import { IconGitHub, IconSeparator } from '@/components/ui/icons'
import { UserMenu } from '@/components/user-menu'
import { SidebarMobile } from './sidebar-mobile'
import { SidebarToggle } from './sidebar-toggle'
import { ChatHistory } from './chat-history'
import { Session } from '@/lib/types'
import { House, SquarePen } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import SelectOWASP from './owasp'
import { SecureSystem } from './secure-system'

async function UserOrLogin() {
  const session = (await auth()) as Session
  return (
    <>
      {session?.user ? (
        <>
          <SidebarMobile>
            <ChatHistory userId={session.user.id} />
          </SidebarMobile>
          <SidebarToggle />
        </>
      ) : (
        <Link href="/new" rel="nofollow" className="flex">
          <House strokeWidth={1} className="hidden size-6 mr-2 dark:block" />
          KarlGPT
        </Link>
      )}
      <div className="flex items-center">
        <IconSeparator className="size-6 text-muted-foreground/50" />
        {session?.user ? (
          <div className="flex">
            <UserMenu user={session.user} />
          </div>
        ) : (
          <Button variant="link" asChild className="-ml-2">
            <Link href="/login">Login</Link>
          </Button>
        )}
      </div>
    </>
  )
}

export async function Header() {
  const session = (await auth()) as Session

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <div className="flex items-center">
        <React.Suspense fallback={<div className="flex-1 overflow-auto" />}>
          <UserOrLogin />
          <div className="pl-2">
            <SelectOWASP />
          </div>
        </React.Suspense>
      </div>
      <div className="flex items-center justify-end space-x-2">
        {!session?.user ? (
          <a
            target="_blank"
            href="https://github.com/StasonJatham/llm-top10-poc"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            <IconGitHub />
            <span className="hidden ml-2 md:flex">GitHub</span>
          </a>
        ) : (
          <div className="flex items-center space-x-4">
            <SecureSystem />
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/new">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8  bg-background p-0 sm:left-4"
                  >
                    <SquarePen
                      strokeWidth={1}
                      className="h-4 w-4  text-black dark:text-white"
                    />
                    <span className="sr-only">New Chat</span>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>New Chat</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </header>
  )
}
