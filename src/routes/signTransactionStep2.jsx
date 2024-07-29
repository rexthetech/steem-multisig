import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useStateMachine } from "little-state-machine";
import updateAction from "../UpdateAction";
import Spinner from "../components/loader";

export default function SignTransactionStep2() {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const { state, actions } = useStateMachine({ updateAction });
  const [ globalErrors, setGlobalErrors ] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Build tx list for display
  var txList = [];

  if (state.data.transactions) {
    for (var i = 0; i < state.data.transactions.length; i++) {
      const partialTx = JSON.parse(state.data.transactions[i].partialTx);
      const txId = state.data.transactions[i].id;

      const proposer = state.data.transactions[i].proposer;
      const accountFrom = state.data.transactions[i].accountFrom;

      const accountTo = partialTx.operations[0][1].to;
      const amount = partialTx.operations[0][1].amount;

      const expiryDate = new Date(state.data.transactions[i].expiration);
      const weightThreshold = state.data.transactions[i].weightThreshold;
      const weightSigned = state.data.transactions[i].weightSigned;
      const expiryDateUTC = expiryDate.getUTCFullYear() + '-' + ('0' + (expiryDate.getUTCMonth()+1)).slice(-2) + '-' + ('0' + expiryDate.getUTCDate()).slice(-2) + ' ' + ('0' + expiryDate.getUTCHours()).slice(-2) + ':' + ('0' + expiryDate.getUTCMinutes()).slice(-2) + ':' + ('0' + expiryDate.getUTCSeconds()).slice(-2);
      
      // Generate one-liner
      const desc = `${amount} from @${accountFrom} to @${accountTo}\n`;
      const expires = `${expiryDateUTC}\n`;
      const proposedBy = `@${proposer} (${weightSigned}/${weightThreshold} weight). \n`;

      txList.push({
        'id': txId,
        'amount': amount,
        'accountFrom': accountFrom,
        'accountTo': accountTo,
        'proposer': proposer,
        'weightThreshold': weightThreshold,
        'weightSigned': weightSigned,
        'expiryDate': expiryDateUTC,
        'desc': desc,
        'expires': expires,
        'proposerBy':proposedBy
      });
    }
  }
  
  const onSubmit = async (formData) => {
    setIsSubmitting(true);

    let data = state.data;
    data.selectedTxIndex = formData.transactionIndex;
    data.transactionId = state.data.transactions[data.selectedTxIndex].id;
    actions.updateAction(data);

    setIsSubmitting(false);
    navigate("/signtransaction3");
  };

  const radiosChanged = (event) => {
    const selectedRadio = event.target;
    const radioFields = document.querySelectorAll('.radioField');

    radioFields.forEach((radioField) => {
      const radio = radioField.querySelector('input[type="radio"]');
      if (radio === selectedRadio) {
        radioField.classList.add('selected');
      } else {
        radioField.classList.remove('selected');
      }
    });
  }

  return (
        <>
        <header className="entry-header">
            <h1 className="entry-title">Sign a Multisig Transaction - Step Two</h1>
        </header>
        <div className="entry-content">
          <p>
            Please select which open transaction you would like to sign.
          </p>
          <form onSubmit={handleSubmit(onSubmit)}>
            {globalErrors && <p role="alert" className="error-message">{globalErrors}</p>}

            <div className="transactionList">
            {txList.map((transaction, index) => (
              <div key={index} className={`radioField ${watch(`transactionIndex`) === index ? 'selected' : ''}`}>
                <label className="radioLabel" onChange={radiosChanged}>
                  <input 
                    type="radio"
                    name="transaction"
                    value={index}
                    {...register('transactionIndex', { required: "" })}
                  />
                  <div className="transaction">
                    <span className="transaction-title">{transaction.desc}</span>

                    <div className="transaction-meta">
                      <span className="label-extra">Proposed by <em>{transaction.proposerBy}</em></span>
                      <span className="label-extra">Expires  <em>{transaction.expires}</em></span>
                    </div>

                  </div>
                </label>
              </div>
            ))}
            </div>

            <div className="buttonRow">
              <button type="submit" disabled={isSubmitting}>Sign</button>
            </div>

            {isSubmitting && (
              <Spinner />
            )}
          </form>
        </div>
      </>
  );
};
