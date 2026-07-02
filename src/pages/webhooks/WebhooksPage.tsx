import { useState, useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Play, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import {
  useWebhooks,
  useWebhookLogs,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useTestWebhook,
  type WebhookBody,
} from '@/hooks/useWebhooks'
import { getApiError } from '@/lib/apiError'
import { formatDateTime } from '@/lib/utils'
import type { Webhook } from '@/types'

type EventKey = 'STOCK_UPDATED' | 'STOCK_LOW' | 'STOCK_OUT'
const ALL_EVENTS: EventKey[] = ['STOCK_UPDATED', 'STOCK_LOW', 'STOCK_OUT']

type Form = {
  name: string
  url: string
  secret?: string
  events: EventKey[]
  is_active: boolean
}

function WebhookDialog({
  open,
  onClose,
  webhook,
}: {
  open: boolean
  onClose: () => void
  webhook?: Webhook
}) {
  const { t } = useTranslation()
  const create = useCreateWebhook()
  const update = useUpdateWebhook(webhook?.id ?? '')
  const isPending = create.isPending || update.isPending

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('validation.webhookNameRequired')),
        url: z.string().url(t('validation.webhookUrlRequired')),
        secret: z.string().optional(),
        events: z
          .array(z.enum(['STOCK_UPDATED', 'STOCK_LOW', 'STOCK_OUT']))
          .min(1, t('validation.webhookEventsMin')),
        is_active: z.boolean(),
      }),
    [t],
  )

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (open) {
      reset(
        webhook
          ? {
              name: webhook.name,
              url: webhook.url,
              secret: '',
              events: webhook.events,
              is_active: webhook.is_active,
            }
          : { name: '', url: '', secret: '', events: ['STOCK_UPDATED'], is_active: true },
      )
    }
  }, [open, webhook, reset])

  const onSubmit = async (values: Form) => {
    const body: WebhookBody = {
      name: values.name,
      url: values.url,
      events: values.events,
      is_active: values.is_active,
      ...(values.secret ? { secret: values.secret } : {}),
    }
    try {
      if (webhook) {
        await update.mutateAsync(body)
        toast.success(t('webhooks.updated'))
      } else {
        await create.mutateAsync(body)
        toast.success(t('webhooks.createdToast'))
      }
      onClose()
    } catch (err) {
      toast.error(getApiError(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{webhook ? t('webhooks.editTitle') : t('webhooks.newTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1">
            <Label>{t('common.name')} *</Label>
            <Input {...register('name')} placeholder="My Webhook" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>{t('webhooks.endpointUrl')} *</Label>
            <Input {...register('url')} placeholder="https://your-server.com/hook" />
            {errors.url && <p className="text-xs text-red-500">{errors.url.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>{t('webhooks.secret')}</Label>
            <Input {...register('secret')} type="password" placeholder={t('webhooks.secretPlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label>{t('common.events')} *</Label>
            <Controller
              name="events"
              control={control}
              render={({ field }) => (
                <div className="space-y-1">
                  {ALL_EVENTS.map((event) => (
                    <label key={event} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={field.value.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            field.onChange([...field.value, event])
                          } else {
                            field.onChange(field.value.filter((v) => v !== event))
                          }
                        }}
                      />
                      <span className="text-sm">{event.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              )}
            />
            {errors.events && <p className="text-xs text-red-500">{errors.events.message}</p>}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded" {...register('is_active')} />
            <span className="text-sm">{t('common.active')}</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('common.saving') : webhook ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function LogsDialog({ open, onClose, webhookId }: { open: boolean; onClose: () => void; webhookId: string }) {
  const { t } = useTranslation()
  const { data: logs, isLoading } = useWebhookLogs(open ? webhookId : '')
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('webhooks.logs')}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-2">
            {logs?.length === 0 && (
              <p className="text-center text-gray-400 py-8">{t('webhooks.noLogs')}</p>
            )}
            {logs?.map((log) => (
              <div
                key={log.id}
                className={`rounded-lg p-3 text-sm ${log.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{log.event}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={log.success ? 'success' : 'destructive'}>
                      {log.status_code}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatDateTime(log.attempted_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function WebhooksPage() {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [logsDialogOpen, setLogsDialogOpen] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | undefined>()
  const [logsWebhookId, setLogsWebhookId] = useState('')

  const { data: webhooks, isLoading } = useWebhooks()
  const deleteWebhook = useDeleteWebhook()

  const openEdit = (w: Webhook) => { setSelectedWebhook(w); setDialogOpen(true) }
  const openCreate = () => { setSelectedWebhook(undefined); setDialogOpen(true) }
  const openLogs = (id: string) => { setLogsWebhookId(id); setLogsDialogOpen(true) }

  const handleDelete = async (w: Webhook) => {
    if (!window.confirm(t('webhooks.deleteConfirm', { name: w.name }))) return
    try {
      await deleteWebhook.mutateAsync(w.id)
      toast.success(t('webhooks.deleted'))
    } catch (err) {
      toast.error(getApiError(err))
    }
  }

  function TestButton({ webhookId }: { webhookId: string }) {
    const test = useTestWebhook(webhookId)
    return (
      <Button
        variant="ghost"
        size="icon"
        title={t('webhooks.sendTest')}
        disabled={test.isPending}
        onClick={async () => {
          try {
            await test.mutateAsync()
            toast.success(t('webhooks.testSent'))
          } catch (err) {
            toast.error(getApiError(err))
          }
        }}
      >
        <Play className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('webhooks.title')}</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('webhooks.addWebhook')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 text-sm text-gray-500">
          {t('webhooks.description')}{' '}
          <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">STOCK_UPDATED</code>,{' '}
          <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">STOCK_LOW</code>,{' '}
          <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">STOCK_OUT</code>
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('common.url')}</TableHead>
                <TableHead>{t('common.events')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead className="w-36" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                    {t('webhooks.notFound')}
                  </TableCell>
                </TableRow>
              ) : (
                webhooks?.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.name}</TableCell>
                    <TableCell className="font-mono text-xs max-w-xs truncate">{w.url}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {w.events.map((e) => (
                          <Badge key={e} variant="outline" className="text-xs">
                            {e.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={w.is_active ? 'success' : 'secondary'}>
                        {w.is_active ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t('webhooks.viewLogs')}
                          onClick={() => openLogs(w.id)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <TestButton webhookId={w.id} />
                        <Button variant="ghost" size="icon" onClick={() => openEdit(w)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(w)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <WebhookDialog open={dialogOpen} onClose={() => setDialogOpen(false)} webhook={selectedWebhook} />
      <LogsDialog
        open={logsDialogOpen}
        onClose={() => setLogsDialogOpen(false)}
        webhookId={logsWebhookId}
      />
    </div>
  )
}
