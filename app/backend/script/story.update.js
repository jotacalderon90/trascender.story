

const fs = require("fs");
const config = JSON.parse(fs.readFileSync("../../../app.json","utf-8"));
const helper = new (require("../lib/helper"))();
const mongodb = new (require("../lib/mongodb"))({config: config});

let piramide = ["Historia de Chile","Invasión Española"];

let create = async function(){
	await mongodb.start();
	let coll = await mongodb.find("story",{tag: {$in:["Invasión Española"]}});
	for(let i=0;i<coll.length;i++){
		
		for(let x=0;x<piramide.length;x++){
			let x1 = coll[i].tag.indexOf(piramide[x]);
			coll[i].tag.splice(x1,1);
		}
		
		for(let x=0;x<piramide.length;x++){
			coll[i].tag.splice(x,0,piramide[x]);
		}
		
		//coll[i].tag.splice(1,0,"Siglo XX");
		//coll[i].tag.splice(1,1,"Siglo XXI");
		
		await mongodb.updateOne("story",coll[i]._id,coll[i]);
		console.log(i + " actualizado");
	}
}
create();