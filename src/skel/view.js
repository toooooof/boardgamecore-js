/**
 * View takes a Model as input (mandatory) and will render the display depending on this model
 * Ideally, you should provide partial render functions, so specific zones can be rendered on demand
 */
var View = function(m) {
   
   /**
    * Gives an $img element
    * @private
    */
   function image(src, clazz) {
        var img = $("<img />");
        if (src != undefined) {
            img.attr('src', src);
        }
        if (clazz != undefined) {
            img.addClass(clazz);
        }
        return img;
    }
    
    /**
     * Example of partial render functions
     */
    this.renderBoard = function() {
        
    }
    
    this.renderPlayers = function() {
        
    }
        
    /**
     * render is a mandatory function.
     * It performs a full render of the display 
     */
    this.render = function() {
        this.renderBoard();
        this.renderPlayers();
    }
    
    this.model = m;
    
};