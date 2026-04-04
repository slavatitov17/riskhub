import { toast as sonnerToast, type ExternalToast } from 'sonner'

import { readBuiltInNotificationsEnabled } from '@/lib/notification-prefs'

type Msg = string | number

function guard<T>(fn: () => T): T | string {
  if (!readBuiltInNotificationsEnabled()) return ''
  return fn()
}

export const toast = {
  message: (msg: Msg, data?: ExternalToast) =>
    guard(() => sonnerToast.message(msg, data)),
  neutral: (msg: Msg, data?: ExternalToast) =>
    guard(() =>
      sonnerToast.message(msg, {
        className:
          '!border !border-border !bg-white !text-foreground shadow-md dark:!bg-white dark:!text-foreground',
        ...data
      })
    ),
  success: (msg: Msg, data?: ExternalToast) =>
    guard(() => sonnerToast.success(msg, data)),
  error: (msg: Msg, data?: ExternalToast) =>
    guard(() => sonnerToast.error(msg, data)),
  info: (msg: Msg, data?: ExternalToast) =>
    guard(() => sonnerToast.info(msg, data)),
  warning: (msg: Msg, data?: ExternalToast) =>
    guard(() => sonnerToast.warning(msg, data)),
  promise: sonnerToast.promise,
  custom: sonnerToast.custom,
  dismiss: sonnerToast.dismiss
}
