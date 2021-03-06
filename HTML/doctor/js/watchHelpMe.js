var tableBody = null;
var firstResponseTimeValues = {};
var completionTimeValues = {};
var goodAnswers = {};
var badAnswers = {};
var ratio = 0;
var canvas = null;
var context = null;
var indexCurrentLevel = 0;
var changeCurrentIndexLevel = false;
var drawingSettings = {
	firstPointTouch: false,
	firstPointEye: false,
	firstPointImage: false,
	lastPointTouch: new Point(),
	lastPointEye: new Point(),
	lastPointImage: new Point(),
	colorImage: '#FF0000',
	colorTouch: '#00FF00',
	colorEye: '#000000',
	mirinoEye:null 
};

var patientID;
var gameIdentification = "HELP_ME";

identificationType = doctorIdentificationType;

var HelpMeNamespace = {
		
	initializePage: function() {

		$('#mainContent div').remove();
	
		HelpMeNamespace.prepareTable();	
		
		$('<div>').attr('id', 'screenPreview').insertBefore('#tableResultsHelpMe');
		
		HelpMeNamespace.prepareLegend();
		HelpMeNamespace.prepareCanvas();
		
		$('<div>').attr('id', 'divButtonStopGame').text('Stop game')
			.insertBefore('#tableResultsHelpMe')
			.button().on('click', function() {
				
				var packetToSend = {
					TYPE: "STOP_GAME"
				};
				
				websocket.send(JSON.stringify(packetToSend));
				
				$(this).remove();
			});
		
		websocket.onmessage = HelpMeNamespace.entryFunction;
	},
	
	trainingComplete: function() {	
		var fakePacket = {
			TYPE: 'TRAINING_SESSION',
			DATA: 'false'
		};
		
		HelpMeNamespace.entryFunction(JSON.stringify(fakePacket));
	},
	
	/**
	 * Manages the messages received during 
	 * the exercises of the child
	 */
	entryFunction: function(message) {
		
		var packet = JSON.parse(message.data || message);
		
		if (packet.TYPE == "TRAINING_SESSION" && packet.DATA == "false") {
			
			useEyeTracker = true;
			
			$('<p>').text('Non appena tutto sarà pronto, cliccare su ' + 
				'Ok per iniziare la presentazione...')
			.appendTo(
				$('<div>').attr('id', 'dialogWaitingToStart')
				.attr('title', 'Pronto')
				.appendTo('#mainContent')
				.dialog({
					modal: true,
					resizable: false,
					closeOnEscape: false,
					draggable: false,
					buttons: {
						Ok: function() {
							$(this).dialog('close');
							$(this).remove();
							
							var packetToSend = {
								'TYPE': 'START_PRESENTATION'
							};
							
							websocket.send(JSON.stringify(packetToSend));
							
							$('<p>').text('Presentazione in corso. Attendere ....').appendTo(
								$('<div>').attr('id', 'dialogWaitingEndPresentation')
								.attr('title', 'Attendere')
								.appendTo('#mainContent').dialog({
									modal: true,
									resizable: false,
									closeOnEscape: false,
									draggable: false
								})
							);
						}						
					}
				})
			);
		}
		/**
		 * Show dialog to select training parameters 
		 */
		else if (packet.TYPE == 'TRAINING_SESSION' && packet.DATA == "true") {

			TrainingManager.screenWidth = screenWidth;
			TrainingManager.dialogSelectParameters();
		}
		/**
		 * Training is ended, show evaluation from the eye tracker 
		 */
		else if (packet.TYPE == 'CALIBRATION_RESULT') {

			TrainingManager.trainingResult(packet);
		}
		/*else if (packet.TYPE == 'EYE_TRACKER_NOT_READY') {

			$('<p>').text('Il sistema di eye-tracking non è collegato. Si desidera procedere con la visita senza analisi del movimento degli occhi?')
			.appendTo(
					$('<div>').attr('id', 'dialogTrackerNotReady')
					.attr('title', 'Tracciamento degli occhi non collegato')
					.appendTo('#mainContent')
			)
			.dialog({
				modal: true,
				resizable: false,
				closeOnEscape: false,
				draggable: false,
				width: getScreenWidth() * 0.5,
				buttons: {
					'Prosegui senza': function() {
						$(this).dialog("close");
						$(this).remove();
						
						useEyeTracker = false;
						
						var fakePacket = {
								TYPE: 'EYE_TRACKER_READY',
								DATA: 'false'
						};
						HelpMeNamespace.entryFunction(JSON.stringify(fakePacket));
						
					},
					'Attendi collegamento': function() {
						console.log("Attendi collegamento");
						$(this).dialog("close");
						$(this).remove();
						$('<p>').text('Collegare il sistema di eye-tracking ' + 
							'per continuare...').appendTo(
								$('<div>').attr('id', '#dialogWaitingTracker')
								.attr('title', 'In Attesa...')
								.appendTo('#mainContent')
								.dialog({
									modal: true,
									resizable: false,
									closeOnEscape: false,
									draggable: false,
									width: getScreenWidth() * 0.4
								})
						);
						
						var packetToSend = {
							TYPE: 'WAITING_TRACKER'
						};
						
						websocket.send(JSON.stringify(packetToSend));
					}
				}
			});
		}*/
		else if (packet.TYPE == 'PRESENTATION_COMPLETE') {

			$('#dialogWaitingEndPresentation').dialog('close').remove();
			
			$('<p>').text('Presentazione completata. Premere Ok per iniziare il gioco')
			.appendTo(
				$('<div>').attr('id', 'dialogWaitingToStart').attr('title', 'Cominciamo!')
				.appendTo('#mainContent')
				.dialog({
					modal: true,
					resizable: false,
					closeOnEscape: false,
					draggable: false,
					buttons: {
						Ok: function() {
							$(this).dialog('close');
							$(this).remove();
							
							var packetToSend = {
								'TYPE': 'START_GAME'
							};
							
							websocket.send(JSON.stringify(packetToSend));
							
							websocket.onmessage = 
								HelpMeNamespace.messagesDuringGame;
						}
					}
				})
			);
		}
		else {
			console.log("Bad Message in entryFunction:");
			console.log(message);
			console.log(message.data);
		}
		
	},
	
	messagesDuringGame: function(message) {
		
		var data = JSON.parse(message.data);
		
		/**
		 * GAME_POSITIONS: positions to show
		 */
		if (data.TYPE == 'GAME_POSITIONS') {
			
			var pointTouch = data.TOUCH_SPECS;
			
			if (pointTouch.LEFT != null && pointTouch.LEFT != -1) {
				pointTouch.LEFT = pointTouch.LEFT * ratio;
				pointTouch.TOP = pointTouch.TOP * ratio;
				
				if (!drawingSettings.firstPointTouch) {
					drawingSettings.firstPointTouch = true;
				}
				else {
					
					context.strokeStyle = drawingSettings.colorTouch;
					context.beginPath();
					context.lineWidth = 3;
					context.moveTo(drawingSettings.lastPointTouch.LEFT, 
						drawingSettings.lastPointTouch.TOP);
					context.lineTo(pointTouch.LEFT, pointTouch.TOP);
					context.closePath();
					context.stroke();
				}
				
				drawingSettings.lastPointTouch = pointTouch;
			}
			else if (pointTouch.LEFT != null && pointTouch.LEFT == -1) {
				drawingSettings.firstPointTouch = false;
			}
			
			var pointEye = data.EYE_SPECS;
			console.log(pointEye);
			if (pointEye.LEFT != null && pointEye.LEFT != -1) {

				pointEye.LEFT = pointEye.LEFT * ratio;
				pointEye.TOP = pointEye.TOP * ratio;
				
				if (!drawingSettings.firstPointEye) {

					drawingSettings.firstPointEye = true;
				}
				else {

					context.strokeStyle = drawingSettings.colorEye;
					context.beginPath();
					context.lineWidth = 1;
					context.moveTo(drawingSettings.lastPointEye.LEFT, 
						drawingSettings.lastPointEye.TOP);
					context.lineTo(pointEye.LEFT, pointEye.TOP);
					context.closePath();
					context.stroke();
				}
				
				drawingSettings.lastPointEye = pointEye;
				drawingSettings.mirinoEye.css({
					visibility: 'visible',
					top: canvas.position().top + pointEye.TOP - drawingSettings.mirinoEye.height() / 2,
					left: canvas.position().left + pointEye.LEFT - drawingSettings.mirinoEye.width() / 2
				});
			}
			else if (pointEye.LEFT != null && pointEye.LEFT == -1) {
				drawingSettings.firstPointEye = false;
			}
			
			
			var pointImage = data.IMAGE_SPECS;
			
			if (pointImage.LEFT != null && pointImage.LEFT != -1) {
				pointImage.TOP = pointImage.TOP * ratio;
				pointImage.LEFT = pointImage.LEFT * ratio;
				
				if (!drawingSettings.firstPointImage) {
					drawingSettings.firstPointImage = true;
				}
				else {
					
					context.strokeStyle = drawingSettings.colorImage;
					context.fillStyoe = drawingSettings.colorImage;
					context.beginPath();
					context.lineWidth = 3;
					context.moveTo(drawingSettings.lastPointImage.LEFT, 
						drawingSettings.lastPointImage.TOP);
					context.lineTo(pointImage.LEFT, pointImage.TOP);
					context.closePath();
					context.stroke();
				}
				
				drawingSettings.lastPointImage = pointImage;
			}
			else if (pointImage.LEFT != null && pointImage.LEFT == -1) {
				drawingSettings.firstPointImage = false;
			}
			
		}
		/**
		 * LEVEL_ENDED: level complete, prepare next row
		 */
		else if (data.TYPE == 'LEVEL_ENDED') {
			
			//changeCurrentIndexLevel = true;
			indexCurrentLevel++;
		}
		/**
		 * SESSION_RESULT: the patient gave an answer, 
		 * add the statistics to the table
		 */
		else if (data.TYPE == 'SESSION_RESULTS') {
			
			var targetFamily = data.TARGET_FAMILY;
			
			/**
			 * First value for the level, initialize values
			 */
			if (!firstResponseTimeValues[indexCurrentLevel]) {
				firstResponseTimeValues[indexCurrentLevel] = new Array();
				completionTimeValues[indexCurrentLevel] = new Array();
				goodAnswers[indexCurrentLevel] = 0;
				badAnswers[indexCurrentLevel] = 0;
				
				var row = $('<tr>').attr('id', targetFamily + indexCurrentLevel)
					.css('font-weight', 'bold').appendTo(tableBody);
				
				var image = $('<img>').attr('src', '../images/less_details.png')
					.css({
						width: '15%',
						'vertical-align': 'middle',
						'margin-left': '0.2em',
						'margin-right': '0.2em',
						cursor: 'pointer'
					});
				
				var clickLessDetails = function(e) {
					e.preventDefault();
					var parentID = $(this).parent().parent('tr').attr('id');
					$('tr.sub'+parentID).fadeOut();
					
					image.off('click');
					image.attr('src', '../images/show_more.png');
					image.on('click', clickMoreDetails);
				};
				
				var clickMoreDetails = function(e) {
					e.preventDefault();
					var parentID = $(this).parent().parent('tr').attr('id');
					$('tr.sub'+parentID).fadeIn();
					
					image.off('click');
					image.attr('src', '../images/less_details.png');
					image.on('click', clickLessDetails);
				}
				
				image.on('click', clickLessDetails);
				
				image.appendTo($('<td>').text('Resume').appendTo(row));	
				$('<td>').text(targetFamily).appendTo(row);
				$('<td>').addClass('meanValueFRT').appendTo(row);
				$('<td>').addClass('meanValueCT').appendTo(row);
				$('<td>').addClass('counts').appendTo(row);
			}
			
			firstResponseTimeValues[indexCurrentLevel].push(data.FIRST_RESPONSE_TIME);
			completionTimeValues[indexCurrentLevel].push(data.COMPLETION_TIME);
				
			if (data.RIGHT_ANSWER == true) {
				goodAnswers[indexCurrentLevel]++;
			}
			else {
				badAnswers[indexCurrentLevel]++;
			}
			
			HelpMeNamespace.updateFamilyRow(targetFamily);
			
			var newRow = $('<tr>').attr('class', 'sub'+targetFamily+indexCurrentLevel)
				.appendTo(tableBody);
			$('<td>').text(data.OBJECT_NAME).appendTo(newRow);
			//$('<td>').text(targetFamily).appendTo(newRow);
			$('<td>').appendTo(newRow);
			$('<td>').text(data.FIRST_RESPONSE_TIME).appendTo(newRow);
			$('<td>').text(data.COMPLETION_TIME).appendTo(newRow);
			
			if (data.RIGHT_ANSWER == true) {
				$('<img>').attr('src', '../images/correct.png')
				.attr('alt', 'Risposta corretta')
				.css('width', '15%')
				.appendTo(
						$('<td>').appendTo(newRow)
				);
			}
			else {
				$('<img>').attr('src', '../images/incorrect.png')
				.attr('alt', 'Risposta errata')
				.css('width', '15%')
				.appendTo(
						$('<td>').appendTo(newRow)
				)
			}
			
			HelpMeNamespace.resetCanvas();
			
			/*if (changeCurrentIndexLevel) {
				indexCurrentLevel++;
				changeCurrentIndexLevel = false;
			}*/
		}
		else {
			console.log("Bad message received in Entry Function: ");
			console.log(data);
		}
	},
	
	updateFamilyRow: function(targetFamily) {
		
		var meanValueFRT = 0;
		var totalFRT = 0;
		var meanValueCT = 0;
		var totalCT = 0;
		
		for (var i = 0; i < firstResponseTimeValues[indexCurrentLevel].length; i++) {
			
			if (firstResponseTimeValues[indexCurrentLevel][i] != null) {
				meanValueFRT += firstResponseTimeValues[indexCurrentLevel][i];
				totalFRT++;
			}
		}
		
		meanValueFRT = meanValueFRT / totalFRT;
		
		for (var i = 0; i < completionTimeValues[indexCurrentLevel].length; i++) {
			
			if (completionTimeValues[indexCurrentLevel][i] != null) {
				meanValueCT += completionTimeValues[indexCurrentLevel][i];
				totalCT++;
			}
		}
		
		meanValueCT = meanValueCT / totalCT;
		
		var row = $('#tableResultsHelpMe tr[id=' + targetFamily + indexCurrentLevel + ']');
		
		row.children('.meanValueFRT').text(meanValueFRT.toFixed(2));
		row.children('.meanValueCT').text(meanValueCT.toFixed(2));
		row.children('.counts').text(goodAnswers[indexCurrentLevel] + '/' + 
									badAnswers[indexCurrentLevel]);
		
	},
	
	prepareTable: function() {
		
		var table = $('<table>').attr('id', 'tableResultsHelpMe')
			.addClass('alignCenter').appendTo('#mainContent');
		var row = $('<tr>').appendTo($('<thead>')
			.addClass('ui-widget-header').appendTo(table));
		$('<th>').text('Oggetto').appendTo(row);
		$('<th>').text('Famiglia Target').appendTo(row);
		$('<th>').text('Tempo risposta (ms)').appendTo(row);
		$('<th>').text('Tempo completamento (ms)').appendTo(row);
		$('<th>').text('Corrette / Errate').appendTo(row);
			
		tableBody = $('<tbody>').appendTo(table);		
	},
	
	prepareCanvas: function() {
		
		canvas = $('<canvas>').attr('id', 'screenSimulator')
			.prependTo('#screenPreview');
		
		canvasObject = canvas.get(0);
		
		var totalWidth = $('#screenPreview').width();
		var legendWidth = $('#divLegend').width();
		
		var total = 100 * (Math.floor((totalWidth - legendWidth) / 100) - 1);
		canvasObject.width = total;
		
		ratio = total / screenWidth;
		canvasObject.height = screenHeight * ratio;
		
		/*console.log(canvasObject.width);
		console.log(canvasObject.height);*/
		
		context = canvasObject.getContext('2d');
		context.lineWidth = 3;
		
		drawingSettings.mirinoEye = $('<img>').addClass('mirino')
			.attr('src', 'images/eye-new.png').appendTo('#screenPreview')
			.css({
				width: Math.floor(getScreenWidth() * 0.05),
				height: Math.floor(getScreenWidth() * 0.05)
			});
	},
	
	resetCanvas: function() {
		
		context.clearRect(0, 0, canvasObject.width, canvasObject.height);
		drawingSettings.firstPointEye = false;
		drawingSettings.firstPointImage = false;
		drawingSettings.firstPointTouch = false; 
		drawingSettings.lastPointEye = null;
		drawingSettings.lastPointImage = null;
		drawingSettings.lastPointTouch = null;
	},
	
	/**
	 * Prepares the legend of the report for the doctor
	 */
	prepareLegend: function() {
		
		var divLegend = $('<div>').attr('id', 'divLegend').appendTo('#screenPreview');
		
		$('<h2>').text('Label').appendTo(divLegend);
		
		var list = $('<ul>').appendTo(divLegend);
		$('<li>').addClass('imageCenter').text('Image center').appendTo(list);
		$('<li>').addClass('touchCenter').text('Touch position').appendTo(list);
		$('<li>').addClass('eyeCenter').text('Eyes position').appendTo(list);
	}
};

