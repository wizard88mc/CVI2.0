/**
 * @author Matteo Ciman
 * 
 * @version 0.1
 */
 
 var doctorID = null;
 var doctorName = null;
 var doctorSurname = null;
 var divPage = null;
 
// PAGE INITIALIZATION
 
var offlineLogin = function(username, password) {

	console.log("offlineLogin");
	console.log(getFromLocalStorage("username"));
	console.log(getFromLocalStorage("password"));
	if (getFromLocalStorage("username") == username && 
			getFromLocalStorage("password") == password) {
			
		var permission = getFromLocalStorage("permission");
		if (permission == "PATIENT") {
			
			var data = new Object();
			data.ID = getFromLocalStorage("patientID");
			data.NAME = getFromLocalStorage("patientName");
			data.SURNAME = getFromLocalStorage("patientSurname");
			data.SEX = getFromLocalStorage("patientSex");
			data.PERMISSION = permission;
			loginCorrect(data);
		}
		else {
			
			$('#dialogLogin').dialog("close");
			$('#dialogLogin').remove();
			
			$('<p>').text('La modalità offline è disponibile solamente per i ' + 
				'bambini e non per i dottori.')
				.appendTo($('<div>').attr('id', 'dialogOfflineDoctor')
						.attr('title', 'Impossibile accedere').appendTo('#mainContent'));	
			
			var width = getScreenWidth() * 0.5;
			
			$('#dialogOfflineDoctor').dialog({
				width: width,
				modal: true,
				draggable: false,
				resizable: false,
				closeOnEscape: true,
				buttons: {
					"Ok": function() {
						$(this).dialog("close");
						$(this).remove();
					}
				}
			});
		}
	}
};

function checkLogin(e) {
	
	e.preventDefault();
	
	var username = $('#username').val();
	var password = $('#password').val();
	
	if (username == "") {
		$('#usernameRow > td:first').css('color', '#F00');
	}
	if (password == "") {
		$('#passwordRow > td:first').css('color', '#F00');
	}
	if (username == "" || password == "") {
		return;
	}
	else {
		
		if (navigator.onLine || !navigator.offline) {
			var divDialog = $('<div>').attr('id', 'dialogLogin')
				.attr('title', 'Attendere..');
			$('<p>').text('Login in corso ...').appendTo(divDialog);
			
			divDialog.appendTo('#mainContent');
			
			saveInLocalStorage("username", username);
			saveInLocalStorage("password", password);
			
			var width = getScreenWidth() * 0.4;
			
			divDialog.dialog({
				width: width,
				modal: true,
				draggable: false,
				resizable: false,
				closeOnEscape: false,
				open: function() {
					$('a.ui-dialog-titlebar-close').hide();
				}
			});
			
			var pageAddress = SERVER_ADDRESS + '/server/CheckLogin.php'; 
			
			try {
			$.ajax({
				url: SERVER_ADDRESS + '/server/CheckLogin.php',
				type: 'POST',
				data: {username: username, password: MD5(password)},
				success: function(message) {
					
					var data = JSON.parse(message);
					
					if (data.CORRECT == "true") {
						loginCorrect(data);
					}
					else {
						loginIncorrect();
					}
				},
				error: function(message) {
					//console.log(message);
					offlineLogin(username, password);
				}
			});
			}
			catch(e) {
				offlineLogin(username, password);
			}
		}
		else {
			offlineLogin(username, password);	
		}
	}
}

function loginCorrect(data) {
	
	setSessionStorage("logged", "true");
	
	if (data.PERMISSION == 'DOCTOR') {
		doctorID = data.ID;
		doctorName = data.NAME;
		doctorSurname = data.SURNAME;
		
		setSessionStorage("doctorName", doctorName);
		setSessionStorage("doctorSurname", doctorSurname);
		setSessionStorage("permission", "DOCTOR");
		setSessionStorage("doctorID", doctorID);
		saveInLocalStorage("permission", "DOCTOR");
		
		doctorLogged();
	}
	else if (data.PERMISSION == 'PATIENT') {
		setSessionStorage("permission", "PATIENT");
		saveInLocalStorage("permission", "PATIENT");
		setSessionStorage("patientID", data.ID);
		saveInLocalStorage("patientID", data.ID);
		setSessionStorage("patientName", data.NAME);
		saveInLocalStorage("patientName", data.NAME);
		setSessionStorage("patientSurname", data.SURNAME);
		saveInLocalStorage("patientSurname", data.SURNAME);
		setSessionStorage("patientSex", data.SEX);
		saveInLocalStorage("patientSex", data.SEX);

		patientLogged();
	}
}

function doctorLogged() {
	location.replace('doctor/index.html');
}

function patientLogged() {
	location.replace('patient/index.html');
}

