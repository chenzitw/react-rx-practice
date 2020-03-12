import React, { FunctionComponent } from 'react';
import styled from 'styled-components';

const Page = styled.div`
  height: 100%;
  padding: 10px 20px;
`;

const App: FunctionComponent = () => (
  <Page>
    <h1>React Rx Practice</h1>
  </Page>
);

export default App;
