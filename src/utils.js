/** 
	<p>Provides methods to encode and decode an object.
	This serialization aims at reducing the place taken by this object (for storage).</p>

	<p>This works well with integers, arrays of integers (and array of array ...), but not so well with strings (which are not compressed at all). 
	See {@linkcode module:Encoder.encodeObject} for more details about the types</p>
	
 	@module Encoder
 */
(function(BGC) {

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
    			res += self.encodeObject(obj[i]);
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

    BGC.Encoder = self;
	window.BGC = BGC;

})(window.BGC || {});

(function(BGC) {
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
	
	BGC.cookie = self;
	window.BGC = BGC;
	
})(window.BGC || {});