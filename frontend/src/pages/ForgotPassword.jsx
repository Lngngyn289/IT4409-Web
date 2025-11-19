import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import FormField from "../components/FormField.jsx";
import { forgotPassword } from "../api.js";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      const result = await forgotPassword(email);
      setSuccess(true);
      setEmail(""); // Clear form
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      previewVariant="hidden-scroll"
      title="Quên mật khẩu"
      subtitle="Nhập email của bạn để nhận link đặt lại mật khẩu."
      footer={
        <span>
          Đã nhớ lại mật khẩu?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 underline-offset-2 hover:text-blue-700"
          >
            Đăng nhập
          </Link>
        </span>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField
          name="email"
          label="Email"
          type="email"
          placeholder="nhap-email@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
            <p className="font-semibold">Email đã được gửi!</p>
            <p className="mt-1 text-xs text-emerald-600">
              Vui lòng kiểm tra hộp thư của bạn và làm theo hướng dẫn để đặt lại mật khẩu.
              Link sẽ hết hạn sau 15 phút.
            </p>
          </div>
        )}

        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isLoading || !email}
        >
          {isLoading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
        </button>

        <div className="text-center">
          <Link
            to="/register"
            className="text-sm text-gray-500 hover:text-blue-600"
          >
            Chưa có tài khoản? Đăng ký ngay
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;

