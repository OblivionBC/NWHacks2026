import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>

          <button onClick={async () => {
            try {
              const response = await fetch('http://localhost:3001/api/projects');
              const data = await response.json();
              console.log('Connections from MongoDB:', data);
            } catch (error) {
              console.error('Error fetching connections:', error);
            }
          }}>
            Click me
          </button>

      </header>
    </div>
  );
}

export default App;
