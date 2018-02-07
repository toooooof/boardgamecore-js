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
    
    BGC.giveUrlParameter = function(paramName) {
        if (paramName != undefined && paramName.length > 0) {
            var params = window.location.search.substr(1);
            if (params != undefined && params.length > 0) {
                paramsTab = params.split("&");
                for (var i = 0 ; i < paramsTab.length ; i++) {
                    var t = paramsTab[i].split("=");
                    if (t.length == 2 && t[0] == paramName) {
                        return t[1];
                    }
                }
            }
        }

        return undefined;
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
        
        this.saveGameData = function(model, creation, callback, context) {
            showLoader();

            var turn = model.workflow.turn;
            var nextPlayer = model.players[model.workflow.currentPlayer].name;

            var phase = model.workflow.phase;
            /*if (phase == SETUP_RESERVE || phase == RESTRUCTURING || phase == CLEAN_UP || phase == PAYDAY) {
                nextPlayer = '';
                var u = _.uniq(model.workflow.ready);
                for (var i = 0 ; i < model.players.length; i++) {
                    if (u.indexOf(i) == -1) {
                        if (phase != PAYDAY || model.players[i].skipPayday !== true) {
                            if (nextPlayer.length > 0) {
                                nextPlayer += ',';
                            }
                            nextPlayer += model.players[i].name;
                        }
                    }
                }
            }

            var phaseStr = PHASES_STR[phase];
            if (phase >= END_GAME) {
                phaseStr = PHASES_STR[END_GAME];
            }*/

            var callData = {
                    id: this.gameId,
                    action: creation === true ? 'create' : 'save',
                    data: BGC.Encoder.encode(model.export()),
                    decade: turn,
                    nextPlayer: nextPlayer,
                    phase: phase,
                    //deleteMoves: (phase == RESTRUCTURING ? "true" : "false"),
                    status: 'ACTIVE'
                };

            if (model.workflow.phase >= END_GAME) {
                callData.status = 'FINISHED';
                callData.winner = Rules.winner(model);
                callData.deleteMoves = "true";
            }

            $.ajax({
                url: this.url,
                type: 'POST',
                data: callData,
                success: function(d,s,x) {
                    hideLoader();
                    if (d == "ok") {
                        //IO.blur();
                        if (callback != undefined && context != undefined) {
                            callback.call(context);
                        }
                    } else if (d == "error-late") {
                        alert("Your data might be outdated. Please try to reload this page and play your move again. It the problem persists, please contact the admin.");
                    }
                },
                error: function() {
                    alert('Something went wrong. Please reload the page. If the problem is still here, please contact the admin')
                }
            });

        },

        this.initLoad = function(callback, context, errorCallback, errorContext) {
            showLoader();
            var url = this.url;
            var gameId = this.gameId;
            $.ajax({
                url: url,
                type: 'POST',
                data: {
                    id: gameId,
                    bug: BGC.giveUrlParameter("bug"),
                    action: 'initLoad',
                }, 
                success: function(data) {
                    hideLoader();
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
        
        init.call(this, options);   
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
                        model.refreshHistory(-1);
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
    
    
    
    BGC.BugReport = function(options) {
        function init() {
            this.userName = options.userName;

            if (options.url != undefined) {
                this.url = options.url;
            } else if (window.URL_TO_BACKEND != undefined) {
                this.url = window.URL_TO_BACKEND;
            }

            if (options.gameId != undefined) {
                this.gameId = options.gameId;
            } else if (window.GAME_ID != undefined) {
                this.gameId = window.GAME_ID;
            } else {
                try {
                    var id = window.location.pathname.split("/")[2].split("-")[0];
                    this.gameId = parseInt(id);
                } catch (err) {
                    
                }
            }

            this.success = options.success;
            this.successContext = options.successContext;

            if ($("#bugReport").length == undefined || $("#bugReport").length == 0) {
                $("body div:nth(1)").prepend('<div id="bugReport"/>');
            }

            var bugReport = $('#bugReport');
            bugReport.empty();
            bugReport.append('<h2>Bug Report</h2><p>Provide here any relevant information about a problem that happened with this game (about the rules, the interface, etc). Please stop the game. Start another one if you really want to keep playing.</p><div><textarea cols="150" rows="10" name="bugContent" id="bugContent"></textarea></div><div><button id="submitBug" class="pure-button">Submit</button><button id="resetBug" class="pure-button">Reset</button></div>');

            $("#bugReport #submitBug").off().on('click', {context: this}, function(e) {
                var desc = $("#bugContent").val();

                if (desc != undefined && desc.length > 0) {
                    bugEntry.call(e.data.context, desc);
                }
            });

            $("#bugReport #resetBug").off().on('click', function() {
                $("#bugContent").val("");
                closeBugReport();
            });
        }

        function closeBugReport() {
            $("#bugReport").hide();
        }

        bugEntry = function(desc) {
            showLoader();

            var me = this;

            var d = {
                    id: me.gameId,
                    action: 'bugentry',
                    user: me.userName,
                    description: desc
                };
            if (Main.M != undefined) {
                d.data = BGC.Encoder.encode(Main.M.export());
            }

            $.ajax({
                url: me.url,
                type: 'POST',
                data: d,
                success: function (d, s, x) {
                    hideLoader();
                    closeBugReport();
                    if (me.success != undefined && me.successContext != undefined) {
                        me.success.call(me.successContext, d);
                    }
                }
            });
        };

        init.call(this);
     
    }

    BGC.Notes = function(options) {
            function init() {
                this.userName = options.userName;

                if (options.url != undefined) {
                    this.url = options.url;
                } else if (window.URL_TO_BACKEND != undefined) {
                    this.url = window.URL_TO_BACKEND;
                }

                if (options.gameId != undefined) {
                    this.gameId = options.gameId;
                } else if (window.GAME_ID != undefined) {
                    this.gameId = window.GAME_ID;
                } else {
                    try {
                        var id = window.location.pathname.split("/")[2].split("-")[0];
                        this.gameId = parseInt(id);
                    } catch (err) {

                    }
                }

                this.success = options.success;
                this.successContext = options.successContext;

                if ($("#notes").length == undefined || $("#notes").length == 0) {
                    $("body div:nth(1)").prepend('<div id="notes"/>');
                }

                var notes = $('#notes');
                notes.empty();
                notes.append('<h2>Personal notes</h2><p>Everything written here will be kept secret, readable only by you.</p><div><textarea cols="150" rows="10" name="note" id="note"></textarea></div><div><button id="submitNote" class="pure-button">Submit</button></div>');

                $("#notes #submitNote").off().on('click', {context: this}, function(e) {
                    var desc = $("#note").val();
                    submitNote.call(e.data.context, desc);
                });

                if (options.initNote != undefined) {
                    $("#note").val(options.initNote);
                }

            }

            function closeNotes() {
                $("#notes").hide();
            }

            submitNote = function(desc) {
                showLoader();

                var me = this;

                var d = {
                        id: me.gameId,
                        action: 'notes',
                        user: me.userName,
                        note: desc,
                        type: 'post'
                    };

                $.ajax({
                    url: me.url,
                    type: 'POST',
                    data: d,
                    success: function (d, s, x) {
                        hideLoader();
                        closeNotes();
                        if (me.success != undefined && me.successContext != undefined) {
                            me.success.call(me.successContext, d);
                        }
                    }
                });
            };

            init.call(this);

        }


    BGC.Chat = function(options) {
        function init() {
            this.userName = options.userName;

            if (options.url != undefined) {
                this.url = options.url;
            } else if (window.URL_TO_BACKEND != undefined) {
                this.url = window.URL_TO_BACKEND;
            }

            if (options.gameId != undefined) {
                this.gameId = options.gameId;
            } else if (window.GAME_ID != undefined) {
                this.gameId = window.GAME_ID;
            } else {
                try {
                    var id = window.location.pathname.split("/")[2].split("-")[0];
                    this.gameId = parseInt(id);
                } catch (err) {
                    
                }
            }

            this.success = options.success;
            this.successContext = options.successContext;

            if ($("#messages").length == undefined || $("#messages").length == 0) {
                $("body div:nth(1)").prepend('<div id="messages"/>');
            }

            var chat = $('#messages');
            chat.empty();
            chat.append('<div id="chatBox"><h2>Post a message</h2><div><textarea rows="6" name="chatMessage" id="chatMessage"></textarea></div><div><button class="pure-button">Submit</button></div></div><div id="messageList"></div');

            $("#chatBox button").off().on('click', {context: this}, function(e) {
                var message = $("#chatMessage").val();

                if (message != undefined && message.length > 0) {
                    $("#chatMessage").val("");
                    postMessage.call(e.data.context, message);
                }
            });

            if (options.initChat != undefined && options.initChat.length) {
                for (var i = 0 ; i < options.initChat.length ; i++) {
                    addChatMessage(options.initChat[i]);
                }
            }

        }

        addChatMessage = function(m, pre) {
            var div = $('<div class="chatentry" >');
            var header = $('<div class="header"/>');
            header.append('<span class="date">' + BGC.giveFormattedDate(m.timestamp) + ' </span>');
            header.append('<span class="bold">' + m.nom + '</span>');
            div.append(header);
            div.append('<div class="body">' + m.message.replace(/\n/g, "<br/>")+ '</span>');
            if (m.date != undefined) div.data('ts', m.timestamp);
            else div.data('ts', -1);
            if (pre === true) $("#messageList").prepend(div);
            else $("#messageList").append(div);
        }

        postMessage = function(message) {
            showLoader();
            var me = this;
            $.ajax({
                url: me.url,
                type: 'POST',
                data: {
                    id: me.gameId,
                    action: 'chatmessage',
                    type: 'add',
                    player: me.userName,
                    message: htmlEscape(message),
                    notif: true
                },
                success: function() {
                    hideLoader();
                    var d = new Date().getTime();
                    var m = {message:htmlEscape(message),nom:me.userName,timestamp:d};
                    addChatMessage.call(me, m, true);
                    if (me.success != undefined && me.successContext != undefined) {
                        me.success.call(me.successContext, d);
                    }
                }
            });
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
            if (typeof data === "string") {
                data = JSON.parse(data);
            }

            if (data.bugData != undefined) {
                this.M = model.import(data.bugData);
                this.M.data = data;
                this.M.data.fullreset = data.bugData;
                if (log != undefined) {
                    this.M.LOG = new BGC.Log(log);
                    this.M.refreshHistory();
                }
            } else if (data.load != undefined) {
                this.M = model.import(data.load);
                this.M.data = data;
                this.M.data.fullreset = data.load;
                if (log != undefined) {
                    this.M.LOG = new BGC.Log(log);
                    this.M.refreshHistory();
                }
            } else {
                this.M = new model();
                this.M.data = data;
                if (log != undefined) {
                    this.M.LOG = new BGC.Log(log);
                    this.M.refreshHistory();
                }
                this.M.init(data.players, data.startingOption);
                this.io.saveGameData(this.M, true);
            }

            this.V = new view(this.M);
            this.C = new controller(this.M, this.V, log);
            this.V.render();

            window.BugReport = new BGC.BugReport({userName: data.name});
            window.Chat = new BGC.Chat({userName: data.name, initChat: data.chat});
            window.Notes = new BGC.Notes({userName: data.name, initNote: data.note});

            this.C.start();
        }
        
        this.io = new io();
        this.io.initLoad(this.startAtLoad, this);
    }
    
    window.BGC = BGC;
    
})(window.BGC || {});

function htmlEscape(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// I needed the opposite function today, so adding here too:
function htmlUnescape(value){
    return String(value)
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}