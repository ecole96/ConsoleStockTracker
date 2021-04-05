import './App.css';
import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import StockStatus from './components/stock-status.component';
import Header from './components/header.component';
import Actions from './components/actions.component';
import Footer from './components/footer.component';

function App() {
  return (
      <div className="container-fluid text-white text-center">
        <Header />
        <Actions />
        <StockStatus />
        <Footer />
      </div>
  );
}

export default App;
