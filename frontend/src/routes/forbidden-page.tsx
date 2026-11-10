import { ShieldAlert } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/features/auth/auth-context'
import { homePathFor } from '@/features/auth/home-path'

export function ForbiddenPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg">
        <EmptyState
          icon={<ShieldAlert className="size-5" aria-hidden="true" />}
          title="Access denied"
          description="Your account does not have permission to view this area. If you believe this is a mistake, contact an administrator."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Go back
              </Button>
              <Button asChild>
                <Link to={user ? homePathFor(user) : '/'}>
                  {user ? 'Go to dashboard' : 'Back to storefront'}
                </Link>
              </Button>
            </div>
          }
        />
      </Card>
    </div>
  )
}
