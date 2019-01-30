var gCognitoAuth;

function init() {
  gCognitoAuth = new AmazonCognitoIdentity.CognitoAuth(COGNITO_AUTH_DATA);
  gCognitoAuth.parseCognitoWebResponse(window.location.href);

  checkLogin();

  if (!localStorage.getItem('client_id')) {
    localStorage.setItem('client_id', uuidv4());
  }

  refreshData();
  setInterval(refreshData, 1000);
}

function checkLogin() {
  if (!gCognitoAuth.isUserSignedIn()) {
    gCognitoAuth.getSession();
  }
}


function refreshData() {
  checkLogin();
  getData(gCognitoAuth.getSignInUserSession().getIdToken().getJwtToken());
}


function getData(idToken) {
  var xmlhttp = new XMLHttpRequest();
  var url =    + '?id=' + localStorage.getItem('client_id');
  xmlhttp.open('GET', url);
  xmlhttp.setRequestHeader('Authorization', idToken);
  xmlhttp.onload = function() {
    if (this.status == 200) {
      var data = JSON.parse(this.responseText);
      updateView(data);
    } else {
      alert('Could not read data');
    }
  };
  xmlhttp.send();
}


function updateView(data) {
  // update view
}


function logout() {
  if (gCognitoAuth.isUserSignedIn()) {
    localStorage.removeItem('client_id');
    gCognitoAuth.signOut();
  } else {
    alert('You are not logged in');
  }
}
