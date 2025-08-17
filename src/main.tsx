import React from "react";
import ReactDOM from 'react-dom/client';
import App from "./App";
import './index.css'
import { store } from "./store/store";
import { BrowserRouter } from "react-router-dom";
import { Provider as ReduxProvider } from 'react-redux';

import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';

const theme = createTheme({
  fontFamily: 'Inter, sans-serif', // can choose font
  primaryColor: 'blue', // can choose theme
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ReduxProvider store={store}>
      <BrowserRouter>
        <MantineProvider theme={theme} defaultColorScheme="auto"> {/* Wrap with MantineProvider */}
          <App />
        </MantineProvider>
      </BrowserRouter>
    </ReduxProvider>
  </React.StrictMode>,
);