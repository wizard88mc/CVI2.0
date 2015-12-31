datiEyeTracker = [];
maxEyeTracker =  -1;
datiTouch = [];
maxTouch = -1;
movements = new Object();
imagePositions = new Object();
touchPositions = new Object();
eyesPositions = new Object();
currentSpeedValue = -1;
timing = null;
tooltipObject = new Object();

var patientID;
var gameIdentification = "CATCH_ME";

identificationType = doctorIdentificationType;
	
var CatchMeNamespace = {
	
	trainingComplete: function() {
		
		var fakePacket = {
			TYPE: 'TRAINING_SESSION',
			DATA: 'false'
		};
		
		CatchMeNamespace.entryFunction(JSON.stringify(fakePacket));
	},
	
	entryFunction: function(message) {
		
		var dataReceived = JSON.parse(message.data || message);
		
		console.log(dataReceived);
		
		if (dataReceived.TYPE == 'IMAGE_SPECIFICATION') {
		
			tooltipObject['tooltipWidth'] = dataReceived.SCREEN_WIDTH * 0.4;
			tooltipObject['tooltipHeight'] = dataReceived.SCREEN_HEIGHT * 0.4;
			tooltipObject['imageWidth'] = dataReceived.IMAGE_WIDTH * 0.4;
			tooltipObject['imageHeight'] = dataReceived.IMAGE_HEIGHT * 0.4;
			
			TrainingManager.screenWidth = dataReceived.SCREEN_WIDTH;
			
			$('#mainContent div').remove();
			
			$('<div>').attr('id', 'divGrafo').appendTo('#mainContent');
			CatchMeNamespace.prepareChart();
			
			/**
			 * Everything is ready to start, showing a dialog to the doctor
			 * to start the game
			 */
		}
		else if (dataReceived.TYPE == "TRAINING_SESSION" && 
			dataReceived.DATA == "false") {

			websocket.onmessage = CatchMeNamespace.manageMessagesGame;
		
			$('<p>').text('Non appena tutto sarà pronto, cliccare su Ok per iniziare')
				.appendTo(
					$('<div>').attr('id', 'dialogWaitingToStart')
						.attr('title', 'Pronto a cominciare')
						.appendTo('#mainContent')
				);
			
			$('#dialogWaitingToStart').dialog({
				modal: true,
				resizable: false,
				closeOnEscape: false,
				draggable: false,
				buttons: {
					Ok: function() {
						$(this).dialog("close");
						$(this).remove();
						
						var packetToSend = {
							TYPE: 'START_GAME'
						};
						
						websocket.send(JSON.stringify(packetToSend));
						timing = setInterval(CatchMeNamespace.updateChart, 5000);
					}
				}
			});
		}
		else if (dataReceived.TYPE == "TRAINING_SESSION" && 
			dataReceived.DATA == "true") {
			
			/**
			 * Showing dialog to start training session
			 */
			TrainingManager.screenWidth = screenWidth;
			TrainingManager.dialogSelectParameters();
		}
		else if (dataReceived.TYPE == "CALIBRATION_RESULT") {
			TrainingManager.trainingResult(dataReceived);
		}
	},
	
	updateChart: function() {
	
		var maxY = -1;
		if (maxTouch > maxEyeTracker) {
			maxY = maxTouch; 
		}
		else { maxY = maxEyeTracker; };
		grafo.setData([{label: 'Delta Vista', data: datiEyeTracker}, 
			{label: 'Delta Tocco', data: datiTouch}]);
			
		grafo.getOptions().yaxes[0].max = maxY + 10;
		
		if (datiTouch.length > 0) {
			
			var lastValue = (datiTouch[datiTouch.length - 1])[0];
			
			grafo.getOptions().xaxes[0].max = lastValue + 20;
			if (lastValue > 60 * 1000) {
				grafo.getOptions().xaxes[0].min = lastValue - (60 * 1000);
			}
		}
		
		grafo.setupGrid();
		grafo.draw();
	},
	
	prepareChart: function() {
		
		datiEyeTracker = [];
		maxEyeTracker =  -1;
		datiTouch = [];
		maxTouch = -1;
		movements = new Object();
		imagePositions = new Object();
		touchPositions = new Object();
		eyesPositions = new Object();
		currentSpeedValue = -1;
	
		$('#divGrafo').height(getScreenHeight() * 0.6);
		
		grafo = $.plot($('#divGrafo'), [
			{
				label: 'Delta Vista', 
				data: [datiEyeTracker],
				color: '#000080'
			}, 
			{
				label: 'Delta Tocco', 
				data: [datiTouch],
				color: 'rgb(204, 0, 5)'
			}], opzioniGrafo);
		
		$('#divGrafo').bind('plothover', function(event, pos, item) {
			
			if (item) {
				$('#tooltip').remove();
				clearInterval(timing);
				
				timing = null;
				var timeValue = item.datapoint[0].toFixed();
				
				createTooltip(item.pageX, item.pageY, timeValue, 0.4);
			}
			else {
				
				$('#tooltip').remove();
				if (timing == null) {
					timing = setInterval(CatchMeNamespace.updateChart, 5000);
				}
			}
		});
		
		$('<div>').attr('id', 'divManager').appendTo('#mainContent');
		
		$('<div>').attr('id', 'divSliderSpeed').appendTo('#divManager');
		$('<h1>').text('Modifica velocità').appendTo('#divSliderSpeed');
		
		$('<input>').attr('id', 'sliderSpeed').attr('type', 'slider')
			.attr('name', 'sliderSpeed').appendTo('#divSliderSpeed');
		
		$('<span>').attr('id', 'labelSpeed').appendTo('#divSliderSpeed');
		
		$('#divSliderSpeed').css('visibility', 'hidden');
		
		$('<div>').attr('id', 'buttonSendSpeed').appendTo('#divSliderSpeed')
			.button({
				label: 'Invia Modifica',
				disabled: true
			}).click(function() {
			
				var speed = $('#sliderSpeed').attr('value');
				var packet = {'TYPE': 'CHANGE_SPEED', 'NEW_SPEED' : speed};
				
				websocket.send(JSON.stringify(packet));
				currentSpeedValue = speed;
				$(this).button("disable");
			});
		
		var divArrows = $('<div>').attr('id', 'arrowsMoveGraph')
			.appendTo('#divManager');
		
		
		$('<img>').attr('id', 'leftArrow').attr('alt', 'Muovi grafico a sinistra')
			.attr('src', '../images/leftarrow.png').addClass('arrow')
			.appendTo(divArrows)
			.click(function(e) {
			
				e.preventDefault();
				grafo.pan({left: -1000});
		});
			
		$('<img>').attr('id', 'rightArrow')
			.addClass('arrow').attr('src', '../images/rightarrow.png')
			.attr('alt', 'Muovi grafo verso destra')
			.appendTo(divArrows)
			.click(function(e) {
				e.preventDefault();
				grafo.pan({left: 1000});
			});
		
		$('<div>').attr('id', 'buttonStopGame').appendTo('#divManager')
			.button({
				label: 'Interrompi gioco'
			})
			.click(function() {
				var packet = {'TYPE': 'STOP_GAME'};
				websocket.send(JSON.stringify(packet));
				
				$('#divSliderSpeed').css('visibility', 'hidden');
				$(this).css('visibility', 'hidden');
				clearInterval(timing);
				CatchMeNamespace.updateChart();
			})
			.css('visibility', 'hidden');
		
		$('<div>').appendTo('#divManager').css('clear', 'both');
		
	},
	
	manageMessagesGame: function(message) {
	
		var dataReceived = JSON.parse(message.data);
		
		if (dataReceived.TYPE == "GRAPH_DATA") {
			
			console.log(dataReceived);
			/**
			 * Adding received data to the graph
			 */
			datiEyeTracker.push([dataReceived.TIME, dataReceived.DELTA_EYE]);
			datiTouch.push([dataReceived.TIME, dataReceived.DELTA_TOUCH]);
			
			if (dataReceived.DELTA_EYE > maxEyeTracker) {
				maxEyeTracker = dataReceived.DELTA_EYE;	
			}
			if (dataReceived.DELTA_TOUCH > maxTouch) {
				maxTouch = dataReceived.DELTA_TOUCH;
			}
			
			imagePositions[dataReceived.TIME] = new Point(dataReceived.IMAGE_SPECS.posTop, 
												dataReceived.IMAGE_SPECS.posLeft);
			touchPositions[dataReceived.TIME] = new Point(dataReceived.TOUCH_SPECS.posTop,
												dataReceived.TOUCH_SPECS.posLeft);
			if (dataReceived.EYES_SPECS.posTop != -1 && dataReceived.EYES_SPECS.posLeft != -1)
			{
				eyesPositions[dataReceived.TIME] = new Point(dataReceived.EYES_SPECS.posTop,
						dataReceived.EYES_SPECS.posLeft);
			}
			else 
			{
				eyesPositions[dataReceived.TIME] = new Point(null, null);
			}
												
			movements[dataReceived.TIME] = dataReceived.MOVEMENT;
		}
		else if (dataReceived.TYPE == "STOP_GAME") {
			clearInterval(timing);
			$('#divSliderSpeed').css('visibility', 'hidden');
			$('#buttonStopGame').css('visibility', 'hidden');
		}
		else if (dataReceived.TYPE == 'SPEED_VALUE') {
			
			$('#buttonStopGame').css('visibility', 'visible');
			$('#divSliderSpeed').css('visibility', 'visible');
			
			$('#sliderSpeed').attr('value', dataReceived.SPEED);
			currentSpeedValue = dataReceived.SPEED;
			$('#sliderSpeed').slider({
				from: 1, to: 10, step: 1,
				format: {format: '##'}, skin: 'round',
				onstatechange: function(value) {
					
					$('#speedLabel').text(value);
					if (value == currentSpeedValue) {
						$('#buttonSendSpeed').button("disable");
					}
					else {
						$('#buttonSendSpeed').button("enable");
					}
				}
			});
		}
		else {
			console.log("Bad Message Received in manageMessagesGame");
			console.log(dataReceived);
		}
	}
};

TrainingManager.trainingComplete = CatchMeNamespace.trainingComplete;

function presentationComplete() {

	var packetToSend = {
		TYPE: 'GET_PATIENT_ID'
	};
	websocket.send(JSON.stringify(packetToSend));

	websocket.onmessage = function(message) {

		var response = JSON.parse(message.data);
		patientID = response.DATA;

		setTimeout(CatchMeSettingsNamespace.requestScreenClient, 3000);
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
		}
		
		location.replace('new_visit.html');
	});

	openWebSocket(doctorClientWebsocketPort);
});
