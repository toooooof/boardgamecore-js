/**
 * Player is not a mandatory class. 
 * It is a sub class used by model in order to handle all players' data in a separate class.
 * It might not be mandatory, but most games have specific players' data, so we advise to use it.
 * 
 * Each player is defined by a name and a color (but "color" is a generic concept, and does not always
 * refer to a color, but it can be a tribe name, people, race, etc, depending on the game)
 */
var Player = function(name, color) {
    
    this.export = function() {
        var tab = [];
        
        tab.push(this.name);
        tab.push(this.color);
        
        return tab;
    };
    
    this.name = name;
    this.color = color;
}

Player.import = function(str) {
    var obj = BGC.Encoder.decode(str);
    
    if (str != undefined && str.length > 0) {
        if (str[0] != undefined && str[1] != undefined) {
            var p = new Player(str[0], str[1]);
            
            return p;
        }
    }
    
    return undefined;
}
