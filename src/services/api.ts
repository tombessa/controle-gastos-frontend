import axios, { AxiosError } from 'axios'
import { parseCookies } from 'nookies'
import { AuthTokenError } from './errors/AuthTokenError'

import { signOut } from '../contexts/AuthContext'

export function setupAPIClient(ctx = undefined){
  let cookies = parseCookies(ctx);
  const url = "https://controle-gastos-backend-tombessa.vercel.app";
  if (url === undefined) {
    const message = `The environment variable "${url}" cannot be "undefined".`;
    throw new Error(message);
  }
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