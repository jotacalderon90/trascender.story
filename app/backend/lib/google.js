const {google} = require('googleapis');

let self = function(application){
	
	if(application.config.google && application.config.google.auth && application.config.google.auth.clientId && application.config.google.auth.clientId!=""){
		this.googleConfig = application.config.google.auth;
		this.enabled = true;
	}
	
	// Create the google auth object which gives us access to talk to google's apis.
	this.createConnection = function(){
		return new google.auth.OAuth2(
			this.googleConfig.clientId,
			this.googleConfig.clientSecret,
			this.googleConfig.redirect
		);
	}

	//Get a url which will open the google sign-in page and request access to the scope provided (such as calendar events).
	this.getConnectionUrl = function(auth){
		return auth.generateAuthUrl({
			access_type: 'offline',
			prompt: 'consent', // access type and approval prompt will force a new refresh token to be made each time signs in
			scope: [
				'https://www.googleapis.com/auth/plus.me',
				'https://www.googleapis.com/auth/userinfo.email',
			]
		});
	}

	//Helper function to get the library with access to the google plus api.
	this.getGooglePlusApi = function(auth){
		return google.plus({ version: 'v1', auth });
	}
}

self.prototype.getURL = function(){
	try{
		return this.getConnectionUrl(this.createConnection());
	}catch(e){
		this.error = e;
		return null;
	}
}

self.prototype.getUserInfo = async function(code){
	try{
		// get the auth "tokens" from the request
		let auth1 = this.createConnection();
		let data = await auth1.getToken(code);
		let tokens = data.tokens;
		
		// add the tokens to the google api so we have access to the account
		let auth = this.createConnection();
		auth.setCredentials(tokens);
		
		// connect to google plus - need this to get the user's email
		let plus = this.getGooglePlusApi(auth);
		let me = await plus.people.get({ userId: 'me' });
		
		return me.data;
	}catch(e){
		this.error = e;
		return null;
	}
}

module.exports = self;