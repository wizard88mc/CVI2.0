var imagesFamily = new Object();
var listOfLevels = [];
var listOfLevelTipologies = [];
var listOfImages = [];
var familySound = new Object();
var divTabs = null;
var screenWidth = 0;
var screenHeight = 0;
var totalErrors = 0;
var currentRetry = 0;
var maxRetry = 5;

function ImageGame(ID,name, fileName) {
	this.imageID = ID;
	this.name = name;
	this.fileName = fileName;
}

function ImageLevel(isTarget, imageID) {
	this.isTarget = isTarget;
	this.imageID = imageID;
	this.compare = function(otherImage) {
		return (this.isTarget == otherImage.isTarget && 
				this.imageID == otherImage.imageID);
	};
}

function Level(type, targets, distracters, targetFamily, sequence, maxTimeImage, sound) {
	this.type = type;
	this.numberOfTargets = targets;
	this.numberOfDistracters = distracters;
	this.targetFamily = targetFamily;
	this.sequence = sequence;
	this.sound = sound;
	this.maxTimeImage = maxTimeImage;
	
	this.compare = function(otherLevel) {
		
		if (this.type != otherLevel.type ||
			this.numberOfTargets != otherLevel.numberOfTargets ||
			this.numberOfDistracters != otherLevel.numberOfDistracters || 
			this.targetFamily != otherLevel.targetFamily || 
			this.maxTimeImage != otherLevel.maxTimeImage || 
			this.sequence.length != otherLevel.sequence.length) {
			
			return false;
		}
		
		for (var i = 0; i < this.sequence.length; i++) {
			
			if (!this.sequence[i].compare(otherLevel.sequence[i])) {
				return false;
			}
		}
		return true;
	};
}

