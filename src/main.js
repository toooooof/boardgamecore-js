(function (BGC) {
    
    BGC.Main = function(controller, view, model, io) {
        
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
        
        this.startAtLoad = function(data) {
            this.data = data;
            
            if (this.data.load != undefined) {
                this.M = model.import(this.data.load);
            } else {
                this.M = new model();
                this.M.init(this.data.players, this.data.startingOption);
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