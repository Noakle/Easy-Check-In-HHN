const db = require('../Database').db;
const firebase = require('../Firebase').firebase;

beforeAll(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
});

describe('Tests for the updateOpenHistoryDocument function in the database module', () => {
    // Clear all mocked functions/objects
    afterEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    test('Checks that an error is thrown when the email is null', async () => {
        await db.updateOpenHistoryDocument(null)
            .catch(e => {
                expect(e.message).toBe("Invalid e-mail! E-Mail must not be null.");
            });
    });

    test('Checks that an error is thrown if the snapshot is empty', async () => {
        const snapshotMock = {
            empty: true
        }
        db.getHistorySnapshot = jest.fn(() => snapshotMock);
        console.log = jest.fn();

        const mail = "somevalidmail@hs-heilbronn.de";
        await db.updateOpenHistoryDocument(mail)
            .catch(e => {
                expect(e.message).toBe('No history document found for mail:' + mail);
                expect(console.log).toHaveBeenCalledWith("Error in getOpenHistoryDocument!");
            });
    });

    test('Checks that an error is thrown if the snapshot contains a checkout field', async () => {
        const docMock = {
            get: jest.fn(() => "NOT UNDEFINED")
        }
        const snapshotMock = {
            empty: false,
            docs: [docMock]
        }
        db.getHistorySnapshot = jest.fn(() => snapshotMock);
        console.log = jest.fn();

        const mail = "somevalidmail@hs-heilbronn.de";

        await db.updateOpenHistoryDocument(mail)
            .catch(e => {
                expect(db.getHistorySnapshot).toHaveBeenCalledTimes(1);
                expect(db.getHistorySnapshot).toHaveBeenCalledWith(mail);
                expect(docMock.get).toHaveBeenCalledTimes(1);
                expect(docMock.get).toHaveBeenCalledWith('checkout');
                expect(e.message).toBe('Document already contains checkout time!');
                expect(console.log).toHaveBeenCalledWith("Error in getOpenHistoryDocument!");
            })
    });

    test("Tests a successful update of an open history document", async () => {
        const refMock = {
            update: jest.fn(() => Promise.resolve("success"))
        }
        const docMock = {
            get: jest.fn(() => undefined),
            ref: refMock
        }
        const snapshotMock = {
            empty: false,
            docs: [docMock]
        }
        db.getHistorySnapshot = jest.fn(() => snapshotMock);

        const mail = "somevalidmail@hs-heilbronn.de";
        await db.updateOpenHistoryDocument(mail)
            .then(result => {
                expect(db.getHistorySnapshot).toHaveBeenCalledTimes(1);
                expect(db.getHistorySnapshot).toHaveBeenCalledWith(mail);
                expect(docMock.get).toHaveBeenCalledTimes(1);
                expect(docMock.get).toHaveBeenCalledWith('checkout');
                expect(refMock.update).toHaveBeenCalledTimes(1);
                expect(refMock.update).toHaveBeenCalledWith(expect.anything());
            })
    });
});

describe('Tests for the getUserDocDataFromEmail function in the database module', () => {
    // Clear all mocked functions/objects
    afterEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    beforeEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    test('Checks that an error is thrown if the email ist null', async () => {
        try {
            await db.getUserDocDataFromEmail(null);
        } catch (e) {
            expect(e.message).toBe("Invalid e-mail! E-Mail must not be null.");
        }
    });

    test('Checks that an error is thrown if snapshot is empty', async () => {
        const snapshotMock = {
            empty: true
        }

        const queryMock = {
            get: jest.fn(() => snapshotMock)
        }

        const collectionRefMock = {
            where: jest.fn(() => queryMock),
        }

        firebase.firestore = jest.fn().mockReturnValue({
            collection: jest.fn(() => collectionRefMock)
        });

        console.log = jest.fn();

        const email = "somemail@hs-heilbronn.de";
        try {
            await db.getUserDocDataFromEmail(email);
        } catch (e) {
            expect(e.message).toBe('No user found with email: ' + email);
            expect(firebase.firestore().collection).toHaveBeenCalledTimes(1);
            expect(firebase.firestore().collection).toHaveBeenCalledWith('User');
            expect(collectionRefMock.where).toHaveBeenCalledTimes(1);
            expect(collectionRefMock.where).toHaveBeenCalledWith('Email', '==', email);
            expect(queryMock.get).toHaveBeenCalledTimes(1);
            expect(console.log).toHaveBeenCalledWith("Error in getUserDocFromEmail!");
        }
    });

    test('Checks that the api calls are called with the correct parameters and that the correct doc is returned', async () => {
        const snapshotMock = {
            docs: ["DOC1", "DOC2"]
        }

        const queryMock = {
            get: jest.fn(() => snapshotMock)
        }

        const collectionRefMock = {
            where: jest.fn(() => queryMock),
        }

        firebase.firestore = jest.fn().mockReturnValue({
            collection: jest.fn(() => collectionRefMock),
        });

        const email = "somemail111@hs-heilbronn.de";
        const result = await db.getUserDocDataFromEmail(email);

        expect(firebase.firestore().collection).toHaveBeenCalledTimes(1);
        expect(firebase.firestore().collection).toHaveBeenCalledWith('User');
        expect(collectionRefMock.where).toHaveBeenCalledTimes(1);
        expect(collectionRefMock.where).toHaveBeenCalledWith('Email', '==', email);
        expect(queryMock.get).toHaveBeenCalledTimes(1);
        expect(result).toBe("DOC1");
    });
});

