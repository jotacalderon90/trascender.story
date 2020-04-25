app.controller("messageCtrl", function(trascender,$scope){
	this.message = new trascender({
		service: {
			create: ["POST","/api/message"]
		},
		start: function(){
			this.message.create = {
				on: "Enviando mensaje",
				error: "Error al enviar su mensaje", 
				success: "Su mensaje ha sido enviado correctamente :D"
			};
			this.new();
		},
		default: function(){
			return {email: "", message: ""}
		},
		isMail: function(data){
			let exp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			if(data!=undefined && data.trim()!="" && exp.test(data)){
				return true;
			}else{
				return false;
			}
		},
		beforeCreate: function(doc){
			
			if(!this.isMail(doc.email)){
				alert("Email inválido");
				return false;
			}
			
			try{
				doc["g-recaptcha-response"] = grecaptcha.getResponse();
			}catch(e){
				if(e.toString()!="ReferenceError: grecaptcha is not defined"){
					console.log(e);
				}
			}
			
			return true;
		},
		afterCreate: function(success, xhttp){
			$scope.$digest(function(){});
			this.new();
		}
	});
});