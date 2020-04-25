var user = new trascender({
	service: {
		read: ["GET", "api/user"]
	},
	start: function(){
		this.read();
	},
	checkUser: async function(){
		while(this.doc==null && (this.readLog==undefined || this.readLog.spinner)){
			await this.wait(500);
		}
	},
	setAdmin: function(aroles){
		this.aroles = aroles;
	},
	isAdmin: function(){
		try{
			for(let i=0;i<this.aroles.length;i++){
				if(this.doc.roles.indexOf(this.aroles[i])>-1){
					return true;
				}
			}
		}catch(e){
			return false;
		}
	}
});
app.factory("trascender_user", function(){
	return user;
});
app.controller("navCtrl", function(trascender_user,$scope){
	this.user = trascender_user;
	setTimeout(function(){
		$scope.$apply();
	}, 500);
});
app.controller("asideCtrl", function(trascender_user,$scope){
	this.user = trascender_user;
	setTimeout(function(){
		$("aside").fadeIn();
		$scope.$apply();
	}, 500);
});