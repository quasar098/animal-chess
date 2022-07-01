const signInMessage = document.getElementById('sign-in-pls');
const usernameBox = document.getElementById('username');
const passwordBox = document.getElementById('password');
const signInButton = document.getElementById('sign-in-button');
const registerCheck = document.getElementById('register');

const youSignedInMsg = document.getElementById('thanks-for-signing-in');

youSignedInMsg.style.display = "none";
signInMessage.style.display = "none";

async function apiReq(path, method="GET", headers=null) {
    if (headers == null) {
        headers = {
          'Content-Type': 'application/json',
        }
    } else {
        headers["Content-Type"] = "application/json";
    }
    let rawResponse = await fetch(
        new URL("api/" + path, API_DOMAIN),
        {
            method: method,
            headers: headers,
        }
    );
    return await rawResponse.json();
}

function getStoredCred() {
    return {username: localStorage.getItem("username"), password: localStorage.getItem("password")}
}

function clearStoredCred() {
    localStorage.removeItem("username");
    localStorage.removeItem("password");
    passwordBox.value = "";
}

function setStoredCred(username, password) {
    localStorage.setItem("password", password);
    localStorage.setItem("username", username);
}

async function isSignedIn() {
    let userList = await apiReq("users");

    if (!Object.values(getStoredCred())[0]) {
        clearStoredCred();
        return false;
    }
    if (userList) {

    }

    return true;
}

async function updateSignIn() {
    youSignedInMsg.style.display = "none";
    signInMessage.style.display = "none";
    let signedIn = await isSignedIn();
    if (signedIn) {
        youSignedInMsg.style.display = "block";
    } else {
        signInMessage.style.display = "block";
    }
}

async function attemptSignIn() {
    if (registerCheck.checked) {
        await apiReq("users", "POST", {"username": usernameBox.value + "", "password": passwordBox.value + ""});
    }
    setStoredCred(usernameBox.value + "", passwordBox.value + "");
    updateSignIn();
}

updateSignIn();
