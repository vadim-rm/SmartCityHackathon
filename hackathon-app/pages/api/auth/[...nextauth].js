import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export default NextAuth({
    secret: "ldsfhskjflahfkasjfhakjsfh",
    // Configure one or more authentication providers
    providers: [
        CredentialsProvider({
            name: "username",
            credentials: {
                username: {label: "Username", type: "text", placeholder: "Username"},
                password: {label: "Username", type: "password", placeholder: "Password"}
            },
            async authorize(credentials, req) {
                if (credentials.username === "admin" && credentials.password === "admin") {
                    return {name: "Admin", email: "true"}
                }
                return null
            }
        })
    ],
})