describe('Tests for the setCheckInStatus function in the database module', () => {
    // Clear all mocked functions/objects
    afterEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    test("Tests that a rejected promise is returned if the email is null", async () => {
        await db.setCheckInStatus(null, null)
            .catch(e => {
                expect(e.message).toBe("Invalid e-mail! E-Mail must not be null.");
            });
    });

    test("Tests that the status is set correctly", async () => {
        const refMock = {
            update: jest.fn(() => Promise.resolve("success"))
        }
        db.getUserDocDataFromEmail = jest.fn().mockReturnValue({
            ref: refMock
        });

        await db.setCheckInStatus("somemail", true)
            .then(result => {
                expect(db.getUserDocDataFromEmail).toHaveBeenCalledTimes(1);
                expect(db.getUserDocDataFromEmail).toHaveBeenCalledWith("somemail");
                expect(refMock.update).toHaveBeenCalledTimes(1);
                expect(refMock.update).toHaveBeenCalledWith({isCheckedIn: true});
                expect(result).toBe("success");
            });
    });
});

describe('Tests for the createUserDocument function in the database module', () => {

    // Clear all mocked functions/objects
    afterEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    test('Checks that the calls to the firebase api for createUserDocument are called with the correct parameters', () => {
        const collectionRefMock = {
            add: jest.fn(() => Promise.resolve())
        }

        firebase.firestore = jest.fn().mockReturnValue({
            collection: jest.fn(() => collectionRefMock),
        });

        const email = "somevalidmail@hs-heilbronn.de";
        const firstname = "John";
        const lastname = "Doe";

        db.createUserDocument(email, firstname, lastname)
            .then(() => {
               expect(firebase.firestore().collection).toHaveBeenCalledTimes(1);
               expect(firebase.firestore().collection).toHaveBeenCalledWith("User");
               expect(collectionRefMock.add).toHaveBeenCalledTimes(1);
               expect(collectionRefMock.add).toHaveBeenCalledWith({
                   Vorname: firstname,
                   Nachname: lastname,
                   Email: email,
                   isCheckedIn: false
               })
            });
    });
});

/*
describe('Tests for the createHistoryDocument function in the database module', () => {

    // Clear all mocked functions/objects
    afterEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

   test('Checks that the calls to the firebase api for createHistoryDocument are called with the correct parameters', () => {
       const collectionRefMock = {
           add: jest.fn(() => Promise.resolve())
       }

       firebase.firestore.Timestamp.now = jest.fn();

       firebase.firestore = jest.fn().mockReturnValue({
           collection: jest.fn(() => collectionRefMock),
           Timestamp: jest.fn().mockReturnValue({
               now: jest.fn(() => "timestamp")
           })
       });

       const email = "somevalidmail@hs-heilbronn.de";
       const type = "Check-In";
       const location = "Sonstheim";

       db.createHistoryDocument(email, type, location)
           .then(() => {
               expect(firebase.firestore().collection).toHaveBeenCalledTimes(1);
               expect(firebase.firestore().collection).toHaveBeenCalledWith('History');
               expect(collectionRefMock.add).toHaveBeenCalledTimes(1);
               expect(collectionRefMock.add).toHaveBeenCalledWith({
                   email: email,
                   type: type,
                   location: location,
                   timestamp: "TIMESTAMP"
               });
               expect(firebase.firestore.Timestamp.now).toHaveBeenCalledTimes(1);
           });
   });
});
*/

