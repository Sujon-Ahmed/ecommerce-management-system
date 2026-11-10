/**
 * Build a FormData payload for multipart requests.
 *
 * Laravel cannot parse multipart bodies on PUT/PATCH, so callers spoof the
 * method with a `_method` field when uploading files on update.
 */
export function toFormData(values: Record<string, unknown>): FormData {
  const form = new FormData()

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null) {
      continue
    }

    if (value instanceof File) {
      form.append(key, value)
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        form.append(`${key}[]`, String(item))
      }
      continue
    }

    if (typeof value === 'boolean') {
      form.append(key, value ? '1' : '0')
      continue
    }

    form.append(key, String(value))
  }

  return form
}
