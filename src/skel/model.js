var Model = (function() {
    var self = {};
    
    self.start = function(options) {
        
    };
    
    self.export = function() {
        
    };
    
    self.getContext = function() {
      if (this.context != undefined) {
        return Encoder.decode(this.context);
      } 
      return undefined;
    }
    
    return self;
})();

Model.import = function(str) {
    
};

/*
var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;
 
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

 
    _.extend(child, parent, staticProps);

 
    child.prototype = _.create(parent.prototype, protoProps);
    child.prototype.constructor = child;

    child.__super__ = parent.prototype;

    return child;
  };
*/