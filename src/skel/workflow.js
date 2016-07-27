(function(self) {
    
    self.canPlay = function(model, playerNumber) {
        if (playerNumber == undefined && model.data != undefined) {
            playerNumber = model.data.pov;
        }
        
        return (model.players[model.workflow.currentPlayer].autoplay !== true && playerNumber == model.workflow.currentPlayer);  
    };
    
    self.lastPlayerCurrent = function(model) {
        var current = model.workflow.currentPlayer;
        if (model.workflow.turnOrder.indexOf(current) == (model.workflow.turnOrder.length - 1)) {
            return true;
        }
        
        var humansAfter = false;
        
        for (var i = model.workflow.turnOrder.indexOf(current) + 1 ; i < model.workflow.turnOrder.length ; i++) {
            if (model.players[model.workflow.turnOrder[i]].autoplay !== true) {
                humansAfter = true;
                break;
            }
        }
        return !humansAfter;
    };
    
    function firstActivePlayer(model) {
        for (var i = 0 ; i < model.workflow.turnOrder.length ; i++) {
            if (model.players[model.workflow.turnOrder[i]].autoplay !== true) {
                return model.workflow.turnOrder[i];
            }
        }
        return -1;
    }
   
    self.next = function(model) {
		var toNextTurn = false;
		var toNextPhase = false;
		var toNextPayer = false;

        switch (model.workflow.phase) {
            /*case SETUP:
                if (self.lastPlayerCurrent(model)) {
                    toNextPhase = true;
                    model.workflow.turn = 1;
                    model.workflow.turnOrder = _.reverse(model.workflow.turnOrder);
                    delete model.vr;
                    _.each(model.workflow.turnOrder, function(p) {
                        model.vrOrder(p);
                    });
                } else {
                    toNextPayer = true;
                }
                break;
            case BID:
                var prochain = playerAfterCurrentForBidPhase(model);
                if (prochain == undefined) {
                    toNextPhase = true;
                    Rules.applyBid(model);
                } else {
                    model.workflow.currentPlayer = prochain;
                    toNextPayer = true;
                }
                break;
            case ACTIONS:
                if (self.lastPlayerCurrent(model)) {
                    Rules.income(model);
                    Rules.checkVictory(model);
                    if (model.workflow.phase != END_GAME) {
                        toNextTurn = true;
                    }
                } else {
                    toNextPayer = true;
                }
                break;
            case INCOME:
                break;*/
        }
        
		if (toNextTurn) {
            //model.workflow.phase = BID;
            model.workflow.turn++;
            model.workflow.currentPlayer = firstActivePlayer(model);
            model.endTurn();
		} else if (toNextPhase) {
			model.workflow.phase++;
            model.workflow.currentPlayer = firstActivePlayer(model);
            startPhase(model);
		} else if (toNextPayer) {
            var idx = model.workflow.turnOrder.indexOf(model.workflow.currentPlayer) + 1;
            model.workflow.currentPlayer = model.workflow.turnOrder[idx%model.workflow.turnOrder.length];
		}

		if (model.workflow.phase == END_GAME) {
			return 0;
		}

		if (toNextTurn) return 3;
		if (toNextPhase) return 2;
		if (toNextPayer) return 1;
	}
    
})(Rules || {});