TrainingManager.trainingComplete = HelpMeNamespace.trainingComplete;

/**
 * Function called when the WebSocket port is open, first step is to require
 * the patiend ID
 */
function presentationComplete() {

	var packetToSend = {
		TYPE: 'GET_PATIENT_ID'
	};
	websocket.send(JSON.stringify(packetToSend));

	websocket.onmessage = function(message) {

		var response = JSON.parse(message.data);
		patientID = response.DATA;

		setTimeout(HelpMeSettingsNamespace.requestScreenClient, 3000);
	}
}

$('document').ready(function() {

	$('<p>').text('Sto recuperando le impostazioni di gioco ...')
		.appendTo($('<div>').attr('id', 'waitingParameters')
				.attr('title', 'Recupero informazioni').appendTo('#mainContent'));

	$('#waitingParameters').dialog({
		modal: true,
		draggable: false,
		closeOnEscape: false,
		resizable: false,
		width: 'auto',
		open: function() {
			$('a.ui-dialog-titlebar-close').hide();
		}
	});

	$('#imgGoBack').off('click');
	$('#imgGoBack').on('click', function() {

		// invio pacchetto x dire di tornare indietro
		if (websocket != null) {
			var packet = {
				TYPE: 'GO_BACK'
			};
			
			websocket.send(JSON.stringify(packet));

			websocket.close();
			websocket = null;
		}
		
		$('#mainContent div, #mainContent table').remove();
		imagesFamily = new Object();
		listOfLevels = [];
		listOfLevelTipologies = [];
		listOfImages = [];
		familySound = new Object();
		divTabs = null;

		location.replace('new_visit.html');
	});

	openWebSocket(doctorClientWebsocketPort);
});
