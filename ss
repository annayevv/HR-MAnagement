import React, { useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { FaEyeSlash } from "react-icons/fa6";
import { IoEyeSharp } from "react-icons/io5";
import { MdOutlineArrowRightAlt } from "react-icons/md";

function Login() {
  const { login, loading, isAuthenticated } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    const success = await login(username, password);

    if (!success) {
      setError("Login failed, please check your password or email.");
    }
  };

  if (isAuthenticated) {
    return <div>Giriş tamamlandy!</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="  p-8 rounded-3xl shadow-2xl bg text-white text-center">
        <img
          src="logo1.png"
          alt="Profile Icon"
          className="w-20 h-20 mx-auto  rounded-[70.5px] mb-6"
        />
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block mr-[335px]  text-lg font-medium text-[#8A8C98]">
              Email
            </label>
            <input
              minLength={3}
              aria-label="Emailynyzy giriziň"
              aria-required="true"
              className="w-[406px] p-3 mt-2 text-lg bg-[#333] border-none rounded-[8px] "
              type="text"
              placeholder="Email giriziň"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block mr-[330px] text-lg font-medium text-[#8A8C98]">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password giriziň"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 mt-2 text-lg bg-[#333] border-none rounded-[8px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                {showPassword ? <IoEyeSharp /> : <FaEyeSlash />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <button
              type="submit"
              className="flex items-center gap-2 w-full p-3  rounded-lg bg-green-700 hover:bg-green-800 text-white text-lg justify-center"
              disabled={loading}
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
              ) : (
                <>
                  Log in <MdOutlineArrowRightAlt size={32} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
