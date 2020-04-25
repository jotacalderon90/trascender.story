const readline = require('readline');
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

rl.question('email: ', (email) => {
	rl.question('password: ', (password) => {
		rl.question('roles: ', (roles) => {
			const fs = require("fs");
			const config = JSON.parse(fs.readFileSync("../../../app.json","utf-8"));
			const helper = new (require("../lib/helper"))();
			const mongodb = new (require("../lib/mongodb"))({config: config});
			let create = async function(email,password,roles){
				let doc = {};
				doc.email = email;
				doc.hash = helper.random(10);
				doc.password = helper.toHash(password + email,doc.hash);
				doc.nickname = email;
				doc.notification = true;
				doc.thumb = "/media/img/user.png";
				doc.roles = roles.split(",");
				doc.created = new Date;
				doc.activate = true;
				await mongodb.start();
				await mongodb.insertOne("user",doc);
				console.log("usuario creado correctamente");
			}
			create(email,password,roles);
		});
	});
});