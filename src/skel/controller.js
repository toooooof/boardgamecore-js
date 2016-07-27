/**
 * The Controller is a class (a function).
 * It cannot be instantiated without a model and a view.
 * 
 * Its purpose it to orchestrate the game, propose actions to players, call the view when
 * a refresh is needed, and update to model according to players' inputs.
 */
var Controller = function(m, v) {
    
    /**************************************************************************************************************
	 *
	 * UTILS & COMMONS
	 * 
	 **************************************************************************************************************/

	function j() {
		return this.model.players[this.model.workflow.currentPlayer];
	}
	
	function n(player) {
		if (player == undefined) {
			return this.model.workflow.currentPlayer;
		}
		
		for (var i = 0 ; i < this.model.players.length ; i++) {
			if (this.model.players[i].color === player.color) {
				return i;
			}
		}
		
		return -1;
	}

	function addResetValidateButton(clean, novalidate, caption, noreset) {
		if (clean == undefined) clean = true;
		if (novalidate == undefined) novalidate = false;
		if (noreset == undefined) noreset = false;

		if (clean === true) $("#actions").empty();
		$(".validationButtons").remove();
		var p = $('<div class="validationButtons"/>');

		/*if (this.model.allowSurrender == true && Rules.canResign(this.model)) {
			var resignButton = $('<button>Resign</button>');
			p.append(resignButton);
			resignButton.on('click', {controller:this}, function(e) {
				e.data.controller.confirmationBox("Are you sure you want to resign ? This cannot be canceled after this step", e.data.controller, confirmResign, e.data.controller.resetButton);
			});
		}*/
		
		if (this.model.workflow.phase == ACTIONS && this.model.workflow.subphase > 0) {
			var resetTotalButton = $('<button class="pure-button">Reset the whole action phase</button>');
			p.append(resetTotalButton);
			resetTotalButton.on('click', {controller:this, total: true}, this.resetButton);
		}

		if (noreset !== true) {
	 		var resetButton = $('<button class="pure-button">Reset</button>');
			p.append(resetButton);
			resetButton.on('click', {controller:this}, this.resetButton);
		}

		if (novalidate === false) {
			if (caption == undefined) caption = "Validate";
			var validateButton = $('<button class="pure-button">' + caption +'</button>');
			p.append(validateButton);
			validateButton.on('click', {controller:this}, this.nextButton);
		}

		$("#actions").append(p);

	}

	this.nextButton = function(e) {
		var c = e.data.controller;		
		/*if (c.model.workflow.phase == RESTRUCTURING) {
			var player = j.call(c);
			if (player.employees == undefined || player.employees.length == 0) {
				c.confirmationBox("There is no one at work. Are you sure you want to validate ? ", c, c.next, c.proposeEmployeesButton);
			} else if (player.beach != undefined && player.beach.length > 0 &&  player.giveNbFreeSlots() > 0) {
				c.confirmationBox("You could send more employees at work. Are you sure you want to validate ?", c, c.next, c.proposeEmployeesButton);
			} else {
				c.next();
			}
		} else {
			c.next();
		}*/
        c.next();
	}

	this.resetButton = function(e) {
		var c = e.data.controller;
		reset.call(c, e.data.total);
	}

	/*this.confirmationBox = function(message, context, callbackConfirm, callbackDecline, yesButtonCaption, noButtonCaption) {
		if (yesButtonCaption == undefined) yesButtonCaption = "Yes";
		if (noButtonCaption == undefined) noButtonCaption = "No";
		
		$("#actions").empty();
		$("#actions").append("<p>" + message + "</p>");
		var line = $("<div>");
		var yesButton = $('<button>' + yesButtonCaption + '</button>');
		var noButton = $('<button>' + noButtonCaption + '</button>');
		line.append(yesButton);
		line.append(noButton);
		$("#actions").append(line);
		yesButton.on('click', {controller:context}, function(e) {
			callbackConfirm.call(context, e);
		});
		noButton.on('click', {controller:context}, function(e) {
			callbackDecline.call(context, e);
		});
	}*/
	
	/*function confirmResign(e) {
		var c = e.data.controller;
		
		$("#actions").empty();
		Bot.kickout(c.model, c.model.workflow.currentPlayer);
		IO.resign(c.model, j.call(c).name, c.next, c);
	}*/

	function reset(total) {
		if (this.model.data.reset != undefined || (total === true && this.model.data.fullreset != undefined)) {
			if (total === true) {
				this.reloadModel(this.model.data.fullreset);
			} else {
				this.reloadModel(this.model.data.reset);
			}
		}
	}

	this.reloadModel = function(strModel) {
        var d = this.model.data;
		this.model = Model.import(strModel);
        this.model.data = d;
		M = this.model;
		this.view.reloadModel(this.model);

		delete this.context;
		//if (M.getContext() != undefined) this.context = M.getContext();
		//else delete this.context;
		this.start();
		//Log.refreshHistory(this.model);
	}
    
    /**************************************************************************************************************
	 *
	 * WORKFLOW
	 * 
	 **************************************************************************************************************/
    this.next = function(nosave) {

		$("#actions").empty();

		/*if (this.model.workflow.phase == ACTIONS && this.model.workflow.subphase < 4) {
			this.model.workflow.subphase++;
            this.start();
		} else {

			if (this.model.workflow.ready == undefined) this.model.workflow.ready = [];
			this.model.workflow.ready.push(this.model.data.pov);

			delete this.model.workflow.subphase;
			var ret = Rules.next(this.model);
			//if (ret >= 2) {
		//		endPhase.call(this);
		//	}

            //IO.saveGame(this.model, ret, this.reprise, this.start, this);
			
		}	*/

		this.view.render();

	}
    
    /**
     * start is a mandatory function.
     * It will be called as an entry point.
     */
    this.start = function() {
        if (this.model.workflow.phase == END_GAME) {
			//$("#actions").html('<p>The winner is : ' + Rules.winner(this.model) + '</p>');
		} else {
        
            if (Rules.canPlay(this.model)) {
                this.model.data.reset = this.model.export();
                
                switch (this.model.workflow.phase) {
                    
                }
            }
        }
        
    };
   
    this.model = m;
    this.view = v;
    
};