import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Sign in to Legacy Cricket Academy</h1>
      <form aria-label="login-form">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" placeholder="Email" data-testid="input-email" required />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" placeholder="Password" data-testid="input-password" required />
        <button type="submit" data-testid="btn-login" className="btn btn-primary w-full mt-3">Login</button>
      </form>
      <hr className="my-4" />
      <p className="text-center text-sm">
        Don't have an account? <Link to="/register" data-testid="link-register" className="text-blue-500 font-semibold">Register</Link>
      </p>
    </div>
  );
}
