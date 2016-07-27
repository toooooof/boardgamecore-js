(function (BGC) {
    
    
    
   /******************************************
     ******************************************
     * ENCODER UTILS
     ******************************************
     ******************************************
     */
    BGC.Encoder = (function() {
        var self = {};

        var REF =  ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","*","%"];

        var symbols = [
            {type:"$", text:"__DOL__", regex: /\$/g},
            {type:"[", text:"__OP__", regex: /\[/g},
            {type:"]", text:"__CLO__", regex: /\]/g},
            {type:"@", text:"__ARO__", regex: /@/g},
            {type:"-", text:"__TIR__", regex: /-/g},
            {type:"+", text:"__PLU__", regex: /\+/g},
            {type:"?", text:"__QUE__", regex: /\?/g},
            {type:":", text:"__COL__", regex: /:/g},
            {type:"&", text:"__AMP__", regex: /\&/g},
        ];

        var STRING = 0;
        var TAB_OPEN = 1;
        var TAB_CLOSE = 2;
        var NUMBER = 3;
        var TAB1D = 4;
        var TAB1DNEG = 5;
        var UNDEFINED = 6;
        var EMPTYTAB = 7;
        var NEGATIVE = 8;

        /** 
            Encode an integer in base64
            @function encode64
            @memberof module:Encoder

            @param {number} n 
            @return {string}
        */
        self.encode64 = function(n) {
            var res = "";

            var a = n;
            while (a > 63) {
                var b = a%64;
                var c = a - b;
                a = c / 64;
                res = encodeChar64(b) + res;
            }

            res = encodeChar64(a) + res;

            return res;
        };

        /** 
            Decode a string from base64
            @function decode64
            @memberof module:Encoder

            @param {string} s 
            @return {number}
        */
        self.decode64 = function(s) {
            var res = 0;
            for (var i = 0 ; i < s.length ; i++) {
                var idx = s.length - i - 1; 
                res += decodeChar64(s[i]) * Math.pow(64,idx);
            }
            return res;
        };
        
        // encoding maison d'un nombre entre 0 et 63
        function encodeChar64(s) {
            if (isNaN(s) || s < 0 || s > 63) return;
            else return REF[s];
        };
        
        // fonction inverse
        function decodeChar64(s) {	
            return REF.indexOf(s);
        };

        function isArrayOfPositiveNumbers(tab) {
            if (tab == undefined || tab.length == undefined || typeof tab == "string") return false;

            for (var i = 0 ; i < tab.length ; i++) {
                if (typeof tab[i] !== 'number' || parseInt(tab[i]) < 0) return false;
            }
            return true;
        };

        function isArrayOfNegativeNumbers(tab) {
            if (tab == undefined || tab.length == undefined || typeof tab == "string") return false;

            for (var i = 0 ; i < tab.length ; i++) {
                if (typeof tab[i] !== 'number' || parseInt(tab[i]) >= 0) return false;
            }
            return true;
        };

        function getNbDigitsNeedToEncode64(nb) {
            var nbDigits = 1;
            while (nb > 63) {
                var b = nb%64;
                var c = nb - b;
                nb = c / 64;
                nbDigits++;
            }
            return nbDigits;
        };

        /** 
         * Encode les tableaux de nombre à 1 dimension 
        * sous la forme : XSErhgDSth21
        * où X est le nombre en base 64 de digit par nombre du tableau
        */
        function encodeArrayOfNumbers(tab, negative) {
            if (negative === true) {
                if (isArrayOfNegativeNumbers(tab)) {
                    var temp = [];
                    for (var i = 0 ; i < tab.length ; i++) {
                        temp[i] = -tab[i];
                    }
                    var max = Math.max.apply(null, temp);
                    var nbDigits = getNbDigitsNeedToEncode64(max);
                    var res = nbDigits + "";
                    for (var i = 0 ; i < temp.length ; i++) {
                        var nb = self.encode64(temp[i]) + "";
                        while (nb.length < nbDigits) nb = "0" + nb;
                        res += nb;
                    }
                    return res;
                }
            } else {
                if (isArrayOfPositiveNumbers(tab)) {
                    var max = Math.max.apply(null, tab);
                    var nbDigits = getNbDigitsNeedToEncode64(max);
                    var res = nbDigits + "";
                    for (var i = 0 ; i < tab.length ; i++) {
                        var nb = self.encode64(tab[i]) + "";
                        while (nb.length < nbDigits) nb = "0" + nb;
                        res += nb;
                    }
                    return res;
                } else {
                    return tab;
                }
            }
        };

        /** la fonction inverse d'au-dessus */
        function decodeArrayOfNumbers(str, negative) {
            if (str != undefined && str.length != undefined) {
                var nbDigits = self.decode64(str[0]);
                var chaine = str.substr(1,str.length);

                if (chaine.length%nbDigits != 0) return str;

                var res = [];
                for (var i = 0 ; i < chaine.length ; i += nbDigits) {
                    res.push(self.decode64(chaine.substr(i,nbDigits)));
                }

                if (negative === true) {
                    for (var i = 0 ; i < res.length ; i++) {
                        res[i] = -res[i];
                    }
                }
                return res;

            } else {
                return str;
            }
        };

        /** 
            Encode an object
            @function encodeObject
            @memberof module:Encoder

            @param {object} obj - The input object can be of several types :
            <ul>
                <li>string</li>
                <li>integer</li>
                <li>undefined</li>
                <li>Empty array</li>
                <li>Array of integer</li>
                <li>An array of all of these possible types (including this one)</li>
            </ul>
            Objects ({}) are not supported
            @return {string}

            @example <caption>Example usage of encodeObject.</caption>
            * // returns "[-2100203%*[-100001:]$toto]"
            * Encoder.encodeObject([[64,2,3,4094],[[0,0,0,0,1],[]],"toto"])

        */
        self.encode = function(obj) {
            if (obj == undefined) {
                return "?";
            } else if (typeof obj == "string") {
                return "$" + obj.replace(/\$/g, "__DOL__").replace(/\[/g, "__OP__").replace(/\&/g, "__AMP__").replace(/\]/g, "__CLO__").replace(/@/g, "__ARO__").replace(/-/g, "__TIR__").replace(/\+/g, "__PLU__").replace(/\?/g, "__QUE__").replace(/:/g, "__COL__");
            } else if (obj.length == 0) {
                return ":";
            } else if (!isNaN(obj) && typeof obj == "number") {
                if (obj >= 0) return "@" + self.encode64(obj);
                else return "&" + self.encode64(-obj);
            } else if (isArrayOfPositiveNumbers(obj)) {
                return "-" + encodeArrayOfNumbers(obj);
            } else if (isArrayOfNegativeNumbers(obj)) {
                return "+" + encodeArrayOfNumbers(obj, true);
            } else if (obj.length != undefined) {
                var res = "[";
                for (var i = 0 ; i < obj.length ; i++) {
                    res += self.encode(obj[i]);
                }
                res += "]";
                return res;
            } else {
                return obj;
            }
        };

        /** 
            Decode a string
            @function decodeObject
            @memberof module:Encoder

            @param {string} str
            @return {object}

            @see {@linkcode module:Encoder.encodeObject}
        */
        self.decode = function (str) {

            if (typeof str != "string") return str;

            if (str[0] == "[" && str[str.length-1] == "]") {
                return tokenize(str.substr(1,str.length-2));
            } else {
                var markers = ["@","$","-","+","[","]","?",":","&"];
                var mot = "";
                var i = 0;
                while ( markers.indexOf(str[i+1]) == -1 && (i+1) < str.length) {
                    mot += str[i];
                    i++;
                } 
                mot += str[i];
                return decodeSimpleType(mot);
            }
            
        };

        self.getIntFromBoolean = function(bool) {
            if (bool === true) return 1;
            else return 0; 
        };
        
        self.getBooleanFromInt = function(num) {
            return (num === 1);
        };

        function tokenize(str) {
            var markers = ["@","$","-","+","[","]","?",":","&"];

            if (typeof str != "string") return str;

            var res = [];
            for (var i = 0 ; i < str.length ; i++) {
                var c = str[i];
                var mot = "";
                if (c === "[") {
                    var fin = findClosingBraket(str.substr(i+1));
                    mot = str.substr(i+1,fin);
                    i += fin+1;
                    res.push(tokenize(mot));
                } else if ( c!== "]" && markers.indexOf(c) > -1) {
                    while ( markers.indexOf(str[i+1]) == -1 && (i+1) < str.length) {
                        mot += str[i];
                        i++;
                    } 
                    mot += str[i];
                    
                    res.push(decodeSimpleType(mot));
                }

            }

            return res;
        };

        function decodeSimpleType(str) {
            var markers = ["@","&","$","-","+","?",":"];

            if (typeof str != "string") return str;

            var res;
            for (var i = 0 ; i < str.length ; i++) {
                var c = str[i];
                var mot = "";
                if ( markers.indexOf(c) > -1) {
                    i++;
                    while ( markers.indexOf(str[i]) == -1 && i < str.length) {
                        mot += str[i];
                        i++;
                    } 
                    i--;
                    if (c === "$") return mot.replace(/__DOL__/g,'$').replace(/__OP__/g,"[").replace(/__CLO__/g, "]").replace(/__ARO__/g,"@").replace(/__TIR__/g, "-").replace(/__PLU__/g, "+").replace(/__AMP__/g, "&").replace(/__QUE__/g, "?").replace(/__COL__/g, ":");
                    else if (c === "@") return self.decode64(mot);
                    else if (c === "&") return -self.decode64(mot);
                    else if (c === "-") return decodeArrayOfNumbers(mot);
                    else if (c === "+") return decodeArrayOfNumbers(mot, true);
                    else if (c === ":") return [];
                    else if (c === "?") return undefined;
                }
            }
        };

        function findClosingBraket(str) {
            var level = 0;
            for (var i = 0 ; i < str.length ; i++) {
                var c = str[i];
                if (c === "[") level++;
                if (c === "]") {
                    if (level == 0) return i;
                    else level--;
                }
            }
            return -1;
        };

        return self;

    })();
    
    
    
    
    
    /******************************************
     ******************************************
     * COOKIE UTILS
     ******************************************
     ******************************************
     */
    BGC.cookie = (function() {
        
        var self = {};
	
        self.get = function(cname) {
            var name = cname + "=";
            var ca = document.cookie.split(';');
            for(var i = 0; i <ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0)==' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) == 0) {
                    return c.substring(name.length,c.length);
                }
            }
            return "";
        }
        
        self.set = function(cname, cvalue, exdays) {
            if (exdays == undefined) exdays = 30;
            var d = new Date();
            d.setTime(d.getTime() + (exdays*24*60*60*1000));
            var expires = "expires="+d.toUTCString();
            document.cookie = cname + "=" + cvalue + "; " + expires;
        }
        
        return self;
        
    })();
    
    
    BGC.giveFormattedDate = function(timestamp) {

		var d = new Date(timestamp);
		var res = d.getFullYear() + '/';
		if (d.getMonth() < 9) res += '0' + (d.getMonth() + 1) + '/';
		else res += (d.getMonth() + 1 ) + '/';
		if (d.getDate() < 10) res += '0' + d.getDate() + ' ';
		else res += d.getDate() + ' ';
		if (d.getHours() < 10) res += '0' + d.getHours() + ':';
		else res += d.getHours() + ':';
		if (d.getMinutes() < 10) res += '0' + d.getMinutes() + ':';
		else res += d.getMinutes() + ':';
		if (d.getSeconds() < 10) res += '0' + d.getSeconds();
		else res += d.getSeconds();

		return res;

	}
    
    
    /******************************************
     ******************************************
     * IO
     ******************************************
     ******************************************
     */
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
    };
    
    
    
    
    
    
    
    /******************************************
     ******************************************
     * HISTORY FUNCTIONS
     ******************************************
     ******************************************
     */
    BGC.Log = function(options) {
        function init() {
            if (options != undefined) {
                if (options.decalage != undefined) {
                    this.decalage = options.decalage;
                } else {
                    this.decalage = 0;
                }
                if (options.TECH_LOGS != undefined) {
                    this.TECH_LOGS = options.TECH_LOGS;
                } else {
                    this.TECH_LOGS = [];
                }
                if (options.SEPARATOR_LOGS != undefined) {
                    this.SEPARATOR_LOGS = options.SEPARATOR_LOGS;
                } else {
                    this.SEPARATOR_LOGS = [];
                }
                if (options.displayLogMethod != undefined) {
                    this.giveFullText = options.displayLogMethod;
                } else {
                    this.giveFullText = consoleOutput;
                }
                if (options.historyLength != undefined) {
                    this.HISTORY_LENGTH = options.historyLength;
                } else {
                    this.HISTORY_LENGTH = 30;
                }
            } else {
                this.decalage = 0;
                this.TECH_LOGS = [];
                this.SEPARATOR_LOGS = [];
                this.giveFullText = consoleOutput;
                this.HISTORY_LENGTH = 30;
            }
        }
        
        this.log = function(model, player, action, param, timestamp) {
            if (timestamp == undefined) timestamp = Math.round((new Date().getTime() - this.decalage)/1000);
            if (timestamp < 0) timestamp = 0;
            
            if (this.TECH_LOGS.indexOf(action) == -1) {
                this.history(model, player, action, param, timestamp);
            }

            if (model.logs == undefined) model.logs = [];
            model.logs.push({
                player: player,
                action: action,
                param: param,
                timestamp: timestamp
            });

        };

        this.history = function(model, player, action, param, timestamp) {
            
            if (this.TECH_LOGS.indexOf(action) == -1) {
                var div = $('<div class="log">');

                var strPlayer = "";
                if (player > -1 && player < 63) {
                    strPlayer = model.players[player].name;
                    div.addClass('color' +  model.getPlayerColor(player));
                }

                if (this.SEPARATOR_LOGS.indexOf(action) == -1) div.append('<div class="header"><span> ' + BGC.giveFormattedDate(timestamp*1000) + ' </span></div>');
                else div.addClass('separator');
                div.append(this.giveFullText(strPlayer, action, param));
                $("#history").prepend(div);
            }

        };
        
        function consoleOutput(playerNumber, action, param) {
            return $('<div>Player ' + playerNumber + ', action : ' + action + '</div>' );
        };
        
        this.refreshHistory = function(model, last) {
            if (last == undefined) last = this.HISTORY_LENGTH;
            if (model.logs != undefined) {
                var t = _.sortBy(model.logs, 'timestamp');
                $("#history").empty();

                if (last > -1 && t.length > last) {
                    var button = $('<div><button>Show full log</button></div>');
                    button.on('click', function() {
                        Log.refreshHistory(model, -1);
                    });
                    $("#history").append(button);
                    t = t.slice(t.length-last, t.length);
                }
                var me = this;
                _.each(t, function(item) {
                    me.history(model, item.player, item.action, item.param, item.timestamp);
                });
            }
        }

        
        init.call(this);
    }
    
    
    
    
    /******************************************
     ******************************************
     * MAIN FUNCTION
     ******************************************
     ******************************************
     */
    BGC.Main = function(controller, view, model, io, log) {
        
        if (controller == undefined) {
            if (typeof Controller == "function") {
                controller = Controller;
            } else {
                throw "FATAL ! No controller defined";
            }
        }
        
        if (view == undefined) {
            if (typeof View == "function") {
                view = View;
            } else {
                throw "FATAL ! No view defined";
            }
        }
        
        if (model == undefined) {
            if (typeof Model == "function") {
                model = Model;
            } else {
                throw "FATAL ! No model defined";
            }
        }
        
        if (io == undefined) {
            if (typeof IO == "function") {
                io = IO;
            } else {
                throw "FATAL ! No io defined";
            }
        } 
        
        if (log == undefined) {
            if (typeof Log == "object") {
                log = Log;
            } else {
                throw "FATAL ! No log defined";
            }
        } 
        
        this.startAtLoad = function(data) {
            if (data.load != undefined) {
                this.M = model.import(data.load);
                this.M.data = data;
                this.M.data.fullreset = data.load;
                if (log != undefined) {
                    this.M.LOG = new BGC.Log(log);
                    this.M.LOG.refreshHistory(this.M);
                }
            } else {
                this.M = new model();
                this.M.data = data;
                if (log != undefined) {
                    this.M.LOG = new BGC.Log(log);
                    this.M.LOG.refreshHistory(this.M);
                }
                this.M.init(data.players, data.startingOption);
            }
            
            this.V = new view(this.M);
            this.C = new controller(this.M, this.V);
            /*if (this.M.getContext() != undefined) {
                this.C.context = this.M.getContext();
            } else {
                delete this.C.context;
            }*/
            this.V.render();
            this.C.start();
        }
        
        this.io = new io();
        this.io.initLoad(this.startAtLoad, this);
    }
    
    window.BGC = BGC;
    
})(window.BGC || {});