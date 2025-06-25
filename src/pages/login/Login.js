import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
const clientId = "91424131370-ievd7huontv62lvh8g7r0nnsktp4mheh.apps.googleusercontent.com";

function Login(){
    const onSuccess = (response) => {
        console.log("LOGIN SUCCESS! Current user: ", response);
    };

    const onFailure = (error) => {
        console.log("LOGIN FAILED! error: ", error);
    };

    return (
        <div>
            <GoogleOAuthProvider clientId={clientId}>
                <GoogleLogin
                    onSuccess={onSuccess}
                    onError={onFailure}
                />
            </GoogleOAuthProvider>
        </div>
    );
}

export default Login;
