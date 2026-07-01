import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Auth() {
  const location = useLocation();
  const isLogin = location.pathname === "/login";

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("Equipment Rental");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    if (!user) {
      setMessage("Account created. Please check your email to confirm your account.");
      setLoading(false);
      return;
    }

    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        name: companyName,
        slug,
        industry,
        created_by: user.id,
      })
      .select()
      .single();

    if (companyError) {
      setMessage(companyError.message);
      setLoading(false);
      return;
    }

    await supabase.from("company_members").insert({
      company_id: company.id,
      user_id: user.id,
      role: "owner",
      status: "active",
    });

    window.location.href = "/dashboard";
  }

  return (
    <div className="authPage">
      <section className="authCard">
        <div className="sectionHeader authHeader">
          <span>{isLogin ? "Log In" : "Start Free Trial"}</span>
          <h2>{isLogin ? "Welcome back." : "Create your workspace."}</h2>
          <p>
            {isLogin
              ? "Log in to your BC Digital workspace."
              : "No credit card required. Create your company and start setting up BC Fleet."}
          </p>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleSignup} className="authForm">
          {!isLogin && (
            <>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                required
              />

              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company name"
                required
              />

              <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
                <option>Equipment Rental</option>
                <option>Construction</option>
                <option>Auto Repair</option>
                <option>Pressure Washing</option>
                <option>Decorative Concrete</option>
                <option>Home Services</option>
                <option>Other</option>
              </select>
            </>
          )}

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            required
          />

          <button disabled={loading}>
            {loading
              ? isLogin
                ? "Logging in..."
                : "Creating..."
              : isLogin
              ? "Log In"
              : "Create Free Workspace"}
          </button>
        </form>

        {message && <p className="authMessage">{message}</p>}

        <p className="authSwitch">
          {isLogin ? "Need an account? " : "Already have an account? "}
          <Link to={isLogin ? "/signup" : "/login"}>
            {isLogin ? "Start free trial" : "Log in"}
          </Link>
        </p>
      </section>
    </div>
  );
}