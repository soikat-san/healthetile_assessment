import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface LoaderProps {
  retryAttempt: number;
}

const Loader = ({ retryAttempt }: LoaderProps) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 my-2">
      <div className="flex items-center justify-center w-full">
        <DotLottieReact
          src="https://lottie.host/7c34b76a-2f26-4304-b445-c400db32b216/0hDSixnws7.lottie"
          loop
          autoplay
          className="w-96 h-96"
        />
      </div>
      {retryAttempt > 0 && (
        <p className="mt-1 text-center text-sm md:text-3xl text-slate-400">
          Retrying... attempt {retryAttempt} of {3}
        </p>
      )}
    </div>
  );
};

export default Loader;
