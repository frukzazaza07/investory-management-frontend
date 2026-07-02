import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLogin } from '@/hooks/useAuth'
import { getApiError } from '@/lib/apiError'

type Form = { email: string; password: string }

export default function LoginPage() {
  const { t } = useTranslation()
  const login = useLogin()

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('validation.invalidEmail')),
        password: z.string().min(1, t('validation.passwordRequired')),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: Form) => {
    try {
      await login.mutateAsync(values)
    } catch (err) {
      toast.error(getApiError(err))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Investory</CardTitle>
          <p className="text-sm text-gray-500 text-center mt-1">{t('auth.signInDesc')}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">{t('common.email')}</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
            <p className="text-center text-sm text-gray-500">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-blue-600 hover:underline">
                {t('auth.register')}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
