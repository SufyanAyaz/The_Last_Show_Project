import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import './index.css';
import Layout from "./Layout";
import ObituaryDisplay from './ObituaryDisplay';
import CreationDisplay from './CreationDisplay';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/obituaries" replace={true} />}>
        </Route>
        <Route element={<Layout />}>
          <Route path="/" element={<ObituaryDisplay />} />
          <Route path="/obituaries" element={<ObituaryDisplay />} />
          <Route path="/obituaries/create" element={<CreationDisplay />} />
          <Route path="*" element={<ObituaryDisplay />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </>
);
reportWebVitals();
