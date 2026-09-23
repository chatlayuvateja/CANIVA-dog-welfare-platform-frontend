/**
 * Reusable labelled form field - Session 14.
 *
 * Renders an <input>, <select> or <textarea> with its label and, when
 * present, the per-field error coming from the backend's ApiError
 * `fieldErrors` map (Spring field name -> message):
 *
 *   <FormField label="Email" name="email" type="email" required
 *              value={form.email} onChange={handleChange}
 *              error={errors.email} />
 *
 *   <FormField label="Event type" name="eventType"
 *              options={[{ value: 'DOG_REGISTRATION', label: 'Dog registration' }]}
 *              value={form.eventType} onChange={handleChange} />
 *
 *   <FormField label="Description" name="description" type="textarea" … />
 */
export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  options,
  ...rest
}) {
  const inputProps = {
    id: name,
    name,
    value: value ?? '',
    onChange,
    required,
    'aria-invalid': error ? true : undefined,
    ...rest,
  }

  return (
    <div className="form-field">
      <label htmlFor={name}>
        {label}
        {required && (
          <span aria-hidden="true" className="required-mark">
            {' '}
            *
          </span>
        )}
      </label>

      {options ? (
        <select {...inputProps}>
          <option value="">Select…</option>
          {options.map((option) => {
            const opt = typeof option === 'string' ? { value: option, label: option } : option
            return (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            )
          })}
        </select>
      ) : type === 'textarea' ? (
        <textarea {...inputProps} />
      ) : (
        <input type={type} {...inputProps} />
      )}

      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
