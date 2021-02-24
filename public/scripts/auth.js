const firebase = require('./module/Firebase').firebase;
require('firebase/auth');
require('firebase/firestore');
require('firebase/functions');
const authModule = require('./module/Auth').auth;
const dbModule = require('./module/Database').db;
const geoModule = require('./module/GeoLocation').geo;
const utilsModule = require('./module/Utils').utils;

const auth = firebase.auth();
const db = firebase.firestore();

// User state status listener
auth.onAuthStateChanged(user => {
    console.log(user)

    // Only show check-in/out content to logged in and verified users
    if (user && user.emailVerified) {
        // Fetch current user's document from the database
        let email = user.email

        // Set content depending on checkin status
        dbModule.isUserCheckedIn(email)
            .then(isCheckedIn => {
                if (isCheckedIn) {
                    showContent('checkout');
                } else {
                    showContent('checkin');
                }

                // Show history button
                document.getElementById('btnHistory').classList.add('show');
            })
            .catch(error => {
                console.log(error.message);
            });
    } else {
        // Default content
        showContent('login');
        document.getElementById('btnHistory').classList.remove('show');
    }
})

function getShownContent() {
    let contents = ['login', 'checkin', 'checkout', 'register', 'history', 'pwReset', 'dsgvo', 'impressum'];
    let result = null;
    contents.forEach(element => {
        if (document.getElementById(element).classList.contains('show') && result == null) {
            result = element;
        }
    });
    return result;
}

