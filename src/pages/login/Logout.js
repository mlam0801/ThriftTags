import React from 'react'
import { GoogleLogout } from 'react-google-login';

const clientId = "91424131370-ievd7huontv62lvh8g7r0nnsktp4mheh.apps.googleusercontent.com";

function Logout() {
    const onSuccess = () => {
        console.log("You have logged out successfully!");
    }

    return(
        <div id="logout-button">
            <GoogleLogout
                clientId={clientId}
                buttonText={"Logout"}
                onLogoutSuccess={onSuccess}
            />
        </div>
    )
}

export default Logout;