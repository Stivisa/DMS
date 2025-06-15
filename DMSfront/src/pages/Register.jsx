//NOT USED
import { React, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { userRequest } from "../utils/requestMethods";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleClick = async (e) => {
    e.preventDefault();
    await userRequest.post("/auth/register", {
      username,
      password,
    });
    navigate("/login");
  };

  return (
    <div className="grid grid-cols-1  h-screen w-full">
      <div className="bg-default flex flex-col justify-center">
        <form className="max-w-[400px] w-full mx-auto bg-white p-4">
          <h2 className="text-4xl font-bold text-center py-6">COMPANY NAME</h2>
          <div className="flex flex-col py-2">
            <label>Username</label>
            <input
              className="border p-2 cursor-pointer"
              type="text"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="flex flex-col py-2">
            <label>Password</label>
            <input
              className="border p-2 cursor-pointer"
              type="password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            onClick={handleClick}
            disabled={false}
            className={
              false
                ? "border w-full my-5 py-2 bg-indigo-300 text-white cursor-not-allowed"
                : "border w-full my-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white"
            }
          >
            Sign up
          </button>
          {false && (
            <div className="text-center text-red-600">
              Something went wrong!
            </div>
          )}
          <div className="flex justify-between">
            <p className="flex items-center">
              <input className="mr-2" type="checkbox" /> Remember Me
            </p>
            <Link to="/login">
              <p>Already have an account? Sign in</p>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
