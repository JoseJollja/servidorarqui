import express from 'express';
//graphql
import { ApolloServer } from 'apollo-server-express';

import { typeDefs } from './data/schema';
import { resolvers } from './data/resolvers';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({path: 'variables.env'});

const app= express();
const server = new ApolloServer({
    typeDefs, 
    resolvers,
    context: async({req}) => {
        //obtener token del servidor
        const token = req.headers['authorization'];

        if(token != "null"){
            try {
                //Verificar el token  del front end (Cliente)
                const usuarioActual = await jwt.verify(token, process.env.SECRETO);
                // agregamos  el usuario actual al request
                req.usuarioActual = usuarioActual;

                return {
                    usuarioActual
                }


            } catch(err) {

            }
        }
    }
});
const PORT = process.env.PORT || 9000;

server.applyMiddleware({app});

app.listen(PORT, () => console.log(`El servidor esta corriendo  http://localhost:9000${server.graphqlPath} `));
