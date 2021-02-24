const firebase = require('./Firebase').firebase;
require('firebase/firestore');

function createUserDocument(email, firstName, lastName) {
    return firebase.firestore().collection("User").add({
        Vorname: firstName,
        Nachname: lastName,
        Email: email,
        isCheckedIn: false
    });
}

function createHistoryDocument(email, location) {
    return firebase.firestore().collection('History').add({
        email: email,
        location: location,
        checkin: firebase.firestore.Timestamp.now()
    });
}

async function updateOpenHistoryDocument(email) {
    if (email == null) {
        throw new Error("Invalid e-mail! E-Mail must not be null.");
    }
    try {
        const querySnapshot = await exportFunctions.getHistorySnapshot(email);
        if (querySnapshot.empty) {
            throw new Error('No history document found for mail:' + email);
        }

        // Newest document MUST contain a checkin timestamp but no checkout timestamp
        const docSnapshot = querySnapshot.docs[0];
        const checkout = docSnapshot.get('checkout');
        // Field for the checkin status not found in the user's document -> keep login content for now
        if (typeof checkout != 'undefined') {
            throw new Error('Document already contains checkout time!');
        }

        return docSnapshot.ref.update({checkout: firebase.firestore.Timestamp.now()});
    } catch (e) {
        console.log("Error in getOpenHistoryDocument!");
        throw(e);
    }
}

async function getUserDocDataFromEmail(email) {
    if (email == null) {
        throw new Error("Invalid e-mail! E-Mail must not be null.");
    }
    try {
        const querySnapshot = await firebase.firestore().collection('User').where('Email', '==', email).get();
        if (querySnapshot.empty) {
            throw new Error('No user found with email: ' + email);
        }
        return querySnapshot.docs[0];
    } catch (e) {
        console.log("Error in getUserDocFromEmail!");
        throw(e);
    }
}

async function setCheckInStatus(email, status) {
    try {
        const userDocData = await exportFunctions.getUserDocDataFromEmail(email);
        return userDocData.ref.update({isCheckedIn: status});
    } catch (error) {
        return Promise.reject({message: error.message});
    }
}

async function isUserCheckedIn(userEmail) {
    const userDocData = await exportFunctions.getUserDocDataFromEmail(userEmail);
    const isCheckedIn = userDocData.get('isCheckedIn');
    // Field for the checkin status not found in the user's document -> keep login content for now
    if (typeof isCheckedIn == 'undefined') {
        throw new Error('Unable to find login status for user. Field is missing in the database!');
    }
    return isCheckedIn;
}

async function saveAutoCheckInStatus(email) {
    const userDocData = await exportFunctions.getUserDocDataFromEmail(email);
    const currentStatus = userDocData.get('autoCheckedInEnabled');
    const autoCheckInStatus = document.getElementById('autoCheckIn').getAttribute('checked') === 'checked';
    if (typeof currentStatus == 'undefined' || currentStatus !== autoCheckInStatus) {
        // Set the new checkin status
        const docRef = userDocData.ref;
        return docRef.update({autoCheckedInEnabled: autoCheckInStatus});
    } else {
        return Promise.reject();
    }
}

function getHistorySnapshot(email) {
    return firebase.firestore()
        .collection('History')
        .where('email', '==', email)
        .orderBy("checkin", "desc")
        .get();
}

const exportFunctions = {
    createUserDocument,
    createHistoryDocument,
    getUserDocDataFromEmail,
    isUserCheckedIn,
    saveAutoCheckInStatus,
    setCheckInStatus,
    updateOpenHistoryDocument,
    getHistorySnapshot
}

module.exports.db = exportFunctions;
