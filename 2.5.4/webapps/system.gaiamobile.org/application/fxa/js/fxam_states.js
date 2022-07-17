'use strict';var FxaModuleStates=(function(){return{ENTER_PHONE_OTP:{id:'fxa-enter-otp',module:'FxaModuleEnterOTP'},SIGN_IN:{id:'fxa-sign-in',module:'FxaModuleSignIn'},SIGN_OUT:{id:'fxa-sign-out',module:'FxaModuleSignOut'},MULTIPLE_SIGN_IN_ATTEMPTS:{id:'fxa-multiple-sign-in-attempts',module:'FxaMultipleSignInAttempts'},CHECK_PASSWORD:{id:'fxa-check-password',module:'FxaModuleCheckPassword'},CHANGE_PASSWORD:{id:'fxa-change-password',module:'FxaModuleChangePassword'},SIGNUP_SUCCESS:{id:'fxa-signup-success',module:'FxaModuleSignupSuccess'},SEND_SUCCESS:{id:'fxa-send-success',module:'FxaModuleSendSuccess'},FORGOT_PASSWORD:{id:'fxa-forgot-password',module:'FxaModuleForgotPassword'},FORGOT_PASSWORD_SUCCESS:{id:'fxa-forgot-password-success',module:'FxaModuleForgotPasswordSuccess'},REFRESH_AUTH:{id:'fxa-refresh-auth',module:'FxaModuleRefreshAuth'},RESET_PASSWORD_SUCCESS:{id:'fxa-reset-password-success',module:'FxaModuleResetPasswordSuccess'},TOS:{id:'fxa-tos'},PP:{id:'fxa-pp'},ENTER_PHONE_NUMBER_LOGIN:{id:'fxa-login-phone-number',module:'FxaModuleLoginPhoneNumber'},ENTER_ACCOUNT_PN:{id:'fxa-enter-account-pn',module:'FxaModuleEnterAccountPN'},EDIT_ACCOUNT_PN:{id:'fxa-edit-account-pn',module:'FxaModuleEditAccountPN'},EDIT_ACCOUNT_EMAIL:{id:'fxa-edit-account-email',module:'FxaModuleEditAccountEmail'},DELETE_ACCOUNT:{id:'fxa-delete-account',module:'FxaModuleDeleteAccount'},VERIFY_ALT_PHONE:{id:'fxa-enter-alt-phone-otp',module:'FxaModuleEnterAltPhoneOTP'},ENTER_PERSONAL_INFO:{id:'fxa-enter-personal-info',module:'FxaModuleEnterPersonalInfo'},PASSWORD_RETRIEVAL:{id:'fxa-password-retrieval',module:'FxaModulePasswordRetrieval'},EDIT_ACCOUNT_ALT_PN:{id:'fxa-edit-account-alt-pn',module:'FxaModuleEditAccountAltPN'},SEND_EMAIL_VERIFICATION:{id:'fxa-send-email-verification',module:'FxaModuleSendEmailVerification'},DONE:null,back:function(){FxaModuleNavigation.back();},setState:function setState(state){if(!(state in this)||typeof state==='function'){return;}
document.location.hash=state.id;}};}());