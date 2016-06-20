(function(BGC) {

	BGC.Model = function(options) {
		
		if (typeof options["import"] != "function") {
			throw "import function undefined";
		} else {
			(function() {
				this.import = options["import"];
			}).call(BGC.Model.prototype);
		}
		
		if (typeof options["export"] != "function") {
			throw "export function undefined";
		} else {
			(function() {
				this.export = options["export"];
			}).call(BGC.Model.prototype);
		}
		
	};

	// fonction d'init en fonction de paramètres d'entrée

	(function() {
	    this.log = function(action, timestamp, player, parameters) {
	        
	    };
	}).call(BGC.Model.prototype);

	window.BGC = BGC;

})(window.BGC || {});