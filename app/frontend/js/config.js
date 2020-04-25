app.controller("configCtrl", function(trascender,$scope){
	this.config = new trascender({
		service: {
			update: ["PUT", "config"],
			delete: ["DELETE", "config"]
		},
		start: function(){
			this.doc = {
				content: JSON.stringify(c,undefined,"\t")
			};
		},
		beforeUpdate: function(){
			return confirm("Confirme actualización del archivo de configuración");
		},
		afterUpdate: function(success,xhttp){
			if(success){
				alert("Archivo de configuración actualizado correctamente");
				location.reload();
			}else{
				alert("Error!");
				console.log(xhttp);
			}
		},
		beforeDelete: function(){
			return confirm("Advertencia!\nYa no podrá editar el archivo de configuración por este medio, ¿desea continuar?");
		},
		afterDelete: function(success,xhttp){
			if(success){
				alert("Archivo de configuración eliminado correctamente");
				location.reload();
			}else{
				alert("Error!");
				console.log(xhttp);
			}
		}
	});
});