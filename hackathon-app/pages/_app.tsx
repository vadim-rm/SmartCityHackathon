import '../styles/globals.css'
import type {AppProps} from 'next/app'
import moment from "moment/moment";
import 'moment/locale/ru';
import {SessionProvider} from "next-auth/react"

moment.locale('ru')

function MyApp({Component, pageProps: {session, ...pageProps}}: AppProps) {
    return (
        <SessionProvider session={session}>
            <Component {...pageProps} />
        </SessionProvider>
    )
}

export default MyApp
