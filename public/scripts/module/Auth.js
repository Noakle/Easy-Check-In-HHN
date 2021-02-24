const firebase = require('./Firebase').firebase;
require('firebase/auth');
require('firebase/firestore');
require('firebase/functions');
const dbModule = require('./Database').db;
const utils = require('./Utils').utils;

// Sign up
function signUp() {
    let eMail = document.getElementById("eMail");
    let password = document.getElementById("pWord");
    let repeatPassword = document.getElementById("repeatPWord");
    let fName = document.getElementById("fName");
    let lName = document.getElementById("lName");

    let verifyResult = exportFunctions.verifySignUpInputs(eMail.value, fName.value, lName.value, password.value, repeatPassword.value);
    if (!verifyResult.isValid) {
        return Promise.reject({code: 'invalid-input', element: verifyResult.element, message: verifyResult.message});
    }

    // Create user
    return firebase.auth().createUserWithEmailAndPassword(eMail.value, password.value);
}

// Sign in
function signIn() {
    const email = document.getElementById('txtEmail').value;
    const password = document.getElementById('txtPassword').value;

    return firebase.auth().signInWithEmailAndPassword(email, password)
        .then(userCredentials => { // IMPORTANT: Called before the state change of the user
            // Check if user is verified
            if (!userCredentials.user.emailVerified) {
                // Show missing authentication popup if the user is not verified
                utils.showPopup("missing-auth-modal");
            } else {
                // Remember me functionality
                utils.setRememberMe();

                // Auto-Check-In functionality
                utils.setAutoCheckIn();
                dbModule.saveAutoCheckInStatus(userCredentials.user.email)
                    .then(() => console.log("Auto Check-In status updated!"))
                    .catch(() => console.log("Auto Check-In status is already up to date!"));

                // Clear input
                document.getElementById('txtEmail').value = "";
                document.getElementById('txtPassword').value = "";
            }

            // Clear error
            document.getElementById('txtEmail').classList.remove('is-invalid');
            document.getElementById('txtPassword').classList.remove('is-invalid');

            // Set and show error message
            document.getElementById('error-alert-sign-in').classList.remove("showErrorAlert");
            document.getElementById('error-alert-sign-in').classList.add("hideErrorAlert");
        })
        .catch((error) => {
            // Set input style
            document.getElementById('txtEmail').classList.add('is-invalid');
            document.getElementById('txtPassword').classList.add('is-invalid');

            // Set and show error message
            document.getElementById('error-label-sign-in').innerText = "Incorrect email or password.";
            document.getElementById('error-alert-sign-in').classList.remove("hideErrorAlert");
            document.getElementById('error-alert-sign-in').classList.add("showErrorAlert");
        });
}

//get the firstname and the lastname of the user and make it visible in the header
async function showUserNameInHeader() {
    if(firebase.auth().currentUser != null) {
        let email = firebase.auth().currentUser.email;
        try {
            const userData = await dbModule.getUserDocDataFromEmail(email);
            const vorname = userData.get('Vorname');
            const nachname = userData.get('Nachname');
            document.getElementById('nav-User').innerHTML = vorname + " " + nachname;
            return Promise.resolve(vorname + " " + nachname);
        } catch (e) {
            return Promise.reject(e.message);
        }
    }
}

// Sending a verification email to a non verified user
function sendAuthenticationEmail() {
    const auth = firebase.auth();
    if (auth.currentUser != null && !auth.currentUser.emailVerified) {
        return auth.currentUser.sendEmailVerification();
    } else {
        return Promise.reject({code: 'invalid-user', message: "Invalid user!"});
    }
}

// Sending a password reset mail to a user
function sendPasswordResetMail () {
    const email = document.getElementById('pwResetMail').value;
    return firebase.auth().sendPasswordResetEmail(email)
        .then(() => {
            utils.showInfoPopup("Success", "A password reset email was successfully sent!");
            console.log('A password reset email was successfully sent!');
        })
        .catch(error => {
            utils.showErrorPopup("Error", "Error on sending a password reset email. Please try again later.");
            console.error(error.message);
        })
}

async function sendCheckInMail(location) {
    let email = firebase.auth().currentUser.email;
    try {
        const userDocData = await dbModule.getUserDocDataFromEmail(email);
        const name = userDocData.get('Vorname');
        const docID = userDocData.id;
        const sendCheckinEmail = firebase.functions().httpsCallable('sendCheckinEmail');
        const result = await sendCheckinEmail({
            name: name,
            location: location,
            url: "https://us-central1-easy-check-in-hhn.cloudfunctions.net/autoCheckOut?docid=" + docID
        });
        utils.showInfoPopup("Success", "Check-In confirmation email has been sent!");
        console.log("Check-In mail was send! ");
        return result;
    } catch (e) {
        utils.showErrorPopup("Error", "Unable to send the Check-In confirmation email! Please try again later.");
        console.error(e.message);
    }
}

// Checking the values provided by a user on sign up. Defined here: https://jira-student.it.hs-heilbronn.de/browse/LABSW20T1-73
function verifySignUpInputs(email, firstName, lastName, password, repeatPassword) {
    // Firstname must have a length between 2 and 255 characters
    if (firstName.length < 2 || firstName.length > 255) {
        return {isValid: false, element: "fName", message: "The firstname \n must have a \n length between 2 \n and 255 characters."};

    // Lastname must have a length between 2 and 255 characters
    } else if (lastName.length < 2 || lastName.length > 255) {
        return {isValid: false, element: "lName", message: "The lastname \n must have a \n length between 2 \n and 255 characters."};

    // E-Mail must be a valid hs-heilbronn email
    } else if (!email.match(/hs-heilbronn.de$/) || email.length > 255) {
        return {isValid: false, element: "eMail", message: "You have to \n use a 'hs-heilbronn.de' \n email and the email \n must not contain more \n than 255 characters."};

    // Password must have a length of at least 8 symbols, as well as at least one uppercase letter one lowercase letter and one symbol or number.
    } else if (password.length < 8) {
        return {isValid: false, element: "pWord", message: "The password \n must be at least \n 8 characters long."};

    // Password must be shorter or equal to the length of 255.
    } else if (password.length > 255) {
        return {isValid: false, element: "pWord", message: "The password must \n not be longer \n than 255 characters."};

    // Password must match the repeated password
    } else if (password !== repeatPassword) {
        return {isValid: false, element: "repeatPWord", message: "The entered passwords \n do not match."};
    }

    // Password must contain at least one upper case letter, one lower case letter and one number or non alphabetic symbol
    let hasUpperCase = /[A-Z]/.test(password);
    let hasLowerCase = /[a-z]/.test(password);
    let hasNumbers = /\d/.test(password);
    let hasNonAlphas = /\W/.test(password);

    if (!hasLowerCase || !hasUpperCase || (!hasNumbers && !hasNonAlphas)) {
        return {isValid: false, element: "pWord", message: "The password must\ncontain at least\none lower case\nletter, one upper\ncase letter and\none number or\nsymbol."};
    }

    return {isValid: true, element: "", message: ""};
}

const exportFunctions = {
    sendAuthenticationEmail,
    sendPasswordResetMail,
    sendCheckInMail,
    verifySignUpInputs,
    showUserNameInHeader,
    signUp,
    signIn
};

module.exports.auth = exportFunctions;

