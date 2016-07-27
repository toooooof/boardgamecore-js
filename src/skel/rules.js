/**
 * Rules is meant to be a static object with static public methods that provides rules for the game.
 * It is important to keep in mind that it is a static and stateless object. 
 * Most of methods will take the game state (Model) in input parameter, in order to return a choice
 * of evolve the model.
 * 
 * 
 * Rules can be divided in several files if needed (one for the rules, one to compute what will be 
 * proposed to the players)
 */
var Rules = (function() {
   
   var self = {};
   
   /**
    * Example of an exported function 
    */
   self.publicFunction = function(model, param) {
       // Do stuff related to the game, such harvesting, computing income, ...
   };
   
   return self; 
})();