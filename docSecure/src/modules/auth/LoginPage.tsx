import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from './AuthContext'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' }
  })
  const { login } = useAuth()

  const onSubmit = async (values: FormValues) => {
    await login(values)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 sm:py-6">
      <div className="flex flex-col items-center w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-blue-500/10">
        <h1 className="text-2xl font-semibold text-slate-50 uppercase">Connexion</h1>
        <p className="text-sm text-slate-300 mt-6 text-center">
          Accédez à votre espace sécurisé SecureDocs.
        </p>

        <form className="flex flex-col justify-center space-y-4 mt-6 w-full" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label className="text-sm text-slate-200">Email</label>
            <input
              required
              type="email"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-50 outline-none ring-blue-500 focus:ring"
              {...register('email')}
            />
            {formState.errors.email && (
              <p className="text-sm text-red-400">{formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-200">Mot de passe</label>
            <input
              type="password"
              required
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-50 outline-none ring-blue-500 focus:ring"
              {...register('password')}
            />
            {formState.errors.password && (
              <p className="text-sm text-red-400">{formState.errors.password.message}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition cursor-pointer hover:scale-[1.02] hover:duration-200 hover:ease-in-out"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  )
}


