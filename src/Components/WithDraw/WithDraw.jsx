import React, { useContext, useState } from "react";
import "./WithDraw.css";
import { userDataContext } from "../../AppContexts";
import supabase from "../../SupabaseClient";
import { toast } from "react-toastify";
const WithDraw = () => {
  const [isVoda, setIsVoda] = useState(false);
  const [isInsta, setIsInsta] = useState(false);
  const { userData } = useContext(userDataContext);
  const [withdrawForm, setWithdrawForm] = useState({
    brokerId: userData.id,
    brokerName: userData.fullName,
    brokerPhone: userData.phone,
    brokerEmail: userData.email,
    actualBalance: userData.actualBalance,
    withDrawalPhone: "",
    isVodafone: isVoda,
    vodaCarrierName: "",
    isInstaPay: isInsta,
    instaEmail: "",
    instaAccountName: "",
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setWithdrawForm({ ...withdrawForm, [name]: value });
    console.clear();
    console.log(withdrawForm);
  };
  const handleSubmit = async() => {
      const {data, error} = await supabase.from("WithDrawalRequests").insert([withdrawForm]);
      if(error){
        console.error("Error:", error);
        toast.error("Erorr sending request. Please try again.");
      }else if(data && data.length > 0){
        toast.success("Request sent successfully!");
      }
  }
  return (
    <div className="withdraw-conatiner">
      <form>
        <div className="payment-type-checkbox">
          <label>
            <input
              type="checkbox"
              checked={isVoda}
              onChange={() => {
                setIsVoda(!isVoda);
                setIsInsta(false);
              }}
            />
            Vodafone Cash
          </label>
          <label>
            <input
              type="checkbox"
              checked={isInsta}
              onChange={() => {
                setIsInsta(!isInsta);
                setIsVoda(false);
              }}
            />
            InstaPay
          </label>
        </div>
        {(isVoda || isInsta) && (
          <div className="payment-form">
            <label>Phone Number</label>
            <input type="text" placeholder= {`${isInsta ? "InstaPay Phone Number" : "Vodafone Cash Phone Number"}`}  defaultValue={userData.phone} name="withDrawalPhone" onChange={handleChange}/>
            {isInsta && (
              <div>
                <label>InstaPay Account Email</label>
                <input type="email" placeholder="InstaPay Account Email" name="instaEmail" onChange={handleChange}/>
                <label>InstaPay Account Name</label>
                <input type="text" placeholder="InstaPay Account Name" name="instaAccountName" onChange={handleChange}/>
                <h5>Fullfilling the InstaPay account is Recommended for more accuracy</h5>
                <h5>Phone or email one of them is enough</h5>
              </div>
            )}
            {isVoda && (
              <div>
                <label>Vodafone Cash Carrier Name</label>
                <input type="text" placeholder="Vodafone Cash Carrier Name" name="vodaCarrierName" onChange={handleChange}/>
              </div>
            )}
            <button type="button" onClick={handleSubmit}>Withdraw</button>
          </div>
        )}
      </form>
    </div>
  );
};

export default WithDraw;
