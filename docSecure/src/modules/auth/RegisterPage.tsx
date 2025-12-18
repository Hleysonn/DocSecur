import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from './AuthContext'
import { api } from '../http/api'

const schema = z
  .object({
    name: z.string().min(2, 'Nom trop court'),
    email: z.string().email('Email invalide'),
    password: z.string().min(8, '8 caractères minimum'),
    confirm: z.string()
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm']
  })

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const { register: registerField, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirm: '' }
  })
  const { login } = useAuth()

  const onSubmit = async (values: FormValues) => {
    await api.post('/auth/register', {
      name: values.name,
      email: values.email,
      password: values.password
    })
    await login({ email: values.email, password: values.password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 sm:py-16">
      <div className="flex flex-col items-center w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-blue-500/10">
        <h1 className="text-2xl font-semibold text-slate-50 uppercase">Inscription</h1>
        <p className="text-sm text-slate-300 mt-6 text-center">
          Créez votre compte pour accéder à SecureDocs.
        </p>

        <form className="flex flex-col justify-center space-y-4 mt-6 w-full" onSubmit={handleSubmit(onSubmit)}>
          <Field label="Nom complet" error={formState.errors.name?.message}>
            <input
              required
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-50 outline-none ring-blue-500 focus:ring"
              {...registerField('name')}
            />
          </Field>

          <Field label="Email" error={formState.errors.email?.message}>
            <input
              required
              type="email"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-50 outline-none ring-blue-500 focus:ring"
              {...registerField('email')}
            />
          </Field>

          <Field label="Mot de passe" error={formState.errors.password?.message}>
            <input
              required
              type="password"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-50 outline-none ring-blue-500 focus:ring"
              {...registerField('password')}
            />
          </Field>

          <Field label="Confirmer le mot de passe" error={formState.errors.confirm?.message}>
            <input
              required
              type="password"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-50 outline-none ring-blue-500 focus:ring"
              {...registerField('confirm')}
            />
          </Field>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition cursor-pointer hover:scale-[1.02] hover:duration-200 hover:ease-in-out"
          >
            Créer un compte
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  children
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-slate-200">{label}</label>
      {children}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}


