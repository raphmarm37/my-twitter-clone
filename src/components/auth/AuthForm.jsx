import { memo } from 'react';
import { Link } from 'react-router-dom';
import { AlertIcon } from '../common/Icons';

const AuthForm = memo(({
  title,
  subtitle,
  fields,
  submitText,
  loadingText,
  loading,
  error,
  success,
  onSubmit,
  footerText,
  footerLinkText,
  footerLinkTo,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card w-full max-w-[400px] p-8">
        <div className="text-center mb-6">
          <h1 className="text-[28px] font-bold text-primary mb-2">
            {title}
          </h1>
          <p className="text-sm text-secondary">
            {subtitle}
          </p>
        </div>

        {error && (
          <div className="alert-error mb-4">
            <div className="flex items-start gap-2">
              <AlertIcon size={20} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="alert-success mb-4">
            {success}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="flex flex-col gap-4">
            {fields.map((field) => (
              <div key={field.id}>
                <label
                  htmlFor={field.id}
                  className="block text-sm font-medium text-secondary mb-1"
                >
                  {field.label}
                </label>
                <input
                  type={field.type}
                  id={field.id}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={field.placeholder}
                  disabled={loading}
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-5 py-3"
          >
            {loading ? loadingText : submitText}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-secondary">
          {footerText}{' '}
          <Link to={footerLinkTo} className="font-semibold text-link">
            {footerLinkText}
          </Link>
        </p>
      </div>
    </div>
  );
});

AuthForm.displayName = 'AuthForm';

export default AuthForm;