// Display content
function showContent(contentToShow) {
    // Reset box style
    document.getElementById('boxContainer').className = 'box';

    // Change displayed content
    if (contentToShow != null) {
        let currentContent = getShownContent();
        let contents = ['login', 'checkin', 'checkout', 'register', 'history', 'pwReset', 'dsgvo', 'impressum'];
        contents.forEach(element => {
            if (element === contentToShow) {
                // Shown new content
                document.getElementById(element).className = 'content show';

                switch (contentToShow) {
                    case 'login':
                        // Load remember me
                        const cbxRememberMe = document.getElementById('stayCheckedIn');
                        const inEmail = document.getElementById('txtEmail');
                        if (localStorage.rememberMe && localStorage.rememberMe !== "") {
                            cbxRememberMe.setAttribute("checked", "checked");
                            inEmail.value = localStorage.email;
                        } else {
                            cbxRememberMe.removeAttribute("checked")
                            inEmail.value = "";
                        }

                        // Load auto check-in
                        const cbxAutoCheckIN = document.getElementById('autoCheckIn');
                        if (localStorage.autoCheckIn && localStorage.autoCheckIn !== "") {
                            cbxAutoCheckIN.setAttribute("checked", "checked");
                        } else {
                            cbxAutoCheckIN.removeAttribute("checked")
                        }

                        //hide the "nav-User" label in the header by default if the user is signed out
                        document.getElementById("nav-User").style.display = 'none';

                        //"nav-SignIn" Label in the header to visible by default if the user is sign out
                        document.getElementById("nav-SignIn").style.display = 'block';

                        //"nav-SignUp" Label in the header to visible by default if the user is sign out
                        document.getElementById("nav-SignUp").style.display = 'block';

                        //hide "nav-SignOut" Label in the header to by default if the user is sign out
                        document.getElementById("nav-SignOut").style.display = 'none';
                        break;

                    case 'checkin':
                        // Try to do an automatic check-in if the function is activated
                        if (currentContent === 'login' && localStorage.autoCheckIn && localStorage.autoCheckIn !== "") {
                            navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
                        }
                        //show the "nav-User" label in the header by default if the user is signed out
                        document.getElementById("nav-User").style.display = 'block';

                        //hide "nav-SignIn" Label in the header by default if the user is sign out
                        document.getElementById("nav-SignIn").style.display = 'none';

                        //hide "nav-SignUp" Label in the header to visible by default if the user is sign out
                        document.getElementById("nav-SignUp").style.display = 'none';

                        //show "nav-SignOut" Label in the header to by default if the user is sign out
                        document.getElementById("nav-SignOut").style.display = 'block';

                        //set the user email as label in the header if the user is successfully signed in
                        authModule.showUserNameInHeader();

                        break;

                    case 'checkout':
                        const mail = auth.currentUser.email;
                        if (mail) {
                            dbModule.getHistorySnapshot(mail)
                                .then(querySnapshot => {
                                    if (querySnapshot.empty) {
                                        utilsModule.showErrorPopup("Error", "Unable to update history. No history found!");
                                        console.error("Error on fetching user's history: No history document found for mail: " + mail);
                                        showContent('login');
                                        return;
                                    }

                                    // Newest document MUST contain a checkin timestamp but no checkout timestamp
                                    const docSnapshot = querySnapshot.docs[0];
                                    const location = docSnapshot.get('location');

                                    if (typeof location == "undefined") {
                                        utilsModule.showErrorPopup("Error", "Unable to update history. Location is missing!");
                                        console.error("Error on fetching location from history: Document does not contain a location field!");
                                        showContent('login');
                                        return;
                                    } else if (typeof location != "string") {
                                        utilsModule.showErrorPopup("Error", "Unable to update history. Invalid location!");
                                        console.error("Error on fetching location from history: Wrong type format for location string expected!");
                                        showContent('login');
                                        return;
                                    }

                                    document.getElementById('checkout-alert-small').innerHTML = "You are currently checked in at " + location;
                                    document.getElementById('location-image').src = "img/" + location + ".jpg";
                                    document.getElementById('location-small').innerHTML = location;
                                    console.log("Show Check-Out for: " + location);
                                })
                                .catch(error => {
                                    utilsModule.showErrorPopup("Error", "Unable to update history. Error on database access!");
                                    console.error("Error on fetching user's history: " + error.message);
                                    showContent('login');
                                })
                        } else {
                            utilsModule.showErrorPopup("Error", "Access denied!");
                            console.error("Cannot show checkout page for unknown user!");
                            showContent('login');
                        }

                        //show the "nav-User" label in the header by default if the user is signed out
                        document.getElementById("nav-User").style.display = 'block';

                        //hide "nav-SignIn" Label in the header by default if the user is sign out
                        document.getElementById("nav-SignIn").style.display = 'none';

                        //hide "nav-SignUp" Label in the header by default if the user is sign out
                        document.getElementById("nav-SignUp").style.display = 'none';

                        //show "nav-SignOut" Label in the header to by default if the user is sign out
                        document.getElementById("nav-SignOut").style.display = 'block';

                        //set the user email as label in the header if the user is successfully signed in
                        authModule.showUserNameInHeader();

                        break;

                    case 'register':
                        //hide the "nav-User" label in the header by default if the user is signed out
                        document.getElementById("nav-User").style.display = 'none';

                        //show "nav-SignIn" Label in the header by default if the user is sign out
                        document.getElementById("nav-SignIn").style.display = 'block';

                        //show "nav-SignUp" Label in the header by default if the user is sign out
                        document.getElementById("nav-SignUp").style.display = 'block';

                        //hide "nav-SignOut" Label in the header to by default if the user is sign out
                        document.getElementById("nav-SignOut").style.display = 'none';
                        break;

                    case 'pwReset':
                        //hide the "nav-User" label in the header by default if the user is signed out
                        document.getElementById("nav-User").style.display = 'none';

                        //show "nav-SignIn" Label in the header by default if the user is sign out
                        document.getElementById("nav-SignIn").style.display = 'block';

                        //show "nav-SignUp" Label in the header by default if the user is sign out
                        document.getElementById("nav-SignUp").style.display = 'block';

                        //hide "nav-SignOut" Label in the header to by default if the user is sign out
                        document.getElementById("nav-SignOut").style.display = 'none';
                        break;

                    case 'history':
                        showHistory();

                        //show the "nav-User" label in the header by default if the user is signed out
                        document.getElementById("nav-User").style.display = 'block';

                        //hide "nav-SignIn" Label in the header by default if the user is sign out
                        document.getElementById("nav-SignIn").style.display = 'none';

                        //hide "nav-SignUp" Label in the header by default if the user is sign out
                        document.getElementById("nav-SignUp").style.display = 'none';

                        //show "nav-SignOut" Label in the header to by default if the user is sign out
                        document.getElementById("nav-SignOut").style.display = 'block';

                        //set the user email as label in the header if the user is successfully signed in
                        authModule.showUserNameInHeader();

                        break;

                    case 'dsgvo':

                        //show the "nav-User" label in the header by default if the user is signed out
                        document.getElementById("nav-User").style.display = 'block';

                        //hide "nav-SignIn" Label in the header by default if the user is sign out
                        document.getElementById("nav-SignIn").style.display = 'none';

                        //hide "nav-SignUp" Label in the header by default if the user is sign out
                        document.getElementById("nav-SignUp").style.display = 'none';

                        //show "nav-SignOut" Label in the header to by default if the user is sign out
                        document.getElementById("nav-SignOut").style.display = 'block';

                        authModule.showUserNameInHeader();

                        break;

                    case 'impressum':

                        //show the "nav-User" label in the header by default if the user is signed out
                        document.getElementById("nav-User").style.display = 'block';

                        //hide "nav-SignIn" Label in the header by default if the user is sign out
                        document.getElementById("nav-SignIn").style.display = 'none';

                        //hide "nav-SignUp" Label in the header by default if the user is sign out
                        document.getElementById("nav-SignUp").style.display = 'none';

                        //show "nav-SignOut" Label in the header to by default if the user is sign out
                        document.getElementById("nav-SignOut").style.display = 'block';

                        authModule.showUserNameInHeader();

                        break;
                }
            } else {
                document.getElementById(element).className = 'content';

                // Clear inputs of sign up and hide error elements upon loading another content
                if (element === 'register' && currentContent === 'register') {
                    $('#register :input').each(function () {
                        $(this).val('');
                        $(this).removeClass('is-invalid').removeClass('is-valid');
                    });
                    $('#register').find('.font-weight-bold').each(function () {
                        $(this).removeClass('showErrorAlert').addClass('hideErrorAlert');
                    });
                    $('#error-alert-sign-up').removeClass('showErrorAlert').addClass('hideErrorAlert');
                }
            }
        });
    }
}

