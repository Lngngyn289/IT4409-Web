import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

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
      // Redirect to workspaces after successful login
      setTimeout(() => {
        navigate("/workspaces");
      }, 1000);
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
          <Link to="/register" className="font-medium text-blue-600 underline-offset-2 hover:text-blue-700">
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
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-700 underline-offset-2"
          >
            Quên mật khẩu?
          </Link>
        </div>
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
            <p className="font-semibold">{success.message}</p>
            <p className="text-xs text-emerald-600">
              Xin chào {success.user?.fullName || success.user?.email}!
            </p>
          </div>
        )}
        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isLoading}
        >
          {isLoading ? "Đang xử lý..." : "Đăng nhập"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;
