const authModule = require('../Auth').auth;
const firebase = require('../Firebase').firebase;
const utilsModule = require('../Utils').utils;
const dbModule = require('../Database').db;

describe('Tests for the sendAuthenticationEmail function in the authentication module', () => {
    // Clear all mocked functions/objects
    afterEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    test('Send an email to a user that is not verified', () => {
        firebase.auth = jest.fn().mockReturnValue({
            currentUser: {
                emailVerified: false,
                sendEmailVerification: jest.fn(() => Promise.resolve("E-Mail send"))
            }
        });

        authModule.sendAuthenticationEmail()
            .then(result => {
                expect(firebase.auth).toHaveBeenCalled();
                expect(firebase.auth().currentUser.sendEmailVerification).toHaveBeenCalled();
                expect(result).toBe("E-Mail send");
            });
    });

    test('Check that no email is send if the user is verified',() => {
        firebase.auth = jest.fn().mockReturnValue({
            currentUser: {
                emailVerified: true,
                sendEmailVerification: jest.fn(() => Promise.resolve("E-Mail send"))
            }
        });

        authModule.sendAuthenticationEmail()
            .catch(error => {
                expect(firebase.auth).toHaveBeenCalled();
                expect(firebase.auth().currentUser.sendEmailVerification).toHaveBeenCalledTimes(0);
                expect(error.code).toBe('invalid-user');
                expect(error.message).toBe('Invalid user!');
            });
    });
})

