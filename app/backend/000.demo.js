"use strict";

let self = function(a){
	
}

//@route('/demo/plain')
//@method(['get'])
self.prototype.plain = function(req,res){
	res.send("hola mundo!");
}

//@route('/demo/json')
//@method(['get'])
self.prototype.json = function(req,res){
	res.send({data: {title: "respuesta json", name: "trascender"}});
}

//@route('/demo/render')
//@method(['get'])
self.prototype.render = function(req,res){
	res.render("message",{title: "Renderizado HTML", message: "El mensaje recibido es: " + req.query.msg, class: "success"});
}

//@route('/demo/error')
//@method(['get'])
self.prototype.error = function(req,res){
	res.status(500).render("message",{title: "Renderizado HTML para errores", message: "Ha ocurrido un error", class: "danger"});
}

module.exports = self;