// -----------------------------------------------------
// ---- Logo
// -----------------------------------------------------
document.getElementById('logo').addEventListener('click', () => {
        //redirects the user to the login, checkin or checkout page depends on the login or checkin status
        if (auth.currentUser != null) {
            let email = auth.currentUser.email;
            console.log(email);
            dbModule.isUserCheckedIn(email)
                .then(isCheckedIn => {
                    if (isCheckedIn) {
                        showContent('checkout');
                    } else {
                        showContent('checkin');
                    }
                })
        } else {
            showContent('login');
        }
    }
);


// -----------------------------------------------------
// ---- Sign In
// -----------------------------------------------------
document.getElementById('btnLogin').addEventListener('click', () => authModule.signIn());

document.getElementById('nav-SignIn').addEventListener('click', () => showContent('login'));

document.getElementById('hsLabel').addEventListener('click', () => showContent('login'));

// -----------------------------------------------------
// ---- Sign Out
// -----------------------------------------------------
document.getElementById('btnLogout').addEventListener('click', async () => {
    const mail = auth.currentUser.email
    if (mail) {
        dbModule.isUserCheckedIn(mail)
            .then(isCheckedIn => {
                if (isCheckedIn) {
                    dbModule.getHistorySnapshot(mail)
                        .then(querySnapshot => {
                            if (querySnapshot.empty) {
                                utilsModule.showErrorPopup("Error", "No history found!");
                                console.error("Error on fetching user's history: No history document found for mail: " + mail);
                            }

                            // Newest document MUST contain a checkin timestamp but no checkout timestamp
                            const docSnapshot = querySnapshot.docs[0];
                            const location = docSnapshot.get('location');

                            if (typeof location == "undefined") {
                                utilsModule.showErrorPopup("Error", "History is missing a location!");
                                console.error("Error on fetching location from history: Document does not contain a location field!");
                                showContent('login');
                            } else if (typeof location != "string") {
                                utilsModule.showErrorPopup("Error", "Invalid location!");
                                console.error("Error on fetching location from history: Wrong type format for location string expected!");
                                showContent('login');
                            }

                            if (checkOutReminder(location)) {
                                console.log("Check-Out reminder send. (Mail: " + mail + " Location: " + location + ")");
                            }
                            auth.signOut();

                        })
                        .catch(error => {
                            utilsModule.showErrorPopup("Error", "Error on database access!");
                            console.error("Error on fetching user's history: " + error.message);
                            auth.signOut();
                        })
                } else {
                    auth.signOut();
                }
            })
            .catch(error => {
                console.log(error.message);
                auth.signOut();
            });
    } else {
        console.error("Error on logout: No user found!")
    }
});

