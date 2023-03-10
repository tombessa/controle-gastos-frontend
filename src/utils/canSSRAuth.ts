import {GetServerSideProps,
    GetServerSidePropsContext,
    GetServerSidePropsResult} from "next";

import {parseCookies, destroyCookie} from "nookies";
import {AuthTokenError} from "../services/errors/AuthTokenError";


//páginas de usuários logados
export function canSSRAuth<P extends { [key: string]: any; }>(fn: GetServerSideProps<P>){
    // @ts-ignore
    return async(ctx: GetServerSidePropsContext):Promise<GetServerSidePropsResult<P>> => {
        const cookies = parseCookies(ctx);
        //página com usuario não logado --> redireciona
        if(!cookies['@nextauth.token']){

            return{
                redirect:{
                    destination:'/',
                    permanent: false
                }
            }
        }
        try{
            return await fn(ctx);
        }catch(err){
            if(err instanceof AuthTokenError) {
                destroyCookie(ctx, '@nextauth.token');
                return {
                    redirect: {
                        destination: '/',
                        permanent: false
                    }
                }
            }
        }


    }
}