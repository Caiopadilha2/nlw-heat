/**
 * Receber código (code)
 * Recuperar access_token no github (para receber infos do usuario)
 * Verificar se usuario existe no BD
 * sim -> gera token
 * nao -> cria no BD e gera token
 * Retornar o token + infos do usuario logado
 */
import axios from "axios";

import prismaClient from "../prisma";

import { sign } from "jsonwebtoken";

interface IAccessTokenResponse {
  access_token: string,
}

interface IUserInfosResponse {
  avatar_url: string,
  login: string,
  id: number,
  name: string
}

class AuthenticateUserService {
  async execute(code: string) {
    const base_url = "https://github.com/login/oauth/access_token";

    const { data: accessTokenResponse } = await axios.post<IAccessTokenResponse>(base_url, null, {
      params: {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      },
      headers: {
        "accept": "application/json"
      }
    })

    const response = await axios.get<IUserInfosResponse>("https://api.github.com/user", {
      headers: {
        authorization: `Bearer ${accessTokenResponse.access_token}`
      }
    })

    const { login, id, avatar_url, name } = response.data;

    let user = await prismaClient.user.findFirst({
      where: {
        github_id: id
      }
    });

    if (!user) {
      user = await prismaClient.user.create({
        data: {
          github_id: id,
          login,
          avatar_url,
          name
        }
      })
    }

    const token = sign(
      {
        user: {
          name: user.name,
          avatar_url: user.avatar_url,
          id: user.id
        }
      },
      process.env.SECRET_KEY,
      {
        subject: user.id,
        expiresIn: "1d"
      }
    );

    return { token, user };
  }
}

export { AuthenticateUserService };