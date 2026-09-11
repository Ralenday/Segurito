import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import LockScreen from '../src/screens/LockScreen';
import { AuthProvider } from '../src/context/AuthContext';

test('renderiza la pantalla de bloqueo sin crashear', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      <AuthProvider>
        <LockScreen />
      </AuthProvider>,
    );
  });
});
