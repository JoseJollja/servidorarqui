import mongoose from 'mongoose';
import { Clientes, Productos, Pedidos, Usuarios } from './db';
import { rejects } from 'assert';
import bcrypt from 'bcrypt';
//GENERAR TOKEN
import dotenv from 'dotenv';
dotenv.config({path: 'variables.env'});

import jwt from 'jsonwebtoken';
//Palabra reservada expiresIn
const crearToken = (usuarioLogin, secreto, expiresIn) => {
//usuario viene de la base de datos
    const {usuario} = usuarioLogin;

    return jwt.sign({usuario}, secreto, {expiresIn});
}
export const resolvers = {
    Query: {
        getClientes: (root, {limite, offset}) => {
            return Clientes.find({}).limit(limite).skip(offset)
        },
        getCliente: (root, {id}) => {
            return new Promise((resolve, object) => {
                Clientes.findById(id, (error, cliente) => {
                    if(error) rejects(error)
                    else resolve(cliente)   
                });
            });
        },
        //Aqui usaremos esta funcion para aplicarlo en el paginador y saber cuantos clientes hay en la DB
        totalClientes: (root) => {
            return new Promise((resolve,object) => {
                Clientes.countDocuments({}, (error, count) =>{
                    if(error) rejects(error)
                    else resolve(count)
                });
            });
        },

        //LLamaremos a todos los productos de la DB dandole parametros de limites
        obtenerProductos: (root , {limite, offset, stock}) => {
            let filtro;
            if(stock){
                filtro = { stock: {$gt : 0 } }
            }
            return Productos.find(filtro).limit(limite).skip(offset)
        },
        obtenerProducto: (root, {id}) => {
            return new Promise((resolve, object) => {
                Productos.findById(id, (error, producto) => {
                    if(error) rejects(error)
                    else resolve(producto)   
                });
            });
        },
        //Aqui usaremos esta funcion para aplicarlo en el paginador y saber cuantos productos hay en la DB
        totalProductos: (root) => {
            return new Promise((resolve,object) => {
                Productos.countDocuments({}, (error, count) =>{
                    if(error) rejects(error)
                    else resolve(count)
                });
            });
        },
        obtenerPedidos:(root, {cliente}) => {
            return new Promise((resolve, object) =>{
                Pedidos.find({cliente: cliente}, (error, pedido) => {
                    if(error) rejects(error);
                    else resolve(pedido);
                })
            })
        },
        topClientes: (root) => {
            return new Promise((resolve, object) => {
                Pedidos.aggregate([
                    {
                        $group : {
                            _id : "$cliente",
                            total: { $sum: "$total" }
                        }

                    },
                    {
                        $lookup : {
                            from: "depositos",
                            localField : '_id',
                            foreignField : '_id',
                            as : 'cliente'
                        }    
                    },
                    {
                        $sort : {total : -1 }
                    },
                    {
                        $limit: 10
                    }
                ], (error, resultado) => {
                    if(error) rejects(error);
                    else resolve(resultado);
                })
            })
        },
        obtenerUsuario: (root, args, {usuarioActual} ) => {
        //usuarioActual es como lo tenemos en el index del servidor
            if(!usuarioActual){
                return null;
            }
            // Obtener el usuario actual del request del JWT  Verificado
            const usuario = Usuarios.findOne({usuario: usuarioActual.usuario});
            
            return usuario;
        },
        topEncargados: (root) => {
            return new Promise((resolve, object) => {
                Pedidos.aggregate([
                    {
                        $group : {
                            _id : "$encargado",
                            total: { $sum: "$total" }
                        }

                    },
                    {
                        $lookup : {
                            from: "usuarios",
                            localField : '_id',
                            foreignField : '_id',
                            as : 'encargado'
                        }    
                    },
                    {
                        $sort : {total : -1 }
                    },
                    {
                        $limit: 10
                    }
                ], (error, resultado) => {
                    if(error) rejects(error);
                    else resolve(resultado);
                })
            })
        }
    },
    Mutation: {
        crearCliente : (root, {input}) => {
            const nuevoCliente = new Clientes({
                nombre : input.nombre,
                apellido : input.apellido,
                edad : input.edad,
                foto : input.foto,
                area : input.area,
                emails : input.emails,
                tipo : input.tipo,
                pedidos : input.pedidos
            });
            nuevoCliente.id = nuevoCliente._id;

            return new Promise((resolve, object)=>{
                nuevoCliente.save((error) => {
                    if(error) rejects(error)
                    else resolve(nuevoCliente)
                })
            });
        },
        actualizarCliente : (root, {input}) => {
            return new Promise((resolve, object) => {
                Clientes.findOneAndUpdate({ _id : input.id }, input, {new: true}, 
                (error, cliente) => {
                    if(error) rejects(error)
                    else resolve(cliente)
                });   
            });
        },
        eliminarCliente : (root, {id}) => {
            return new Promise((resolve, object)=>{
               Clientes.findOneAndDelete({_id : id},(error)=>{
                    if(error) rejects(error)
                    else resolve("Se Elimino Correctamente")
               })
            });
        },
        nuevoProducto : (root, {input}) => {
            const nuevoProducto = new Productos({
                codigo : input.codigo,
                nombre : input.nombre,
                imagen : input.imagen,
                descripcion : input.descripcion,
                precio : input.precio,
                stock : input.stock
            });
            //mongodb crear de forma automatica el id
            nuevoProducto.id = nuevoProducto._id;

            return new Promise((resolve, object)=>{
                nuevoProducto.save((error) => {
                    if(error) rejects(error)
                    else resolve(nuevoProducto)
                })
            });
        },
        actualizarProducto : (root, {input}) => {
            return new Promise((resolve, object) => {
                Productos.findOneAndUpdate({ _id : input.id }, input, {new: true}, 
                (error, producto) => {
                    if(error) rejects(error)
                    else resolve(producto)
                });   
            });
        },
        eliminarProducto : (root, {id}) => {
            return new Promise((resolve, object)=>{
               Productos.findOneAndDelete({_id : id},(error)=>{
                    if(error) rejects(error)
                    else resolve("Se Elimino Correctamente")
               })
            });
        },
        nuevoPedido: (root, {input}) =>{
            const nuevoPedido = new Pedidos({
                pedido: input.pedido,
                total: input.total,
                fecha: new Date(),
                cliente: input.cliente,
                estado: "PENDIENTE",
                encargado: input.encargado
            });

            nuevoPedido.id = nuevoPedido._id;
            return new Promise((resolve, object) => {
                nuevoPedido.save((error) => {
                    if(error) rejects(error)
                    else resolve(nuevoPedido)
                });
            });
        },
        actualizarEstado : (root, {input}) => {
            return new Promise ((resolve, object) =>{
                //cambia si se hizo efectivo el pedido o no
                const { estado } = input;
                let instruccion;
                if(estado === 'COMPLETADO'){
                    instruccion ='-'
                }else if(estado === 'DEVUELTO'){
                    instruccion = '+';
                }
                input.pedido.forEach(pedido => {
                    Productos.updateOne({_id : pedido.id}, 
                    { "$inc":
                        {"stock" : `${instruccion}${pedido.cantidad}`}
                            }, function(error) {
                            if(error) return new Error(error)
                        }
                    )
                });

                Pedidos.findOneAndUpdate({_id: input.id}, input, {new: true}, (error)=>{
                    if(error)rejects(error);
                    else resolve('Se actualizo Correctamente')
                })
            })
        },
        crearUsuario: async(root, {nombre, rol, usuario, password}) =>{
            //revisar que un usuario contiene el mismo password
            const existeUsuario = await Usuarios.findOne({usuario});
            if(existeUsuario){
                throw new Error('El usuario ya existe');
            }
            const nuevoUsuario = await new Usuarios({
                nombre,
                rol,
                usuario,
                password
            }).save();
            return "Creado Correctamente";
        },
        autenticarUsuario: async(root, {usuario, password})=>{
            const nombreUsuario = await Usuarios.findOne({usuario});
            if(!nombreUsuario){
                throw new Error('Usuario no encontrado ');
            }
            const passwordCorrecto = await  bcrypt.compare(password, 
                nombreUsuario.password);
                //Si el password es incorrecto
                if(!passwordCorrecto){
                    throw new Error('Password Incorrecto');
                }
                return{
                    token: crearToken(nombreUsuario, process.env.SECRETO, '1hr')
                }
        }
    }
}