// -----------------------------------------------------
// ---- Popup
// -----------------------------------------------------
document.getElementById('btnResendMail').addEventListener('click', () => {
    authModule.sendAuthenticationEmail()
        .then(function () {
            // Sign out the user and close the popup
            auth.signOut();
            utilsModule.hidePopup("missing-auth-modal");
        })
        .catch(function (error) {
            utilsModule.showErrorPopup("Error", "Unable to send the authentication email. Please try again later.")
            console.error("Error on sending authentication email: " + error);
        })
});

// -----------------------------------------------------
// ---- Sign up
// -----------------------------------------------------
document.getElementById('nav-SignUp').addEventListener('click', () => {
    showContent('register');
});

document.getElementById('signUpBTN').addEventListener('click', () => {
    showContent('register');
});

// Real time sign up validation using jquery
$(document).ready((function () {
    // Firstname
    $('#fName').on('input', function () {
        let input = $(this);
        let firstName = input.val();
        if (firstName.length >= 2) {
            input.removeClass('is-invalid').addClass('is-valid');
            $('#fNameError').addClass('hideErrorAlert');
        } else {
            input.removeClass('is-valid').addClass('is-invalid');
            $('#fNameError').removeClass('hideErrorAlert');
        }
    });
    // Lastname
    $('#lName').on('input', function () {
        let input = $(this);
        let lastName = input.val();
        if (lastName.length >= 2) {
            input.removeClass('is-invalid').addClass('is-valid');
            $('#lNameError').addClass('hideErrorAlert');
        } else {
            input.removeClass('is-valid').addClass('is-invalid');
            $('#lNameError').removeClass('hideErrorAlert');
        }
    });
    // Email
    $('#eMail').on('input', function () {
        let input = $(this);
        let email = input.val()
        let regex = /hs-heilbronn.de$/
        if (regex.test(email)) {
            input.removeClass('is-invalid').addClass('is-valid');
            $('#eMailError').addClass('hideErrorAlert');
        } else {
            input.removeClass('is-valid').addClass('is-invalid');
            $('#eMailError').removeClass('hideErrorAlert');
        }
    });
    // Password
    $('#pWord').on('input', function () {
        let input = $(this);
        let password = input.val();
        let hasUpperCase = /[A-Z]/.test(password);
        let hasLowerCase = /[a-z]/.test(password);
        let hasNumbers = /\d/.test(password);
        let hasNonAlphas = /\W/.test(password);
        if (password.length < 2 || password.length > 255 || !hasLowerCase || !hasUpperCase || (!hasNumbers && !hasNonAlphas)) {
            input.removeClass('is-valid').addClass('is-invalid');
            $('#pWordError').removeClass('hideErrorAlert');
        } else {
            input.removeClass('is-invalid').addClass('is-valid');
            $('#pWordError').addClass('hideErrorAlert');
        }
    });
    // Repeat Password
    $('#repeatPWord').on('input', function () {
        let input = $(this);
        let repeatedPassword = input.val();
        if (repeatedPassword === document.getElementById('pWord').value) {
            input.removeClass('is-invalid').addClass('is-valid');
            $('#repeatPWordError').addClass('hideErrorAlert');
        } else {
            input.removeClass('is-valid').addClass('is-invalid');
            $('#repeatPWordError').removeClass('hideErrorAlert');
        }
    });
}));

