import Auth from "../components/Auth";
import { Quote } from "../components/Quote";

export const Signup = () => {
  return (
    <>
      <div className="grid grid-cols-2">
        <Auth />
        <div className="invisible lg:visible">
          <Quote />
        </div>
      </div>
    </>
  );
};
