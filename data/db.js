import mongoose from 'mongoose';
import bcrypt from 'bcrypt';


mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost/cliente', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.set('setFindAndModify', false);
//Definir el schema de clientes
const clientesSchema = new mongoose.Schema({
    nombre : String,
    apellido : String,
    edad : Number,
    area : String,
    foto : String,
    emails : Array,
    tipo : String,
    pedidos: Array
});


const Clientes = mongoose.model('deposito', clientesSchema);

// Definir el schema de Productos

const productosSchema = new mongoose.Schema({
    codigo : String,
    nombre : String, 
    imagen : String,
    descripcion: String,
    precio: Number, 
    stock: Number
});

const Productos = mongoose.model('activos', productosSchema);

//Pedidos
const pedidosSchema = new mongoose.Schema({
    pedido: Array,
    total:  Number,
    fecha: Date,
    cliente: mongoose.Types.ObjectId,
    estado: String,
    encargado: mongoose.Types.ObjectId
});

const Pedidos = mongoose.model('pedidos', pedidosSchema);

const usuariosSchema = new mongoose.Schema({
    nombre: String,
    rol: String,
    usuario: String,
    password: String,
})

//HASHEAR LOS PASSWORD
usuariosSchema.pre('save', function(next){
    //SI EL PASSOWRD NO ESTA MODIFICADO EJECUTAR LA SIGUIENTE FUNCION
    if(!this.isModified('password')){
        return next();
    }
    bcrypt.genSalt(10, (err, salt)=> {
        if(err) return next(err);
        bcrypt.hash(this.password, salt, (err, hash) =>{
            if(err) return next(err);
            this.password = hash;
            next();
        });
    });
});
const Usuarios =mongoose.model('usuarios', usuariosSchema);


export { Clientes, Productos, Pedidos, Usuarios};

