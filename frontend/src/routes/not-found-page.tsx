import { Compass, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg">
        <EmptyState
          icon={<Compass className="size-5" aria-hidden="true" />}
          title="Page not found"
          description="The page you are looking for does not exist or may have been moved."
          action={
            <Button asChild>
              <Link to="/">
                <Home />
                Back to storefront
              </Link>
            </Button>
          }
        />
      </Card>
    </div>
  )
}
