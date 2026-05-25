import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const users = [
  { id:1, name:'Abbas Al Masri', email:'admin@hayyamed.ai', password:'hayyamed2024', role:'admin' },
  { id:2, name:'Agent One', email:'agent@hayyamed.ai', password:'agent2024', role:'agent' },
]

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label:'Email', type:'email' },
        password: { label:'Password', type:'password' },
      },
      async authorize(credentials) {
        const user = users.find(u => u.email === credentials.email && u.password === credentials.password)
        if (user) return user
        return null
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  secret: 'hayyamed-secret-key-2024',
  session: { strategy: 'jwt' },
})

export { handler as GET, handler as POST }