function loginIncorrect() {
	removeFromLocalStorage("username");
	removeFromLocalStorage("password");
	
	$('#dialogLogin').dialog("destroy").remove();
	
	$('<p>').text('Username e password inseriti non corretti. ')
		.appendTo(
			$('<div>').attr('id', 'dialogErrorLogin').attr('title', 'Errore!')
			.appendTo('#mainContent')
		);
		
	var width = getScreenWidth() * 0.5;
		
	$('#dialogErrorLogin').dialog({
		modal: true, 
		width: width,
		buttons: {
			Ok: function() {
				$(this).dialog("close");
				$(this).remove();
			}
		}, 
		resizable: false,
		draggable: false
	});
}

function localFileSystemInitializationComplete() {
	
	var dirReader = offlineObjectManager.rootDirectoryEntry.createReader();
	
	var readEntries = function() {
    	dirReader.readEntries (function(results) {
      		if (results.length) {
        		offlineObjectManager.arrayOfflineVisits = offlineObjectManager.arrayOfflineVisits
        			.concat(OfflineNamespace.toArray(results));
        		readEntries();
      		}
      		else {
      			console.log(offlineObjectManager.arrayOfflineVisits);
      			if (offlineObjectManager.arrayOfflineVisits.length) {
      				OfflineNamespace.someVisitsToSend();
      			}
      		}
    	});
  	};

	readEntries();
	
}

function checkLocalStorageForOfflineExercises() {
	
	var count = 0;
	for (var i = 0; i < localStorage.length; i++) {
		
		var folder = localStorage.key(i);
		
		if (checkForLocalStorageIfFolder(folder)) {
			count = count + 1;
		}
	}
	
	if (count > 0) {
		OfflineNamespace.someVisitsToSend();
	}
}

$(document).ready(function(e) {
	
	var appCache = window.applicationCache;
	
	$('<img>').attr('src', 'images/preloader.gif')
	.attr('id', 'preloaderWaitingCache').prependTo('body');
	
	appCache.addEventListener('updateready', cacheUpdateReady, false);
	appCache.addEventListener('cached', operationsCacheFinished, false);
	appCache.addEventListener('noupdate', operationsCacheFinished, false);
	appCache.addEventListener('error', operationsCacheFinished, false);
	appCache.addEventListener('obsolete', operationsCacheFinished, false);
	appCache.addEventListener('progress', progressFunctionCache, false);
	
	try {
		appCache.update();
	}
	catch(e) {
		operationsCacheFinished(e);
	}
    
});

/**
 * Function called when the cache operation are completed
 */
function initPage() {
	
	$('#preloaderWaitingCache').remove();
	
	var alreadyLogged = checkAlreadyLogged();
	
	if (alreadyLogged) {
		if (getFromSessionStorage("permission") == "DOCTOR") {
			doctorName = getFromSessionStorage("doctorName");
			doctorSurname = getFromSessionStorage("doctorSurname");
			doctorLogged();
		}
		else if (getFromSessionStorage("permission") == "PATIENT") {
			patientLogged();
		}
	}
	else {
		
		if (getFromLocalStorage("username") != "") {
			$('#username').attr({'value': getFromLocalStorage('username')});
		}
		if (getFromLocalStorage("password") != "") {
			$('#password').attr({'value': getFromLocalStorage('password')});
		}
		
		$('#buttonLogin').button();
		$('#buttonLogin').click(checkLogin);
		
		if (!navigator.onLine && !getFromLocalStorage('username') 
				&& !getFromLocalStorage('password') && 
				!getFromLocalStorage('permission')) {
			
			$('<p>').text("Per poter utilizzare l'applicazione in modalità" + 
				" offline è necessario collegarsi alla rete almeno una volta.")
				.appendTo(
					$('<div>').attr('id', 'dialogNeverConnected')
						.attr('title', 'Errore!')
						.appendTo('#mainContent'));
				
			var width = getScreenWidth() * 0.5;
				
			$('#dialogNeverConnected').dialog({
				modal: true, 
				width: width,
				buttons: {
					Ok: function() {
						$(this).dialog("close");
						$(this).remove();
					}
				}, 
				resizable: false,
				draggable: false
			});
		}
		
		window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
		
		if (window.requestFileSystem) {

		    window.webkitStorageInfo.requestQuota(window.PERSISTENT, 10*1024*1024, function(grantedBytes) {
		
		        window.requestFileSystem(window.PERSISTENT, grantedBytes, OfflineNamespace.initFs, function(error) {
		            console.log("No space received");
		        });
		    }, function(error) {
		        console.log("No space allowed");
		        console.log(error);
		    });
		}
		else {
			checkLocalStorageForOfflineExercises();
		}
		
	}
};