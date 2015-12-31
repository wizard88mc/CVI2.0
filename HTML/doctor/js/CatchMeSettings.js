function GameSettings() {

	this.rightMovement = true;
	this.leftMovement = false;
	this.upMovement = true;
	this.downMovement = false;
	this.startFromCenter = false;
	this.mixMovements = false;
	this.speed = 5;
	this.backgroundColor = '#000000';
	this.foregroundColor = '#FFFFFF';
	this.imageID = 1;
	this.changeImageColor = false;
	this.percentualImageWidth = 20; // Percent of the image width, used for CSS
	this.imageFileName = "";
	this.numberOfRepetitions = 1;
	
this.getBackgroundRGB = function() {
	return new Array(hexToR(this.backgroundColor),
					hexToG(this.backgroundColor),
					hexToB(this.backgroundColor));
};

this.getForegroundRGB = function() {
	return new Array(hexToR(this.foregroundColor),
					hexToG(this.foregroundColor),
					hexToB(this.foregroundColor));
};
	
};
var exercisesToSend = new Object();
var gameSettings = new GameSettings();
var availableImages = new Object();
var aviableImages = new Object();
var patientID = null;
var canvasSettings = new Object();
var screenWidth = 0;
var screenHeight = 0;

function getMaxNumberInsideObject(object) {
	var num = 0;
	for (var index in object) {
		if (object[index] != null) {
			num++;
		}
	}
	return num;
}

