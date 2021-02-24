const utils = require('../Utils').utils;

describe('Tests for the setRememberMe function in the utils module', () => {
    // Prepare html body for the tests
    beforeEach(() => {
        document.body.innerHTML =
            '<div>' +
                '<input type="checkbox" id="stayCheckedIn" value="bRememberMe"/>' +
                '<input id="txtEmail" type="text">' +
            '</div>';
    })

    // Clear all mocked functions/objects
    afterEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    test('Checks that the local storage values are removed when the remember me checkbox is not checked', () => {
        // Mock the localStorage
        Storage.prototype.getItem = jest.fn(() => {return 'someValue';});
        Storage.prototype.removeItem = jest.fn();

        document.getElementById('stayCheckedIn').removeAttribute("checked");
        document.getElementById('txtEmail').value = "something";

        utils.setRememberMe();

        expect(localStorage.getItem).toHaveBeenCalledTimes(2);
        expect(localStorage.removeItem).toHaveBeenCalledTimes(2);
        expect(localStorage.getItem.mock.calls).toEqual([["email"], ["rememberMe"]]);
        expect(localStorage.removeItem.mock.calls).toEqual([["email"], ["rememberMe"]]);
    });

    test('Checks that the local storage values are removed when the remember me checkbox is checked but no email was entered', () => {
        // Mock the localStorage
        Storage.prototype.getItem = jest.fn(() => {return 'someValue';});
        Storage.prototype.removeItem = jest.fn();

        document.getElementById('stayCheckedIn').setAttribute("checked", "checked");
        document.getElementById('txtEmail').value = "";

        utils.setRememberMe();

        expect(localStorage.getItem).toHaveBeenCalledTimes(2);
        expect(localStorage.removeItem).toHaveBeenCalledTimes(2);
        expect(localStorage.getItem.mock.calls).toEqual([["email"], ["rememberMe"]]);
        expect(localStorage.removeItem.mock.calls).toEqual([["email"], ["rememberMe"]]);
    });

    test('Checks that the local storage values are set when the remember me checkbox is checked and an email was entered', () => {
        // Mock the localStorage
        Storage.prototype.setItem = jest.fn();

        document.getElementById('stayCheckedIn').setAttribute("checked", "checked");
        document.getElementById('txtEmail').value = "somevalidmail@hs-heilbronn.de";

        utils.setRememberMe();

        expect(localStorage.setItem).toHaveBeenCalledTimes(2);
        expect(localStorage.setItem.mock.calls).toEqual([['email', "somevalidmail@hs-heilbronn.de"], ["rememberMe", "bRememberMe"]]);
    });
});

describe('Tests for the setAutoCheckIn function in the utils module', () => {
    // Prepare html body for the tests
    beforeEach(() => {
        document.body.innerHTML =
            '<div>' +
                '<input type="checkbox" id="autoCheckIn" value="value"/>' +
            '</div>';
    })

    // Clear all mocked functions/objects
    afterEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    test('Tests that the option is not stored if the checkbox is not checked', () => {
        Storage.prototype.getItem = jest.fn(() => null);
        Storage.prototype.removeItem = jest.fn();
        document.getElementById('autoCheckIn').removeAttribute("checked");

        utils.setAutoCheckIn();

        expect(localStorage.getItem).toHaveBeenCalledTimes(1);
        expect(localStorage.getItem).toHaveBeenCalledWith('autoCheckIn');
        expect(localStorage.removeItem).toHaveBeenCalledTimes(0);
    });

    test('Tests that the option is not stored if the checkbox is not checked and the old vales is removed', () => {
        Storage.prototype.getItem = jest.fn(() => "something");
        Storage.prototype.removeItem = jest.fn();
        document.getElementById('autoCheckIn').removeAttribute("checked");

        utils.setAutoCheckIn();

        expect(localStorage.getItem).toHaveBeenCalledTimes(1);
        expect(localStorage.getItem).toHaveBeenCalledWith('autoCheckIn');
        expect(localStorage.removeItem).toHaveBeenCalledTimes(1);
        expect(localStorage.removeItem).toHaveBeenCalledWith('autoCheckIn');
    });

    test('Tests that the value is stored if the checkbox is checked', () => {
        Storage.prototype.setItem = jest.fn();
        document.getElementById('autoCheckIn').setAttribute("checked", "checked");

        utils.setAutoCheckIn();

        expect(localStorage.setItem).toHaveBeenCalledTimes(1);
        expect(localStorage.setItem).toHaveBeenCalledWith('autoCheckIn', "value");
    });
});