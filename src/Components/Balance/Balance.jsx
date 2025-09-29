import { useContext } from "react";
import "./Balance.css";
import { userDataContext } from "../../AppContexts";

const Balance = () => {
  const { userData } = useContext(userDataContext);

  return (
    <>
      <h3>
        Suspended Balance:{" "}
        <p>{userData ? userData.suspendedBalance ?? 0 : "Loading..."}</p>
      </h3>
      <h3>
        Actual Balance:{" "}
        <p>{userData ? userData.actualBalance ?? 0 : "Loading..."}</p>
      </h3>
    </>
  );
};

export default Balance;
