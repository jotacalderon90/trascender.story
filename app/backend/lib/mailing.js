"use strict";

const mailer = require("nodemailer");
const transport = require("nodemailer-smtp-transport");

var self = function(application){
	this.config = application.config;
	this.createTransport = function(){
		//attachments : [{filename: 'text3.txt',path: 'Your File path'}]
		return mailer.createTransport(transport({
			host : this.config.smtp.host,
			secureConnection : this.config.smtp.secureConnection,
			port: this.config.smtp.port,
			auth : {
				user : this.config.smtp.user, 
				pass : this.config.smtp.pass
			}
		}));
	}
}

self.prototype.send = function(body){
	return new Promise((resolve,reject)=>{
		body.bcc = this.config.properties.admin;
		body.from = (this.config.smtp.from!=undefined && this.config.smtp.from.trim()!="")?this.config.smtp.from:this.config.smtp.user;
		this.createTransport().sendMail(body, function(e, response){
			if(e){
				return reject(e);
			}else{
				resolve(response);
			}
		});
	});
}

module.exports = self;