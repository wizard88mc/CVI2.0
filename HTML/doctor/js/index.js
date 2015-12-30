/**
 * Javascript functions for the index page of the doctor where he/she
 * can choose the operation to perform
 */

 function managePatients() {
	location.replace('gestionepazienti.html');
 }

 function doctorClient() {
 	location.replace('new_visit.html');
 }

 function patientClient() {
 	location.replace('../patient/index.html');
 }

 function pageSetupSteps() {

 	/**
	 * Sets the Welcome message for the doctor
	 */
	var doctorName = getFromSessionStorage('doctorName');
	var doctorSurname = getFromSessionStorage('doctorSurname');
	$('#welcomeDoctor').text('Bentornato Dott. ' + doctorName 
		+ ' ' + doctorSurname);

	/**
	 * Logout button operations 
	 */
	$('#logout').on('click', function() {
		
		removeFromSessionStorage("logged");
		removeFromSessionStorage("doctorName");
		removeFromSessionStorage("doctorSurname");
		removeFromSessionStorage("doctorID");
		removeFromSessionStorage("permission");
		location.replace('../index.html');
	});

	/**
	 * Setting up the buttons
	 */
	 $('#managePatients').button().click(managePatients);
	 $('#doctorClient').button().click(doctorClient);
	 $('#patientClient').button().click(patientClient);
 }

 $('document').ready(function() {

 	if (!checkAlreadyLogged()) {
 		location.replace('../index.html');
 	}

 	pageSetupSteps();
 });