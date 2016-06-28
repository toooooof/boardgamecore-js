var IO = function(options) {
    
    function init(options) {
        if (window.URL_TO_BACKEND != undefined) {
            this.url = window.URL_TO_BACKEND;
        }
        
        if (window.TOKEN != undefined) {
            this.token = window.TOKEN;
        } else {
            var t = BGC.cookie.get('token');
            if (t != undefined && t.length > 0) {
                this.token = t;
            }
        }
        
        if (window.GAME_ID != undefined) {
            this.gameId = window.GAME_ID;
        } else {
            try {
                var id = window.location.pathname.split("/")[2].split("-")[0];
                this.gameId = parseInt(id);
            } catch (err) {
                
            }
        }
        
        if (options != undefined) {
            if (options.backendUrl != undefined) {
                this.url = options.backendUrl;
            }
            
            if (options.token != undefined) {
                this.token = options.token;
            }   
            
            if (options.gameId != undefined) {
                this.gameId = options.gameId;
            }   
            
            if (options.decalage != undefined) {
                this.decalage = options.decalage;
            } else {
                this.decalage = 0;
            }
        }
        
        if (this.url == undefined) {
            throw "Error ! No connection defined";
        }
        
        if (this.token == undefined) {
            throw "Error ! No token defined";
        }
    }
    
    this.initLoad = function(callback, context, errorCallback, errorContext) {
        $.ajax({
           url: this.url,
           type: 'GET',
           data: {
               id: this.gameId,
               action: 'initLoad'
           }, 
           success: function(data) {
               callback.call(context, data);
           },
           error: function(error) {
               if (errorCallback != undefined && errorContext != undefined) {
                   errorCallback.call(errorContext, error);
               } else {
                   console.log(error);
               }
           }
        });
    }
    
    init(options);   
}