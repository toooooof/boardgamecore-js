/**
 * The Model holds the data.
 * Every data must be stored here (or in sub-objects). 
 * The import and export functions provide serialization and deserialization methods
 */
var Model = function() {
    
    /**
     * init is a mandatory function.
     * It will be called at game start if this is a new game
     * 
     * @param players : String[] - the players' names ordered by seat number
     * @param options : object - An object with all the inputs coming from the website (mainly game setup parameters) 
     */
    this.init = function(players, options) {
        this.map = new Map(players.length);
        
        var colors = _.shuffle([0,1,2,3,4]);
        var t = [];
        var cpt = 0;
        this.players = [];
        _.each(players, function(name) {
            this.players.push(new Player(name, colors.pop()));
            t.push(cpt++);
        }, this);
        
        this.workflow = {
            turn: 0,
            phase: SETUP,
            turnOrder: _.shuffle(t)
        };
        this.workflow.currentPlayer = this.workflow.turnOrder[0];
        
    };
    
    this.endTurn = function() {
        delete this.bidDetails;
        delete this.qamataMoney;
    }
    
    this.log = function(action, param, playerNumber, timestamp) {
        if (this.LOG != undefined) {
            if (playerNumber == undefined) {
                playerNumber = this.workflow.currentPlayer;
            }
            this.LOG.log(this, playerNumber, action, param, timestamp);
        }
	}
    
    /**
     * export is a mandatory function.
     * It exports all the data needed to store this game's state. 
     * The BGC.Encoder tranforms the export array to a string.
     * 
     * @return String
     */
    this.export = function() {
        var tab = [];
        
        if (this.players != undefined) {
            var t = [];
            _.each(this.players, function(p) {
                t.push(p.export()); 
            });
            tab.push(t);
        } else {
            tab.push(undefined);
        }
        
        if (this.logs != undefined && this.logs.length > 0) {
			var tRef = this.logs[0].timestamp;
			var t = [tRef];
			var ts = [];
			_.each(this.logs, function(log) {
				t.push([
					log.player,
					log.action,
					log.param
					]);
				ts.push(log.timestamp - tRef);
			});
			tab.push(t);
			tab.push(ts);
		} else {
			tab.push(undefined);
			tab.push(undefined);
		}
        
        return BGC.Encoder.encode(tab);
    };
    
};

/**
 * import is a mandatory static function.
 * It takes an input string, read it into a import array, and return a working model 
 * corresponding to this specific statue
 * 
 * @param str : String - Input data 
 * @return Model
 */
Model.import = function(str) {
    var m = new Model();
    var tab = BGC.Encoder.decode(str);
    
    if (tab != undefined) {
        if (tab[0] != undefined) {
            m.players = [];
            _.each(tab[0], function(item) {
                m.players.push(Player.import(item));
            });
        } 
    }
    
    if (tab[1] != undefined && tab[2] != undefined ) {
        m.logs = [];
        var tRef = 0;
        _.each(tab[1], function(log) {

            if (typeof log === 'number') {
                tRef = log;
            } else {
                var l = {
                    player: log[0],
                    action: log[1],
                    param: log[2]
                };
                if (typeof l.param === "number") l.param = [l.param];
                m.logs.push(l);
            }
        });

        for (var i = 0; i < tab[2].length; i++) {
            m.logs[i].timestamp = tab[2][i] + tRef;
        };
    }
    
    return m;
};