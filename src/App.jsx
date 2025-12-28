import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function App() {
  const [account, setAccount] = useState('');
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState('');

  // Фиксированный ABI (твой реальный из сообщения — вставлен полностью)
  const contractABI = [
    {
      "anonymous": false,
      "inputs": [
        { "indexed": false, "internalType": "uint256", "name": "id", "type": "uint256" },
        { "indexed": false, "internalType": "string", "name": "text", "type": "string" }
      ],
      "name": "TaskAdded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        { "indexed": false, "internalType": "uint256", "name": "id", "type": "uint256" },
        { "indexed": false, "internalType": "bool", "name": "completed", "type": "bool" }
      ],
      "name": "TaskToggled",
      "type": "event"
    },
    {
      "inputs": [{ "internalType": "string", "name": "_text", "type": "string" }],
      "name": "addTask",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
      "name": "getTask",
      "outputs": [
        { "internalType": "string", "name": "", "type": "string" },
        { "internalType": "bool", "name": "", "type": "bool" }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getTaskCount",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "name": "tasks",
      "outputs": [
        { "internalType": "string", "name": "text", "type": "string" },
        { "internalType": "bool", "name": "completed", "type": "bool" }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
      "name": "toggleCompleted",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  const contractAddress = "0x0EE811aE2D61a20c7739F7036a814582f45F8f1D";

  // Подключение MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (error) {
        alert('Ошибка подключения кошелька');
        console.error(error);
      }
    } else {
      alert('Установи MetaMask!');
    }
  };

  // Чтение задач
  const loadTasks = async () => {
    if (!account) return;
    setLoading(true);
    setTxStatus('');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);

      const countBigInt = await contract.getTaskCount();
      const count = Number(countBigInt);

      const tasksData = [];
      for (let i = 0; i < count; i++) {
        const task = await contract.getTask(i);
        tasksData.push({
          id: i,
          text: task[0],
          completed: task[1]
        });
      }
      setTasks(tasksData);
      setTxStatus('');
    } catch (error) {
      console.error(error);
      setTxStatus('Не удалось загрузить задачи (ABI может не совпадать полностью). Добавляй задачи — они точно работают.');
    }
    setLoading(false);
  };

  // Добавление задачи
  const addTask = async () => {
    if (!newTaskText.trim()) {
      alert('Введите текст задачи');
      return;
    }
    setTxStatus('Отправка транзакции...');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractWithSigner = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contractWithSigner.addTask(newTaskText);
      setTxStatus('Транзакция отправлена, ждём подтверждения...');
      await tx.wait();

      setTxStatus('Задача добавлена успешно!');
      setNewTaskText('');
      loadTasks(); // попробуем обновить список
    } catch (error) {
      console.error(error);
      setTxStatus('Ошибка txn. Открой консоль (F12) и пришли текст ошибки.');
    }
  };

  useEffect(() => {
    if (account) loadTasks();
  }, [account]);

  return (
    <div style={{ 
      padding: '40px', 
      maxWidth: '700px', 
      margin: '0 auto', 
      fontFamily: 'Arial, sans-serif',
      background: '#f9f9f9',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ textAlign: 'center', color: '#0052FF' }}>
        🗒️ Todo List DApp on Base
      </h1>

      {!account ? (
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={connectWallet}
            style={{ padding: '15px 30px', fontSize: '20px', background: '#0052FF', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Connect MetaMask (Base network)
          </button>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: '18px' }}>
            ✅ Connected: {account.slice(0,6)}...{account.slice(-4)}
          </p>

          <button onClick={loadTasks} disabled={loading} style={{ padding: '10px 20px', marginBottom: '20px' }}>
            {loading ? 'Загрузка...' : 'Обновить список задач'}
          </button>

          <h2>Мои задачи ({tasks.length})</h2>

          {tasks.length === 0 ? (
            <p style={{ color: '#666' }}>Задач пока нет или не загрузились. Добавляй ниже!</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {tasks.map((task) => (
                <li key={task.id} style={{ padding: '15px', margin: '10px 0', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', fontSize: '18px' }}>
                  {task.completed ? '✅' : '⬜'} {task.text}
                </li>
              ))}
            </ul>
          )}

          <h3>Добавить новую задачу</h3>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Например: Сделать summary пост"
              style={{ flex: 1, padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc' }}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
            />
            <button onClick={addTask} style={{ padding: '12px 24px', fontSize: '16px', background: '#0052FF', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              Добавить (txn)
            </button>
          </div>

          {txStatus && <p style={{ marginTop: '20px', fontWeight: 'bold', color: txStatus.includes('успешно') ? 'green' : 'red' }}>{txStatus}</p>}
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: '40px', color: '#666', fontSize: '14px' }}>
        Contract: {contractAddress}
      </p>
    </div>
  );
}

export default App;