/**
 * @author Matteo Ciman
 * 
 * @version 0.1
 */

identificationType = doctorIdentificationType;

var gameID = -1;
var arrayOfDescriptionGames = Array();
var arrayOfGamesIdentifications = Array();

var patientID = -1;

var doctorID = getFromSessionStorage("doctorID");

var useEyeTracker = true;
var folderGame = null;

var NewVisitNamespace = {
		
checkEverythingReady: function() {
	
	var packetToSend = {
		TYPE: "EVERYTHING_READY"
	};
	
	if (websocket != null) {

		websocket.onmessage = function(message) {

			var response = JSON.parse(message.data);
			if (response.TYPE == "EVERYTHING_READY" && 
					response.DATA == "READY") {
				NewVisitNamespace.startNewGame();
			}
			else {
				
				if (response.ADDITIONAL == "NO_EYE_TRACKER") {
					var p = $('<p>').text('Eye Tracker non collegato. ' +
						'Collegarlo e poi proseguire.');

					$('<div>').attr('id', 'dialogNoTrackerConnected')
						.attr('title', 'Eye Tracker non pronto')
						.appendTo('body');

					p.appendTo('#dialogNoTrackerConnected');
					
					$('#dialogNoTrackerConnected').dialog({
						modal: true,
						resizable: false,
						width: 'auto',
						exitOnEscape: true,
						buttons: {
							Ok: function() {
								$(this).dialog("close");
								$(this).remove();
							} 
						}
					});
				}
				else if (response.ADDITIONAL == "NO_CHILD_CLIENT") {

					var p =$('<p>').text('Schermo del bambino non collegato. ' + 
							'Collegarlo e poi proseguire.');

					$('<div>').attr('id', 'dialogNoChildClientConnected')
						.attr('title', 'Bambino non pronto')
						.appendTo('body');

					p.appendTo('#dialogNoChildClientConnected');

					$('#dialogNoChildClientConnected').dialog({
						modal: true,
						resizable: false,
						width: 'auto',
						exitOnEscape: true,
						buttons: {
							Ok: function() {
								$(this).dialog('close');
								$(this).remove();
							}
						}
					});
				}
			}
		};
		websocket.send(JSON.stringify(packetToSend));
	}
	else {

		NewVisitNamespace.noServerWorking();
	}
},

startNewGame: function() {
	
	patientID = $('#selectPatient').val();
	gameID = $('#selectGames').val();
	
	if (patientID == "" || gameID == "") {

		var errorsList = $('<ul>');
		errorsList.css('list-style-position', 'inside');
		if (patientID == "") {
			$('<li>').text('Nessun paziente scelto').appendTo(errorsList);
		}
		if (gameID == "") {
			$('<li>').text('Nessun gioco selezionato').appendTo(errorsList);
		}
		
		$('<div>').attr('id', 'errorStartGame').attr('title', 'Mancano informazioni')
			.appendTo('#mainContent');
		
		$('<p>').text('Non sono state fornite tutte le informazioni necessarie:')
			.appendTo('#errorStartGame');
		errorsList.appendTo('#errorStartGame');
		
		$('#errorStartGame').dialog({
			modal: true,
			resizable: false,
			draggable: false,
			width: getScreenWidth() * 0.4,
			buttons: {
				Ok: function() {
					$(this).dialog("close");
					$(this).remove();
				}
			}
		});
	}
	else {
		/*
		 * Tutto pronto per cominicare, posso andare 
		 * alla pagina dedicata ad ogni singolo gioco per impostazioni
		 * e visualizzazione in tempo reale
		 */
		
		NewVisitNamespace.goToGame();
	}
},

getListOfPatients: function() {
	
	$.ajax({
		url: SERVER_ADDRESS + '/server/GetPatientsList.php',
		type: 'POST',
		data: {
			'doctorID': doctorID
		},
		success: function(message) {
			
			try {
				var arrayOfPatients = JSON.parse(message);
				
				$('<option>').val('').text(' - - - ').appendTo('#selectPatient');
				
				for (var i = 0; i < arrayOfPatients.length; i++) {
					
					var patient = arrayOfPatients[i];
								 
					$('<option>').val(patient.ID).text(patient.SURNAME + " " + patient.NAME).appendTo('#selectPatient');
				}
			}
			catch(error) {
				console.log(error);
				console.log(message);
			}
		}
	});
},

getListOfGames: function() {
	
	$.ajax({
		url: SERVER_ADDRESS + '/server/GetGamesList.php', 
		success: function(message) {
			
			var arrayOfGames = JSON.parse(message);
			
			$('<option>').val('').text('- - - - -').appendTo('#selectGames');
			
			 for (var i = 0; i < arrayOfGames.length; i++) {
				var game = arrayOfGames[i];
							
				$('<option>').val(game.ID).text(game.NAME).appendTo('#selectGames');
				
				arrayOfDescriptionGames[game.ID] = game.DESCRIPTION;
				arrayOfGamesIdentifications[game.ID] = game.IDENTIFICATION;
			}
		}
	});
},

goToGame: function() {
	
	if (websocket == null) {
		NewVisitNamespace.noServerWorking();
	}
	else {

		var packetToSend = {
			TYPE: 'GO_TO_GAME',
			PATIENT_ID: patientID,
			GAME: arrayOfGamesIdentifications[gameID]
		};
		websocket.send(JSON.stringify(packetToSend));
		/**
		 * CatchMe game
		 */
		if (arrayOfGamesIdentifications[gameID] == "CATCH_ME") {
			
			NewVisitNamespace.catchMeGameSteps();
		}
		/**
		 * HelpMe game
		 */
		else if (arrayOfGamesIdentifications[gameID] == "HELP_ME") {	
			NewVisitNamespace.helpMeGameSteps();
		}
	}
		
},

/**
 * If the HelpMe! is the game to play, close the WebSocket connection 
 * and go to the page for real-time feedback
 */
helpMeGameSteps: function() {

	websocket.close();
	location.replace('watchHelpMe.html');
},

/**
 * Steps performed to start the CatchMe game
 */
catchMeGameSteps: function() {

	websocket.close();
	location.replace('watchCatchMe.html');
},

noServerWorking: function() {
	
	$('#waitingParameters').dialog("close").remove();
	
	$('<p>').text('Attenzione: Server non attivato o non funzionante. Verificare e riprovare')
		.appendTo($('<div>').attr('id', 'dialogServerNotWorking')
			.attr('title', 'Attenzione').appendTo('#mainContent'));

	$('#dialogServerNotWorking')
		.dialog({
			modal: true,
			resizable: false,
			draggable: false,
			width: (getScreenWidth() * 0.5),
			buttons: {
				"Chiudi": function() {
					$(this).dialog("close");
					$(this).remove();
				}
			}
		});
},

noClientConnected: function() {
	
	$('#waitingParameters').dialog("close").remove();
	
	$('<p>').text('Attenzione: nessun dispositivo per il paziente connesso. ' + 
			'Collegarlo e riprovare')
		.appendTo($('<div>').attr('id', 'dialogNoClientConnected')
			.attr('title', 'Errore')
			.appendTo('#mainContent'));
	
	$('#dialogNoClientConnected').dialog({
		modal: true,
		resizable: false,
		draggable: false,
		width: (getScreenWidth() * 0.5),
		buttons : {
			"Chiudi": function() {
				$(this).dialog("close");
				$(this).remove();
			}
		}
	});
},

presentationComplete: function() {
	
	console.log("Presentation Complete");
	initializePage();
},

initializePage: function() {
	
	NewVisitNamespace.getListOfPatients();
	
	$('#btnNewPatient').button()
		.click(function() {
			$(this).hide();
			$('#formNewPatient').fadeIn();
		});
	
	$('#dateOfBirth').datepicker({
		changeMonth: true,
		changeYear: true,
		dateFormat: 'yy-mm-dd',
		yearRange: "-20:+2"
	});
	
	$('#btnInsertNewPatient').button()
		.click(function(event) {

			event.preventDefault();
			
			var patientName = $('#name').val();
			var patientSurname = $('#surname').val();
			
			if (patientName == "" || patientSurname == "") {
				
				var listErrors = $('<ul>').css('list-style-position', 'inside');
				
				if (patientName == "") {
					$('<li>').text('Nome non inserito').appendTo(listErrors);
				}
				if (patientSurname == "") {
					$('<li>').text('Cognome non inserito').appendTo(listErrors);
				}
				
				$('<div>').attr('id', 'dialogErrorInput').attr('title', 'Informazioni mancanti')
					.css('padding',' 0.3em').appendTo('#divTableNewPatient');
				
				$('<p>').text('Non sono state inserite tutte le informazioni necessarie: ')
					.appendTo('#dialogErrorInput');
				
				listErrors.appendTo('#dialogError');
				
				$('#dialogErrorInput').dialog({
					modal: true,
					resizable: false,
					draggable: false,
					width: getScreenWidth() * 0.5, 
					buttons: {
						Ok: function() {
							$(this).dialog('close');
							$(this).remove();
						}
					}
				}).parent().addClass('ui-state-error');
				
			}
			else {
				
				var dateOfBirth = $('#dateOfBirth').val();
				var disability = $('#disabilita').val();
				var sex = $('input:radio[name=sex]:checked').val();
				
				$.ajax({
					url: SERVER_ADDRESS + '/server/AddNewPatient.php',
					type: "POST",
					data: {
						name: patientName, surname: patientSurname, 
						dateOfBirth: dateOfBirth, disabilita: disability, 
						sex: sex, doctorID: doctorID 
						},
					success: function(message) {
						
						console.log(message);
						var data = JSON.parse(message);
						
						if (data.OK == 'true') {
												
							$('<option>').val(data.ID).attr('selected', 'selected')
								.text(data.SURNAME + " " + data.NAME).appendTo('#selectPatient');
							
							var dialog = $('<div>').attr('id', 'dialogInsertOk').attr('title', 'Inserimento Avvenuto')
								.appendTo('#divNewPatient');
							
							$('<p>').text('Operazione completata').appendTo(dialog);
							$('<p>').text('Il nuovo bambino è già selezionato nell\'elenco a sinistra.').appendTo(dialog);
							
							dialog.dialog({
								modal: true, 
								draggable: false,
								resizable: false,
								width: getScreenWidth() * 0.4,
								buttons: {
									Ok: function() {
										$(this).dialog("destroy");
										$(this).remove();
									}
								}
							});
							
							$('#divNewPatient').fadeOut();
							
						}	
						else {
							$('<p>').text("Errore nell'inserimento").appendTo(
								$('<div>').attr('id', 'dialogError').attr('title', 'Errore!').appendTo('#divNewPatient'));

							$('<p>').text(data.ERROR).appendTo('#dialogError');
							
							$('#dialogError').dialog({
								modal: true,
								draggable: false,
								resizable: false,
								width: getScreenWidth() * 0.4, 
								buttons: {
									Ok: function() {
										$(this).dialog("close");
										$(this).remove();
									}
								}
							}).parent().addClass('ui-state-error');
						}
					}
				});
			}
		});
	
	$('#btnAnnullaInserimento').button()
		.click(function(event) {
			
			event.preventDefault();
			$('#formNewPatient').hide();
			$('#btnNewPatient').fadeIn();			
		});
	
	$('#formNewPatient').hide();
	
	NewVisitNamespace.getListOfGames();
	
	$('#selectGames').change(function() {
		
		gameID = $(this).val();
		
		if (gameID == "") {
			$('#gameDescription').text("");
		}
		else {
			$('#gameDescription').text(arrayOfDescriptionGames[gameID]);
		}
	});
	
	$('#buttonStart').button()
			.click(NewVisitNamespace.checkEverythingReady);

	openWebSocket(doctorClientWebsocketPort);
}
};

function presentationComplete() {

}

$('document').ready(function(e) {

	if (!checkAlreadyLogged()) {
		location.replace("../index.html");
	}
	
	$('#imgGoBack').off('click');
	$('#imgGoBack').click(function() {
		location.replace('index.html');
	});

	NewVisitNamespace.initializePage();
});