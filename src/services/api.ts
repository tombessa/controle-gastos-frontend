import axios, { AxiosError } from 'axios'
import { parseCookies } from 'nookies'
import { AuthTokenError } from './errors/AuthTokenError'

import { signOut } from '../contexts/AuthContext'

export interface ProcessEnv {
  [key: string]: string | undefined
}

export function extractStringEnvVar(
    key: keyof NodeJS.ProcessEnv,
): string {
  console.log(process.env.NODE_ENV);
  console.log(process.env.URL_BACKEND);
    const value = process.env[key];
    
    if (value === undefined) {
        const message = `The environment variable "${key}" cannot be "undefined".`;

        throw new Error(message);
    }

    return value;
}

export function setupAPIClient(ctx = undefined){
  let cookies = parseCookies(ctx);
  const url = extractStringEnvVar('URL_BACKEND');
  const api = axios.create({
    baseURL: url,
    headers: {
      Authorization: `Bearer ${cookies['@nextauth.token']}`
    }
  })

  api.interceptors.response.use(response => {
    return response;
  }, (error: AxiosError) => {
    if(error.response!==undefined)
    if(error.response.status === 401){
      // qualquer erro 401 (nao autorizado) devemos deslogar o usuario
      if(typeof window !== undefined){
        // Chamar a funçao para deslogar o usuario
        signOut();
      }else{
        return Promise.reject(new AuthTokenError())
      }
    }

    return Promise.reject(error);

  })

  return api;

}