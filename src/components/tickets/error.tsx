import { DotLottieReact } from "@lottiefiles/dotlottie-react";

type ErrorProps = {
  error: string;
  isExhausted: boolean;
  onRetry: () => void;
};

const Error = ({ error, isExhausted, onRetry }: ErrorProps) => {
  return (
    <div className="rounded-lg border border-red-300 bg-red-50 p-8 my-2">
      <div className="flex items-center justify-center w-full">
        <DotLottieReact
          src="https://lottie.host/c3bb0fc8-e389-421a-859d-bb5e5130bcf0/QCxyjPRWpB.lottie"
          loop
          autoplay
          className="w-96 h-96"
        />
      </div>
      <p className="mb-3 text-center text-3xl text-red-600">{error}</p>
      {isExhausted && (
        <button
          onClick={onRetry}
          className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 cursor-pointer mx-auto block w-1/3"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default Error;
