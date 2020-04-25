"use strict";

var self = function(a){
	this.dir = a.dir;
	this.config = a.config;
	this.auth = a.auth;
	this.helper = a.helper;
	this.mailing = a.mailing;
	this.mongodb = a.mongodb;
	this.render = a.render;
}



//@route('/user/subscription')
//@method(['get','post'])
self.prototype.subscriber = async function(req,res){
	try{
		switch(req.method.toLowerCase()){
			case "get":
				res.render("user/subscription");
			break;
			case "post":
				req.body.email = req.body.email.toLowerCase();
				if(this.helper.isEmail(req.body.email)){
					let ce = await this.mongodb.count("user",{email: req.body.email});
					if(ce!=0){
						throw("El email ingresado ya está registrado");
					}else{
						let doc = {};
						doc.email = req.body.email;
						doc.hash = this.helper.random(10);
						doc.password = this.helper.toHash("123456" + req.body.email,doc.hash);
						doc.nickname = req.body.email;
						doc.notification = true;
						doc.thumb = "/media/img/user.png";
						doc.roles = ["user"];
						doc.created = new Date();
						doc.activate = (this.config.smtp.enabled)?false:true;
						await this.mongodb.insertOne("user",doc);
						if(this.config.smtp.enabled){
							let memo = {};
							memo.to = doc.email;
							memo.subject = "Activación de cuenta"
							memo.nickname = doc.nickname;
							memo.hash = this.config.properties.host + "/user/activate/" + new Buffer(doc.password).toString("base64");
							memo.html = this.render.processTemplateByPath(this.dir + this.config.properties.views + "mailing/template_activate.html", memo);
							memo.config = this.config;
							await this.mailing.send(memo);
							res.render("message",{title: "Usuario registrado", message: "Se ha enviado un correo para validar su registro", class: "success"});
						}else{
							res.render("message",{title: "Usuario registrado", message: "Se ha completado su registro correctamente", class: "success"});
						}
					}
				}else{
					throw("El email ingresado no es válido");
				}
			break;
		}
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger"});
	}
}



//@route('/user/activate/:hash')
//@method(['get'])
self.prototype.activate = async function(req,res){
	try{
		let hash = new Buffer(req.params.hash, "base64").toString("ascii");
		let row = await this.mongodb.find("user",{password: hash});
		if(row.length!=1){
			throw("se ha encontrado más de un usuario asociado a este hash");
		}else{
			row[0].activate = true;
			await this.mongodb.updateOne("user",row[0]._id,row[0]);
			res.render("message",{title: "Usuario activado", message: "Se ha completado su registro correctamente", class: "success"});
		}
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger"});
	}
}



//@route('/user/desactivate/:hash')
//@method(['get'])
self.prototype.desactivate = async function(req,res){
	try{
		let hash = new Buffer(req.params.hash, "base64").toString("ascii");
		let row = await this.mongodb.find("user",{password: hash});
		if(row.length!=1){
			throw("se ha encontrado más de un usuario asociado a este hash");
		}else{
			row[0].activate = null;
			await this.mongodb.updateOne("user",row[0]._id,row[0]);
			res.render("message",{title: "Usuario desactivado", message: "Se ha completado su desactivación correctamente", class: "success"});
		}
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger"});
	}
}



module.exports = self;