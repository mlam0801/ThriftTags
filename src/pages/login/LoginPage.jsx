import { useState, useEffect } from "react";
import "./LoginPage.css";
import emailIcon from "../../images/email.png";
import passwordIcon from "../../images/password.png";
import userIcon from "../../images/person.png";
import bg1 from "../../images/valuevillage.jpg";
import bg2 from "../../images/salvationarmy.jpeg";
import bg3 from "../../images/Goodwill.jpg.webp";
import bg4 from "../../images/communityaid.jpeg";
import bg5 from "../../images/buffaloexchange.jpeg";
import { db } from "../../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { gapi } from 'gapi-script';
//import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
//import LoginButton from './Login';
import { useAuth } from '../../context/AuthContext'; // from GB
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase";

const clientId = "91424131370-ievd7huontv62lvh8g7r0nnsktp4mheh.apps.googleusercontent.com";

const LoginPage = () => {
  const navigate = useNavigate();
  const { signup, login, error: authError } = useAuth(); // from GB
  const [action, setAction] = useState("Login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (action === "Sign Up") {
        const userCredential = await signup(email, password);

        const userRef = doc(db, 'users', email);
        await setDoc(userRef, {
          username,
          email,
          createdAt: new Date().toISOString(),
        });
    
        sessionStorage.setItem('userEmail', email);
        navigate('/home');
      } else {
        await login(email, password);

        const userRef = doc(db, 'users', email);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          sessionStorage.setItem('userEmail', email);
          navigate('/home');
        } else {
          setError("User not found in database");
        }
      }
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    function start() {
      gapi.client.init({
        clientId: clientId,
        scope: "profile email",
      }).then(() => {
        const auth2 = gapi.auth2.getAuthInstance();
        if (auth2) {
          auth2.isSignedIn.listen(handleAuthChange);
        } else {
          console.error("Google Auth2 instance is not initialized properly.");
        }
      }).catch((error) => {
        console.error("Error initializing Google client", error);
      });
    }
    gapi.load('client:auth2', start);
  }, []);

  const handleLogin = () => {
    const auth2 = gapi.auth2.getAuthInstance();
    auth2.signIn({ prompt: 'select_account' })
      .then(() => {
        const googleUser = auth2.currentUser.get();
        const id_token = googleUser.getAuthResponse().id_token;
        authenticate(id_token);
      });
  };

  const authenticate = async (id_token) => {
    try {
      const response = await fetch('/auth', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${id_token}`,
        },
      });
      if (response.ok) {
        sessionStorage.setItem('id_token', id_token);
        navigate('/home');
      }
    } catch (error) {
      console.error("Authentication error", error);
    }
  };

  const handleAuthChange = (isSignedIn) => {
    if (isSignedIn) {
      const auth2 = gapi.auth2.getAuthInstance();
      const googleUser = auth2.currentUser.get();
      const id_token = googleUser.getAuthResponse().id_token;
      authenticate(id_token);
    }
  };
  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
  
    try {
      await sendPasswordResetEmail(auth, email);
      setError("");
      alert("Password reset email sent! Please check your inbox.");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="login-page">
      <div className="background">
        <div className="slide" style={{ backgroundImage: `url(${bg1})` }}></div>
        <div className="slide" style={{ backgroundImage: `url(${bg2})` }}></div>
        <div className="slide" style={{ backgroundImage: `url(${bg3})` }}></div>
        <div className="slide" style={{ backgroundImage: `url(${bg4})` }}></div>
        <div className="slide" style={{ backgroundImage: `url(${bg5})` }}></div>
      </div>

      <div className="body-login">
        <div className="left-side">
          <h1>ThriftTags</h1>
          <p>
            Welcome to ThriftTags! ThriftTags aims to connect our thrifting
            community to share locations they frequent, from common to unique
            finds! We encourage users to share their finds with others and
            make new connections.
          </p>
        </div>

        <form className="container-login" onSubmit={handleSubmit}>
          <div className="header">
            <div className="text">{action}</div>
            <div className="underline"></div>
          </div>

          <div className="inputs">
            {action === "Sign Up" && (
              <div className="input">
                <img src={userIcon} alt="Username" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="input">
              <img src={emailIcon} alt="Email" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input">
              <img src={passwordIcon} alt="Password" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {action === "Login" && (
            <div className="forgot-password">
              Lost password? <span onClick={handleForgotPassword}>Click here!</span>
            </div>
          )}

          {/* Error message */}
          {error && <div className="error-message">{error}</div>}

          <div className="submit-container">
            <button
              type={action === "Sign Up" ? "submit" : "button"} 
              className={`submit ${action === "Sign Up" ? "" : "gray"}`}
              onClick={() => {
                if (action !== "Sign Up") {
                  setAction("Sign Up");
                }
              }}
            >
              Sign Up
            </button>

            <button
              type={action === "Login" ? "submit" : "button"}
              className={`submit ${action === "Login" ? "" : "gray"}`}
              onClick={() => {
                if (action !== "Login") {
                  setAction("Login");
                }
              }}
            >
              Login
            </button>
          </div>


        </form>
      </div>
    </div>
  );
};

export default LoginPage;
