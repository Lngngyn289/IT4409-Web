import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import FormField from "../components/FormField.jsx";
import useAuth from "../hooks/useAuth.js";

const loginFields = [
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "nhap-email@domain.com",
  },
  {
    name: "password",
    label: "Mật khẩu",
    type: "password",
    placeholder: "••••••••",
  },
];

const initialState = { email: "", password: "" };

function LoginPage() {
  const [formState, setFormState] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const { login } = useAuth();

  const handleChange = (field) => (event) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess(null);
    setIsLoading(true);

    try {
      const result = await login(formState);
      setSuccess({
        message: "Đăng nhập thành công!",
        user: result.user,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      previewVariant="hidden-scroll"
      title="Đăng nhập"
      subtitle="Sử dụng tài khoản đã đăng ký để truy cập ứng dụng."
      footer={
        <span>
          Bạn chưa có tài khoản?{" "}
          <Link to="/register" className="text-indigo-300 underline-offset-2 hover:text-indigo-200">
            Đăng ký ngay
          </Link>
        </span>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {loginFields.map((field) => (
          <FormField
            key={field.name}
            {...field}
            value={formState[field.name]}
            onChange={handleChange(field.name)}
          />
        ))}
        {error && (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}
        {success && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-100">
            <p className="font-semibold">{success.message}</p>
            <p className="text-xs text-emerald-200/80">
              Xin chào {success.user?.fullName || success.user?.email}!
            </p>
          </div>
        )}
        <button
          type="submit"
          className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isLoading}
        >
          <span className="absolute inset-0 opacity-0 blur-2xl transition duration-500 group-hover:opacity-60">
            <span className="block h-full w-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400" />
          </span>
          <span className="relative flex items-center gap-2">
            {isLoading ? "Đang xử lý..." : "Đăng nhập"}
          </span>
        </button>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;
