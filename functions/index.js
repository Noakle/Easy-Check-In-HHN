const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const nodemailer = require('nodemailer')
const user = functions.config().gmail.user;
const pass = functions.config().gmail.password;

const cors = require('cors')({origin: true});

// Create a transporter (for testing we can use gmail)
let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // SSL Port
    secure: true, // Enable SSL
    auth: {
        user: user,
        pass: pass
    }
});

exports.sendCheckinEmail = functions.https.onCall((data, context) => {
    if (!context.auth && !context.auth.token.email) {
        throw new functions.https.HttpsError('failed-precondition', 'Must be logged in with an valid email address')
    }

    const mailOptions = {
        from: 'noreply@easy-check-in-hhn.firebaseapp.com',
        to: context.auth.token.email,
        subject: 'Check-in confirmation',
        html: `<h2>Check-In confirmation</h2>
            <p>Hallo ${data.name},<br><br>
            Du hast dich erfolgreich an dem Standort ${data.location} eingecheckt. Bitte denk daran, dass du beim<br>
            Verlassen der Hochschule einen Check-Out durchführst. Besuche dazu wieder die Easy Check-In HHN Webseite oder<br>
            klicke auf den folgenden Link, um direkt einen Check-Out durchzuführen.<br>
            <h4><a href="${data.url}">Check-Out</a></h4><br>
            Bitte bleib gesund und achte auf die geltenden Corona-Verordnungen!<br><br><br>
            Dein Easy Check-In HHN Team`
    };

    return retrySendMail(mailOptions, 5);
});

//sendCheckOutReminderMail
exports.sendCheckOutReminderEmail = functions.https.onCall((data, context) => {
    const mailOptions = {
        from: 'noreply@easy-check-in-hhn.firebaseapp.com',
        to: data.email,
        subject: 'Check-Out Reminder',
        html: `<h2>Check-Out Reminder</h2>
            <p>Hallo ${data.name},<br><br>
            Wir haben festgestellt, dass du aktuell noch am Standort ${data.location} eingecheckt bist.<br>
            Bitte denke daran, dich auszuchecken, falls du dich nicht mehr im Hochschulgebäude aufhälst<br>
            Klicke auf den folgenden Link, um direkt einen Check-Out durchzuführen.<br>
            <h4><a href="${data.url}">Check-Out</a></h4><br>
            Bitte bleib gesund und achte auf die geltenden Corona-Verordnungen!<br><br><br>
            Dein Easy Check-In HHN Team`
    };

    return retrySendMail(mailOptions, 5);

});

async function retrySendMail(mailOptions, retriesLeft) {
    if (retriesLeft <= 0) {
        return "Failed to send mail!";
    }

    await transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return retrySendMail(mailOptions, retriesLeft - 1);
        } else {
            console.log('E-Mail sent: %s', info.messageId);
            return "Success";
        }
    })
}

exports.autoCheckOut = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        // Get the user's document id
        const docID = req.query.docid;
        const docRef = admin.firestore().collection('User').doc(docID);

        // Update the user's checkin status 
        docRef.update({isCheckedIn : false})
            .then(() => {
                // Create document in the History collection for the checkin
                docRef.get()
                .then((snapshot) => {
                    // Check if the snapshot has no matching documents
                    if (snapshot.empty) {
                        console.log("No user document found with id: " + docID);
                        return res.send("No user document found with id: " + docID);
                    }

                    // Update the latest history document for the user
                    const email = snapshot.get('Email');
                    admin.firestore()
                        .collection('History')
                        .where('email', '==', email)
                        .orderBy("checkin", "desc")
                        .get()
                        .then(querySnapshot => {
                            if (querySnapshot.empty) {
                                console.error('No history documents found for mail:' + email);
                                return res.send('No history documents found for mail:' + email);
                            }

                            // Newest document MUST contain a checkin timestamp but no checkout timestamp
                            const docSnapshot = querySnapshot.docs[0];
                            const checkout = docSnapshot.get('checkout');
                            // Field for the checkin status not found in the user's document -> keep login content for now
                            if (typeof checkout != 'undefined') {
                                console.log('Check-Out already done!');
                                return res.send('Check-Out already done!');
                            }

                            docSnapshot.ref.update({checkout: admin.firestore.Timestamp.now()})
                                .then(() => {
                                    console.log('Check-Out completed! Updated user: ' + docID + ' Updated history: ' + docSnapshot.id);
                                    return res.send('Check-Out completed!');
                                })
                                .catch(error => {
                                    console.error(error);
                                    return res.send(error.toString());
                                });
                        })
                        .catch(error => {
                            console.error(error);
                            return res.send(error.toString());
                        });

                    /*
                    admin.firestore().collection('History').add({
                        email: email,
                        type: "Check-Out",
                        location: "Sontheim",
                        timestamp: admin.firestore.Timestamp.now()
                    })
                    .then(resultDocument => {
                        console.log('Check-Out completed! Updated user: ' + docID + ' Updated history: ' + resultDocument.id);
                        return res.send('Check-Out completed!');
                    })
                    .catch(error => {
                        console.error(error);
                        return res.send(error.toString());
                    });
                     */
                })
                .catch((error) => {
                    console.error(error);
                    return res.send(error.toString());
                });                
            })
            .catch((error) => {
                console.error(error);
                return res.send(error.toString());
            });        
    });
});