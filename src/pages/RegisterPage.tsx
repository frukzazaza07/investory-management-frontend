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
import { useRegister } from '@/hooks/useAuth'
import { getApiError } from '@/lib/apiError'

type Form = { email: string; password: string; confirm: string }

export default function RegisterPage() {
  const { t } = useTranslation()
  const register_ = useRegister()

  const schema = useMemo(
    () =>
      z
        .object({
          email: z.string().email(t('validation.invalidEmail')),
          password: z.string().min(8, t('validation.passwordMin')),
          confirm: z.string(),
        })
        .refine((d) => d.password === d.confirm, {
          message: t('validation.passwordMismatch'),
          path: ['confirm'],
        }),
    [t],
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email, password }: Form) => {
    try {
      await register_.mutateAsync({ email, password })
      toast.success(t('auth.accountCreated'))
    } catch (err) {
      toast.error(getApiError(err))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{t('auth.createAccount')}</CardTitle>
          <p className="text-sm text-gray-500 text-center mt-1">{t('auth.getStarted')}</p>
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
              <Input id="password" type="password" placeholder={t('auth.passwordMin')} {...register('password')} />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm">{t('auth.confirmPassword')}</Label>
              <Input id="confirm" type="password" placeholder="••••••••" {...register('confirm')} />
              {errors.confirm && <p className="text-xs text-red-500">{errors.confirm.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={register_.isPending}>
              {register_.isPending ? t('auth.creatingAccount') : t('auth.createAccount')}
            </Button>
            <p className="text-center text-sm text-gray-500">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
                {t('auth.signIn')}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