document.getElementById('BTNSignUp').addEventListener('click', async (event) => {
    // Create user in firebase
    await authModule.signUp()
        .then(function () {
            // Send authentication email
            authModule.sendAuthenticationEmail()
                .then(function () {
                    utilsModule.showInfoPopup("Success", "Sign Up was successful. Please check you mailbox to verify your email.");
                })
                .catch(function (error) {
                    utilsModule.showErrorPopup("Error", error.message);
                    console.error(error.message);
                });
        })
        .catch(function (error) {
            // If the error occurred due to the validation of the inputs then highlight the affected input
            if (error.code === 'invalid-input') {
                $('#'+error.element).removeClass('is-valid').addClass('is-invalid');
            }

            // Show the error message in the error alert
            document.getElementById('error-label-sign-up').innerText = error.message;
            $('#error-alert-sign-up').removeClass('hideErrorAlert').addClass('showErrorAlert');

            console.error(error.message);
        });

    // If the user was created successful then create user document in the firestore
    if (auth.currentUser != null) {
        const eMail = document.getElementById("eMail");
        const password = document.getElementById("pWord");
        const repeatPassword = document.getElementById("repeatPWord");
        const fName = document.getElementById("fName");
        const lName = document.getElementById("lName");

        await dbModule.createUserDocument(eMail.value, fName.value, lName.value)
            .then(function (docRef) {
                console.log("Document written with ID: ", docRef.id);
                // Clear input fields
                eMail.value = "";
                password.value = "";
                repeatPassword.value = "";
                fName.value = "";
                lName.value = "";
            })
            .catch(function (error) {
                console.log("Error on creating user document in database: " + error.message);
            });

        // Sign out the created user
        auth.signOut()
            .catch(function (error) {
                console.error(error.message);
            });
    }
});

// -----------------------------------------------------
// ---- Reset password
// -----------------------------------------------------
document.getElementById('forgotPassword').addEventListener('click', () => showContent('pwReset'));
document.getElementById('pwResetMailBTN').addEventListener('click', () => authModule.sendPasswordResetMail());

document.getElementById('backToLogin').addEventListener('click', () => showContent('login'));

// -----------------------------------------------------
// ---- Auto-Check-In
// -----------------------------------------------------
//Callback that will be called when the user allows the usage of his gps data.
const successCallback = position => {
    const closestLocation = geoModule.getClosestLocationInRange(position);
    if (closestLocation != null && typeof closestLocation === "string") {
        console.log("Current location: " + closestLocation);
        authModule.sendCheckInMail(closestLocation);
        checkin(closestLocation);
    } else {
        utilsModule.showErrorPopup("Auto-Check-In failed", "You must be at a valid location! Make sure you are within a 400m radius of a location when using the Auto Check-In function.");
        console.log("Not at any location");
    }
}

const errorCallback = error => {
    utilsModule.showErrorPopup("Auto-Check-In failed", "Make sure that you allow the access to your GPS data.");
    console.error(error);
};

// -----------------------------------------------------
// ---- Check-In /-Out
// -----------------------------------------------------

// Set the checkin status of the user to true and create a new document in the history collection with a timestamp
// for the current check-in and the given location.
function checkin(location) {
    if (firebase.auth().currentUser == null) {
        utilsModule.showErrorPopup("Check-In failed", "You are not signed in anymore. Please sign in again.");
        return;
    }

    const email = auth.currentUser.email
    // Update the user's checkin status
    dbModule.setCheckInStatus(email, true)
        .then(() => {
            console.log("Check-In status is now true!");
            // Create document in the History collection for the checkin
            dbModule.createHistoryDocument(email, location)
                .then((ref) => {
                    console.log("History document created! " + ref.id);
                    utilsModule.showInfoPopup("Success", "You successfully checked-in at: " + location);
                    // Show checkout content
                    showContent('checkout');
                })
                .catch(error => {
                    utilsModule.showErrorPopup("Error", error.message);
                    console.error(error.message);
                });
        })
        .catch(e => {
            utilsModule.showErrorPopup("Error", e.message);
            console.error(e.message);
        });
}

// Set the checkin status of the user to false and update the latest history document which does not contain a checkout
// timestamp.
function checkout() {
    if (firebase.auth().currentUser == null) {
        utilsModule.showErrorPopup("Check-Out failed", "You are not signed in anymore. Please sign in again.");
        return;
    }

    const email = auth.currentUser.email
    // Update the user's checkin status
    dbModule.setCheckInStatus(email, false)
        .then(() => {
            console.log("Check-In status is now false!");
            dbModule.updateOpenHistoryDocument(email)
                .then(() => {
                    console.log("History document updated!");
                    utilsModule.showInfoPopup("Success", "You successfully checked-out");
                    showContent('checkin');
                })
                .catch(e => {
                    utilsModule.showErrorPopup("Error", e.message);
                    console.error(e.message);
                });
        })
        .catch(e => {
            utilsModule.showErrorPopup("Error", e.message);
            console.error(e.message);
        });
}

