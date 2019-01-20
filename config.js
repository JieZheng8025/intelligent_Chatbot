var API_URL = 'https://www.google.com';
var COGNITO_AUTH_DATA = {
  ClientId: '10nd8730k7b8cijogt19abp3do',
  // Using Amazon Cognito custom domain below, default domain is also fine.
  AppWebDomain: 'ai-customer-service-experience.auth.us-east-1.amazoncognito.com',
  TokenScopesArray: ['phone', 'email', 'openid', 'aws.cognito.signin.user.admin', 'profile'],
  RedirectUriSignIn: 'https://s3.amazonaws.com/ai-customer-service-experience/index.html',
  RedirectUriSignOut: 'https://www.google.com'
};

/*
To test Amazon Cognito hosted UI:
https://auth.example.com/login?response_type=token&client_id=YOUR_AMAZON_COGNITO_CLIENT_ID&redirect_uri=https://localhost
*/
