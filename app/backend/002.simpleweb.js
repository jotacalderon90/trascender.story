"use strict";

let self = function(a){
	this.dir = a.dir;
	this.config = a.config;
	this.helper = a.helper;
	this.mailing = a.mailing;
	this.mongodb = a.mongodb;
	this.render = a.render;
	
	if(this.config.recaptcha && this.config.recaptcha.enabled===true){
		this.recaptcha = require("express-recaptcha");
		this.recaptcha.init(this.config.recaptcha.public,this.config.recaptcha.private);
		this.recaptcha.render();
	}
}



self.prototype.render_view = function(req,res,next){
	let view = ((req.params.id)?req.params.id:"index");
	if(this.helper.exist(view)){
		res.render(view);
	}else{
		return next();
	}
}



//@route('/')
//@method(['get'])
self.prototype.render_index = function(req,res,next){
	this.render_view(req,res,next);
}



//@route('/:id')
//@method(['get'])
self.prototype.render_other = function(req,res,next){
	this.render_view(req,res,next);
}



//@route('/api/message')
//@method(['post'])
//@description('primera accion en que usuario/cliente envia informacion al servidor')
self.prototype.message = async function(req,res,next){
	try{
		req.body.email = req.body.email.toLowerCase();
		if(this.helper.isEmail(req.body.email)){
			if(this.recaptcha!=undefined){
				await this.helper.recaptcha(this.recaptcha,req);
			}
			req.body.created = new Date();
			req.body.to = req.body.email;
			req.body.html = this.render.processTemplateByPath(this.dir + this.config.properties.views + "mailing/template_message.html",req.body);
			
			//insertar usuario si no existe
			let e = await this.mongodb.count("user",{email: req.body.email});
			if(e==0){
				let u = {};
				u.email = req.body.email;
				u.hash = this.helper.random(10);
				u.password = this.helper.toHash("123456" + u.email,u.hash);
				u.nickname = u.email;
				u.notification = true;
				u.thumb = "/media/img/user.png";
				u.roles = ["user","message"];
				u.created = new Date();
				u.activate = true;
				await this.mongodb.insertOne("user",u);
				console.log("nuevo usuario insertado");
			}else{
				console.log("usuario ya insertado: " + e);
			}
			
			await this.mongodb.insertOne("message",req.body);
			if(this.config.smtp.enabled){
				await this.mailing.send(req.body);
			}
			res.send({data: true});
		}else{
			throw("IMAIL INVALIDO");
		}
	}catch(e){
		console.error("ERROR-ERROR-ERROR-ERROR");
		console.error("ERROR-ERROR-ERROR-ERROR");
		console.error("ERROR-ERROR-ERROR-ERROR");
		console.error(e);
		res.send({data: true});
	}
}



module.exports = self;