describe('Tests for the verifySignUpInputs function in the authentication module', () => {
    const validEmail = 'SomeMail@stud.hs-heilbronn.de';
    const validFirstName = 'John';
    const validLastName = 'Doe';
    const validPassword = 'SomeValidPassword1';

    test('Verify that only hs-heilbronn.de emails are allowed', () => {
        let result = authModule.verifySignUpInputs('somemail@web.de', validFirstName, validLastName, validPassword, validPassword);
        expect(result.isValid).toBeFalsy();
        expect(result.element).toBe("eMail");
        expect(result.message).toBe("You have to \n use a 'hs-heilbronn.de' \n email and the email \n must not contain more \n than 255 characters.");

        result = authModule.verifySignUpInputs('somemail@HS-heilbronn.de', validFirstName, validLastName, validPassword, validPassword);
        expect(result.isValid).toBeFalsy();
        expect(result.element).toBe("eMail");
        expect(result.message).toBe("You have to \n use a 'hs-heilbronn.de' \n email and the email \n must not contain more \n than 255 characters.");

        result = authModule.verifySignUpInputs('somemail@stud.hs-heilbronn.com', validFirstName, validLastName, validPassword, validPassword);
        expect(result.isValid).toBeFalsy();
        expect(result.element).toBe("eMail");
        expect(result.message).toBe("You have to \n use a 'hs-heilbronn.de' \n email and the email \n must not contain more \n than 255 characters.");

        result = authModule.verifySignUpInputs(validEmail, validFirstName, validLastName, validPassword, validPassword);
        expect(result.isValid).toBeTruthy();
        expect(result.element).toBe("");
        expect(result.message).toBe("");
    });

    test('Verify that only lastnames with a length between 2 and 255 are allowed', () => {
        let result = authModule.verifySignUpInputs(validEmail, validFirstName, '', validPassword, validPassword);
        expect(result.isValid).toBeFalsy();
        expect(result.element).toBe("lName");
        expect(result.message).toBe("The lastname \n must have a \n length between 2 \n and 255 characters.");

        result = authModule.verifySignUpInputs(validEmail, validFirstName, 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata ', validPassword, validPassword);
        expect(result.isValid).toBeFalsy();
        expect(result.element).toBe("lName");
        expect(result.message).toBe("The lastname \n must have a \n length between 2 \n and 255 characters.");

        result = authModule.verifySignUpInputs(validEmail, validFirstName, validLastName, validPassword, validPassword);
        expect(result.isValid).toBeTruthy();
        expect(result.element).toBe("");
        expect(result.message).toBe("");
    });

    test('Verify that only firstnames with a length between 2 and 255 are allowed', () => {
        let result = authModule.verifySignUpInputs(validEmail, '', validLastName, validPassword, validPassword);
        expect(result.isValid).toBeFalsy();
        expect(result.element).toBe("fName");
        expect(result.message).toBe("The firstname \n must have a \n length between 2 \n and 255 characters.");

        result = authModule.verifySignUpInputs(validEmail, 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata ', validLastName, validPassword, validPassword);
        expect(result.isValid).toBeFalsy();
        expect(result.element).toBe("fName");
        expect(result.message).toBe("The firstname \n must have a \n length between 2 \n and 255 characters.");

        result = authModule.verifySignUpInputs(validEmail, validFirstName, validLastName, validPassword, validPassword);
        expect(result.isValid).toBeTruthy();
        expect(result.message).toBe("");
    });

    test('Verify that the password must have a length of at least 8 characters', () => {
        let result = authModule.verifySignUpInputs(validEmail, validFirstName, validLastName, '', validPassword);
        expect(result.isValid).toBeFalsy();
        expect(result.element).toBe("pWord");
        expect(result.message).toBe("The password \n must be at least \n 8 characters long.");

        result = authModule.verifySignUpInputs(validEmail, validFirstName, validLastName, 'invalid', validPassword);
        expect(result.isValid).toBeFalsy();
        expect(result.element).toBe("pWord");
        expect(result.message).toBe("The password \n must be at least \n 8 characters long.");

        result = authModule.verifySignUpInputs(validEmail, validFirstName, validLastName, 'atleast8chars', validPassword);
        expect(result.isValid).toBeFalsy();
        expect(result.element).toBe("repeatPWord");
        expect(result.message).not.toBe("The password must be at least 8 characters long.");
    });

    test('Verify that the password must have a length less than 256 characters', () => {
        let result = authModule.verifySignUpInputs(validEmail, validFirstName, validLastName, 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata s', validPassword);
        expect(result.isValid).toBeFalsy();
        expect(result.element).toBe("pWord");
        expect(result.message).toBe("The password must \n not be longer \n than 255 characters.");

        result = authModule.verifySignUpInputs(validEmail, validFirstName, validLastName, 'atLeast8CharsAndLessThan256', validPassword);
        expect(result.isValid).toBeFalsy();
        expect(result.element).toBe("repeatPWord");
        expect(result.message).not.toBe("The password must \n not be longer \n than 255 characters.");
    });

    test('Verify that the password must match each other', () => {
        let result = authModule.verifySignUpInputs(validEmail, validFirstName, validLastName, 'atLeast8CharsAndLessThan256', validPassword);
        expect(result.isValid).toBeFalsy();
        expect(result.element).toBe("repeatPWord");
        expect(result.message).toBe("The entered passwords \n do not match.");

        result = authModule.verifySignUpInputs(validEmail, validFirstName, validLastName, 'atLeastEightCharsAndLess', 'atLeastEightCharsAndLess');
        expect(result.isValid).toBeFalsy();
        expect(result.element).toBe("pWord");
        expect(result.message).not.toBe("The entered passwords \n do not match.");
    });

    test('Verify that the password must contain at least one upper case letter, one lower case letter and one number or symbol', () => {
        let result = authModule.verifySignUpInputs(validEmail, validFirstName, validLastName, 'alllowercase', 'alllowercase');
        expect(result.isValid).toBeFalsy();
        expect(result.element).toBe("pWord");
        expect(result.message).toBe("The password must\ncontain at least\none lower case\nletter, one upper\ncase letter and\none number or\nsymbol.");

        result = authModule.verifySignUpInputs(validEmail, validFirstName, validLastName, 'ALLUPPERCASE', 'ALLUPPERCASE');
        expect(result.isValid).toBeFalsy();
        expect(result.element).toBe("pWord");
        expect(result.message).toBe("The password must\ncontain at least\none lower case\nletter, one upper\ncase letter and\none number or\nsymbol.");

        result = authModule.verifySignUpInputs(validEmail, validFirstName, validLastName, 'lowerAndUPPERCase', 'lowerAndUPPERCase');
        expect(result.isValid).toBeFalsy();
        expect(result.element).toBe("pWord");
        expect(result.message).toBe("The password must\ncontain at least\none lower case\nletter, one upper\ncase letter and\none number or\nsymbol.");

        result = authModule.verifySignUpInputs(validEmail, validFirstName, validLastName, '12345678', '12345678');
        expect(result.isValid).toBeFalsy();
        expect(result.element).toBe("pWord");
        expect(result.message).toBe("The password must\ncontain at least\none lower case\nletter, one upper\ncase letter and\none number or\nsymbol.");

        result = authModule.verifySignUpInputs(validEmail, validFirstName, validLastName, '        ', '        ');
        expect(result.isValid).toBeFalsy();
        expect(result.element).toBe("pWord");
        expect(result.message).toBe("The password must\ncontain at least\none lower case\nletter, one upper\ncase letter and\none number or\nsymbol.");

        result = authModule.verifySignUpInputs(validEmail, validFirstName, validLastName, '    1    ', '    1    ');
        expect(result.isValid).toBeFalsy();
        expect(result.element).toBe("pWord");
        expect(result.message).toBe("The password must\ncontain at least\none lower case\nletter, one upper\ncase letter and\none number or\nsymbol.");

        result = authModule.verifySignUpInputs(validEmail, validFirstName, validLastName, 'lowercase123', 'lowercase123');
        expect(result.isValid).toBeFalsy();
        expect(result.element).toBe("pWord");
        expect(result.message).toBe("The password must\ncontain at least\none lower case\nletter, one upper\ncase letter and\none number or\nsymbol.");

        result = authModule.verifySignUpInputs(validEmail, validFirstName, validLastName, validPassword, validPassword);
        expect(result.isValid).toBeTruthy();
        expect(result.element).toBe("");
        expect(result.message).toBe("");
    });
});

describe('Tests for the signUp function in the authentication module', () => {

    beforeEach(() => {
        // Prepare html body for the tests
        document.body.innerHTML =
            '<div>' +
                '<input type="text" id="fName" name="firstName" placeholder="first name">' +
                '<input type="text" id="lName" name="secondName" placeholder="last name">' +
                '<input type="text" id="eMail" name="eMail" placeholder="e-mail">' +
                '<input type="password" id="pWord" name="pWord" placeholder="password">' +
                '<input type="password" id="repeatPWord" name="pWord" placeholder="repeat password">' +
            '</div>';

        // Mock the firebase auth function createUserWithEmailAndPassword
        firebase.auth = jest.fn().mockReturnValue({
            createUserWithEmailAndPassword: jest.fn(() => Promise.resolve("Success"))
        });
    });

    // Clear all mocked functions/objects
    afterEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    test('Check that invalid inputs result in an rejected promise', () => {
        authModule.signUp()
            .catch(function(error) {
                expect(error.code).toBe('invalid-input');
                expect(error.message).toBe("The firstname \n must have a \n length between 2 \n and 255 characters.");
                expect(error.element).toBe('fName');
                expect(firebase.auth().createUserWithEmailAndPassword).toHaveBeenCalledTimes(0);
            });
    });

    test('Check that signUp gets invoked with the correct parameters', () => {
        const firstName = 'John';
        const lastName = 'Doe';
        const mail = 'somevalidmail@hs-heilbronn.de';
        const password = 'SomeValidPassword1';

        document.getElementById("fName").value = firstName;
        document.getElementById("lName").value = lastName;
        document.getElementById("eMail").value = mail;
        document.getElementById("pWord").value = password;
        document.getElementById("repeatPWord").value = password;

        authModule.signUp()
            .then(() => {
                expect(firebase.auth().createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
                expect(firebase.auth().createUserWithEmailAndPassword).toHaveBeenCalledWith(mail, password);
            });
    });
});

describe('Tests for the signIn function in the authentication module', () => {

    beforeEach(() => {
        // Prepare html body for the tests
        document.body.innerHTML =
            '<div>' +
                '<input type="text" id="txtEmail" >' +
                '<input type="text" id="txtPassword" >' +
                '<div id="error-alert-sign-in"></div>' +
                '<small id="error-label-sign-in" ></small>' +
            '</div>';

        // Mock the functions of other modules
        utilsModule.setRememberMe = jest.fn();
        utilsModule.setAutoCheckIn = jest.fn();
        utilsModule.showPopup = jest.fn();
        dbModule.saveAutoCheckInStatus = jest.fn(() => Promise.resolve());
        console.log = jest.fn();
        console.error = jest.fn();
    });

    // Clear all mocked functions/objects
    afterEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    test('Check that invalid inputs result in an error message', () => {
        const mail = 'somevalidmail@hs-heilbronn.de';
        const password = 'SomeValidPassword1';

        document.getElementById("txtEmail").value = mail;
        document.getElementById("txtPassword").value = password;

        // Mock the firebase auth function createUserWithEmailAndPassword
        firebase.auth = jest.fn().mockReturnValue({
            signInWithEmailAndPassword: jest.fn(() => Promise.reject({code: "error-code", message: "Invalid inputs!"}))
        });

        authModule.signIn()
            .catch(error => {
                expect(firebase.auth().signInWithEmailAndPassword).toHaveBeenCalledWith(mail, password);
                expect(error.code).toBe('error-code');
                expect(error.message).toBe("Invalid inputs!");
                expect(document.getElementById('txtEmail').classList.contains('is-invalid')).toBeTruthy();
                expect(document.getElementById('txtPassword').classList.contains('is-invalid')).toBeTruthy();
                expect(document.getElementById('error-alert-sign-in').classList.contains('showErrorAlert')).toBeTruthy();
                expect(document.getElementById('error-alert-sign-in').classList.contains('hideErrorAlert')).toBeFalsy();
                expect(document.getElementById('error-label-sign-in').innerText).toBe("Incorrect email or password.");
            });
    });

    test('Check that an user that has not verified himself will see a popup', () => {
        const mail = 'somevalidmail@hs-heilbronn.de';
        const password = 'SomeValidPassword1';

        document.getElementById("txtEmail").value = mail;
        document.getElementById("txtPassword").value = password;

        const userCredentialMock = {
            user: {
                emailVerified: false
            }
        };

        // Mock the firebase auth function createUserWithEmailAndPassword and return mocked credentials
        firebase.auth = jest.fn().mockReturnValue({
            signInWithEmailAndPassword: jest.fn(() => Promise.resolve(userCredentialMock)),
        });


        authModule.signIn()
            .then(function() {
                expect(firebase.auth().signInWithEmailAndPassword).toHaveBeenCalledWith(mail, password);
                expect(utilsModule.showPopup).toHaveBeenCalledWith("missing-auth-modal");
            });
    });

    test('Check that the remember me and auto check-in values will be stored and\nthe inputs will be cleared on a successful sign in', () => {
        const mail = 'somevalidmail@hs-heilbronn.de';
        const password = 'SomeValidPassword1';

        document.getElementById("txtEmail").value = mail;
        document.getElementById("txtPassword").value = password;

        const userCredentialMock = {
            user: {
                emailVerified: true,
                email: mail
            }
        };

        // Mock the firebase auth function createUserWithEmailAndPassword and return mocked credentials
        firebase.auth = jest.fn().mockReturnValue({
            signInWithEmailAndPassword: jest.fn(() => Promise.resolve(userCredentialMock)),
        });

        authModule.signIn()
            .then(function() {
                expect(firebase.auth().signInWithEmailAndPassword).toHaveBeenCalledWith(mail, password);
                expect(utilsModule.setRememberMe).toHaveBeenCalledTimes(1);
                expect(utilsModule.setAutoCheckIn).toHaveBeenCalledTimes(1);
                expect(dbModule.saveAutoCheckInStatus).toHaveBeenCalledTimes(1);
                expect(dbModule.saveAutoCheckInStatus).toHaveBeenCalledWith(mail);
                expect(console.log).toHaveBeenCalledWith("Auto Check-In status updated!");
                expect(document.getElementById('txtEmail').value).toBe('');
                expect(document.getElementById('txtPassword').value).toBe('');
            });
    });
});

describe('Tests for the sendPasswordResetMail function in the authentication module', () => {

    beforeEach(() => {
        // Prepare html body for the tests
        document.body.innerHTML =
            '<div>' +
                '<input type="text" id="pwResetMail" >' +
            '</div>';

        utilsModule.showInfoPopup = jest.fn();
        utilsModule.showErrorPopup = jest.fn();

        console.log = jest.fn();
        console.error = jest.fn();
    });

    // Clear all mocked functions/objects
    afterEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    test('Test the behaviour when the sending of the email returns a error from firebase', () => {
        const mail = 'somevalidmail@hs-heilbronn.de';
        document.getElementById("pwResetMail").value = mail;

        firebase.auth = jest.fn().mockReturnValue({
            sendPasswordResetEmail: jest.fn(() => Promise.reject({message: "Some error"}))
        });

        authModule.sendPasswordResetMail()
            .catch(error => {
                expect(firebase.auth().sendPasswordResetEmail).toHaveBeenCalledTimes(1);
                expect(firebase.auth().sendPasswordResetEmail).toHaveBeenCalledWith(mail);
                expect(error.message).toBe("Some error");
                expect(utilsModule.showErrorPopup).toHaveBeenCalledWith("Error", "Error on sending a password reset email. Please try again later.");
                expect(console.error).toHaveBeenCalledWith("Some error");
            });
    });

    test('Test the behaviour when the sending of the email was successful', () => {
        const mail = 'somevalidmail@hs-heilbronn.de';
        document.getElementById("pwResetMail").value = mail;

        firebase.auth = jest.fn().mockReturnValue({
            sendPasswordResetEmail: jest.fn(() => Promise.resolve())
        });

        authModule.sendPasswordResetMail()
            .then(() => {
                expect(firebase.auth().sendPasswordResetEmail).toHaveBeenCalledTimes(1);
                expect(firebase.auth().sendPasswordResetEmail).toHaveBeenCalledWith(mail);
                expect(utilsModule.showInfoPopup).toHaveBeenCalledWith("Success", "A password reset email was successfully sent!");
                expect(console.log).toHaveBeenCalledWith('A password reset email was successfully sent!');
            });
    });
});

describe('Tests for the sendCheckInMail function in the authentication module', () => {
    beforeEach(() => {
        utilsModule.showInfoPopup = jest.fn();
        utilsModule.showErrorPopup = jest.fn();

        console.log = jest.fn();
        console.error = jest.fn();
    });

    // Clear all mocked functions/objects
    afterEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    test('Test the behaviour when a none logged in user tried to send a checkin mail', () => {
        firebase.auth = jest.fn().mockReturnValue({
            currentUser: {
                email: null
            }
        });

        dbModule.getUserDocDataFromEmail = jest.fn(() => new Error("some error"));
        firebase.functions = jest.fn();

        authModule.sendCheckInMail()
            .catch(error => {
                expect(dbModule.getUserDocDataFromEmail).toHaveBeenCalledWith(null);
                expect(utilsModule.showErrorPopup).toHaveBeenCalledWith("Error", "Unable to send the Check-In confirmation email! Please try again later.");
                expect(error.message).toBe("some error");
            });
    });

    test('Test the behaviour when check in mail was send successfully', async () => {
        const validEmail = 'SomeMail@stud.hs-heilbronn.de';
        const someName = "John";
        const someId = "ID";

        firebase.auth = jest.fn().mockReturnValue({
            currentUser: {
                email: validEmail
            }
        });

        const userDocDataMock = {
            get: jest.fn(() => someName),
            id: someId
        }

        const sendCheckinEmailMock = jest.fn(() => "success");

        dbModule.getUserDocDataFromEmail = jest.fn(() => Promise.resolve(userDocDataMock));
        firebase.functions = jest.fn().mockReturnValue({
            httpsCallable: jest.fn(() => sendCheckinEmailMock)
        });

        const result = await authModule.sendCheckInMail("location");

        expect(firebase.auth).toHaveBeenCalledTimes(1);
        expect(dbModule.getUserDocDataFromEmail).toHaveBeenCalledWith(validEmail);
        expect(userDocDataMock.get).toHaveBeenCalledWith('Vorname');
        expect(firebase.functions).toHaveBeenCalledTimes(1);
        expect(firebase.functions().httpsCallable).toHaveBeenCalledTimes(1);
        expect(firebase.functions().httpsCallable).toHaveBeenCalledWith('sendCheckinEmail');

        const expectedData = {
            name: someName,
            location: "location",
            url: "https://us-central1-easy-check-in-hhn.cloudfunctions.net/autoCheckOut?docid=" + someId
        }
        expect(sendCheckinEmailMock).toHaveBeenCalledWith(expectedData);
        expect(result).toBe("success");
        expect(utilsModule.showInfoPopup).toHaveBeenCalledWith("Success", "Check-In confirmation email has been sent!");
        expect(console.log).toHaveBeenCalledWith("Check-In mail was send! ");
    });
});

describe('Tests for the showUserNameInHeader function in the authentication module', () => {
    beforeEach(() => {
        // Prepare html body for the tests
        document.body.innerHTML =
            '<div>' +
                '<div id="nav-User" >' + '</div>' +
            '</div>';

        // Mock the firebase auth function
        const validEmail = 'SomeMail@stud.hs-heilbronn.de';

        firebase.auth = jest.fn().mockReturnValue({
            currentUser: {
                email: validEmail
            }
        });
    });

    // Clear all mocked functions/objects
    afterEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    test('Test the behaviour when an error occurs', async () => {
        dbModule.getUserDocDataFromEmail = jest.fn(() => new Error("some error"));

        await authModule.showUserNameInHeader()
            .catch(error => {
                expect(firebase.auth).toHaveBeenCalledTimes(2);
                expect(dbModule.getUserDocDataFromEmail).toHaveBeenCalledWith('SomeMail@stud.hs-heilbronn.de');
                expect(error).toBe("userData.get is not a function");
            });
    });

    test('Test the behaviour on success', async () => {
        const userDataMock = {
            get: jest.fn(() => "someString")
        }

        dbModule.getUserDocDataFromEmail = jest.fn(() => Promise.resolve(userDataMock));

        const result = await authModule.showUserNameInHeader();
        expect(firebase.auth).toHaveBeenCalledTimes(2);
        expect(dbModule.getUserDocDataFromEmail).toHaveBeenCalledWith('SomeMail@stud.hs-heilbronn.de');
        expect(document.getElementById('nav-User').innerHTML).toBe("someString someString");
        expect(result).toBe("someString someString");
    });
});