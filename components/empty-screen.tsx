import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <h1 className="text-lg font-semibold">
          Prompt Piraterie: Auf Kaperfahrt im LLM-Ozean
        </h1>
        <p className="leading-normal text-muted-foreground">
          Dies ist eine Demo-Umgebung zur Demonstration der{' '}
          <ExternalLink href="https://genai.owasp.org/llm-top-10/">
            OWASP LLM Top 10
          </ExternalLink>
          . Erkunde, wie die Risiken von LLMs in verschiedenen Szenarien
          aufgezeigt werden.
        </p>
        <p className="leading-normal text-muted-foreground">
          Weitere Informationen findest du{' '}
          <ExternalLink href="https://doc.karlcom.de/s/zdKTyJ405">
            hier in meinem Wiki
          </ExternalLink>
          .
        </p>
      </div>
    </div>
  )
}
