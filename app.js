console.log(new Date() + " == iniciando aplicacion");

//importar librerias externas
console.log(new Date() + " == importando readline");
const readline 		= require('readline');
console.log(new Date() + " == importando fs");
const fs			= require("fs");
console.log(new Date() + " == importando path");
const path			= require("path");
console.log(new Date() + " == importando express");
const express		= require("express");
console.log(new Date() + " == importando body-parser");
const bodyParser	= require("body-parser");
console.log(new Date() + " == importando cookie-parser");
const cookieParser	= require("cookie-parser");
console.log(new Date() + " == importando express-session");
const session		= require("express-session");
console.log(new Date() + " == importando express-fileupload");
const upload		= require('express-fileupload');
console.log(new Date() + " == importando helmet");
const helmet 		= require("helmet");
console.log(new Date() + " == importando http");
const http			= require("http");
console.log(new Date() + " == importando trascender.router");
const router 		= require("trascender.router");
console.log(new Date() + " == importando trascender.render");
const render 		= require("trascender.render");
			
//kernel/core/motor del sistema trascender
let trascender = async function(){
	try{
		
		//configurar estandar de aplicacion web/nodejs/express/trascender
		if(true){
			
			this.dir		= __dirname;
			this.config		= JSON.parse(fs.readFileSync("./app.json","utf8"));
			
			console.log(new Date() + " == configurando aplicacion");
			this.express = express();
			this.express.use(bodyParser.json({limit: "50mb"})); 
			this.express.use(bodyParser.urlencoded({extended: true}));
			
			if(this.config.properties.cookie_domain){
				this.express.use(cookieParser({domain:this.config.properties.cookie_domain}));
			}else{
				this.express.use(cookieParser());
			}
			
			this.express.use(session({secret: (new Date()).toISOString(), resave: false, saveUninitialized: false}));
			this.express.use(upload());
			this.express.use(helmet());
			
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
			this.process = process;
			
			this.config.properties.views = "/app/frontend/html/";
			
			this.server		= http.Server(this.express);
			
			this.render = new render(this, __dirname + "/app/frontend/html/");
			
			let libs = fs.readdirSync("./app/backend/lib","utf8").filter(function(row){
				return fs.statSync(path.join("./app/backend/lib",row)).isFile();
			});
			
			for(let i=0;i<libs.length;i++){
				let l = libs[i].replace(".js","");
				console.log(new Date() + " == instanciando libreria " + l);
				this[l]	= new(require("./app/backend/lib/" + l))(this);
			}
			
			if(this.config.properties.cors===true){
				let cors = require("cors");
				this.express.use(cors());
			}
			
			await  this.mongodb.start();
			
			//PRIMERA EJECUCION DE SISTEMA TRASCENDER
			if (!fs.existsSync("./log.csv")) {
				try{
					let r;
					
					let objects = JSON.parse(fs.readFileSync("./app/backend/script/objects.json","utf8"));
					for(let i=0;i<objects.length;i++){
						r = await this.mongodb.count("object",{name: objects[i].name});
						if(r==0){
							r = await this.mongodb.insertOne("object",objects[i]);
							console.log(new Date() + " == inserted " + r.insertedCount + " object " + objects[i].name);
							if(r.insertedCount==1){
								if(objects[i].doc){
									for(let x=0;x<objects[i].doc.length;x++){
										r = await this.mongodb.insertOne(objects[i].name,objects[i].doc[x]);
										console.log(new Date() + " == inserted " + r.insertedCount + " document in " + objects[i].name);
									}
								}
							}
						}
					}
					
					r = await this.readline.ask("Debe tener al menos un usuario administrador, ¿desea crearlo? [S/N]?: ");
					if(r.toUpperCase()=="S"){
						let user = await this.readline.ask("Ingrese un nombre de usuario: ");
						let pass = await this.readline.ask("Ingrese una contraseña: ");
						let doc = {};
						doc.email = user;
						doc.hash = this.helper.random(10);
						doc.password = this.helper.toHash(pass + user,doc.hash);
						doc.nickname = user;
						doc.notification = true;
						doc.thumb = "/media/img/user.png";
						doc.roles = ["admin","user"];
						doc.created = new Date();
						doc.activate = true;
						r = await this.mongodb.count("user",{email: user});
						if(r==0){
							r = await mongodb.insertOne("user",doc);
							console.log("usuario administrador creado correctamente");
						}else{
							throw("El usuario " + user + " ya existe");
						}
					}
				}catch(e){
					console.error("No se pudo crear el usuario administrador: " + e);
				}
			}
		}
		
		//definir funciones internas propias de trascender
		if(true){
			
			this.beforeExecute = function(params){
				return async (req,res,next) => {
					try{
						//SI NO EXISTE ARCHIVO LOG ES PRIMERA VEZ QUE EJECUTA POR ENDE DEBERIA CARGAR OBJETOS BASICOS Y CREAR USUARIO ADMIN
						
						
						//SET TYPE:FILE-FOLDER-REDIRECT-API
						req.type = params.type;
						
						//SET REAL IP
						req.real_ip = (req.connection.remoteAddress!="::ffff:127.0.0.1")?req.connection.remoteAddress:req.headers["x-real-ip"];
						
						//DECODE USER AUTHENTICATED
						let token = null;
						if(req.method.toLowerCase()=="get" && req.query.Authorization && req.query.Authorization!=""){
							token = this.auth.decode(req.query.Authorization);
							token = (token==null)?{error: this.auth.error.toString()}:token;
						}else if(req.method.toLowerCase()=="post" && req.body.Authorization && req.body.Authorization!=""){
							token = this.auth.decode(req.body.Authorization);
							token = (token==null)?{error: this.auth.error.toString()}:token;
						}else if(req.headers && req.headers.cookie){
							let cookies = req.headers.cookie.split(";");
							for(let i=0;i<cookies.length;i++){
								if(cookies[i].indexOf("Authorization=")>-1){
									token = this.auth.decode(cookies[i].split("=")[1].split(";")[0]);
									token = (token==null)?{error: this.auth.error.toString()}:token;
								}
							}
						}
						
						//FIND USER
						if(token!=null && token!=undefined && !token.error){
							req.user = await this.mongodb.findOne("user",token.sub);
						}
						
						//LOG
						req.created = new Date();
						let content = "\n";
						content += req.created.toISOString() + ";";
						content += req.real_ip + ";";
						content += ((req.user)?req.user.email:null) + ";";
						content += req.originalUrl + ";";
						content += req.method + ";";
						content += JSON.stringify(req.body);
						console.log(content);
						fs.appendFile("./log.csv", content, function (err) {});
						
						//VALIDATE USER
						if(params.roles==undefined || params.roles.length==0){
							return next();
						}else if(token==null || token==undefined){
							throw("Acción restringida"); 
						}else if(token.error){
							throw(token.error); 
						}else{
							let a = await this.mongodb.find("user_active",{user_id: token.sub});
							if(a.length==0){ throw("Acción restringida"); }
							a = false;
							for(let i=0;i<params.roles.length;i++){
								if(req.user.roles.indexOf(params.roles[i])>-1){
									a = true;
								}
							}
							if(a){
								return next();
							}else{
								throw("Acción restringida");
							}
						}
					}catch(e){
						console.error(e);
						if(req.url.indexOf("/api/")==-1){
							req.session.redirectTo = req.url;
						}
						res.status(401).render("message",{title: "Error 401", message: e.toString(), error: 401, class: "danger"});
					}
				}
			}
			
			this.getFile = function(file){
				return function(req,res){
					res.sendFile(file);
				};
			}
			
			this.getRedirect = function(to){
				return function(req,res){
					res.redirect(to);
				};
			}
			
		}
		
		//levantar aplicación solicitada
		if(true){
			
			//publicar archivos
			console.log(new Date() + " == publicando archivos");
			this.express.get("/favicon.ico", this.getFile(this.dir + "/app/frontend/media/img/favicon.ico"));
			this.express.get("/robots.txt", this.getFile(this.dir + "/app/frontend/media/doc/robots.txt"));
			if(this.config.files){
				for(let i=0;i<this.config.files.length;i++){
					this.express.get(this.config.files[i].uri, this.beforeExecute({type: "FILE", roles: this.config.files[i].roles}), this.getFile(this.dir + this.config.files[i].src));
				}
			}
				
			//publicar carpetas
			console.log(new Date() + " == publicando carpetas");
			this.express.use("/",  express.static(this.dir + "/app/frontend"));
			if(this.config.folders){
				for(let i=0;i<this.config.folders.length;i++){
					this.express.use(this.config.folders[i].uri, this.beforeExecute({type: "FOLDER", roles: this.config.folders[i].roles}), express.static(this.dir + this.config.folders[i].src));
				}
			}
				
			//importar router
			new router(this,__dirname + "/app/backend");
			
			//publicar redireccionamientos
			if(this.config.redirect){
				for(let i=0;i<this.config.redirect.length;i++){
					console.log(new Date() + " == publicando redireccionamientos");
					this.express.use(this.config.redirect[i].from, this.beforeExecute({type: "REDIRECT", roles: this.config.redirect[i].roles}), this.getRedirect(this.config.redirect[i].to));
				}
			}
			
			//publicar error 404
			this.express.use(function(req,res,next){
				console.log(new Date() + " == publicando error 404");
				res.status(404).render("message",{title: "Error 404", message: "URL no encontrada", error: 404, class: "danger"});
			});
			
			//iniciar aplicacion
			let port = this.config.properties.port;
			console.log(new Date() + " == abriendo puerto");
			this.server.listen(port, function(){
				console.log("app started in port " + port);
			});
			
		}
	
	}catch(e){
		console.log("ERROR AL LEVANTAR SISTEMA TRASCENDER!");
		console.log(e);
		process.exit();
	}
};
trascender();