describe('Tests for the isUserCheckedIn function in the database module', () => {
    // Clear all mocked functions/objects
    afterEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    test('Checks that an error is thrown if the isCheckIn field is not found in the users doc', async () => {
        const userDataMock = {
            get: jest.fn(() => undefined)
        }
        db.getUserDocDataFromEmail = jest.fn(() => userDataMock);

        try {
            await db.isUserCheckedIn("somemail@hs.heilbronn.de");
        } catch (e) {
            expect(db.getUserDocDataFromEmail).toHaveBeenCalledTimes(1);
            expect(db.getUserDocDataFromEmail).toHaveBeenCalledWith("somemail@hs.heilbronn.de");
            expect(userDataMock.get).toHaveBeenCalledWith('isCheckedIn');
            expect(e.message).toBe('Unable to find login status for user. Field is missing in the database!');
        }
    })

    test('Checks that the check in status is returned if it was found in the users doc', async () => {
        const userDataMock = {
            get: jest.fn(() => true)
        }
        db.getUserDocDataFromEmail = jest.fn(() => userDataMock);

        const result = await db.isUserCheckedIn("somemail@hs.heilbronn.de");
        expect(db.getUserDocDataFromEmail).toHaveBeenCalledTimes(1);
        expect(db.getUserDocDataFromEmail).toHaveBeenCalledWith("somemail@hs.heilbronn.de");
        expect(userDataMock.get).toHaveBeenCalledWith('isCheckedIn');
        expect(result).toBe(true);
    })
});



describe('Tests for the saveAutoCheckInStatus function in the database module', () => {
    beforeEach(() => {
        // Prepare html body for the tests
        document.body.innerHTML =
            '<div>' +
                '<input type="checkbox" id="autoCheckIn" value="autoCheckIn">Auto Check-In' +
            '</div>';
    });

    // Clear all mocked functions/objects
    afterEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    test("Checks that no update is done if the current value is already saved", async () => {
        const refMock = {update: jest.fn()}
        const userDocDataMock = {
            get: jest.fn(() => true),
            ref: refMock
        }
        db.getUserDocDataFromEmail = jest.fn(() => userDocDataMock);
        document.getElementById('autoCheckIn').setAttribute('checked', 'checked');

        const mail = "mail";
        await db.saveAutoCheckInStatus(mail)
            .catch(() => {
                expect(db.getUserDocDataFromEmail).toHaveBeenCalledTimes(1);
                expect(db.getUserDocDataFromEmail).toHaveBeenCalledWith(mail);
                expect(userDocDataMock.get).toHaveBeenCalledTimes(1);
                expect(userDocDataMock.get).toHaveBeenCalledWith('autoCheckedInEnabled');
                expect(refMock.update).toHaveBeenCalledTimes(0);
            });
    });

    test("Checks that the auto checkin status is updated correctly", async () => {
        const refMock = {update: jest.fn(() => Promise.resolve("success"))}
        const userDocDataMock = {
            get: jest.fn(() => undefined),
            ref: refMock
        }
        db.getUserDocDataFromEmail = jest.fn(() => userDocDataMock);
        document.getElementById('autoCheckIn').setAttribute('checked', 'checked');

        const mail = "mail";
        await db.saveAutoCheckInStatus(mail)
            .then(result => {
                expect(db.getUserDocDataFromEmail).toHaveBeenCalledTimes(1);
                expect(db.getUserDocDataFromEmail).toHaveBeenCalledWith(mail);
                expect(userDocDataMock.get).toHaveBeenCalledTimes(1);
                expect(userDocDataMock.get).toHaveBeenCalledWith('autoCheckedInEnabled');
                expect(refMock.update).toHaveBeenCalledTimes(1);
                expect(refMock.update).toHaveBeenCalledWith({autoCheckedInEnabled: true});
                expect(result).toBe("success");
            });
    });
});