// export function LandingPage() {
//   const features = [
//     { title: 'Chiffrement fort', desc: 'AES-256-GCM, aucune donnée en clair, tokens rotatifs.' },
//     { title: 'Contrôle des accès', desc: 'Rôles USER / MANAGER / ADMIN et partage granulaire.' },
//     { title: 'Traçabilité', desc: 'Logs horodatés pour chaque action sensible.' }
//   ]

//   return (
//     <div className="min-h-screen bg-slate-950 text-slate-50">
//       <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12">
//         <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
//           <div className="flex items-center gap-3">
//             <div className="rounded-lg bg-blue-600/20 p-3 ring-1 ring-blue-500/40">
//               <span className="text-lg font-semibold text-blue-200">SD</span>
//             </div>
//             <div>
//               <p className="text-sm uppercase tracking-[0.2em] text-blue-300">SecureDocs</p>
//               <p className="text-sm text-slate-300">Gestion et partage sécurisé des documents</p>
//             </div>
//           </div>
//           <div className="flex flex-wrap gap-3 text-sm">
//             <a
//               href="/login"
//               className="rounded-lg border border-slate-700 px-4 py-2 hover:border-slate-500"
//             >
//               Connexion
//             </a>
//             <a
//               href="/register"
//               className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500"
//             >
//               Créer un compte
//             </a>
//           </div>
//         </header>

//         <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
//           <div className="space-y-6">
//             <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200 ring-1 ring-blue-500/30">
//               Sécurité d&apos;entreprise • Traçabilité • Chiffrement fort
//             </div>
//             <h1 className="text-4xl font-bold leading-tight text-slate-50 sm:text-5xl">
//               Stockez, chiffrez et partagez vos documents sensibles en toute confiance.
//             </h1>
//             <p className="text-lg text-slate-300">
//               Authentification par rôles, chiffrement AES-256-GCM, journaux d’audit immuables et
//               contrôle fin des accès. Conçu pour les équipes qui doivent être rapides sans sacrifier
//               la conformité.
//             </p>
//             <div className="flex flex-wrap gap-3 text-sm text-slate-200">
//               <span className="rounded-lg bg-slate-900 px-3 py-2 ring-1 ring-slate-800">
//                 JWT access/refresh
//               </span>
//               <span className="rounded-lg bg-slate-900 px-3 py-2 ring-1 ring-slate-800">
//                 Hash Argon2id
//               </span>
//               <span className="rounded-lg bg-slate-900 px-3 py-2 ring-1 ring-slate-800">
//                 Rate limiting login
//               </span>
//               <span className="rounded-lg bg-slate-900 px-3 py-2 ring-1 ring-slate-800">
//                 RGPD ready
//               </span>
//             </div>
//           </div>

//           <div className="space-y-5 rounded-2xl bg-slate-900/50 p-6 ring-1 ring-slate-800 shadow-lg shadow-blue-500/10">
//             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//               {features.map((feature) => (
//                 <div
//                   key={feature.title}
//                   className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-lg shadow-blue-500/5"
//                 >
//                   <h3 className="text-base font-semibold text-slate-50">{feature.title}</h3>
//                   <p className="mt-2 text-sm text-slate-300">{feature.desc}</p>
//                 </div>
//               ))}
//             </div>
//             <div className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-600/20 to-blue-400/10 p-4">
//               <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">
//                 Espace admin
//               </p>
//               <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-100">
//                 {['Inviter / désactiver', 'Changer les rôles', 'Consulter les logs', 'Clés & partage'].map(
//                   (item) => (
//                     <li
//                       key={item}
//                       className="flex items-center gap-2 rounded-lg bg-blue-900/30 px-3 py-2"
//                     >
//                       <span className="h-2 w-2 rounded-full bg-blue-300" />
//                       {item}
//                     </li>
//                   )
//                 )}
//               </ul>
//             </div>
//           </div>
//         </section>

//         <section className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 md:grid-cols-3">
//           <div>
//             <p className="text-sm font-semibold text-blue-200">Performances</p>
//             <p className="mt-2 text-3xl font-bold text-slate-50">200 ms</p>
//             <p className="text-sm text-slate-400">Objectif de latence sur les actions simples.</p>
//           </div>
//           <div>
//             <p className="text-sm font-semibold text-blue-200">Uploads</p>
//             <p className="mt-2 text-3xl font-bold text-slate-50">50 Mo</p>
//             <p className="text-sm text-slate-400">Limite par fichier avec versioning incrémental.</p>
//           </div>
//           <div>
//             <p className="text-sm font-semibold text-blue-200">Scalabilité</p>
//             <p className="mt-2 text-3xl font-bold text-slate-50">1 000+</p>
//             <p className="text-sm text-slate-400">
//               Utilisateurs simultanés visés avec pagination systématique.
//             </p>
//           </div>
//         </section>
//       </div>
//     </div>
//   )
// }