var HelpMeSettingsNamespace = {
	
	/**
	 * Checks if the image choosed is a target if it has to
	 * be a target image or if that is a distractor if it
	 * is a distractor
	 *  
	 * @param imageID: imageID
	 * @param typeElement: T or D
	 * @param targetFamily: target family of the level
	 * @returns {Boolean}: if it is correct or not
	 */
	checkImageType: function(imageID, typeElement, targetFamily) {
		
		if (targetFamily == "" || imageID == "") {
			return false;
		}
		var possibleImages = imagesFamily[targetFamily];
		var foundInTarget = false;
		
		for (var index = 0; index < possibleImages.length && 
				!foundInTarget; index++) {

			if (possibleImages[index].imageID == imageID) {
				foundInTarget = true;
			}
		}
		
		if (typeElement == 'T' && foundInTarget) {
			return true;
		}
		if (typeElement == 'D' && !foundInTarget) {
			return true;
		}
		return false;
	},
	
	updateErrors: function() {
		
		if (totalErrors > 0) {
			$('#buttonComplete').button('disable');
			$('#totalErrors #numberTotalErrorsSpan').text(totalErrors);
			$('#totalErrors').css({
				visibility: 'visible'
			});
		}
		else {
			$('#buttonComplete').button('enable');
			$('#totalErrors #numberTotalErrorsSpan').text(0);
			$('#totalErrors').css({
				visibility: 'hidden'
			});
		}
		
	},
	
	buildSelectImages: function(imageID) {
		
		var select = $('<select>');
		
		if (imageID == -1) {
			$('<option>').attr('value', "").attr('selected', 'selected')
				.appendTo(select);
		}
		else {
			$('<option>').attr('value', '').appendTo(select);
		}
		
		for (var family in imagesFamily ) {

			var group = $('<optgroup>').attr('label', family).appendTo(select);
			var familyImages = imagesFamily[family];
			
			for (var index in familyImages) {
				
				var image = familyImages[index];
				var option = $('<option>');
				
				if (image.imageID == imageID) {
					option.attr('selected', 'selected');
				}
				option.text(image.name).attr('value', image.imageID).appendTo(group);
			}
		}
		
		select.change(function() {
			var imageID = $(this).val();
			var typeElement = $(this).parent().parent().children('.columnImageType').text();
			var divLevel = $(this).parents().eq(4);
			var targetFamily = divLevel.find('select.selectTargetFamily').val();
			
			$(this).parent().next().children('img').attr('src', '../helpMe/images/'
					+HelpMeSettingsNamespace.getImageFilename(imageID));

			var isImageCorrect = 
				HelpMeSettingsNamespace.checkImageType(imageID, typeElement, targetFamily);
			
			if (!isImageCorrect) 
			{
				if ($(this).parent().parent('tr').children('td').hasClass('badSettings') == false) {
					$(this).parent().parent('tr').children('td').addClass('badSettings');
					totalErrors++;
					HelpMeSettingsNamespace.updateErrors();
				}
			}
			else 
			{
				if ($(this).parent().parent('tr').children('td').hasClass('badSettings') == true) 
				{
					$(this).parent().parent('tr').children('td').removeClass('badSettings');
					totalErrors--;
					HelpMeSettingsNamespace.updateErrors();
				}
			}
			
		});
		
		return select;
	},
	
	buildSelectTargetFamily: function(targetFamily) {
		
		var select = $('<select>').addClass('selectTargetFamily');
		
		if (targetFamily == null) {
			$('<option>').attr('value', '').attr('selected', 'selected').appendTo(select);
		}
		
		for (var family in imagesFamily) {
			
			var option = $('<option>');
			if (family == targetFamily) {
				option.attr('selected', 'selected');
			}
			option.text(family).attr('value', family).appendTo(select);
		}
		
		select.on('change', function()
		{
			var currentValue = $(this).val();
			
			if (currentValue != "")
			{
				var selects = $(this).parent().parent().find('table select');
				selects.each(function() {
					if ($(this).val() != "")
					{
						selects.trigger('change');
					}
				});
			}
		});
		
		return select;
	},
	
	buildMaxTimeSelect: function(timeDefined) {
		
		var select = $('<select>').addClass('selectMaxTime');
		if (timeDefined == null) {
			$('<option>').attr('value', '').attr('selected', 'selected').appendTo(select);
		}
		
		for (var i = 20; i <= 40; i += 1) {

			var option = $('<option>');
			if (i == timeDefined) {
				option.attr('selected', 'selected');
			}
			option.text(i).attr('value', i).appendTo(select);
		}
		
		return select;
	},
	
	buildLevelTitle: function(index, targets, distracters) {
		
		return "Livello <span class=\"levelIndex\">" + (index + 1) 
			+ "</span> - T: " + targets + ' x D: ' + distracters;
	},
	
	makeRowSelectable: function(row) {
		
		$(row).bind('mousedown', function(e) {
			e.metaKey = true;
		}).selectable({
			selected: function(event, ui) {
				
				if ($(ui.selected.parentElement).siblings('.ui-selected').length > 0) {
					$(ui.selected.parentElement).siblings('.ui-selected')
						.children('td').removeClass('ui-selected');
					$(ui.selected.parentElement).siblings('.ui-selected')
						.removeClass('ui-selected');
				}
				
				$(ui.selected.parentElement).addClass('ui-selected');
				$(ui.selected.parentElement).children().addClass('ui-selected');
				
			},
			unselected: function(event, ui) {
				$(ui.unselected.parentElement).removeClass('ui-selected');
				$(ui.unselected.parentElement).children().removeClass('ui-selected');
			}
		});
	},
	
	updateLabelsTabs: function() {
		
		$('div[id^="level"]').each(function(index) {
			
			$(this).find('h2 span[class="levelIndex"]').text(index + 1);
			$(this).attr('id', "level" + index);
		});
		
		$('#menuTabs li').each(function(index) {
			$(this).children('a').text(index + 1);
			$(this).children('a').attr('href', "#level" + index);
		});
	},
	
	getImageFilename: function(id) {
		
		for (var i = 0; i < listOfImages.length; i++) {
			
			if (listOfImages[i].imageID == id) {
				return listOfImages[i].fileName;
			}
		}
	},
	
	requestScreenClient: function() {
		
		var packetToSend = {
			TYPE: 'SCREEN_MEASURES'
		};
		
		websocket.onmessage = function(message) {
			
			var data = JSON.parse(message.data);
			if (data.TYPE == "SCREEN_MEASURES") {
				
				if (data.RESULT == true) {
					screenWidth = data.SCREEN_WIDTH;
					screenHeight = data.SCREEN_HEIGHT;
					console.log("WIDTH: " + screenWidth + "HEIGHT: " + screenHeight);
					
					HelpMeSettingsNamespace.getImagesFamilies();
				}
				else {
					if (data.ERROR == "01") {
						currentRetry++;
						if (currentRetry <= maxRetry) {
							console.log("Retry connection to client: " + currentRetry);
							setTimeout(function() {
								websocket.send(JSON.stringify(packetToSend));
							}, 2500);
						}
					}
				}
			}
		};
		
		websocket.send(JSON.stringify(packetToSend));
	},

	getImagesFamilies: function() {
		
		$.ajax({
			type: "GET",
	        url: "../helpMe/settings/images.xml",
	        dataType: "xml",
	        cache: 'false',
	        success: function(xml) {
	
	            $(xml).find('family').each(function() {
	            	
	                var family = $(this).attr('type');
	                
	                var audioFile = $(this).attr('audioFile');
	
	                familySound[family] = audioFile;
	                imagesFamily[family] = new Array();
	
	                $(this).find('image').each(function() {
	
	                    var name = $(this).attr('name');
	                    var fileName = $(this).attr('fileName');
	                    var imageID = $(this).attr('id');
	
	                    var image = new ImageGame(imageID, name, fileName);
	                    imagesFamily[family].push(image);
	                    listOfImages.push(image);
	                });
	            });
	            // recupero le diverse tipologie di livelli
	            
	            $.ajax({
	            	type: "GET",
	            	url: '../helpMe/settings/difficulties.xml',
	            	cache: 'false',
	            	dataType: 'xml',
	            	success: function(xml) {
	            		
	            		$(xml).find('typeLevel').each(function() {
	            			var type = $(this).attr('type');
	            			listOfLevelTipologies.push(type);
	            		});
	            		
	            		// recupero impostazioni di gioco, che saranno
	    	            // o di default oppure quelle specifiche per il bambino
	            		$.ajax({
	    	            	type: "POST",
	    	            	url: SERVER_ADDRESS + "/server/GetGameSettingsHelpMe.php",
	    	            	data: {
	    	            		patientID: patientID
	    	            	},
	    	            	success: function(message) {
	    	            		
	    	            		try {
	    	            			var data = JSON.parse(message);
	    		            		if (data.TYPE == "GAME_SPECS") {
	    		            			HelpMeSettingsNamespace.getGameLevels(data.FILE_NAME);
	    		            		}
	    	            		}
	    	            		catch(error) {
	    	            			console.log(error);
	    	            			console.log(message);
	    	            		}
	    	            	}
	    	            });
	            	}
	            });
	            
	        }
		});
	},
	
	getGameLevels: function(fileName) {
		
		console.log(fileName);
		$.ajax({
			type: "GET",
			url: SERVER_ADDRESS + '/helpMe/settings/' + fileName,
			dataType: "xml",
	        cache: 'false',
	        success: function(xml) {
	        	
	        	$(xml).find('level').each(function() {
	        		
	        		var type = $(this).attr('type');
	        		var targetsAndDistracters = type.split('x');
	        		var targetFamily = $(this).attr('targetFamily');
	        		var maxTime = $(this).attr('maxTimeImage');
	        		var sequenceOfImages = [];
	        		
	        		$(this).find('image').each(function() {
	        			var type = $(this).attr('type');
	        			var imageID = $(this).attr('imageID');
	        			var isTarget = true;
	        			if (type == 'D') {
	        				isTarget = false;
	        			}
	        			sequenceOfImages.push(new ImageLevel(isTarget, imageID));
	        		});
	        		
	        		listOfLevels.push(new Level(type, targetsAndDistracters[0], 
	        			targetsAndDistracters[1], targetFamily, 
	        			sequenceOfImages, maxTime));
	        		
	        	});
	        	
	        	HelpMeSettingsNamespace.buildDivSettings();
	        }
		});
	},
	
	buildDivSettings: function() {
		
		$('#mainContent div').remove();
		
		$('#waitingParameters').dialog("close");
		$('#waitingParameters').remove();
		
		var divContainerAll = $('<div>').attr('id', 'containerAll')
			.appendTo('#mainContent');
		
		$('<div>').attr('id', 'newLevel').appendTo(divContainerAll)
			.addClass('ui-widget-content ui-corner-all');

		$('<label>').attr('for', 'selectNewLevel').addClass('label')
			.text('Inserisci nuovo livello: ').appendTo('#newLevel')
			.css({
				padding: '0.5em',
				'vertical-align': 'middle'
			});

		$('<select>').attr('id', 'selectNewLevel').appendTo('#newLevel');
		
		for (var index in listOfLevelTipologies) {
			$('<option>').attr('value', listOfLevelTipologies[index])
				.text(listOfLevelTipologies[index])
				.appendTo('#selectNewLevel');
		}
		
		$('<div>').attr('id', 'buttonAddLevel').text('Aggiungi livello')
			.appendTo('#newLevel').button();
		
		$('#buttonAddLevel').on('click', function() {
			
			/**
			 * Retrieve the number of target and distractor elements
			 * elements[0] = target, elements[1] = distractors
			 */
			var valueLevel = $('#selectNewLevel').children('option:selected').val();
			var elements = valueLevel.split('x');
			var indexLevel = $('#menuTabs').children('li').length;
			
			/**
			 * Create the title of the level and the link for the div
			 */
			var link = "#level" + indexLevel;
			var levelTitle = HelpMeSettingsNamespace.buildLevelTitle(indexLevel, 
					elements[0], elements[1]);
			
			var divLevel = $('<div>').attr('id', 'level'+indexLevel)
				.appendTo('#tabsLevels');
			
			$('<h2>').html(levelTitle).appendTo(divLevel);
			
			var select = HelpMeSettingsNamespace.buildSelectTargetFamily();
			select.appendTo($('<div>').addClass('divSelectTargetFamily')
					.text('Famiglia target: ').appendTo(divLevel));
			
			var selectTime = HelpMeSettingsNamespace.buildMaxTimeSelect();
			selectTime.appendTo($('<div>').addClass('divSelectMaxTime')
					.text('Tempo massimo immagine (s): ').appendTo(divLevel));
			
			/**
			 * Creating the table necessary to build the level
			 * for the doctor
			 */
			var table = $('<table>').addClass('tableLevel').appendTo(divLevel);
			
			for (var i = 0; i < elements[0]; i++) {
				
				var selectImage = HelpMeSettingsNamespace.buildSelectImages(-1);
				
				var row = $('<tr>').appendTo(table)
					.addClass('ui-widget-content');
				$('<td>').addClass('columnImageType').text('T').appendTo(row);
				$('<td>').addClass('columnImageSelect').appendTo(row);
				selectImage.appendTo(row.children('td').last());
				
				$('<img>').addClass('imgPreview').appendTo($('<td>').appendTo(row));
				
				row.children('td').addClass('badSettings');
				
				HelpMeSettingsNamespace.makeRowSelectable(row);
			}
			
			for (var i = 0; i < elements[1]; i++) {
				var selectImage = HelpMeSettingsNamespace.buildSelectImages(-1);
				
				var row = $('<tr>').appendTo(table)
					.addClass('ui-widget-content');
				$('<td>').addClass('columnImageType').text('D').appendTo(row);
				$('<td>').addClass('columnImageSelect').appendTo(row);
				selectImage.appendTo(row.children('td').last());
				
				$('<img>').addClass('imgPreview').appendTo($('<td>').appendTo(row));
				
				row.children('td').addClass('badSettings');
				
				HelpMeSettingsNamespace.makeRowSelectable(row);
			}
			
			$('<input>').attr('type', 'hidden').attr('name', 'levelType')
				.attr('value', valueLevel).appendTo(divLevel);
			$('<input>').attr('type', 'hidden').attr('name', 'numberTargets')
				.attr('value', elements[0]).appendTo(divLevel);
			$('<input>').attr('type', 'hidden').attr('name', 'numberDistracters')
				.attr('value', elements[1]).appendTo(divLevel);
			
			var lastSimilarLevel = divLevel.prevAll('div[id^="level"]:has(input[name="numberTargets"][value="'+elements[0]+'"])').first();
			
			if (lastSimilarLevel.length == 0) {

				var list = divLevel.prevAll('div[=id^="level"]:has(input[name="numberTargets"])');
				var exit = false;
				for (var i = 0; i < list.length && !exit; i++) {

					var valueTargets = $(list[i]).children('input[type="hidden"][name="numberTargets"]')
						.val();
					
					if (Number(valueTargets) < elements[0]) {

						exit = true;
						lastSimilarLevel = $(list[i]);
						console.log(i);
					}
				}
			}
			
			var li = $('<li>');
			$('<a>').attr('href', link).appendTo(li);
			var indexToEnable = 0;
				
			if (lastSimilarLevel.length != 0) {

				divLevel.insertAfter(lastSimilarLevel);
				var indexToInsert = lastSimilarLevel.parent().children('div').index(lastSimilarLevel);
				$(".ui-tabs-nav li:eq("+(indexToInsert)+")").after(li);
				indexToEnable = indexToInsert + 1;
			}
			else {

				divLevel.insertBefore('div[id^=level]:eq(0)');
				li.prependTo('.ui-tabs-nav');
				indexToEnable = 0;
			}
			
			HelpMeSettingsNamespace.updateLabelsTabs();
			
			$("#tabsLevels").tabs("refresh");

			$('#tabsLevels').tabs("enable", indexToEnable);
			
			totalErrors += Number(elements[0]) + Number(elements[1]);
			
			HelpMeSettingsNamespace.updateErrors();
		});
		
		divTabs = $('<div>').attr('id', 'tabsLevels').appendTo(divContainerAll);
		
		$('<ul>').attr('id', 'menuTabs').appendTo(divTabs);
		
		for (var index in listOfLevels) {
			
			index = Number(index);
			var currentLevel = listOfLevels[index];

			$('<a>').attr('href', '#level' + index).text(index + 1)
				.appendTo($('<li>').appendTo('#menuTabs'));
			
			var title = HelpMeSettingsNamespace.buildLevelTitle(index, 
				currentLevel.numberOfTargets, currentLevel.numberOfDistracters);
			
			var divLevel = $('<div>').attr('id', 'level' + index).appendTo(divTabs); 
			$('<h2>').html(title).appendTo(divLevel);
			
			var select = HelpMeSettingsNamespace.buildSelectTargetFamily(currentLevel.targetFamily);
			select.appendTo($('<div>').addClass('divSelectTargetFamily')
					.text('Famiglia target: ').appendTo(divLevel));
			
			var selectTime = HelpMeSettingsNamespace.buildMaxTimeSelect(currentLevel.maxTimeImage);
			selectTime.appendTo($('<div>').addClass('divSelectMaxTime')
					.text('Tempo massimo immagine: ').appendTo(divLevel));
			
			var sequenceImages = currentLevel.sequence;
			var table = $('<table>').addClass('tableLevel').appendTo(divLevel);
			
			for (var indexImages in sequenceImages) {
				
				var image = sequenceImages[indexImages];
				var target = 'T';
				if (!image.isTarget) {
					target = 'D';
				}
				
				var selectImage = HelpMeSettingsNamespace.buildSelectImages(image.imageID);
				
				var row = $('<tr>').appendTo(table).addClass('ui-widget-content');
				$('<td>').addClass('columnImageType').text(target).appendTo(row);
				$('<td>').addClass('columnImageSelect').appendTo(row);
				selectImage.appendTo($('td.columnImageSelect').last());
				
				$('<img>').addClass('imgPreview')
					.attr('src', '../helpMe/images/' + 
						HelpMeSettingsNamespace.getImageFilename(image.imageID))
					.appendTo($('<td>').appendTo(row));
				
				HelpMeSettingsNamespace.makeRowSelectable(row);
			}
			
			$('<input>').attr('type', 'hidden').attr('name', 'levelType')
				.attr('value', currentLevel.type).appendTo(divLevel);
			$('<input>').attr('type', 'hidden').attr('name', 'numberTargets')
				.attr('value', currentLevel.numberOfTargets).appendTo(divLevel);
			$('<input>').attr('type', 'hidden').attr('name', 'numberDistracters')
				.attr('value', currentLevel.numberOfDistracters).appendTo(divLevel);
		}
		
		var divButtons = $('<div>').attr('id', 'buttons').appendTo(divContainerAll)
			.addClass('ui-widget-content ui-corner-all');
		
		$('<div>').attr('id', 'buttonMoveUp').html("&uarr;").appendTo(divButtons).button();
		$('#buttonMoveUp').on('click', function() {
			var rowSelected = $('tr.ui-selected');
			var rowIndex = rowSelected.parent().children().index(rowSelected);
			 
			 if (rowIndex > 0) {
				 rowSelected.insertBefore(rowSelected.parent().children().get(rowIndex - 1));
			 }
		});
		$('<div>').attr('id', 'buttonMoveDown').html("&darr;").appendTo(divButtons).button();
		$('#buttonMoveDown').on('click', function() {
			var rowSelected = $('tr.ui-selected');
			var rowIndex = rowSelected.parent().children().index(rowSelected);
			var totalRows = rowSelected.parent().children().size();

			if (rowIndex < totalRows - 1) {
				rowSelected.insertAfter(rowSelected.parent().children().get(rowIndex + 1));
			}
		});
		
		$('<div>').attr('id', 'buttonDeleteLevel').text('Elimina livello')
			.appendTo(divButtons).button()
			.on('click', function() {
				
				var index = $('#menuTabs').children('li[class*="ui-tabs-active"]')
					.index();
				
				$('#tabsLevels').find(".ui-tabs-nav li:eq("+index+")").remove();
				$('#tabsLevels').find('div[id^=level]:eq('+index+')').remove();
				
				HelpMeSettingsNamespace.updateLabelsTabs();
				
				$('#tabsLevels').tabs("refresh");
				
				/**
				 * traverse all the select to check the current number of total
				 * errors without the deleted level
				 */
				totalErrors = 0;
				$('table select').each(function() {

					var imageID = $(this).val();
					var typeElement = $(this).parent().parent()
						.children('.columnImageType').text();

					var divLevel = $(this).parents().eq(4);
					var targetFamily = divLevel.find('select.selectTargetFamily').val();
					
					$(this).parent().next().children('img')
						.attr('src', '../helpMe/images/'
							+ HelpMeSettingsNamespace.getImageFilename(imageID));

					var isImageCorrect = HelpMeSettingsNamespace
						.checkImageType(imageID, typeElement, targetFamily);
					
					if (!isImageCorrect) {
						totalErrors++;
					}
				});
				HelpMeSettingsNamespace.updateErrors();
			});
		
		$('<div>').attr('id', 'buttonComplete').text('Inizia il gioco')
			.appendTo(divButtons).button()
			.on('click', function() {
				HelpMeSettingsNamespace.collectLevelsToSend();
			});
		
		divButtons.children().css({
				margin: '0.5em'
			});
		
		$('<div>').attr('id', 'totalErrors').appendTo(divButtons);
		$('<span>').text('Numero di errori: ').appendTo('#totalErrors');
		$('<span>').attr('id', 'numberTotalErrorsSpan').text('0')
			.appendTo('#totalErrors');
		
		$('<div>').appendTo(divContainerAll).css({
			clear: 'both'
		});
		
		divTabs.tabs();
	},
	
	collectLevelsToSend: function() {
		
		listOfNewLevels = new Array();
		
		var divsLevels = $('#tabsLevels div[id^="level"]');

		for (var index = 0; index < divsLevels.length; index++) {
			
			var currentLevel = divsLevels.get(index);
			var levelType = $(currentLevel).children('input[name="levelType"]').val();
			var numberOfTargets = $(currentLevel).children('input[name="numberTargets"]').val();
			var numberOfDistracters = $(currentLevel).children('input[name="numberDistracters"]').val();
			var targetFamily = $(currentLevel).children().children('select[class="selectTargetFamily"]').val();
			var maxTimeWaiting = $(currentLevel).children().children('select[class="selectMaxTime"]').val();
			var sound = familySound[targetFamily];
			
			var rowsElements = $(currentLevel).find('table tbody tr');
			
			var imagesSequence = [];

			rowsElements.each(function() {

				var typeImage = $(this).find('td.columnImageType').text();
				var imageID = $(this).find('td.columnImageSelect select').val();
				var isTarget = true;
				if (typeImage == 'D') {
					isTarget = false;
				}
				
				imagesSequence.push(new ImageLevel(isTarget, imageID));
			});
			
			listOfNewLevels.push(new Level(levelType, numberOfTargets, 
					numberOfDistracters, targetFamily, imagesSequence, 
					maxTimeWaiting, sound));
			
		}
		
		// devo verificare se x caso ho cambiato livelli di
		// rispetto a quelli di partenza; 
		// in caso affermativo devo salvare dati
		var levelsToSend = false;
		if (listOfLevels.length != listOfNewLevels.length) {
			// devo spedire
			levelsToSend = true;
			console.log("Spedisci");
		}
		else {
			var equals = true;
			for (var index = 0; index < listOfNewLevels.length && equals; index++) {
				
				equals = equals && listOfNewLevels[index].compare(listOfLevels[index]);
			}
			
			if (!equals) {
				// devo spedire
				levelsToSend = true;
				console.log("Spedisci");
			}
			else {
				console.log("non spedisci");
			}
		}
		
		if (levelsToSend) {
			$.ajax({
				type: "POST", 
				url: SERVER_ADDRESS + "/server/SaveLevelsHelpMe.php",
				data: {
					patientID: patientID,
					levels: JSON.stringify(listOfNewLevels)
				},
				success: function(message) {

					console.log(message);
					if (message == 1) {
						console.log("Complete");
						HelpMeSettingsNamespace.sendLevelsToClient(listOfNewLevels);
					}
				}
			});
			
		}
		else {
			HelpMeSettingsNamespace.sendLevelsToClient(listOfNewLevels);
		}
	},
	
	sendLevelsToClient: function(levels) {
		
		var packetToSend = {
			TYPE: "GAME_SETTINGS",
			LEVELS: levels,
			GAME_IDENTIFICATION: gameIdentification
		};
			
		websocket.send(JSON.stringify(packetToSend));

		HelpMeNamespace.initializePage();	
	}
};