var CatchMeSettingsNamespace = {

verifyColorContrast: function() {
		
	var goodColorContrast = checkColorContrast(gameSettings.getBackgroundRGB(), 
											gameSettings.getForegroundRGB());
	
	if (!goodColorContrast) {
		$('#divBadContrast').fadeIn();
	}
	else {
		$('#divBadContrast').fadeOut();
	}
	
	var canvas = $('#imageExample')[0];
	if (canvas != null) {
		var context = canvas.getContext('2d');
		context.fillStyle = gameSettings.foregroundColor;
		context.fillRect(0, 0, canvas.width, canvas.height);
	}
	
	var divExampleDimensions = $('#exampleDimensions');
	if (divExampleDimensions != null) {
		divExampleDimensions.css('background-color', gameSettings.backgroundColor);
	}
},

updateLabelSpeed: function(speed) {
	
	gameSettings.speed = speed;
	$('#labelSpeed').text(speed);
},

updateCanvasPreview: function(value) {
	
	gameSettings.percentualImageWidth = value;
	$('#imageExample').width(gameSettings.percentualImageWidth + '%');
	
	var centerOfPreviewDiv = Math.round($('#exampleDimensions').height() / 2);
	var topOfImagePreview = centerOfPreviewDiv - Math.round($('#imageExample').height() / 2);
	
	$('#imageExample').css('margin-top', topOfImagePreview + 'px');
},

/**
 * First function to call to start with the game settings
 */
requestScreenClient: function() {
	
	var packetToSend = {
		"TYPE": "SCREEN_MEASURES"
	};
	
	websocket.onmessage = function(message) {
		
		var data = JSON.parse(message.data);
		if (data.TYPE == "SCREEN_MEASURES") {
			
			if (data.RESULT == true) {
				screenWidth = data.SCREEN_WIDTH;
				screenHeight = data.SCREEN_HEIGHT;
				
				CatchMeSettingsNamespace.requestGameSettings();
			}
			
		}
	};
	websocket.send(JSON.stringify(packetToSend));
	
},
/**
 * Called to retrieve game settings for the patient
 */
requestGameSettings: function() {
	
	$('#mainContent div').remove();
	
	$('<div>').attr('id', 'headerSettings').appendTo('#mainContent');
	$('<h1>').text('Impostazioni di gioco').appendTo('#headerSettings');
	$('#headerSettings').addClass('ui-widget-header ui-corner-all alignCenter');
	
	$.ajax({
		url: SERVER_ADDRESS + '/server/GetGameSettingsCatchMe.php',
		type: 'POST',
		data: {patientID: patientID},
		success: function(message) {
			
			$('#waitingParameters').dialog("close");
			$('#waitingParameters').remove();
			
			console.log(message);
			CatchMeSettingsNamespace.setGameSettingsNew(JSON.parse(message));
			
		}
	});
},

updateMovementsLabel: function(settings, element) {
	
	var text = "";
	
	if (settings.upMovement) {
		text += "Alto";
	}
	if (settings.downMovement) {
		text += ", Basso";
	}
	if (settings.rightMovement) {
		text += ", Destra";
	}
	if (settings.leftMovement) {
		text += ", Sinistra";
	}
	
	if (text.charAt(0) == ",") {
		text = text.substring(1);
	}
	
	$(element).text(text);
	
}, 

buildDialogChooseMovement: function(settingsToChange, elementToUpdate) {
	
	var settingsFinal = new Object();
	settingsFinal.rightMovement = settingsToChange.rightMovement;
	settingsFinal.leftMovement = settingsToChange.leftMovement;
	settingsFinal.upMovement = settingsToChange.upMovement;
	settingsFinal.downMovement = settingsToChange.downMovement;
	
	var divMovimenti = $('<div>').attr('id', 'divDialogMovimenti')
		.addClass('ui-widget-content ui-corner-all').attr('title', 'Gestione movimenti')
		.appendTo('#mainContent');
	
	/**
	 * Checkbox per movimenti verso l'alto
	 */
	$('<input>').attr('type', 'checkbox').attr('id', 'upMovement')
		.attr('name', 'upMovement').appendTo(divMovimenti)
		.change(function() {
			settingsFinal.upMovement = !settingsFinal.upMovement;
	});
	$('<label>').attr('for', 'upMovement').text('Movimento verso l\'alto').appendTo(divMovimenti);
	$('<br />').appendTo(divMovimenti);
	
	if (settingsToChange.upMovement == true) {
		$('#divDialogMovimenti input#upMovement').attr('checked', 'checked');
	}
	
	/**
	 * Checkbox per movimenti verso il basso
	 */
	$('<input>').attr('type', 'checkbox').attr('id', 'downMovement')
		.attr('name', 'downMovement').appendTo(divMovimenti)
		.change(function() {
			settingsFinal.downMovement = !settingsFinal.downMovement;
	});
	
	$('<label>').attr('for', 'downMovement').text('Movimento verso il basso').appendTo(divMovimenti);
	$('<br />').appendTo(divMovimenti);
	
	if (settingsToChange.downMovement == true) {
		$('#divDialogMovimenti input#downMovement').attr('checked', 'checked');
	}
	
	/**
	 * Checkbox per movimenti verso destra
	 */
	$('<input>').attr('type', 'checkbox').attr('id', 'rightMovement')
		.attr('name', 'rightMovement').appendTo(divMovimenti)
		.change(function() {
			settingsFinal.rightMovement = !settingsFinal.rightMovement;
		});
	$('<label>').attr('for', 'rightMovement').text('Movimento verso destra').appendTo(divMovimenti);
	$('<br />').appendTo(divMovimenti);
	
	if (settingsToChange.rightMovement == true) {
		$('#divDialogMovimenti input#rightMovement').attr('checked', 'checked');
	}
	
	/**
	 * Checkbox per movimenti verso sinistra
	 */
	$('<input>').attr('type', 'checkbox').attr('id', 'leftMovement')
		.attr('name', 'leftMovement').appendTo(divMovimenti)
		.change(function() {
			settingsFinal.leftMovement = !settingsFinal.leftMovement;
	});
	$('<label>').attr('for', 'leftMovement').text('Movimento verso sinistra').appendTo(divMovimenti);
	$('<br />').appendTo(divMovimenti);
	
	if (settingsToChange.leftMovement == true) {
		$('#divDialogMovimenti input#leftMovement').attr('checked', 'checked');
	}
	
	divMovimenti.appendTo('#mainContent')
		.dialog({
			modal: true,
			draggable: false,
			resizable: false,
			closeOnEscape: false,
			width: '50%',
			buttons: {
				"Conferma": function() {
					$(this).dialog("close");
					$(this).remove();
					settingsToChange.rightMovement = settingsFinal.rightMovement;
					settingsToChange.leftMovement = settingsFinal.leftMovement;
					settingsToChange.upMovement = settingsFinal.upMovement;
					settingsToChange.downMovement = settingsFinal.downMovement;
					CatchMeSettingsNamespace.updateMovementsLabel(settingsToChange, elementToUpdate);
				},
				"Annulla": function() {
					$(this).dialog("close");
					$(this).remove();
				}
			}
			
		})
},

buildDialogChangePicture: function(settingsToChange, imageToUpdate) {
	
	var currentImageID = settingsToChange.imageID;
	var divChangeImage = $('<div>').attr('id', 'divDialogChooseImage')
		.addClass('ui-widget-content ui-corner-all').attr('title', 'Seleziona immagine')
		.css('text-align', 'center')
		.appendTo('#mainContent');
	
	var select = $('<select>').attr('id', 'selectChooseImage').appendTo(divChangeImage);
	
	select.change(function() {
		
		currentImageID = $(this).val();
		$('#divDialogChooseImage #imgPreview').attr('src', '../catchMe/images/' + availableImages[currentImageID].IMG_FILE);
	})
	
	for (var imageID in availableImages) {
		
		var option = $('<option>').val(imageID).text(availableImages[imageID].IMG_NAME)
			.appendTo('#selectChooseImage');
		
		if (imageID == settingsToChange.imageID) {
			option.attr('selected', 'selected');
		}
	}
	
	var imagePreview = $('<img>').attr('id' ,'imgPreview')
		.css({
			display: 'block',
			'align-content': 'center',
			margin: 'auto',
			'margin-top': '1.0em',
			width: '60%'
		}).appendTo(divChangeImage);
	imagePreview.attr('src', '../catchMe/images/' + 
		availableImages[settingsToChange.imageID].IMG_FILE);
	
	divChangeImage.dialog({
		modal: true,
		draggable: false,
		resizable: false,
		closeOnEscape: false,
		width: '40%',
		buttons: {
			"Conferma": function() {
				$(this).dialog("close");
				$(this).remove();
				settingsToChange.imageID = currentImageID;
				settingsToChange.canvasSize = availableImages[settingsToChange.imageID].IMG_SIZE;
				imageToUpdate.attr('src', '../catchMe/images/' + availableImages[settingsToChange.imageID].IMG_FILE);
			},
			"Annulla": function() {
				$(this).dialog("close");
				$(this).remove();
			}
		}
	});
},

buildDialogChangeBackgroundColor: function(settingsToChange, elementToUpdate) {
	
	var currentBackground = settingsToChange.backgroundColor;
	
	var divChangeBackgroundColor = $('<div>').attr('id', 'divDialogChangeBackground')
		.addClass('ui-widget-content ui-corner-all').attr('title', 'Modifica colore di sfondo')
		.css({
			'text-align': 'center',
		})
		.appendTo('#mainContent');
	
	$('<div>').attr('id', 'backgroundColorPicker')
		.css({
			display: 'inline-block',
			margin: '1.0em',
			width: '50%',
			'vertical-align': 'middle'
		}).appendTo(divChangeBackgroundColor);
	var backgroundPicker = $.farbtastic('#divDialogChangeBackground #backgroundColorPicker');
	
	backgroundPicker.linkTo(function(color) {
		
		currentBackground = color;
		$('#divDialogChangeBackground > #previewBackgroundColor')
			.css({
				'background-color': color,
				display: 'inline-block',
				margin: 'auto'
			});
		//CatchMeSettingsNamespace.verifyColorContrast();
	});
	
	$('#backgroundColorPicker #farbtastic').css('margin', 'auto');
		
	$('<div>').attr('id', 'previewBackgroundColor').addClass('inline_block')
		.css({
			width: '2.0em',
			height: '2.0em',
			
		}).appendTo(divChangeBackgroundColor);
					
	backgroundPicker.setColor(currentBackground);
	
	divChangeBackgroundColor.dialog({
		modal: true,
		draggable: false,
		resizable: false,
		closeOnEscape: false,
		width: '40%',
		buttons: {
			"Conferma": function() {
				$(this).dialog("close");
				$(this).remove();
				settingsToChange.backgroundColor = currentBackground;
				$(elementToUpdate).css('background-color', currentBackground);
			}, 
			"Annulla": function() {
				$(this).dialog("close");
				$(this).remove();
			}
		}
	})
},

buildDialogChangeSize: function(settingsToChange, elementToUpdate) {
	
	var currentImageSize = settingsToChange.percentualImageWidth;
	var divChangeSize = $('<div>').attr('id', 'divDialogChangeImageSize')
		.addClass('ui-widget-content ui-corner-all')
		.attr('title', 'Modifica dimensione immagine')
		.css('text-align', 'center')
		.appendTo('#mainContent');
	
	var size = 	availableImages[settingsToChange.imageID].IMG_SIZE.split('x');
	canvasSettings.width = size[0];
	canvasSettings.height = size[1];
	
	var divDimensions = $('<div>').attr('id', 'divDimensions')
		.appendTo(divChangeSize);
	
	$('<input>').attr('type', 'slider').attr('id', 'sliderDimensions')
		.attr('name', 'dimensions').appendTo(
			$('<div>').addClass('divContainerSlider').appendTo(divDimensions));
	
	var exampleDimensions = $('<div>').attr('id', 'exampleDimensions').appendTo(divDimensions)
		.css({
			border: '1px solid #000',
			'background-color': settingsToChange.backgroundColor
		});
	
	var ratio = Math.ceil((screenWidth * 0.5) / (divDimensions.width() * 0.5));
	
	exampleDimensions.width(Math.floor(screenWidth * 0.5 / ratio));
	exampleDimensions.height(Math.floor(screenHeight * 0.5 / ratio));
	
	$('<canvas>').attr('id', 'imageExample').appendTo(exampleDimensions);
	
	var canvas = $('#divDialogChangeImageSize #imageExample')[0];
	canvas.width = canvasSettings.width;
	canvas.height = canvasSettings.height;
	var canvasContext = canvas.getContext('2d');
	canvasContext.fillStyle = settingsToChange.foregroundColor;
	canvasContext.fillRect(0, 0, canvas.width, canvas.height);
	$('#imageExample').css('width', settingsToChange.percentualImageWidth + '%');
	
	$('#divDialogChangeImageSize #sliderDimensions')
		.attr('value', settingsToChange.percentualImageWidth)
		.slider({
			from: 5, to: 80, step: 1,
			format: {format: '##'}, skin: 'plastic', 
			onstatechange: function(value) {
				currentImageSize = value;
				$('#divDialogChangeImageSize #imageExample').width(currentImageSize + '%');
				
				var centerOfPreviewDiv = Math.round($('#divDimensions #exampleDimensions').height() / 2);
				var topOfImagePreview = centerOfPreviewDiv 
					- Math.round($('#exampleDimensions #imageExample').height() / 2);
				
				$('#exampleDimensions #imageExample').css('margin-top', topOfImagePreview + 'px');
			}
	});
	
	divChangeSize.dialog({
		modal: true,
		draggable: false,
		resizable: false,
		exitOnEscape: false,
		width: '50%',
		buttons: {
			"Conferma": function() {
				$(this).dialog("close");
				$(this).remove();
				settingsToChange.percentualImageWidth = currentImageSize;
				elementToUpdate.text(currentImageSize + '%');
			},
			"Annulla": function() {
				$(this).dialog("close");
				$(this).remove();
			}
		}
	});
},

buildDialogChangeSpeed: function(settingsToUpdate, elementToUpdate) {
	
	var currentImageSpeed = settingsToUpdate.speed;
	var divChangeSpeed = $('<div>').attr('id', 'divDialogChangeImageSize')
		.addClass('ui-widget-content ui-corner-all')
		.attr('title', 'Modifica velocità')
		.css('text-align', 'center')
		.appendTo('#mainContent');
	
	$('<input>').attr('id', 'sliderSpeed').attr('type', 'slider')
	.attr('name', 'speed').attr('value', settingsToUpdate.speed)
		.css('margin-bottom', '2.0em')
		.appendTo(divChangeSpeed)
		.slider({
		from: 1, to: 10, step: 1, format: {format: '#'},
		onstatechange: function(value) {
			currentImageSpeed = value;
		}
	});
	
	divChangeSpeed.dialog({
		modal: true,
		draggable: false,
		resizable: false,
		closeOnEscape: false,
		width: '20%',
		buttons: {
			"Conferma": function() {
				$(this).dialog("close");
				$(this).remove();
				settingsToUpdate.speed = currentImageSpeed;
				$(elementToUpdate).text(currentImageSpeed + '/10');
			},
			"Annulla": function() {
				$(this).dialog("close");
				$(this).remove();
			}
		}
	})
},

deleteLevel: function(exerciseNumber, divToRemove) {
	
	divToRemove.remove();
	exercisesToSend[exerciseNumber] = null;
},

createNewExerciseEditer: function(exerciseOrder, numberExerciseLabel, settings) {
	
	exercisesToSend[exerciseOrder] = new GameSettings();
	
	var functionSelectRepetitions = function(exerciseID, numberRepetitions, divToAppend) {
		
		var select = $('<select>').attr('id', 'repetitions' + exerciseID);
		for (var i = 1; i < 6; i++) {
			var option = $('<option>').attr('value', i).text(i);
			
			if (i == numberRepetitions) {
				option.attr('selected', 'selected');
			}
			
			option.appendTo(select);
		}

		select.on('change', function() {
			var newValue = $(this).children('option[selected="selected"]').val();
			exercisesToSend[exerciseID].numberOfRepetitions = Number(newValue);
		})
		
		select.appendTo(divToAppend);
	};

	var divSetExercises = $('<div>').attr('id', 'divSetExercises' + exerciseOrder)
		.addClass('divSetExercises alignLeft ui-widget-content ui-corner-all ui-helper-clearfix');
	
	if (settings != null) {
		divSetExercises.appendTo('#mainContent');
	}
	else {
		divSetExercises.insertBefore('#buttons');
	}
	
	var spanDeleteLevel = $('<span>').text('Elimina livello')
		.addClass('eliminaLivello');
	
	$('<img>').attr('src', '../images/close.png').appendTo(spanDeleteLevel);
	
	var paragraph = $('<p>').text('Esercizio personalizzato')
		.addClass('ui-state-default ui-corner-all ui-helper-clearfix titleExercise')
		.appendTo(divSetExercises);
	
	spanDeleteLevel.appendTo(paragraph);
	
	spanDeleteLevel.on('click', function() {
		CatchMeSettingsNamespace.deleteLevel(exerciseOrder, divSetExercises);
	});
	
	$('<span>').addClass('ui-icon ui-icon-pencil').prependTo(paragraph);
	
	var divNumberRepetitions = $('<div>').attr('id', 'divNumberRepetitionsExercise' + exerciseOrder)
		.css({
			'text-align': 'center',
			padding: '0.5em'
		}).appendTo(divSetExercises);
	$('<p>').text("Numero di ripetizioni dell'esercizio: ").addClass('smallLabel')
		.css('display', 'inline-block').appendTo(divNumberRepetitions);
	
	if (settings != null) {
		exercisesToSend[exerciseOrder].numberOfRepetitions = settings.NUM_REPETITIONS;
	}
	
	functionSelectRepetitions(exerciseOrder, exercisesToSend[exerciseOrder].numberOfRepetitions, 
		divNumberRepetitions);
	
	var divFirstHalf = $('<div>').appendTo(divSetExercises);
	var divLeftSection = $('<div>').addClass('divLeft').appendTo(divFirstHalf);
	var divRightSection = $('<div>').addClass('divRight').appendTo(divFirstHalf);
	
	/**
	 * Section to modify the background color
	 */
	if (settings != null) {
		exercisesToSend[exerciseOrder].backgroundColor = settings.BACK_COLOR;
		exercisesToSend[exerciseOrder].foregroundColor = settings.IMG_COLOR;
		exercisesToSend[exerciseOrder].changeImageColor = settings.CHANGE_IMG_COLOR;
	}
	$('<p>').addClass('smallLabel inline_block').css({
		'margin-top': '1.0em'
	}).text('Colore di sfondo: ').appendTo(divLeftSection);
	
	$('<div>').attr('id', 'divBackgroundColorSmallPreview' + exerciseOrder)
		.addClass('backgroundColorSmallPreview')
		.css({
			'background-color': exercisesToSend[exerciseOrder].backgroundColor,
		}).appendTo(divLeftSection);
		
	$('<div>').attr('id', 'changeBackgroundColor' + exerciseOrder)
		.text('Modifica colore di sfondo')
		.addClass('changeBackgroundColor')
		.appendTo(divLeftSection)
		.button()
		.click(function(event) {
			CatchMeSettingsNamespace.buildDialogChangeBackgroundColor(exercisesToSend[exerciseOrder], 
				$('#divBackgroundColorSmallPreview'+exerciseOrder));
		});
	
	/**
	 * Section to modify the movements of the image
	 */
	$('<span>').attr('id', 'movementsChoosed' + exerciseOrder)
		.css({
			'float': 'none',
			'font-weight': 'normal'
		}).appendTo(
			$('<p>').addClass('smallLabel inline_block')
				.text('Movimenti: ').appendTo(divRightSection)
			);
	$('<div>').addClass('changeMovements').text('Modifica movimenti')
		.appendTo(divRightSection)
		.button()
		.click(function(event) {
			
			CatchMeSettingsNamespace.buildDialogChooseMovement(exercisesToSend[exerciseOrder], 
				$('#movementsChoosed'+exerciseOrder));
		});
	
	if (settings != null) {
		if (settings.RIGHT_MOV == "1") {
			exercisesToSend[exerciseOrder].rightMovement = true;
		}
		else {
			exercisesToSend[exerciseOrder].rightMovement = false;
		}
		if (settings.LEFT_MOV == "1") {
			exercisesToSend[exerciseOrder].leftMovement = true;
		}
		else {
			exercisesToSend[exerciseOrder].leftMovement = false;
		}
		if (settings.UP_MOV == "1") {
			exercisesToSend[exerciseOrder].upMovement = true;
		}
		else {
			exercisesToSend[exerciseOrder].upMovement = false;
		}
		if (settings.DOWN_MOV == '1') {
			exercisesToSend[exerciseOrder].downMovement = true;
		}
		else {
			exercisesToSend[exerciseOrder].downMovement = false;
		}
	}
	
	CatchMeSettingsNamespace.updateMovementsLabel(exercisesToSend[exerciseOrder], 
		$('#movementsChoosed'+exerciseOrder));
	
	/**
	 * Section to modify START FROM CENTER and COMBINE MOVEMENTS
	 */
	var divSpecs = $('<div>').appendTo(divRightSection);
	$('<img>').attr('id', 'imgStartFromCenter' + exerciseOrder)
		.addClass('imgYesOrNo').appendTo(
			$('<p>').addClass('smallLabel inline_block').css('width', '45%')
				.text('Parti dal centro').appendTo(divSpecs));
	
	$('img#imgStartFromCenter'+exerciseOrder).on('click', function() {
		if (exercisesToSend[exerciseOrder].startFromCenter == true) {
			$(this).attr('src', '../images/incorrect.png');
		}
		else {
			$(this).attr('src', '../images/correct.png');
		}
		exercisesToSend[exerciseOrder].startFromCenter = 
			!exercisesToSend[exerciseOrder].startFromCenter;
	});
	
	$('<img>').attr('id', 'imgCombineMovements'+exerciseOrder)
		.addClass('imgYesOrNo').appendTo(
			$('<p>').addClass('smallLabel inline_block').css('width', '45%')
				.text('Combina Movimenti').appendTo(divSpecs));
	
	$('img#imgCombineMovements'+exerciseOrder).on('click', function() {
		if (exercisesToSend[exerciseOrder].mixMovements == true) {
			$(this).attr('src', '../images/incorrect.png');
		}
		else {
			$(this).attr('src', '../images/correct.png');
		}
		exercisesToSend[exerciseOrder].mixMovements = !exercisesToSend[exerciseOrder].mixMovements;
	})
	
	if (settings != null) {
		if (settings.START_CENTER == "1") {
			exercisesToSend[exerciseOrder].startFromCenter = true;
		}
		if (settings.MIX_MOVEMENTS == "1") {
			exercisesToSend[exerciseOrder].mixMovements = true;
		}
	}
		
	if (exercisesToSend[exerciseOrder].startFromCenter) {	
		$('#imgStartFromCenter'+exerciseOrder).attr('src', '../images/correct.png');
	}
	else {
		$('#imgStartFromCenter'+exerciseOrder).attr('src', '../images/incorrect.png');
	}
	if (exercisesToSend[exerciseOrder].mixMovements) {
		$('#imgCombineMovements'+exerciseOrder).attr('src', '../images/correct.png');
	}
	else {
		$('#imgCombineMovements'+exerciseOrder).attr('src', '../images/incorrect.png');
	}
	
	var divSecondHalf = $('<div>').css('clear', 'both').appendTo(divSetExercises);
	divLeftSection = $('<div>').addClass('divLeft').appendTo(divSecondHalf);
	divRightSection = $('<div>').addClass('divRight').appendTo(divSecondHalf);
	
	/**
	 * Section to modify the size of the image
	 */
	if (settings != null) {
		exercisesToSend[exerciseOrder].percentualImageWidth = settings.IMG_WIDTH;
	}
	$('<span>').attr('id', 'sizeImage'+exerciseOrder).css('float', 'none').appendTo(
			$('<p>').addClass('smallLabel inline_block').css({
				'margin-top': '1.0em'
			}).text('Dimensione immagine: ').appendTo(divLeftSection)
		);
	
	$('span#sizeImage'+exerciseOrder).text(exercisesToSend[exerciseOrder].percentualImageWidth + '%');
	
	$('<div>').attr('id', 'changeSize').text('Modifica dimensione')
	.css({
		'font-size': '0.7em',
		'margin-bottom': '0.8em',
		'vertical-align': 'middle',
		'margin-top': '1.0em'
	}).appendTo(divLeftSection)
	.button()
	.click(function(event) {
		
		CatchMeSettingsNamespace.buildDialogChangeSize(exercisesToSend[exerciseOrder], 
			$('span#sizeImage'+exerciseOrder));
	});
	
	/**
	 * Section to modify speed of movements
	 */
	if (settings != null) {
		exercisesToSend[exerciseOrder].speed = settings.SPEED;
	}
	$('<span>').attr('id', 'speedImage'+exerciseOrder).css('float', 'none').appendTo(
			$('<p>').addClass('smallLabel inline_block').css({
				'margin-top': '1.0em'
			}).text('Velocità immagine: ').appendTo(divLeftSection)
		);
	
	$('span#speedImage'+exerciseOrder)
		.text(exercisesToSend[exerciseOrder].speed + '/10');
	
	$('<div>').attr('id', 'changeSpeed').text('Modifica velocità')
	.css({
		'font-size': '0.7em',
		'margin-bottom': '0.8em',
		'vertical-align': 'middle',
		'margin-top': '1.0em'
	}).appendTo(divLeftSection)
	.button()
	.click(function(event) {
		
		CatchMeSettingsNamespace.buildDialogChangeSpeed(exercisesToSend[exerciseOrder], 
			$('span#speedImage'+exerciseOrder));
	});
	
	/**
	 * Section to modify the image of the exercise
	 */
	
	if (settings != null) {
		exercisesToSend[exerciseOrder].imageID = settings.IMG_ID;
	}
	exercisesToSend[exerciseOrder].imageFileName = 
		availableImages[exercisesToSend[exerciseOrder].imageID].IMG_FILE;
	exercisesToSend[exerciseOrder].canvasSize = 
		availableImages[exercisesToSend[exerciseOrder].imageID].IMG_SIZE
	
	$('<img>').attr('id', 'imageChoosed'+exerciseOrder)
		.css({
			width: '10%',
			'vertical-align': 'middle',
			'margin-left': '0.8em'
		}).appendTo(
			$('<span>').addClass('smallLabel').css({
				'margin-top': '1.0em'
			}).text('Immagine: ').appendTo(divRightSection)
		);
	
	$('img#imageChoosed' + exerciseOrder)
		.attr('src', '../catchMe/images/' + 
			availableImages[exercisesToSend[exerciseOrder].imageID].IMG_FILE);
	
	$('<div>').attr('id', 'changeImage').text('Modifica immagine')
	.css({
		'margin-left': '10%',
		'font-size': '0.7em',
		'margin-bottom': '0.8em',
		'vertical-align': 'middle',
		'margin-top': '1.0em'
	}).appendTo(divRightSection)
	.button()
	.click(function(event) {
		
		CatchMeSettingsNamespace.buildDialogChangePicture(exercisesToSend[exerciseOrder], $('img#imageChoosed'+exerciseOrder));
		//CatchMeSettingsNamespace.buildDialogChangeSize(gameSettings, $('span#sizeDefault'));
	});
	
},

setGameSettingsNew: function(data) {
	
	availableImages = data.IMAGES_SPECS;
	
	exercisesToSend = new Object();
	
	var exercises = data.EXERCISES;
	
	for (var exerciseOrder in exercises) {
		
		CatchMeSettingsNamespace.createNewExerciseEditer(exerciseOrder, 
			exerciseOrder, exercises[exerciseOrder]);
	}
	
	$('<div>').attr('id', 'buttons').appendTo('#mainContent')
		.addClass('ui-widget-content ui-corner-all alignCenter');
	
	$('<button>').attr('id', 'buttonAddNewExercise').text('Aggiungi nuovo esercizio')
	.appendTo('#buttons').button()
	.click(function() {
		
		var indexNewLevel = Object.keys(exercisesToSend).length;
		var forLabelIndex = getMaxNumberInsideObject(exercisesToSend);
		
		if (forLabelIndex == 0) {
			forLabelIndex++;
		}
		
		CatchMeSettingsNamespace.createNewExerciseEditer(indexNewLevel, forLabelIndex, null);
		
	});

	$('<button>').attr('id', 'buttonStart').text('Comincia!')
		.appendTo('#buttons').button()
		.click(function(){
		
		var areThereErrors = false;
		var stringErrors = "";
		
		for (var number in exercisesToSend) {
			if (exercisesToSend[number] != null) {
				if (!exercisesToSend[number].rightMovement && !exercisesToSend[number].leftMovement &&
						!exercisesToSend[number].upMovement && !exercisesToSend[number].downMovement) {
					areThereErrors = true;
					stringErrors += "<li>Nessun movimento impostato esercizio " + number + "</li>";
				}
			}
		}
		
		for (var number in exercisesToSend) {
			if (exercisesToSend[number] != null) {
				if (exercisesToSend[number].changeImageColor && 
						!checkColorContrast(exercisesToSend[number].getBackgroundRGB(), exercisesToSend[number].getForegroundRGB())) {
					areThereErrors = true;
					stringErrors += "<li>Basso contrasto tra colori esercizio " + number +"</li>";
				}
			}
		}
		
		if (areThereErrors) {
			$('<div>').attr('id', 'dialogErrorsSettings').attr('title', 'Attenzione!')
				.appendTo('#mainContent');
			$('<p>').text('Attenzione: ').appendTo('#dialogErrorsSettings');
			$('<ul>').appendTo('#dialogErrorsSettings');
			$(stringErrors).appendTo('#dialogErrorsSettings ul');
			$('#dialogErrorsSettings ul').css('list-style-position', 'inside');
			
			$('#dialogErrorsSettings').dialog({
				modal: true,
				resizable: false,
				draggable: false,
				width: (getScreenWidth() * 0.5),
				buttons: {
					"Conferma": function() {
						$(this).dialog("close");
						CatchMeSettingsNamespace.personalizationComplete();
					},
					"Annulla": function() {
						$(this).dialog("close");
					}
				}
			});
		}
		else {
			CatchMeSettingsNamespace.personalizationComplete();
		}
		
	});
},

/**
 * Devo recuperare le istruzioni per disegnare correttamente canvas
 */
personalizationComplete: function() {
	
	console.log(exercisesToSend);
	
	var settingsToSend = {
		rightMovement: gameSettings.rightMovement,
		leftMovement: gameSettings.leftMovement,
		upMovement: gameSettings.upMovement,
		downMovement: gameSettings.downMovement,
		startFromCenter: gameSettings.startFromCenter,
		mixMovements: gameSettings.mixMovements,
		speed: gameSettings.speed,
		backgroundColor: gameSettings.backgroundColor,
		foregroundColor: gameSettings.foregroundColor,
		imageID: gameSettings.imageID,
		changeImageColor: gameSettings.changeImageColor,
		percentualImageWidth: gameSettings.percentualImageWidth,
		imageFileName: gameSettings.imageFileName
	};
	
	var finalValueExercises = new Object();
	var index = 0;
	
	for (var i in exercisesToSend) {
		if (exercisesToSend[i] != null) {
			finalValueExercises[index] = exercisesToSend[i];
			index++;
		}
	}
	
	
	$.ajax({
		url: SERVER_ADDRESS + '/server/SaveLevelsCatchMe.php',
		type: 'POST',
		data: {
			patientID: patientID,
			settings: JSON.stringify(finalValueExercises)
		},
		success: function(message) {
			//messaggio ok se tutt ok
			console.log(message);
			
		}
	});
	
	var packetToSend = {
		TYPE: "GAME_SETTINGS",
		EXERCISES: exercisesToSend,
		IMAGES_SPECS: availableImages,
		GAME_IDENTIFICATION: gameIdentification
	};
	websocket.send(JSON.stringify(packetToSend));
	
	/*var packetSession = {
		'TYPE': 'SESSION_SPECS',
		'PATIENT_ID': patientID,
		'GAME_ID': gameIdentification
	};
			
	websocket.send(JSON.stringify(packetSession));*/
	
	websocket.onmessage = CatchMeNamespace.entryFunction;
}
};