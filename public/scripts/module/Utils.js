// Remember Me using the HTML/DOM Web Storage localStorage object.
// This value will be stored even when the session ends or the browser is closed.
function setRememberMe() {
    const cbxRememberMe = document.getElementById('stayCheckedIn');
    const inEmail = document.getElementById('txtEmail');
    if (cbxRememberMe.checked && inEmail.value !== "") {
        localStorage.setItem('email', inEmail.value);
        localStorage.setItem('rememberMe', cbxRememberMe.value);
    } else {
        if (localStorage.getItem('email')) {
            localStorage.removeItem('email');
        }
        if (localStorage.getItem('rememberMe')) {
            localStorage.removeItem('rememberMe');
        }
    }
}

function setAutoCheckIn() {
    const cbxAutoCheckIn = document.getElementById('autoCheckIn');
    if (cbxAutoCheckIn.checked) {
        localStorage.setItem('autoCheckIn', cbxAutoCheckIn.value);
    } else if (localStorage.getItem('autoCheckIn')) {
        localStorage.removeItem('autoCheckIn');
    }
}

function showErrorPopup(title, message) {
    $("#error-modal-title").html(title);
    $("#error-modal-body").html(message);
    exportFunctions.showPopup("error-modal");
}

function showInfoPopup(title, message) {
    $("#info-modal-title").html(title);
    $("#info-modal-body").html(message);
    exportFunctions.showPopup("info-modal");
}

function showPopup(modalID) {
    $('#'+modalID).modal('show');
}

function hidePopup(modalID) {
    $('#'+modalID).modal('hide');
}

const exportFunctions = {
    setRememberMe,
    setAutoCheckIn,
    showPopup,
    hidePopup,
    showErrorPopup,
    showInfoPopup
}

module.exports.utils = exportFunctions;