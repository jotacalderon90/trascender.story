"use strict";

const readline = require('readline');

var self = function(a){
	this.rl = readline.createInterface({
		input: a.process.stdin,
		output: a.process.stdout
	});
}

self.prototype.ask = function(question){
	return new Promise((resolve,reject)=>{
		this.rl.question(question, (answer) => {
			if(answer.trim()!=""){
				resolve(answer);
			}else{
				return reject(answer);
			}
		});
	});
}

module.exports = self;