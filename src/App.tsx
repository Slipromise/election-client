import React, { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from "react-hook-form";
import Web3 from 'web3';
import './App.css';

const web3 = window.ethereum ? new Web3(window.ethereum as typeof Web3.givenProvider):undefined;

// TODO 待優化
const contract = web3? new web3.eth.Contract([
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      }
    ],
    "name": "addCandidate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "candidateID",
        "type": "uint256"
      }
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "candidateID",
        "type": "uint256"
      }
    ],
    "name": "VotedEvent",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "candidates",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "voteCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "candidatesCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "isVoted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
], '0x7dbb9050367Cbf3D6d2FbD2cB7b480CC8Aa9EFb1'):undefined;

console.log(contract)

type Candidate = {
  id:string;
  name:string;
  voteCount:string;
}



interface IFormInput {
  candidateID: String;
}

function App() {
  const [isInit, setIsInit] = useState(false);

  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const [defaultAccount, setDefaultAccount] = useState("");

  const { register, handleSubmit } = useForm<IFormInput>();

  const onSubmit: SubmitHandler<IFormInput> = (data) =>
    data.candidateID &&
    contract?.methods
      .vote(Number(data.candidateID))
      .send({ from: web3?.eth.defaultAccount })
      .finally(() => setIsInit(false));

  useEffect(() => {
    if (web3?.eth.defaultAccount === null) {
      web3.eth.getAccounts().then(([defaultAccount]) => {
        web3.eth.defaultAccount = defaultAccount;
        setDefaultAccount(web3.eth.defaultAccount);
      });
    }
    web3?.eth.defaultAccount && setDefaultAccount(web3.eth.defaultAccount);
  }, [isInit]);

  useEffect(() => {
    !isInit &&
      contract?.methods
        .candidatesCount()
        .call()
        .then((count: number) => {
          let promises: Promise<Candidate>[] = [];
          for (let i = 0; i < count; i++) {
            promises.push(contract?.methods.candidates(i + 1).call());
          }
          return Promise.all(promises);
        })
        .then((candidates: Candidate[]) => {
          setCandidates(candidates);
          setIsInit(true);
          return candidates;
        });
  }, [isInit]);

  return (
    <div className="App">
      <header>
        <h1>投票 DApp</h1>
      </header>
      <div>
        <table>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">候选人</th>
              <th scope="col">得票数</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => (
              <tr key={candidate.id}>
                <th>{candidate.id}</th>
                <td>{candidate.name}</td>
                <td>{candidate.voteCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <hr />
        {defaultAccount ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div>
              <p>{defaultAccount}</p>
              <label htmlFor="candidatesSelect">選擇想去的地方</label>
              <select
                required
                defaultValue=''
                {...register("candidateID")}
                id="candidatesSelect"
              >
                <option value="" disabled hidden  >
                  請選擇
                </option>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" >投票</button>
            <hr />
          </form>
        ) : (
          <p>錢包未連結</p>
        )}
        <p></p>
      </div>
    </div>
  );
}

export default App;
