var IO = {

	url: '../Json',
	decalage: 0,

	init: function(controller) {
		if (global.live === true && global.firebaseUrl != undefined) {
			this.fb = new Firebase(global.firebaseUrl + global.gameId);
			this.chat = new Firebase(global.firebaseUrl + 'chat' + global.gameId);
			this.controller = controller;
			this.ts = new Date().getTime();
			this.tsChat = new Date().getTime();
			this.startReceiveFocus();
		}

		return this;
	},

	loadGame: function(controller) {
		$.ajax({
			url: this.url,
			type: 'POST',
			data: {
				id: global.gameId,
				action: 'load'
			},
			success: function(data) {
				controller.reloadModel(data);
				controller.start();
			}
		});
	},

	saveGame: function(model, ret, callbackPartial, callbackGlobal, context) {
		if (global.pov != undefined) {
			var player = model.players[global.pov];
			if (player != undefined) {
				var phase = model.workflow.phase;
				if (ret == 2) phase -= 1;
				if (!Rules.simultaneous(phase) || ret >= 2) {
					this.saveGameData(model, false, callbackGlobal, context);
					return true;
				} else {
					this.saveMoveAfterSimultaneousMove(model, player, callbackPartial, context);
					return false;
				}
			}
		}
	},

	saveGameData: function(model, creation, callback, context) {
		showLoader();

        var turn = model.workflow.turn;
        var nextPlayer = model.players[model.workflow.currentPlayer].name;

        var phase = model.workflow.phase;
        if (phase == SETUP_RESERVE || phase == RESTRUCTURING || phase == CLEAN_UP || phase == PAYDAY) {
            nextPlayer = '';
            var u = _.uniq(model.workflow.ready);
			for (var i = 0 ; i < model.players.length; i++) {
                if (u.indexOf(i) == -1) {
					if (phase != PAYDAY || model.players[i].skipPayday !== true) {
						if (nextPlayer.length > 0) {
							nextPlayer += ',';
						}
                    	nextPlayer += model.players[i].name;
					}
                }
            }
        }

        var phaseStr = PHASES_STR[phase];
        if (phase >= END_GAME) {
        	phaseStr = PHASES_STR[END_GAME];
        }

        var callData = {
                id: global.gameId,
                action: creation === true ? 'create' : 'save',
                data: Encoder.encodeObject(model.export()),
                decade: turn,
                nextPlayer: nextPlayer,
                phase: phaseStr,
				deleteMoves: (phase == RESTRUCTURING ? "true" : "false"),
				status: 'ACTIVE'
            };

        if (model.workflow.phase >= END_GAME) {
        	callData.status = 'FINISHED';
        	callData.winner = Rules.winner(model);
        	callData.deleteMoves = "true";
        }

        $.ajax({
            url: this.url,
            type: 'POST',
            data: callData,
            success: function(d,s,x) {
            	hideLoader();
            	if (d == "ok") {
	            	IO.blur();
	            	if (callback != undefined && context != undefined) {
	            		callback.call(context);
	            	}
	            } else if (d == "error-late") {
	            	alert("Your data might be outdated. Please try to reload this page and play your move again. It the problem persists, please contact the admin.");
	            }
            },
            error: function() {
                alert('Something went wrong. Please reload the page. If the problem is still here, please contact the admin')
            }
		});

	},

	saveMoveAfterSimultaneousMove: function(model, player, callback, context, phase) {
		if (player.beach == undefined) player.beach = [];
		if (player.employees == undefined) player.employees = [];
		if  (phase == undefined) phase = model.workflow.phase;

		var obj = [];
		var d1 = '', d2 = '';

		if (phase == RESTRUCTURING) {
			obj.push(player.beach.concat([]));
			obj.push(player.employees.concat([]));

			d1 = player.giveNbFreeSlots();
			d2 = model.getPlaceInTurnForPlayer(player);
		} else if (phase == SETUP_RESERVE) {
			d1 = model.getPlaceInTurnForPlayer(player);
			obj.push(model.reserveCards[model.getSeatForPlayer(player)]);
		} else if (phase == PAYDAY) {
			d1 = model.getPlaceInTurnForPlayer(player);
            obj.push(player.beach.concat([]));
            obj.push(player.employees.concat([]));
            if (player.fired != undefined) obj.push(player.fired.concat([]));
            else obj.push([]);
		} else if (phase == CLEAN_UP) {
			d1 = model.getPlaceInTurnForPlayer(player);
            obj.push(player.resources.concat([]));
			obj.push(player.deleted.concat([]));
		}

		this.saveMove(model, player.name, obj, d1, d2, callback, context, phase);
	},

	saveMove: function(model, playerName, backup, d1, d2, callback, context, phase) {
		showLoader();

		var turn = model.workflow.turn;
		if (phase == undefined) phase = model.workflow.phase;
		var auto = '';
		
		for (var i = 0 ; i < model.players.length ; i++) {
			var pn = model.players[i];
			if (pn.bankrupt == true || pn.autoplay == true) {
				if (auto.length > 0) {
					auto += ',';
				}
				auto += i;
			}
		}
	
		$.ajax({
			url: this.url,
			type: 'POST',
			data: {
				id: global.gameId,
				action: 'move',
				content: Encoder.encodeObject(backup),
				turn: turn,
				phase: phase,
				user: playerName,
				data1: d1,
				data2: d2,
				auto: auto
			},
			success: function(d,s,x) {
				hideLoader();
				if (callback != undefined && context != undefined) callback.call(context, d);
			},
			error: function() {
				alert('Something went wrong. Please reload the page. If the problem is still here, please contact the admin')
			}
		});
	},

	deleteMoves: function(model, turn, phase, callback, context) {
		showLoader();

		if (turn == undefined) turn = model.workflow.turn;
		if (phase == undefined) phase = model.workflow.phase;

		$.ajax({
			url: this.url,
			type: 'POST',
			data: {
				id: global.gameId,
				action: 'deletemoves',
				turn: turn,
				phase: phase
			},
			error: function() {
				alert('Something went wrong. Please reload the page. If the problem is still here, please contact the admin')
			},
			success: function() {
				hideLoader();
				callback.call(context);
			}
		});
	},
	
	resign: function(model, player, callback, context) {
		if (model.allowSurrender == true) {
			showLoader();

			if (player == undefined) player = model.players[model.workflow.currentPlayer].name;

			$.ajax({
				url: this.url,
				type: 'POST',
				data: {
					id: global.gameId,
					action: 'resign',
					user: player
				},
				error: function() {
					alert('Something went wrong. Please reload the page. If the problem is still here, please contact the admin')
				},
				success: function() {
					hideLoader();
					callback.call(context);
				}
			});
		}
	},

	bugEntry: function(desc, callback, context) {
		showLoader();

		if (global != undefined && global.name != undefined) {
			$.ajax({
				url: this.url,
				type: 'POST',
				data: {
					id: global.gameId,
					action: 'bugentry',
					user: global.name,
					description: desc

				},
				success: function (d, s, x) {
					hideLoader();
					callback.call(context, d);
				}
			});
		}
	},

	postMessage: function(message, player) {
		showLoader();
		$.ajax({
			url: this.url,
			type: 'POST',
			data: {
				id: global.gameId,
				action: 'chatmessage',
				type: 'add',
				player: player,
				message: htmlEscape(message),
				notif: (global.live !== true)
			},
			success: function() {
				hideLoader();
				var d = new Date().getTime();
				var m = {m:htmlEscape(message),p:player,t:d};
				if (IO.chat != undefined) {
					IO.tsChat = d;
					IO.chat.child('message').set(m);
				}
			}
		});
	},

	postNote: function(note, player) {
		showLoader();
		$.ajax({
			url: this.url,
			type: 'POST',
			data: {
				id: global.gameId,
				action: 'notes',
				type: 'post',
				user: player,
				note: htmlEscape(note)
			},
			success: function() {
				hideLoader();
			}
		});
	},

	startReceiveFocus: function() {
		this.focus(function(data) {
			var ts = data.val();
			var shouldUpdate = (IO.ts != undefined && ts != IO.ts && IO.firstTime != undefined);
			IO.firstTime = true;

			if (shouldUpdate) {
				IO.loadGame(IO.controller);
			}
		});

		window.setTimeout(function () {
			IO.focusChat(function(data) {
				var m = data.val();
				if (m != undefined) {
					var ts = m.t;
					var shouldUpdate = (IO.tsChat != undefined && ts != IO.tsChat && IO.firstTimeChat != undefined);
					IO.firstTimeChat = true;

					if (shouldUpdate && IO.controller != undefined) {
						IO.controller.view.addMessageToDisplayLive({message: m.m, nom: m.p, timestamp: m.t});
					}
				}
			});
		}, 200);

	},

	focus: function(callback) {
		if (this.fb != undefined) {
			this.fb.child('focus').on('value', callback);
		}
	},

	focusChat: function(callback) {
		if (this.chat != undefined) {
			this.chat.child('message').on('value', callback);
		}
	},

	blur: function() {
		if (this.fb != undefined) {
			this.ts = new Date().getTime();
			this.fb.child('focus').set(this.ts);
		}
	}
}

function htmlEscape(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

// I needed the opposite function today, so adding here too:
function htmlUnescape(value){
	return String(value)
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}