document.getElementById('sontheim').addEventListener('click', () => {
    authModule.sendCheckInMail("Sontheim");
    checkin("Sontheim");
});

document.getElementById('bildungscampus').addEventListener('click', () => {
    authModule.sendCheckInMail("Bildungscampus");
    checkin("Bildungscampus");
});

document.getElementById('kuenzelsau').addEventListener('click', () => {
    authModule.sendCheckInMail("Künzelsau");
    checkin("Künzelsau");
});

document.getElementById('schwaebischhall').addEventListener('click', () => {
    authModule.sendCheckInMail("Schwäbischhall");
    checkin("Schwäbischhall");
});

// Resend check-in confirmation
document.getElementById('resendCheckInConfirmation').addEventListener('click', () => {
    const mail = auth.currentUser.email;
    if (mail) {
        dbModule.getHistorySnapshot(mail)
            .then(querySnapshot => {
                if (querySnapshot.empty) {
                    utilsModule.showErrorPopup("Error", "Unable to send a Check-In confirmation email. No history found!");
                    console.error("Error on fetching user's history: No history document found for mail: " + mail);
                    return;
                }

                // Newest document MUST contain a checkin timestamp but no checkout timestamp
                const docSnapshot = querySnapshot.docs[0];
                const location = docSnapshot.get('location');

                if (typeof location == "undefined") {
                    utilsModule.showErrorPopup("Error", "Unable to send a Check-In confirmation email. Location is missing!");
                    console.error("Unable to send a Check-In confirmation email. Location is missing!");
                    return;
                } else if (typeof location != "string") {
                    utilsModule.showErrorPopup("Error", "Unable to send a Check-In confirmation email. Invalid location!");
                    console.error("Unable to send a Check-In confirmation email. Location is missing!");
                    return;
                }

                authModule.sendCheckInMail(location);
            })
            .catch(error => {
                utilsModule.showErrorPopup("Error", "Unable to update history. Error on database access!");
                console.error("Unable to send a Check-In confirmation email.: " + error.message);
            })
    } else {
        utilsModule.showErrorPopup("Error", "Unable to send a Check-In confirmation email. Please sign in again.");
        console.error("Unable to send a Check-In confirmation email. Please sign in again.");
        showContent('login');
    }
});

// Checkout
document.getElementById('checkoutBTN').addEventListener('click', () => checkout());

//Checkout reminder e-Mail
async function checkOutReminder(location) {
    const email = auth.currentUser.email;
    if (email != null) {
        try {
            const userDocData = await dbModule.getUserDocDataFromEmail(email);
            const firstName = userDocData.get('Vorname');
            const docID = userDocData.id;
            const sendCheckOutReminderEmail = firebase.functions().httpsCallable('sendCheckOutReminderEmail');
            await sendCheckOutReminderEmail({
                email: email,
                name: firstName,
                location: location,
                url: "https://us-central1-easy-check-in-hhn.cloudfunctions.net/autoCheckOut?docid=" + docID
            });
            return true;
        } catch (e) {
            console.error(e.message);
            return false;
        }
    } else {
        console.error("Unable to send Check-Out reminder email. Cannot find user!");
        return false;
    }
}

// -----------------------------------------------------
// ---- History
// -----------------------------------------------------
document.getElementById('btnHistory').addEventListener('click', () => showContent('history'));
document.getElementById('historyBTN').addEventListener('click', () => showContent('history'));

function showHistory() {
    populateHistory()
        .then(() => document.getElementById('tblHistory').classList.add('show'))
        .catch(e => console.error(e));
}

function hideHistory() {
    const table = document.getElementById('tblHistory');
    const newBody = document.createElement('tbody');
    table.replaceChild(newBody, document.getElementById('history_table'));
    newBody.id = 'history_table';
    table.classList.remove('show');
}

