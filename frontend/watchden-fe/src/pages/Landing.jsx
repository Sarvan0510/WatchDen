import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-80 bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-semibold text-center mb-2">Watch Party</h1>

        <p className="text-sm text-gray-600 text-center mb-6">
          Watch videos together in real time
        </p>

        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            className="text-center bg-black text-white py-2 rounded"
          >
            Login
          </Link>

          <Link to="/register" className="text-center border py-2 rounded">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
