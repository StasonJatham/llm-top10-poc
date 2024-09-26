import React from 'react'

import { cn } from '@/lib/utils'
import { ExternalLink } from '@/components/external-link'

export function FooterText({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'px-2 text-center text-xs leading-normal text-muted-foreground',
        className
      )}
      {...props}
    >
      Demo built by{' '}
      <ExternalLink href="https://exploit.to/about/">
        Karl Machleidt
      </ExternalLink>{' '}
      with {'<3'} .
    </p>
  )
}