document.getElementById('btnBack').addEventListener('click', () => {
    // Clear history
    hideHistory();

    // Set content depending on checkin status
    dbModule.isUserCheckedIn(auth.currentUser.email)
        .then(isCheckedIn => {
            if (isCheckedIn) {
                showContent('checkout');
            } else {
                showContent('checkin');
            }

            // Show history button
            document.getElementById('btnHistory').classList.add('show');
        })
        .catch(error => {
            console.log(error.message);
        });
});

async function populateHistory() {
    const user = auth.currentUser;

    // Only show check-in/out content to logged in and verified users
    if (user && user.emailVerified) {
        // Fetch current user's document from the database
        const email = user.email
        try {
            const historySnapshot = await dbModule.getHistorySnapshot(email);
            // Check if the snapshot has documents
            if (historySnapshot.empty) {
                console.log("No history found for user: " + email);
                return;
            }

            // Add a row for each document in the history collection
            historySnapshot.forEach(doc => {
                const content = getHistoryContentFromDocument(doc);
                if (content) {
                    addHistoryRow(content, false);
                }
            });
            return Promise.resolve("History populated");
        } catch (e) {
            console.error(e.message);
        }
    }
}

function getHistoryContentFromDocument(doc) {
    if (!doc) {
        return null;
    }

    // Time formats
    let dateFormat = {year: 'numeric', month: 'numeric', day: 'numeric'}
    let checkinoutFormat = {hour: 'numeric', minute: 'numeric'}

    let location = doc.get('location');
    let checkinTimestamp = doc.get('checkin');
    let checkoutTimestamp = doc.get('checkout');
    if (typeof location != 'undefined' && typeof checkinTimestamp != 'undefined') {
        let dateStr = new Intl.DateTimeFormat('de-DE', dateFormat).format(checkinTimestamp.toDate());
        let checkinTimeStr = new Intl.DateTimeFormat('de-DE', checkinoutFormat).format(checkinTimestamp.toDate());
        let checkoutTimeStr = "";
        if (typeof checkoutTimestamp != 'undefined') {
            checkoutTimeStr = new Intl.DateTimeFormat('de-DE', checkinoutFormat).format(checkoutTimestamp.toDate());
        }
        return [dateStr, location, checkinTimeStr, checkoutTimeStr];
    } else {
        return null;
    }
}

function addHistoryRow(contentArray, withListener) {
    if (contentArray == null || !Array.isArray(contentArray) || contentArray.length !== 4) {
        return;
    }

    const table = document.getElementById('history_table');
    let newRow = withListener ? table.insertRow(0) : table.insertRow();

    contentArray.forEach(function (item, index) {
        let td = newRow.insertCell(index);
        td.innerHTML = item;
    });
}

//TODO: Maybe add User snapshot trigger that will check for a update of the checkin status and changes the current view
// if the user used the check out function from the email.

// -----------------------------------------------------
// ---- DSGVO
// -----------------------------------------------------

document.getElementById('btnDsgvo').addEventListener('click', () => {
    showContent('dsgvo')

});

document.getElementById('btnBackDsgvo').addEventListener('click', () => {
        //redirects the user to the login, checkin or checkout page depends on the login or checkin status
        if (auth.currentUser != null) {
            let email = auth.currentUser.email;
            console.log(email);
            dbModule.isUserCheckedIn(email)
                .then(isCheckedIn => {
                    if (isCheckedIn) {
                        showContent('checkout');
                    } else {
                        showContent('checkin');
                    }
                })
        } else {
            showContent('login');
        }
    }
);

// -----------------------------------------------------
// ---- IMPRESSUM
// -----------------------------------------------------

document.getElementById('btnImpressum').addEventListener('click', () => {
    showContent('impressum')
});

document.getElementById('btnBackImpressum').addEventListener('click', () => {
        //redirects the user to the login, checkin or checkout page depends on the login or checkin status
        if (auth.currentUser != null) {
            let email = auth.currentUser.email;
            console.log(email);
            dbModule.isUserCheckedIn(email)
                .then(isCheckedIn => {
                    if (isCheckedIn) {
                        showContent('checkout');
                    } else {
                        showContent('checkin');
                    }
                })
        } else {
            showContent('login');
        }
    }
);