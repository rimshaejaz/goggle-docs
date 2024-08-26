import './App.css';
import Editor from './components/Editor.jsx';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';

// uuid helps to generate unique id's for each page route 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate replace to={`/document/${uuid()}`} />} />
        <Route path="/document/:id" element={<Editor />} />
      </Routes>
    </Router>

  );
};

export default App;
